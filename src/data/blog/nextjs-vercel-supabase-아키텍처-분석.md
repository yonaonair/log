---
title: '`Next.js`, `Vercel`, `Supabase` 아키텍처 분석'
description: '알고 쓰자 '
pubDatetime: 2026-04-15T01:22:51.860Z
modDatetime: 2026-04-15T05:23:03.527Z
slug: nextjs-vercel-supabase-아키텍처-분석
featured: false
draft: false
tags:
  - aws
  - compute
  - arcithecture
  - infra
category: infra & devops
---
> 배포에 성공하기는 쉬웠다. 무수한 가이드가 인터넷에 있고 AI가 비약적인 발전을 거듭하는 시대니까. 하지만 알고 쓰지 않으면 잘 쓴 건지, 의도한 바에 일치하는지 점검할 수 없다. 그래서 글을 남겨둔다.

# 1. PaaS vs Baas

매번 헷갈리는 `Iaas / Pass / BaaS, / Saas`. 다시 한 번 정리해보자.

| 분류 | 의미 | 관리 대상 | 예시 |
| --- | --- | --- | --- |
| IaaS | Infrastructure as a Service | OS, 런타임, 앱, 데이터 모두 | `AWS EC2`, `GCP`, `Compute Engine` |
| Paas | Platform as a Service | 앱 코드 & 데이터 | `Vercel`, `Netlify`, `Heroku` |
| Baas | Backend as a suevice | 프론트엔드 로직만 | `Supabase`, `Firebase` |
| SaaS | Software as a Service | 설정만 | `Notion`, `Slack` |

추상화 수준이 높아질수록, 그러니까 `IaaS → PaaS → Baas → SaaS` 순서로 내려갈 수록 플랫폼은 더 많은 것을 대신 처리하고 개발자가 직접 관리해야 하는 범위는 좁아진다. 다른 말로 ‘플랫폼에 대한 의존도가 높아진다’ 라고 말하기도 한다. 이 트레이드오프, 즉, 하나를 얻으려면 다른 하나를 포기해야 하는 관계를 이해하는 것이 서비스 선택의 출발점이다. 

- `Paas - Vercel/Netlify` : 서버 세팅 없이 코드만 올리면 배포된다 → 내부적으로는 복잡한 인프라가 자동 작동중 
- `Baas - Supabase ` : `PostgreSQL` 에서 데이터베이스, 인증, 스토리지, 엣지 함수를 하나의 인터페이스로 제공하여 서버를 직접 구성하지 않아도 된다. 

# 2. Severless 배포 

## 2-1. 정적 자산이 전세계에 배포되는 방법

`Vercel` 이나 `Netlify`에 `Next.js` 프로젝트를 푸시하면 내부적으로 일어나는 과정이 있다. 

<div color="blue" data-type="callout" data-color="blue" class="callout callout-blue">
<p>(1) Git push → CI/CD 파이프라인 트리거 </p><p>(2) 빌드 서버에서 <code>next build</code> 실행 </p><p>(3) 결과물 분류 : </p><ul class="tight" data-tight="true"><li><p><code>/public</code> 및 <code>.next/static</code> → 정적 자산 (HTML, CSS, JS, 이미지) </p></li><li><p><code>API Routes / Server Components</code> → 서버리스 함수 (Lambda-like) </p></li></ul><p>(4) 정적 자산 → <code>CDN (Content Delivery Network)</code> 엣지 노드 전체에 복제 </p><p>(5) 서버리스 함수 → 요청이 들어올 때마다 실행 (<code>cold start</code> 발생 가능)</p>
</div>

<div color="yellow" data-type="callout" data-color="yellow" class="callout callout-yellow">
<p><strong>keyword: 콜드스타트 (cold start) </strong><br><br>서버리스 함수는 일정 시간 요청이 없으면 실행환경 또는 컨테이너가 내려간다. 새 요청이 들어오면 환경을 재부팅하는데 수백ms에서 수초까지 걸린다. <code>Vercel Edge Functions</code>는 <code>V8 isolate</code> 기반인데 코드스타터가 매우 짧지만 <code>Node.js</code> 런타임 기반 함수는 상대적으로 길다. </p>
</div>

