---
title: AWS EC2로 실시간 채팅 앱 배포하기 (2)
description: ''
pubDatetime: 2026-04-06T08:49:08.181Z
modDatetime: 2026-04-06T08:53:14.589Z
slug: aws-ec2로-실시간-채팅-앱-배포하기-2
featured: false
draft: false
tags:
  - aws
  - node.js
  - socket.io
  - app
series: web
---
지난 포스팅에 적었던 것처럼 2024년 경에 나는 같은 프로젝트를 했던 적이 있다. 해당 github 계정은 작년에 의도하지 않은 사고로 번호를 바꾸게 되면서 복구가 불가능하게 되었는데, 다행히 레파지토리는 살아있었던 모양인지 링크를 찾았다!

그때는 아무것도 모르고 오로지 `배포를 해보고 싶다!`는 열의 하나로 모든 걸 했기 때문에 (ㅋㅋ) EC2가 뭔지, 배포라는게 정확히 무슨 의미인지 전혀 몰랐고, 구글링과 gpt를 양 팔에 끼고 일주일 내내 끙끙거리면서 붙잡고 있었던 기억이 있다. 마침 그때 소스 코드를 `clone` 할 수 있는 링크를 찾았으니 같은 과정으로 `EC2`를 통해 먼저 배포 해보고, 이후 지난 시간에 적었던 것처럼 `EC2+RDS`로 배포하는 과정을 모두 기록해두려고 한다.

# 1. 로컬에서 잘 동작하는지 확인하기

