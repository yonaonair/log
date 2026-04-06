---
title: Next.js + Supabase SSR 인증 트러블슈팅
description: 무한 리디렉션이라니
pubDatetime: 2026-03-11T04:20:00.000Z
modDatetime: 2026-04-06T08:46:33.950Z
slug: nextjs-supabase-ssr-인증-트러블슈팅
featured: false
draft: false
tags:
  - next.js
  - supabase
series: trouble shooting
---
# Next.js + Supabase SSR 인증 트러블슈팅

## 증상

- 로그인 후 계속 `/login`으로 리디렉션

- 로그아웃 후 무한 리디렉션 루프 (307 반복)

- DevTools Application 탭 쿠키에 세션 정보가 없음

---

## 근본 원인

`createBrowserClient`로 로그인하면 세션이 **localStorage에만 저장**된다. 서버(Server Component, middleware)는 localStorage를 읽을 수 없기 때문에 항상 "로그인 안 된 상태"로 판단 → 무한 리디렉션 루프 발생.

**해결 방법:** 로그인 후 서버 콜백(`/api/auth/callback`)을 거쳐 세션을 **쿠키에 저장**해야 서버가 인증 상태를 읽을 수 있다.

---

## 최종 파일 구조

```
src/
├── app/
│   ├── layout.tsx                        # RootLayout — ThemeProvider만
│   ├── page.tsx                          # 로그인 여부로 /tasks 또는 /login redirect
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx                  # 로그인 폼
│   ├── api/
│   │   └── auth/
│   │       └── callback/
│   │           └── route.ts             # ← 핵심! 세션을 쿠키에 저장
│   └── (dashboard)/
│       ├── layout.tsx                    # Header/Footer + 인증 체크
│       └── tasks/
│           └── page.tsx
├── components/
│   ├── common/
│   │   └── ThemeRegistry.tsx
│   └── layout/
│       ├── Header.tsx
│       └── Footer.tsx
└── lib/
    └── supabase/
        ├── client.ts                     # 브라우저용
        └── server.ts                     # 서버용 (async)
middleware.ts                             # 프로젝트 루트 — 세션 갱신만
```

---

## 각 파일 역할

### `middleware.ts` (프로젝트 루트)

세션 쿠키 **갱신만** 담당. redirect 로직 없음. middleware에서 redirect하면 `/login`도 잡혀서 루프 발생하므로 제거.

```ts
export async function middleware(request: NextRequest) {
  // supabase 클라이언트 생성 + getUser() 호출로 세션 갱신만
  await supabase.auth.getUser();
  return response;
}
```

### `src/app/api/auth/callback/route.ts` ← 핵심

로그인 성공 후 이 라우트를 거쳐야 세션이 **쿠키에 저장**된다.

```ts
export async function GET(request: NextRequest) {
  const code = searchParams.get("code");
  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(`${origin}/tasks`);
}
```

### `src/app/(auth)/login/page.tsx`

로그인 성공 후 `router.push` 대신 `window.location.href` 사용. → full reload로 서버가 새 쿠키를 읽도록 강제.

```ts
const { error } = await supabase.auth.signInWithPassword({ email, password });
if (!error) {
  window.location.href = "/tasks"; // router.push 사용 금지
}
```

### `src/app/(dashboard)/layout.tsx`

인증 체크는 여기서만 담당.

```ts
const { data: { user } } = await supabase.auth.getUser();
if (!user) redirect("/login");
```

### `src/app/layout.tsx`

ThemeProvider만. 인증 로직 없음. **이 파일에 인증 체크가 있으면 /login도 redirect 대상이 되어 루프 발생.**

```ts
export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  );
}
```

---

## 로그아웃

클라이언트 `signOut()`은 localStorage만 지우고 서버 쿠키는 못 지움. API route에서 서버 측 signOut을 호출해야 함.

```ts
// src/app/api/logout/route.ts
export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect("/login");
}

// Header.tsx
const handleLogout = async () => {
  await fetch("/api/logout", { method: "POST" });
  window.location.href = "/login";
};
```

---

## Supabase 대시보드 설정

Authentication → URL Configuration

```
Site URL: http://localhost:3000
Redirect URLs: http://localhost:3000/api/auth/callback
```

---

## 문제 요약

| 문제 | 결과 | 해결 |
| --- | --- | --- |
| `app/layout.tsx`<span>에 인증 체크</span> | `/login`<span>도 redirect 대상이 되어 루프</span> | `(dashboard)/layout.tsx`<span>로 이동</span> |
| <span>middleware에서 redirect</span> | `/login`<span> 접근 시 루프</span> | <span>middleware는 세션 갱신만</span> |
| `router.push("/tasks")`<span> 로 로그인 후 이동</span> | <span>서버가 세션 쿠키 못 읽음</span> | `window.location.href`<span> 사용</span> |
| <span>클라이언트 </span>`signOut()`<span> 후 이동</span> | <span>서버 쿠키 미삭제 → 루프</span> | <span>API route에서 서버 signOut</span> |
| <span>callback route 없이 로그인</span> | <span>세션이 localStorage에만 저장</span> | `/api/auth/callback`<span> route 필수</span> |