### CDN (Content Delivery Network) 

전 세계 여러 지역에 분산된 서버 노드들의 네트워크. 사용자가 어떤 사이트에 접속하면 미국 원본 서버까지 가지 않고 가장 가까운 곳의 엣지 노드에서 정적 파일을 받아온다. 

`Vercel`은 `Edge Network`를 통해 100개 이상의 리전에 자산을 배포한다. ` Cash-Control`  헤더를 잘 설정하면 앳지 케시 히트율을 올릴 수 있고 결과적으로 원본 서버 부하의 속도를 줄이기 때문에 응답 속도가 빨라진다. 

<div color="yellow" data-type="callout" data-color="yellow" class="callout callout-yellow">
<p><strong>keyword: Cache-Control 헤더</strong> </p><p>HTTP 응답 헤더. 브라우저와 CDN이 자원을 얼마나, 어디에, 어떤 방식으로 저장할 지 정의하는 지침서. </p>
</div>

<div color="yellow" data-type="callout" data-color="yellow" class="callout callout-yellow">
<p><strong>keyword: 엣지 캐시 히트율 Edge Cache Hit Rate </strong></p><p>전체 요청 중 원본 서버(origin)까지 가지 않고 CDN 엣지 노드에서 즉시 응답을 처리한 비율. 동일한 자원에 대해 캐시 키를 정규화하고 적절한 유효 기간을 설정, 히트율을 높이는 것이 인프라 비용 절감과 속도 개선의 핵심. </p>
</div>

## 2-2. 서버리스 함수 (Serverless Function) 

`Next.js`의 `API Routes`나 `Server Actions`는 `Vercel / Netlify`에서 서버리스 함수로 실행되는데, 이것은 전통적인 의미, 즉 항상 켜져있는 서버와는 다르다. 

<table style="min-width: 75px;">
<colgroup><col style="min-width: 25px;"><col style="min-width: 25px;"><col style="min-width: 25px;"></colgroup><tbody><tr><th colspan="1" rowspan="1"><p>구분</p></th><th colspan="1" rowspan="1"><p>전통 서버</p></th><th colspan="1" rowspan="1"><p>서버리스 함수</p></th></tr><tr><td colspan="1" rowspan="1"><p>실행방식</p></td><td colspan="1" rowspan="1"><p>항상 대기중 </p></td><td colspan="1" rowspan="1"><p>요청이 들어올 때만 실행 </p></td></tr><tr><td colspan="1" rowspan="1"><p>비용 </p></td><td colspan="1" rowspan="1"><p>고정 </p><ul class="tight" data-tight="true"><li><p>서버 운영 시간</p></li></ul></td><td colspan="1" rowspan="1"><p>종량제 </p><ul class="tight" data-tight="true"><li><p>실행 횟수 * 실행 시간 </p></li></ul></td></tr><tr><td colspan="1" rowspan="1"><p>상태 <code>State</code> </p></td><td colspan="1" rowspan="1"><p>메모리에 유지 OK</p></td><td colspan="1" rowspan="1"><p>요청마다 새 인스턴스 생성, 무상태 <code>state</code> (Statless) 구조</p></td></tr><tr><td colspan="1" rowspan="1"><p>콜드 스타트</p></td><td colspan="1" rowspan="1"><p>없음</p></td><td colspan="1" rowspan="1"><p>있음 </p><ul class="tight" data-tight="true"><li><p>첫 요청 시 지연</p></li></ul></td></tr><tr><td colspan="1" rowspan="1"><p>스케일링 </p></td><td colspan="1" rowspan="1"><p>수동 또는 오토스케일링 필요</p></td><td colspan="1" rowspan="1"><p>자동 </p><ul class="tight" data-tight="true"><li><p>프레픽에 따라 인스턴스 복제</p></li></ul></td></tr></tbody>
</table>

