---
title: 'React + flask + Docker 마라톤 배번 확인 로컬 개발 트러블슈팅 '
description: '26/6/28-26/7/7 프론트엔드 담당 '
pubDatetime: 2026-07-06T08:11:30.191Z
modDatetime: 2026-07-06T08:16:21.339Z
slug: react-flask-docker-마라톤-배번-확인-로컬-개발-트러블슈팅
featured: true
draft: false
tags:
  - app
  - javascript
  - web
  - frontend
  - 트러블슈팅
series: web
category: Series
---
# 문제 1. admin으로 로그인해도 이벤트 생성/관리자 메뉴가 안 보임

- `test@test.com`(role: admin)으로 로그인했는데 헤더에 "이벤트 생성", "관리자" 메뉴가 안 보임.
- 새로고침(Ctrl+Shift+R), 로그아웃 후 재로그인까지 해봐도 동일.
- 같은 코드인데 다른 팀원 화면과 다르게 보임.

## 원인 1. MySQL 볼륨을 초기화 → admin 계정 통째로 사라짐

- `.env` 의 db 자격증명을 수정한 뒤 반영하려고 `docker compose down - v` 로 mysql 볼륨 삭제 → 기존 admin 계정 포함 전체 유저 데이터 삭제됨
- `backend/app/blueprints/auth.py` 에서 `admin` role은 회원가입 API로 가입 자체가 막혀있고 역할변경 (`PATCH `/api/admin/users/:id/role)\`도 기존 admin만 호출 가능 → admin이 0명이면 API만으로는 다시 만들 방법 X

### 해결: 

`docker compose exec api python -c` 로 user 모델 직접 짜서 admin 계정 db에 바로 생성

## 원인 2. 프론트 코드에 넣어둔 mockup 모드로 빌드되어 있는 데이터가 남아있었음

- `frontend/.env` 에 `VITE_USE_MOCK=true`를 넣어두었는데, 이 값은 VITE가 빌드 시점에 정적으로 굳히는 값이라서 nginx 컨테이너 이미지 안에 mock 모드가 켜진 채로 유지되고 있었음
- mock 모드에서는 `frontend/src/api/auth.js`의 `resolveMockRole()`이 실제 로그인 API를 호출하지 않고 이메일 문자열에 `admin/organizer/photo` 포함 여부만 확인하고 role을 결정하는 로직이 포함되어 있었음
- 새로 만든 테스트용 관리자계정에는 이 문자열이 포함되어 있지 않아서 항상 `participant`로 처리되고 있었음
- 브라우저 콘솔에서 `JSON.parse(localStorage.getItem('runshot-auth')).state.user` 로 확인해보니 `{id: 999, role: 'participant'}` 라고 나옴. 그런데 이 값은 실제 DB에 존재 할 수 없는 데이터였고, mock 버전 코드에서 하드코딩된 더미 유저로 존재하는 값이었음

### 해결: 

- `VITE_USE_MOCK=false`로 수정 후 `docker compose build nginx && up -d nginx`로 재빌드

# 문제2. 브라우저 캐시 값이 남아있어서 오류가 계속됨

- 재빌드 이후에도 같은 브라우저 일반창에서 여전히 같은 문제 반복 (강력 새로고침, 개발자 도구 network 탭에서 캐시 삭제 완료)
- `POST /api/auth/login` 요청 자체가 안 뜻 ⇒ mock 코드가 여전히 실행중. 캐시 문제.
- 시크릿창으로 열어보니 정상 동작 → 일반 브라우저 프로플에서 강력 새로고침으로도 지워지지 않는 캐시가 남아있었던 것으로 추정

### 해결: 

devtools → application → storage → clear site data로 캐시/서비스워커/로컬스토리지 모두 삭제 후 재로그인 → 오류 해결

# 배운 점  

- `frontend/.env`의 `VITE_USE_MOCK`은 빌드 시점에 고정됨. 값 수정 이후 반드시 `docker compose build nginx`부터 다시 실행해야 함
- mysql/redis/minio/rabbitmq 컨테이너는 최초 볼륨 생성 시에만 `.env`의 계정/비밀번호를 반영. 자격증명을 바꾼 뒤 컨테이너만 재시작하면 실제 계정과 어긋나서 인증 실패가 남. 새 자격증명을 적용하려면 `down -v`로 볼륨을 지우고 다시 올려야 하고 그러면 데이터(유저 포함)가 전부 날아감.
- admin 계정은 API로 스스로 만들 수 없음(회원가입 API가 admin role을 막음). DB를 초기화했다면 첫 admin은 직접 DB에 넣어줘야 함. 시드 스크립트가 없으니 필요하면 만드는 것도 고려.
- 화면이 이상할 때 진단 순서: ① 서버가 실제로 최신 상태인지(컨테이너 재시작 시각, 빌드 산출물 해시) 확인 → ② curl로 프록시 경로 그대로 API 응답 확인 → ③ 브라우저 콘솔/localStorage 값 확인 → ④ Network 탭에 예상한 API 요청이 실제로 뜨는지 확인(안 뜨면 mock/캐시 의심) → ⑤ 시크릿 창으로 캐시 변수 확인.
- 프론트 CSS/JSX를 자주 고칠 땐 도커 재빌드 대신 `npm run dev`(Vite, HMR)로 `http://localhost:5173`에서 작업하는 게 훨씬 빠름(`vite.config.js`에 `/api → localhost:5000` 프록시 이미 설정됨)

흠… ai agent를 활용해서 진행한 작업이라도 웹에 대한 기본 지식이 필요했음. 캐시, 빌드, 환경 등에 대한 지식이 전혀 없었다면 오류를 해결하는데에 기간이 훨씬 오래 걸렸을 것. 앞으로 배포 단의 일을 맡는 엔지니어링을 진행하더라도 네트워크와 브라우저 동작 원리 등에 대한 지식을 먼저 학습해야겠다는 생각을 함.