![](https://velog.velcdn.com/images/pbdorbit/post/81b42321-97e7-4998-95bf-47b464ffbb0a/image.png)ㅎㅎ\
다시보니 좀 부끄럽다

유튜브 영상도 전부 영문이었던데다 소켓도 처음 사용해보는 거라 당시에 코드 짤 때부터 엄청 애먹었었다. 지금 보면 정말 별 거 없는 기능들, 심지어 DB도 사용하지 않는 실시간 소통이라 이름, 채널만 입력하고 들어가서 실시간 채팅하고 나오면 바로 데이터도 사라지는 구조였는데도 그랬다.

하여튼

```null
chat-app
ㄴ client //react port:80
ㄴ server //node.js port:4000
```

이런 구조였기 때문에 하위 폴더들 모두 들어가서 `npm i`로 의존성 설치하고 동작 확인 해주었다. 2024년 코드라 의존성 경고가 엄청 뜨는 건 잠시 눈을 감고 . . .

# EC2 인스턴스 생성하기

배포를 위해 `EC2 인스턴스`, 그러니까 AWS에서 빌릴 가상 컴퓨터를 생성해준다. 나는 아래와 같이 설정했다.

## EC2 인스턴스 설정

| 항목 | 값 |
| --- | --- |
| 이름 | `chat-app-server` |
| AMI | Ubuntu Server 22.04 LTS (프리 티어) |
| 인스턴스 유형 | `t3.micro` (프리 티어) |
| 키 페어 | `chat-key` (기존 키 사용) |

## 네트워크 설정

| 항목 | 값 |
| --- | --- |
| VPC | 기본 VPC (default) |
| 퍼블릭 IP | 활성화 |
| 보안 그룹 이름 | `chat-server-sg` |

## 보안 그룹 인바운드 규칙

| 유형 | 프로토콜 | 포트 | 소스 |\
|------|---------|------|------|

![](https://velog.velcdn.com/images/pbdorbit/post/b1706854-c793-4cc6-9fbe-5fba9975b670/image.png)| HTTP | TCP | 80 | `0.0.0.0/0` |\
| 사용자 지정 TCP | TCP | 4000 | `0.0.0.0/0` |\
| SSH | TCP | 22 | 내 IP |

# EC2 본격 세팅

## SSH 접속

이후 인스턴스 상태가 `실행 중`이 되면 퍼블릭 IP를 복사해서 SSH로 접속한다.

사전에 배포를 위해 `.pem` 파일을 생성해두어서 그대로 사용하려고 했는데, 아래와 같은 에러가 떴다.

```bash
PS C:\.ssh> ssh -i chat-key.pem ubuntu@43.201.254.6
The authenticity of host '----' can't be established.

Warning: Permanently added '------ (ED25519) to the list of known hosts.
Bad permissions. Try removing permissions for user: BUILTIN\\Users (S-1-5-32-545) on file C:/.ssh/chat-key.pem.
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@         WARNING: UNPROTECTED PRIVATE KEY FILE!          @
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
Permissions for 'chat-key.pem' are too open.
It is required that your private key files are NOT accessible by others.
This private key will be ignored.
Load key "chat-key.pem": bad permissions
ubuntu@43.201.254.6: Permission denied (publickey).
```

`.pem` 파일 권한을 아까는 다른 데탑에서 설정해서 잊고 있었다. 권한 설정 다시!

```powershell
icacls C:\.ssh\chat-key.pem /inheritance:r
icacls C:\.ssh\chat-key.pem /grant:r "$($env:USERNAME):(R)"
```

그리고 다시 접속!

```bash
ssh -i C:\.ssh\chat-key.pem ubuntu@43.201.254.6
```

## `Node.js` 설치

```bash
# 1. Node.js 20 버전 설치 스크립트를 인터넷에서 받아서 바로 실행
# curl = 인터넷에서 파일 받는 명령어
# | sudo -E bash - = 받은 스크립트를 관리자 권한으로 바로 실행
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# 2. 실제 Node.js 설치
# apt-get = Ubuntu 패키지 설치 명령어
# -y = 설치 중 나오는 y/n 질문에 자동으로 y 답변
sudo apt-get install -y nodejs

# 3. 설치 확인
# 버전 번호가 뜨면 정상
node -v
npm -v
```

실행하면 아래와 같이 버전 번호가 나와야 한다.

![](https://velog.velcdn.com/images/pbdorbit/post/8fa11deb-4cae-4514-9467-8e4dd1426e5f/image.png)## 소스 코드 올리기

환경을 세팅했으니 배포할 코드를 올린다. 이때 `git`을 이용한다.

```bash
# git 설치
# EC2에는 git이 기본으로 없어서 따로 설치해야 함
sudo apt-get install -y git

# 프로젝트 클론
# EC2 서버로 코드를 가져오는 것
git clone https://github.com/anhyunji494/chat-app.git

# 폴더 진입
cd chat-app

# 잘 받아졌는지 확인
ls
```

이번에도 잘 설치되었다. `git clone`도 성공적이다. 아래와 같은 메세지가 출력되었다.

![](https://velog.velcdn.com/images/pbdorbit/post/1a559823-3b75-4564-9ce3-9b6503ba6164/image.png)이제 서버 먼저 설치한다 !

### server 먼저 실행!

```bash
# 서버 폴더로 이동
cd server

# 패키지 설치
# package.json에 적힌 라이브러리들을 한번에 설치
npm install

# 서버 실행 확인
node index.js
```

![](https://velog.velcdn.com/images/pbdorbit/post/efbb1771-b9e9-4e0f-aebe-90dbf9208110/image.png)마지막으로 서버 실행!

```bash
node index.js
```

설정해둔 서버 실행 메세지가 출력되면 서버는 끝! 다만 구 버전이라서 vulnerability 경고가 많이 출력되기는 한다 (ㅎㅎ)

![](https://velog.velcdn.com/images/pbdorbit/post/b8c1f7aa-6b83-432e-87a7-ac2e48c17b6e/image.png)### client 실행!

일단 새 창에서 SSH 접속한다. 그리고 클라이언트 폴더로 이동해 패키지 설치 후 빌드 실행한다.

```bash
# 새 SSH 창에서 접속
ssh -i C:\.ssh\chat-key.pem ubuntu@43.201.254.6

# 클라이언트 폴더로 이동
cd chat-app/client

# 패키지 설치
npm install

# 빌드
# React 코드를 HTML/CSS/JS 정적 파일로 변환하는 것
# 결과물이 build/ 폴더에 생김
npm run build
```

다음으로 nginx를 설치하고 빌드 파일 서빙

```bash
# nginx 설치
# nginx = 빌드된 React 파일을 사용자에게 전달하는 웹 서버
sudo apt-get install -y nginx

# nginx 실행
sudo systemctl start nginx

# 서버 재시작해도 nginx 자동 실행되게 설정
sudo systemctl enable nginx

# 실행 확인
sudo systemctl status nginx
```

그때는 `nginx`를 어케 읽는지도 몰랐는데 좀 감격스럽고.....

![](https://velog.velcdn.com/images/pbdorbit/post/d93456b0-57a9-4c28-8ba8-92a4bb9c04b9/image.png)`q`를 눌러 로그창을 빠져나온다. 이후 빌드 파일을 `nginx`가 서빙할 수 있게 연결!

```bash
# 기존 nginx 기본 페이지 삭제
sudo rm -rf /var/www/html/*

# React 빌드 파일을 nginx 서빙 폴더로 복사
# /var/www/html = nginx가 파일을 찾는 기본 폴더
sudo cp -r ~/chat-app/client/build/* /var/www/html/

# 잘 복사됐는지 확인
ls /var/www/html
```

![](https://velog.velcdn.com/images/pbdorbit/post/b8702f56-08a4-4cc0-bd03-db85b5e47de9/image.png)이렇게! 파일 목록이 잘 나오면 `PM2`로 서버 백그라운드 실행할 준비한다.

```bash
# PM2 설치
# PM2 = 서버가 꺼져도 자동으로 재시작해주는 프로세스 관리자
# 지금은 node index.js 하면 터미널 닫으면 서버도 꺼짐
# PM2 쓰면 백그라운드에서 계속 실행됨
sudo npm install -g pm2

# 서버 폴더로 이동
cd ~/chat-app/server

# PM2로 서버 실행
pm2 start index.js --name chat-server

# EC2 재시작해도 자동으로 pm2 실행되게 설정
pm2 startup
# 위 명령어 실행하면 sudo 명령어 하나 출력됨 → 그거 복사해서 실행

pm2 save

# 실행 확인
pm2 status
```

근데 바로 에러 났다. 내 기억으로는 2024년에 배포할 때는 이 에러를 어떻게 하지를 못해서 (ㅋㅋ) EC2를 다시 세팅하고 파일들 다시 받고 하면서 내내 헤맸는데, 문제는 간단한 거였다. 일단 에러로그부터.

```bash
ubuntu@ip-10-0-11-3:~/chat-app/server$ pm2 logs chat-server --lines 20
[TAILING] Tailing last 20 lines for [chat-server] process (change the value with --lines option)
/home/ubuntu/.pm2/logs/chat-server-out.log last 20 lines:
/home/ubuntu/.pm2/logs/chat-server-error.log last 20 lines:
0|chat-ser |     at listenInCluster (node:net:1965:12)
0|chat-ser |     at doListen (node:net:2139:7)
0|chat-ser |     at process.processTicksAndRejections (node:internal/process/task_queues:83:21) {
0|chat-ser |   code: 'EADDRINUSE',
0|chat-ser |   errno: -98,
0|chat-ser |   syscall: 'listen',
0|chat-ser |   address: '0.0.0.0',
0|chat-ser |   port: 4000
0|chat-ser | }
0|chat-ser | Error: listen EADDRINUSE: address already in use 0.0.0.0:4000
0|chat-ser |     at Server.setupListenHandle [as _listen2] (node:net:1908:16)
0|chat-ser |     at listenInCluster (node:net:1965:12)
0|chat-ser |     at doListen (node:net:2139:7)
0|chat-ser |     at process.processTicksAndRejections (node:internal/process/task_queues:83:21) {
0|chat-ser |   code: 'EADDRINUSE',
0|chat-ser |   errno: -98,
0|chat-ser |   syscall: 'listen',
0|chat-ser |   address: '0.0.0.0',
0|chat-ser |   port: 4000
0|chat-ser | }
```

첫번째 터미널에서 `node index.js` 실행한 게 살아있어서 포트가 충돌 났던 거다. 그래서 포트 킬 먼저 해줄 거고

```bash
# 4000번 포트 쓰고 있는 프로세스 찾기
sudo lsof -i :4000

# 죽이기 (PID 자리에 위에서 나온 숫자 넣기)
sudo kill -9 <PID>

# pm2 재시작
pm2 restart chat-server

# 확인
pm2 status
```

요 에러는 그래도 웹 개발 중에도 자주 만나서 덜 어려웠는데 문제는.........

![](https://velog.velcdn.com/images/pbdorbit/post/2dea7414-3716-414a-bf1e-294f8f7f0bd7/image.png)이렇게 예쁘게 온라인 표시가 나왔는데도 정작 접속하면 `전송` 버튼이 작동을 안 했다! 로컬에서는 작동이 잘 됐는데! 그래서 2024년의 나는 또 일주일을 헤맸었다 (ㅋㅋ) 정말로 지옥같은 여기서 날 꺼내줘의 반복이었던 걸로 기억. 심지어 그때는 리눅스도 익숙하지 않았을 때였으니까...

하여튼 문제는! 클라이언트 코드에서 소켓 서버주소를 설정하면서 `localhost:4000`으로 하드코딩 했던 거였다. 나중에 알고 너무 허탈해서 소리지르고 싶었던 기억.

확인을 위해 보면

```bash
ubuntu@ip-10-0-11-3:~/chat-app/server$ cat ~/chat-app/client/src/components/Chat/Chat.js
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router';
import io from 'socket.io-client';

import './Chat.css';
import queryString from 'query-string';
import InfoBar from '../InfoBar/InfoBar';
import Input from '../Input/Input.js';
import Messages from '../Messages/Messages.js';

const ENDPOINT = 'http://13.125.239.48:4000'; // 바로 얘가 문제였다. 옛날 IP로 세팅되어 있었음 
const socket = io(ENDPOINT);

const Chat = () => {
  // location hook
  let location = useLocation();

  // setter
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const { name, room } = queryString.parse(location.search);

    setName(name);
    setRoom(room);

    socket.emit('join', { name, room }, () => {});

    return () => {
      socket.disconnect();
      socket.off();
    };
  }, [ENDPOINT, location.search]);

  useEffect(() => {
    socket.on('message', (message) => {
      setMessages([...messages, message]);
    });
  }, [messages]);

  // function for sending messages

  const sendMessage = (event) => {
    event.preventDefault();
    console.log('Sending message:', message);
    if (message) {
      socket.emit('sendMessage', message, () => setMessage(''));
    }
  };

  console.log(message, messages);
  return (
    <div className="outerContainer">
      <div className="container">
        <InfoBar room={room} />
        <Messages messages={messages} name={name} />
        <Input
          message={message}
          setMessage={setMessage}
          sendMessage={sendMessage}
        />
      </div>
    </div>
  );
};

export default Chat;
```

새 IP로 수정하고 다시 빌드!

```bash
# 파일 수정
sed -i "s|http://13.125.239.48:4000|http://43.201.254.6:4000|g" ~/chat-app/client/src/components/Chat/Chat.js

# 확인
grep ENDPOINT ~/chat-app/client/src/components/Chat/Chat.js

# 클라이언트 폴더로 이동
cd ~/chat-app/client

# 다시 빌드
npm run build

# nginx에 복사
sudo cp -r build/* /var/www/html/
```

이후 다시 브라우저에서 접속하고 나면 깨끗하게 잘 동작했다!

- EC2 생성

- Node.js + PM2 서버 실행

- React 빌드 + ngingx 서빙

- URL 연결 확인

까지 했을 때 그때는 하루에 8시간씩 코드를 붙잡아도 일주일이 넘게 걸렸었는데 2026년 지금은 한시간도 안 돼서 다 끝냈다. AI를 사용하기는 그때도 지금도 마찬가지였고 AI의 발전을 무시할 수 없다! 라고 한다면 할 말은 없겠지만, 그래도 한번 해봤다고 훨씬 수월했다고 생각한다.

생각해보면 배포라는 행위의 의미 자체를 몰랐다. `EC2`라는 게 뭔지, 도대체 가상 컴퓨터는 왜 빌려야 하는지, `node.js` 서버를 올려야 한다면서 `PM2`는 왜 나오는지 (ㅋㅋ) 그때는 알쏭당쏭....... 보다 이제 오류 때문에 보기 싫어서 엉 울고 싶었던 것들이 조금이나마 이해할 수 있게 되었다는게 많이 감개무량하다 😭

마지막으로 다이어그램들 붙여둔다

## 시스템 아키텍처

![](https://velog.velcdn.com/images/pbdorbit/post/aa2ee520-efed-42b5-a9ac-75ce5464f8d4/image.png)## 시퀀스 다이어그램

![](https://velog.velcdn.com/images/pbdorbit/post/287a5eb0-ac60-4f97-aa57-8fbab433cb2c/image.png)## 배포 플로우차트

으하하 뿌듯해 !!
