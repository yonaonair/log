---
title: '`Next.js`, `Vercel`, `Supabase` 아키텍처 분석'
description: '알고 쓰자 '
pubDatetime: 2026-04-15T01:22:51.860Z
modDatetime: 2026-04-15T02:56:39.732Z
slug: nextjs-vercel-supabase-아키텍처-분석
featured: false
draft: true
tags: []
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
<p>keyword: 콜드스타트 (cold start) <br><br>서버리스 함수는 일정 시간 요청이 없으면 실행환경 또는 컨테이너가 내려간다. 새 요청이 들어오면 환경을 재부팅하는데 수백ms에서 수초까지 걸린다. <code>Vercel Edge Functions</code>는 <code>V8 isolate</code> 기반인데 코드스타터가 매우 짧지만 <code>Node.js</code> 런타임 기반 함수는 상대적으로 길다. </p>
</div>

### CDN (Content Delivery Network) 

전 세계 여러 지역에 분산된 서버 노드들의 네트워크. 사용자가 어떤 사이트에 접속하면 미국 원본 서버까지 가지 않고 가장 가까운 곳의 엣지 노드에서 정적 파일을 받아온다. 

`Vercel`은 `Edge Network`를 통해 100개 이상의 리전에 자산을 배포한다. ` Cash-Control`  헤더를 잘 설정하면 앳지 케시 히트율을 올릴 수 있고 결과적으로 원본 서버 부하의 속도를 줄이기 때문에 응답 속도가 빨라진다. 

## 2-2. 서버리스 함수 (Serverless Function)의 작동방식 

`Next.js`의 `API Routes`나 `Server Actions`는 `Vercel / Netlify`에서 서버리스 함수로 실행되는데, 이것은 전통적인 의미, 즉 항상 켜져있는 서버와는 다르다. 

<table style="min-width: 75px;">
<colgroup><col style="min-width: 25px;"><col style="min-width: 25px;"><col style="min-width: 25px;"></colgroup><tbody><tr><th colspan="1" rowspan="1"><p>구분</p></th><th colspan="1" rowspan="1"><p>전통 서버</p></th><th colspan="1" rowspan="1"><p>서버리스 함수</p></th></tr><tr><td colspan="1" rowspan="1"><p>실행방식</p></td><td colspan="1" rowspan="1"><p>항상 대기중 </p></td><td colspan="1" rowspan="1"><p>요청이 들어올 때만 실행 </p></td></tr><tr><td colspan="1" rowspan="1"><p>비용 </p></td><td colspan="1" rowspan="1"><p>고정 </p><ul class="tight" data-tight="true"><li><p>서버 운영 시간</p></li></ul></td><td colspan="1" rowspan="1"><p>종량제 </p><ul class="tight" data-tight="true"><li><p>실행 횟수 * 실행 시간 </p></li></ul></td></tr><tr><td colspan="1" rowspan="1"><p>상태 <code>State</code> </p></td><td colspan="1" rowspan="1"><p>메모리에 유지 OK</p></td><td colspan="1" rowspan="1"><p>요청마다 새 인스턴스 생성, 무상태 <code>state</code> (Statless) 구조</p></td></tr><tr><td colspan="1" rowspan="1"><p>콜드 스타트</p></td><td colspan="1" rowspan="1"><p>없음</p></td><td colspan="1" rowspan="1"><p>있음 </p><ul class="tight" data-tight="true"><li><p>첫 요청 시 지연</p></li></ul></td></tr><tr><td colspan="1" rowspan="1"><p>스케일링 </p></td><td colspan="1" rowspan="1"><p>수동 또는 오토스케일링 필요</p></td><td colspan="1" rowspan="1"><p>자동 </p><ul class="tight" data-tight="true"><li><p>프레픽에 따라 인스턴스 복제</p></li></ul></td></tr></tbody>
</table>

# 3. Managed 서비스의 이름

- AWS EC2`에서 P `PostgreSQL을 직접 설치해서 운영한다면 직접 처리해야 하는 일들: 

<div color="blue" data-type="callout" data-color="blue" class="callout callout-blue">
<p>(1) OS  업데이트 및 보안 패치 </p><p>(2} PostgreSQL 버전 업그레이드 </p><p>(3) 백업 스케줄링 (cron + pg_dump 또는 WAL 아카이빙</p><p>(4) 장애 발생 시 복구 절차 </p><p>(5) 연결 풀림 (pg_bouncer 등) </p><p>(6) SSL/TIS  설정</p><p>(7) 방화벽 및 인카운드 규칙 설정</p><p>(8) 모니터링 (CPU,  메모리 ,디스크, 커넥션 수) </p>
</div>

소규모 프로젝트에서 이러한 진행은 비효율적이다. 모든 것을 관리해야 하기 때문이다. 

## 3-2. Supabase가 추상화하는 것들 
