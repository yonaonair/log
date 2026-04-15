---
title: '`Next.js`, `Vercel`, `Supabase` 아키텍처 분석'
description: '알고 쓰자 '
pubDatetime: 2026-04-15T01:22:51.860Z
modDatetime: 2026-04-15T02:26:08.925Z
slug: nextjs-vercel-supabase-아키텍처-분석
featured: false
draft: true
tags: []
---
> 배포에 성공하기는 쉬웠다. 무수한 가이드가 인터넷에 있고 AI가 비약적인 발전을 거듭하는 시대니까. 하지만 알고 쓰지 않으면 잘 쓴 건지, 의도한 바에 일치하는지 점검할 수 없다. 그래서 글을 남겨둔다.

1. PaaS vs Baas

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

2. Severless 배포 

2-1. 정적 자산이 전세계에 배포되는 방법

`Vercel` 이나 `Netlify`에 `Next.js` 프로젝트를 푸시하면 내부적으로 일어나는 과정이 있다. 
