---
title: AWS EC2 + RDS로 실시간 채팅 앱 배포하기 (1) - 설계
description: typescript + socket.io + node.js
pubDatetime: 2026-03-14T02:34:00.000Z
modDatetime: 2026-04-06T08:48:48.248Z
slug: aws-ec2-rds로-실시간-채팅-앱-배포하기-1-설계
featured: false
draft: false
tags:
  - typescript
  - socket.io
  - node.js
  - aws
  - app
series: web
---
# 동기

웹 개발을 아주 처음 시작했을 때 유튜브 영상 보고 무작정 따라하기! 해본 적이 있다. 영어 강의로 된, 채팅 사이트를 Ts+tailwind+nodejs 구성으로 만들고, nodejs 서버는 AWS로 배포하는 방식이었다. 제대로 다룰 줄 아는 게 없으면서도 ts와 tailwind를 써보고 싶다는 마음으로 호기롭게 시작했다가 `이게 왜 되지?` 와 `이게 왜 안 되지?`를 번갈아가며 일주일을 끙끙 앓고 나서야 겨우 해결했던 기억. 특히 Node.js 안에서 Socket을 사용하는 단계와 AWS에서 배포하는 단계에서 애를 먹었다.

그때는 그냥 `제발 동작하게 해주세요`의 마음이었다면 이번에는 제대로 알고 써보고 싶어서 다시 시도해보았다. 클로드와 함께 정리한, 배울 내용은,

- WebSocket 기반 실시간 통신

- 단순 CRUD보다 서버-클라이언트 간 양방향 통신

- AWS 인프라 설계 및 배포 (EC2, RDS, VPC)

- 클라우드 환경에서 서버 직접 구성

# 기술 스택

React + Vite vs Next.js

(1) React + Vite\
CSR, 그러니까 클라이언트 측 렌더링이다. WebSocket과의 궁합이 좋고 빌드 속도가 빠르며, 정적 파일이라 nginx로 서빙이 된다.

(2) Next.js\
프로젝트 하면서 편하게 자주 사용해서 고려했는데, API Routes 구조가 요청-응답이라 WebSocket과의 지속적인 연결 유지에 적합하지 않다.

Q. Next.js는 왜 Socket과 적합하지 않은데?\
=&gt; 서버리스 구조와 충돌하기 때문!

Next.js의 API Routes는 요청이 들어올 때만 함수가 실행되고, 응답을 보내면 즉시 종료됨. 이걸 `Stateless (상태없음)`라고 함.

> Stateless\
> 실행 방식 중 하나. 함수가 요청 올 때만 실행되고 응답하면 즉시 &gt; 종료함. 간단하게 말하면 `상태를 기억하지 않는다`임.
>
> - HTTP는 요청할 때마다 매번 다시 정보를 말해야 함. 서버가 기억하지 않기 때문.
>
> - WebSocket은 한번 연결하면 서버가 그 연결을 계속 기억하고 있음!

때문에 Stateless 구조인 Next.js는 WebSocket 장기 연결과는 적합하지 않음.