# 3. Managed 서비스

- AWS EC2`에서 P `PostgreSQL을 직접 설치해서 운영한다면 직접 처리해야 하는 일들: 

<div color="blue" data-type="callout" data-color="blue" class="callout callout-blue">
<p>(1) OS  업데이트 및 보안 패치 </p><p>(2} PostgreSQL 버전 업그레이드 </p><p>(3) 백업 스케줄링 (cron + pg_dump 또는 WAL 아카이빙</p><p>(4) 장애 발생 시 복구 절차 </p><p>(5) 연결 풀림 (pg_bouncer 등) </p><p>(6) SSL/TIS  설정</p><p>(7) 방화벽 및 인카운드 규칙 설정</p><p>(8) 모니터링 (CPU,  메모리 ,디스크, 커넥션 수) </p>
</div>

소규모 프로젝트에서 이러한 진행은 비효율적이다. 모든 것을 관리해야 하기 때문이다. 

## 3-2. Supabase가 추상화하는 것들 

Supabase 는 `GpostgreSQL`을 기반으로 하면서도 운영 부담을 플랫폼 수준에서 처리해준다. 개발자가 직접 다루는 레이어는 스키마 설계와 쿼리 뿐이다. 

<div color="blue" data-type="callout" data-color="blue" class="callout callout-blue">
<p><strong>Supabase 제공 기능</strong></p><p>(1) <code>PostgreSQL</code> : managed</p><p>(2) Auth : <code>JWT</code> 기반, <code>OAuth</code> 포함</p><p>(3) Storage : 파일 업로드 → S3 호환 버킷 </p><p>(4) Realtime : 변경 감지 → WebSocket으로 브로드캐스트 </p><p>(5) Edge Functions : <code>Deno</code> 기반 서버리스 </p><p>(6) PostgREST : REST API 자동 생성</p>
</div>

<div color="yellow" data-type="callout" data-color="yellow" class="callout callout-yellow">
<p><strong>keyword: WebSocket 브로드캐스트 Broadcast </strong></p><p>특정 클라이언트로부터 전송된 메시지를 현재 연결된 모든 클라이언트에게 동시에 전송하는 이벤트 전파 방식. 단순 일대일 통신이 아니라 Pub/Sub(발행/구독) 패턴을 서버 레이어에서 추상화하여 대규모 사용자에게 실시간 상태를 동기화할 때 사용. </p>
</div>

<div color="yellow" data-type="callout" data-color="yellow" class="callout callout-yellow">
<p><strong>keyword: S3 호환 버킷 (compatible API) </strong></p><p>AWS S3가 객체 스토리지 시장의 표준이 되면서 대다수의 스토리지 서비스 (<code>Cloudflare R2</code>, <code>MinlO</code> 등)가 S3와 동일한 <code>RESTful API</code>규격을 따름. <code>aws-sdk</code> 라이브러리를 그대로 사용하면서 엔드포인트 URL만 바꾸면 서비스 이동 가능. </p>
</div>

<div color="yellow" data-type="callout" data-color="yellow" class="callout callout-yellow">
<p><strong>keyword: </strong><code>Edge Functions</code><strong> </strong></p><p>전 세계에 분산된 엣지 노드에서 실행되는 서버리스 함수. 기존 <code>Lambda(Node.js)</code> 보다 가벼운 <code>V8</code> 엔진을 사용.  </p>
</div>

<div color="yellow" data-type="callout" data-color="yellow" class="callout callout-yellow">
<p><strong>keyword: </strong><code>PostgREST</code><strong> </strong></p><p><code>PostgreSQL</code> 데이터베이스 스키마를 읽어 표준 <code>RESTful API</code>를 자동으로 생성해주는 웹 서버. 단순 CRUD 코드를 작성할 필요를 없애고 <code>GET /users?id=eq.1</code> 쿼리를 SQL로 자동 변환. <code>RLS</code>와 결헙하여 백엔드 로직 없이도 DB레벨에서 보안 및 권한 제어 수행. 복잡한 비즈니스 로직이 없는 서비스라면 이것만으로 별도 백엔드 서버 없이 풀스택 개발 가능.</p>
</div>

## 3-3. Row Level Security 

`RLS`라고 약칭한다. 테이블의 각 행에 대한 접근 권한을 정책으로 정의하는데, `Supabase`가 클라이언트에서 직접 DB에 쿼리를 날릴 수 있는 구조`PostgREST`를 제공하기 때문에 발생할 수 있는 보안 취약점을 방지한다. 

`RLS`를 설정하지 않으면 `anon키 (공개) `로도 전체 데이터를 조회할 수 있기 때문에 Supabase 프로젝트 초기 세팅 시 놓치지 않고 필수로 해주어야 함 

# 4. 객체 스토리지 (Object Storage) 

## 4-1. 객체 스토리지란 

전통적인 파일 시스템 (디렉터리 구조)와 달리 `key-value`쌍으로 저장하여, 각 파일(객체)가 가진 고유한 식별자(key)를 가지고 `HTTP URL`로 직접 접근이 가능한 방식. 

<div color="blue" data-type="callout" data-color="blue" class="callout callout-blue">
<p><strong>장점 </strong></p><ul class="tight" data-tight="true"><li><p>파일 수와 용량에 거의 제한 없이 확장 가능</p></li><li><p>파일에 <code>HTTP URL</code> 로 직접 접근 가능 → CDN 연동 용이</p></li><li><p>내부적으로 데이터를 여러 노드에 복제 → 고가용성</p></li><li><p>서버 로컬 스토리지 대비 저렴한 가격</p></li></ul>
</div>

## 4-2. `S3` vs `Cloudflare R2` 

`AWS S3`는 업로드 `Ingress` 비용이 무료지만 다운로드 `Egress`(데이터 전송 비용)이 발생해서 내 프로젝트에 적합하지 않았음. 

이미지나 동영상처럼 용량이 큰 파일을 자주 서빙하는 서비스라면 Egress 비용이 전체 인프라 비용에서 상당한 비중을 차지한다. Cloudflare R2는 이 비용을 제거하기 때문에 선 택했다. 

대신 R2는 저장 용량과 클래스에 따른 작업 양에 따라 금액이 부과된다. 프로젝트에 적합하게 설계해야 한다. 

# 5. 인바운드 규칙

`Netlify/Vercel` 계열 프로젝트와 달리 `Node.js` 백엔드를 `EC2`에 올리려면 보안그룹(Security Group)과 인바운드/아운바운드 규칙을 직접 설정 해주어야 한다. 

## 5-1. 보안그룹 (Security Group) 

`AWS`의 보안그룹은 `EC2 인스턴스`에 대한 가상의 방화벽이다. 어떤 IP에서 어떤 포트로 들어오는 트래픽을 허용할지, 어떤 포트로 나가는 트래픽을 허용할지 정의한다. 

- 인바운드 Inbound : 외부 → `EC2` 인스턴스로 들어오는 트래픽
- 아웃바운드 Outbound : `EC2` 인스턴스 → 외부로 나가는 트래픽 

보안그룹은 화이트리스트 (허용 목록 규정) 방식. 명시적으로 허용하지 않은 트래픽은 모두 차단된다. 

## 5-2. 일반적인 `Node.js` + `Socket.io` 서버의 인바운드 규칙 구성

<table style="min-width: 100px;">
<colgroup><col style="min-width: 25px;"><col style="min-width: 25px;"><col style="min-width: 25px;"><col style="min-width: 25px;"></colgroup><tbody><tr><th colspan="1" rowspan="1"><p>유형</p></th><th colspan="1" rowspan="1"><p>프로토콜</p></th><th colspan="1" rowspan="1"><p>포트 범위</p></th><th colspan="1" rowspan="1"><p>소스</p></th></tr><tr><td colspan="1" rowspan="1"><p>SSH</p></td><td colspan="1" rowspan="1"><p>TCP</p></td><td colspan="1" rowspan="1"><p>22</p></td><td colspan="1" rowspan="1"><p>내 IP </p><ul class="tight" data-tight="true"><li><p>관리 접속용</p></li></ul></td></tr><tr><td colspan="1" rowspan="1"><p>HTTP</p></td><td colspan="1" rowspan="1"><p>TCP</p></td><td colspan="1" rowspan="1"><p>80</p></td><td colspan="1" rowspan="1"><p>0.0.0.0/0</p><ul class="tight" data-tight="true"><li><p>모든 IP</p></li></ul></td></tr><tr><td colspan="1" rowspan="1"><p>HTTPS</p></td><td colspan="1" rowspan="1"><p>TCP</p></td><td colspan="1" rowspan="1"><p>443</p></td><td colspan="1" rowspan="1"><p>0.0.0.0/0</p><ul class="tight" data-tight="true"><li><p>모든 IP</p></li></ul></td></tr><tr><td colspan="1" rowspan="1"><p>Custom TCP</p></td><td colspan="1" rowspan="1"><p>TCP</p></td><td colspan="1" rowspan="1"><p>3001</p></td><td colspan="1" rowspan="1"><p>0.0.0.0/0</p><ul class="tight" data-tight="true"><li><p><code>Node</code> 앱 포트</p></li></ul></td></tr></tbody>
</table>

포트 22 (SSH): EC2 인스턴스에 터미널로 접속하는 포트. `0.0.0.0/0`(모든 IP 허용)으로 열어두면 브루트포스 공격에 노출된다. 가능하면 본인의 IP만 허용하거나 AWS Systems Manager Session Manager를 사용해 SSH 포트 자체를 닫는 것이 권장된다.

포트 80/443 (HTTP/HTTPS): 웹 요청을 받는 표준 포트. Node.js 앱이 직접 80 포트를 열기보다는 Nginx를 앞단에 두고 리버스 프록시 구성을 하는 것이 일반적이다.

`Socket.io` 포트: 기본적으로 HTTP 프로토콜 위에서 동작하며(초기 핸드셰이크), 이후 WebSocket으로 업그레이드된다. 별도 포트를 사용한다면 해당 포트를 인바운드 규칙에 추가해야 한다. Nginx로 리버스 프록시를 구성하면 80/443을 통해 처리할 수 있다.

> 이 부분부터는 이해가 어려워서 Gemini랑 같이 봤다 

- 22 `SSH` : 서버 관리자가 원격 터미널로 접속하는 뒷문. 아무나 들어오만 안 되니까 내 IP만 허용하는게 보안 상식. 
- 80 / 443 `HTTP / HTTPS`  : 전 세계 사용자가 내 웹사이트에 접속하는 정문. 그래서 소스를 모든 IP로 설정
- 3001 : 실제로 내 코드가 실행되는 사무실 번호. 

## 5-3. Nginx 리버스 프록시 구성 개념

<div color="green" data-type="callout" data-color="green" class="callout callout-green">
<p>mermaid 로 쓰기 </p><p>[인터넷] ↓ :443 (HTTPS) [Nginx] ← SSL 종료(SSL Termination) 처리 ↓ 내부 포트 프록시 [Node.js 앱 :3001] ↕ [<a target="_blank" rel="noopener noreferrer nofollow" href="http://Socket.io">Socket.io</a> WebSocket 연결]</p>
</div>

```
# /etc/nginx/sites-available/myapp
server {
    listen 443 ssl;
    server_name api.yourdomain.com;

    # SSL 인증서 경로 (Let's Encrypt 등)
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;

        # WebSocket 업그레이드를 위한 헤더 설정
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

`proxy_set_header Upgrade`와 `Connection "upgrade`의 Socket.io가 없으면 WebSocket 업그레이드가 실패하고 폴링(polling) 방식으로 폴백된다. CORS 에러와 함께 연결이 불안정해지는 원인이 되기도 한다.

<div color="red" data-type="callout" data-color="red" class="callout callout-red">
<p><strong>Nginx 리버스 프록시</strong></p><p>사용자가 직접 3001 포트 <code>Node.js</code>로 접속하게 하지 않고 <code>Nginx</code> 라는 문지기 앞에 세우는 이유 </p><p>(1) <code>SSL Termination</code> </p><p>암호화된 통신 <code>HTTPS</code>를 해독하는 작업은 연산량이 많다. 이걸 <code>Node.js</code>가 직접하면 메인이 되는 비즈니스 로직 처리가 느려짐. 고성능인 <code>Nginx</code>가 암호화를 풀어서 <code>Node.js</code>에게는 가벼운 <code>HTTP</code>로 전달해주는 구조 </p><p>(2) 보안 (추상화) </p><p>실제 서비스가 돌아가는 포트를 외부에 직접 노출하지 않으면 공격자는 <code>Nginx (80/443)</code>만 볼 수 있기 때문에 내부 구조를 알 수 없다 </p><p>(3) 로드 밸런싱 및 정적 파일 서빙</p><p>나중에 서버가 커져서 <code>Node.js</code> 앱을 여러 개 띄울 때 <code>Nginx</code>가 트래픽을 골고루 나눠주는 역할을 하게 됩 </p>
</div>

<div color="yellow" data-type="callout" data-color="yellow" class="callout callout-yellow">
<p>keyword: 프록시 Proxy </p><p>대리인이라는 뜻의 단어. “누구를” 대신하느냐에 따라 이름이 바뀜. </p><ul class="tight" data-tight="true"><li><p>포워드 프록시 Forward proxy </p><ul class="tight" data-tight="true"><li><p>클라이언트가 외부 인터넷에 접속할 때 정체를 숨기거나 특정 사이트 접근을 제한하기 위해 </p></li></ul></li><li><p>리버스 프록시 </p><ul class="tight" data-tight="true"><li><p>외부 사용자가 내 서버에 직접 접근하는 걸 막고 중간에서 요청을 대신 받아 내부 서버로 전달 </p></li></ul></li></ul><p>        → 실제 백엔드 서버의 IP와 포트 노출 X =&gt;  보안 용이 </p><p>        → <code>HTTPS</code> 암호화 해제 작업을 프록시가 전담해 백엔드 서버의 부하를 줄임</p><p>        → 자주 요청되는 정적 자원을 프록시가 저장해두고 즉시 응답 → 캐싱 </p>
</div>

<div color="yellow" data-type="callout" data-color="yellow" class="callout callout-yellow">
<p>keyword: 로드 밸런싱 Load Balancing </p><p>부하(Load)를 균형있게 나누는 것. 서비스 규모가 커져서 서버 한 대 <code>single instance</code>로는 감당이 안 될 때 똑같은 서버를 여러 대 띄우고 트래픽을 분산시킴. </p><ul class="tight" data-tight="true"><li><p>동작: 리버스 프록시로 동작하는 <code>Nginx</code>가 요청 → 뒤에 있는 여러 대의 <code>Node.js</code> 서버 중 하나를 골라 요청을 던짐 </p></li><li><p>주요 알고리즘 </p></li></ul><p>(1) Round Robin: 순서대로 한번씩 돌아가며 전달</p><p>(2) Least Connections: 연결된 사용자가 가장 적은 서버로 전달 </p><p>(3) IP Hash: 특정 IP는 항상 특정 서버로 연결 </p>
</div>

인프라 위에서 돌아가는 소프트웨어만 들여다보다가 직접 해보니 그만큼 기반이 되는 인프라도 중요하다는 걸 알게 되었다. 옳거나 그른 스택이 아니라 서비스의 요구사항, 운영리소스에 맞게 조율해야 하는데, 너무 막연히 종류를 알고만 있었어서 애를 좀 먹었다. 다음 번에 할 때는 더 잘 할 수 있겠지? 
