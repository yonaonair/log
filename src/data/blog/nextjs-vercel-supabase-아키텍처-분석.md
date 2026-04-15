---
title: '`Next.js`, `Vercel`, `Supabase` 아키텍처 분석'
description: '알고 쓰자 '
pubDatetime: 2026-04-15T01:22:51.860Z
modDatetime: 2026-04-15T01:38:05.662Z
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

추상화 수준이 높아질수록, 그러니까 `IaaS → PaaS → Baas → SaaS` 순서로 내려갈 수록 플랫폼은 더 많은 것을 대신 처리하고 개발자가 직접 관리해야 하는 범위는 좁아진다. 닫른 말로 “플랫폼에 대한 의존도가 높아진다” 라고 말하기도 한다. 