![](https://velog.velcdn.com/images/pbdorbit/post/49a25cda-d281-4117-a5ae-e67293b2f3a7/image.png)> 인터넷 모든 통신은 사실 소켓 기반임. HTTP도 소켓 위에서 동작하는데, 다만 연결하고 =&gt; 한 마디 하고 =&gt; 바로 끊는 방식. 이 `연결=> 응답=> 종료`를 반복하기 때문에 계속 새 메시지가 있는지 물어봐야 하고, 이걸 `폴링(Polling)`이라고 함.

![](https://velog.velcdn.com/images/pbdorbit/post/e1ab258f-c1cd-4b92-940d-0ffcaf6552bb/image.png)> WebSocket은 HTTP로 시작했다가 WebSocket으로 소통을 전환할 수 있는데, 해당 프로토콜을 업데이트 하는 걸 `101 Switching Protocols`라고 함. 이후에는 서버가 먼저 요청할 수 있음.\
> HTTP는 응답하고 끝나니까 서버가 연결을 기억 안 해도 됨. [Socket.io](http://Socket.io)는 `Room` 개념을 지원하기 때문에 채팅방마다 다른 메시지를 보낼 수 있음

일반 WebSocket을 편하게 쓸 수 있게 만든 라이브러리이다.

> 일반 WebSocket 이용 시 단점\
> 연결 끊기면 자동 재연결 X\
> 채팅방 A에만 메세지 보내기 &lt;= 이런 기능 X\
> 구형 브라우저가 WebSocket 안 되면 그냥 죽어버림

```javascript
// WebSocket만 쓸 때
socket.send(JSON.stringify({ type: "chat", room: "A", msg: "안녕" }))

// Socket.io 쓸 때
socket.emit("chat", { room: "A", msg: "안녕" })
```

특히 채팅처럼 실시간 통신이 중요한 앱은 [Socket.io](http://Socket.io) 서버를 별도로 둬야 한다.

> Q. 왜 분리해야 되는데?\
> 연결 유지가 서버에 부담됨!\
> =&gt; HTTP는 응답하고 끝나니 연결을 기억하지 않아도 되는데, WebSocket은 접속자가 1000이라면 1000개의 연결을 동시에 이어가야 함. 메모리와 네트워크 자원을 소모하는 일이라 일반 HTTP서버보다 부담이 크고, 그래서 [Socket.io](http://Socket.io) 서버를 별도 EC2로 분리하는 것을 권장하는 거임.

[Socket.io](http://Socket.io) 분리

- 관심사 분리: 페이지 서빙(React)과 실시간 이벤트 처리([Socket.io](http://Socket.io))는 역할이 다름

- 트래픽 증가 시 [Socket.io](http://Socket.io) 서버만 별도 확장 가능 (스케일링이라고 부른다.)

- 소켓 서버에 문제가 생겨도 프론트엔드는 영향을 받지 않는다

- 실무에서도 채팅 서버는 별도 서비스로 분리하는게 일반적이다

RDS PostgreSQL vs Mongo DB\
채팅 메세지는 명확한 스키마가 있는 정형 데이터라 굳이 NoSQL 쓸 필요도 없고, 트랜잭션이나 JOIN이 필요해서 RDBMS가 더 안정적임. RDS를 쓰면 Private Subnet으로 격리도 할 수 있어서 보안 설계에도 유리함.

> 트랜잭션\
> 여러작업을 하나로 묶은 것. 전부 성공 or 하나라도 실패하면 전부 취소되는 단위. `둘 다 성공하면 반영, 하나라도 실패하면 없었던 일!`로 처리되는 걸 말하는데, 이걸 롤백(Rollback)이라고 함.

3. 시스템 아키텍처

항상 코드를 직접 작성하고 기능을 작동하게 하는 것만 봤지 전체적인 그림을 본 적이 없어서 클로드에게 요청했다. 어떤 서버가 어디 있고 서로 어떻게 연결되는지, 각각의 역할이 무엇인지 공부하는 게 필요할 것 같다.

(1) 시스템 아키텍쳐

![](https://velog.velcdn.com/images/pbdorbit/post/497fc52e-7169-471f-b948-4c02e4be3727/image.png)- VPC (Virtual Private Cloud)\
  AWS는 전 세계에 엄청난 서버 공간을 가지고 있는데, 이걸 빌려오는 거다. 그 안에서는 내 서버끼리만 통신할 수가 있어서 다른 회사 서버랑 섞이지 않는다.

AWS 전체가 도시라고 하면, VPC는 우리 아파트 단지라서 외부인이 함부로 들어올 수 없고, EC2, RDS는 단지 안의 건물이라는 비유.

- Subnet (구역)\
  VPC안을 다시 구역으로 나누는 건데, 지금 아키텍처에서는 두개로 나누어져있다.\
  - Public Subnet: 외부 인터넷 접근 가능 구역. 사용자가 직접 접속해야하는 부분들.\
  - Private Subnet: 외부에서 절대 직접 접근할 수 없는 구역. EC2를 통해서만 들어올 수 있다.\
  =&gt; DB는 외부에서 직접 접근하면 안 되기 때문에 EC2에게 입구를 지키라고 맡긴 것!

- EC2 (Elastic Compute Cloud)\
  AWS에서 빌리는 가상 컴퓨터. AWS 데이터 센터 안에서 24시간 꺼지지 않고 돌아가기 때문에 로컬 컴퓨터로 서버를 돌리면서 신경 쓸 필요가 없음.\
  - EC2 A React 파일 서빙\
  npm run build하면 나오는 HTML, CSS, JS 파일들을 올려두고 nginx가 사용자에게 전달하게 할 거임! nginx는 파일 배달부 역할이라서 요청이 들어오면 해당 파일들 찾아줄 것!\
  - EC2 B [Socket.io](http://Socket.io) 서버\
  여기서 Node.js 서버가 돌아갈 거임. 사용자들 WebSocket 연결 받아서 메세지 오면 다른 사람들 한테 전달, DB에도 저장

- RDS(Relational Database Service)\
  AWS가 관리해주는 DB서버. PostgreSQL을 직접 EC2에도 설치할 수 있긴 한데 그럼 DB를 직접 내가 관리해야 함. 백업, 업데이트, 장애 대응 등을 AWS가 대신해주는 서비스가 RDS임. Private Subnet 안에 있어서 외부인 직접 접근 불가, EC2 B만 접근 가능

(2) 플로우 차트

![](https://velog.velcdn.com/images/pbdorbit/post/0f092828-d688-454c-a1fe-2fd06f9c1ce2/image.png)\
플로우차트는 데이터나 작업의 흐름을 볼 수 있다. 전체적으로 어떤 서비스인지 설명할 때 사용한다.

> 브로드 캐스트가 뭐야!\
> 말 그대로 방송. 방송국이 신호하면 TV를 켠 시청자 모두가 전원을 동시에 받는 것처럼, 특정한 개인에게 보내는 게 아니라 연결된 모두에게 동시에 신호를 전달하는 것이 브로드캐스트.

> 브로드캐스트의 반대, 유니캐스트\
> 카카오톡, 인스타DM처럼 특정 개인에게 전하는 신호

(3) 시퀀스 차트

![](https://velog.velcdn.com/images/pbdorbit/post/920350a4-55d1-4e30-8a72-96145ee780e3/image.png)```null
->>  실선 화살표 = 요청 > 능동적으로 뭔가 함
-->> 점선 화살표 = 응답 > 받은 것에 대한 대답
```

시퀀스 차트는 누가에 집중되어 있다. 위에서 아래로 흐를수록 나중에 일어난 일. 기술적으로 동작하는 모습을 보여줄 때 사용한다.

아 힘드러 그래도 의식적으로 정리하고 구조를 익히려고 하면 언젠가 알게 되는 날이 오겠지? ...
