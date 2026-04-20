---
title: 'Next.js + Supabase + Vercel 사내 CS홈페이지 트러블슈팅 '
description: ''
pubDatetime: 2026-04-20T07:56:42.368Z
modDatetime: 2026-04-20T08:25:03.160Z
slug: nextjs-supabase-vercel-사내-cs홈페이지-트러블슈팅
featured: true
draft: false
tags:
  - 트러블슈팅
series: web
category: Tech
---
스타트업의 최대 이점이자 단점이 사수가 없다는 점이라고 들은 적 있다. 인턴으로 근무하는 회사에서 그 양쪽을 절실히 느끼는 것 같다. 

일단 이 프로젝트는 `Next.js` + `Supabase (DB, Auth)` + `Cloudflare R2(object storage)` + `Vercel(배포)` 로 만들었다. 사내 주문과 CS 작업 관리를 위해 만들었고, 코드 전체를 공개하지는 않는다. 문제점을 해결한 방안을 정리해두려고 한다. 

# 1. Next.js SSR과 브라우저 API 충돌 

## → 빌드 에러, 로그인 버튼 먹통 

### (1) 빌드 자체가 터짐

에러 메세지는 다음과 같았다. 

```
Error: createBrowserClient() called before environment variables are available
```

처음 코드는 아래와 같이 작성했다. 

```
// login/page.tsx 최상위 (컴포넌트 밖)
const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export default function LoginPage() { ... }
```

모듈 최상위에 Supabase 클라이언트를 바로 만든 상황이었다. 

### 문제가 되는 이유 

`Next.js`는 빌드 시점에 각 페이지를 `prerender (사전 렌더)` 한다. 이 과정에서 모듈을 임포트하는 순간 최상위코드가 실행된다. 문제는 이 시점이 `Node.js`의 빌드 환경이라서, `NEXT_PUBLIC_SUPABASE_URL` 같은 런타임 환경 변수가 아직 주입되지 않은 상태일 수 있다. 

<div color="yellow" data-type="callout" data-color="yellow" class="callout callout-yellow">
<p><strong>빌드 시점</strong> </p><p>모듈 임포트 → <code>createBrowserClient()</code> 즉시 실행 → 환경볌수 없음 → 에러</p>
</div>

### 해결 방법

클라이언트 초기화를 컴포넌트 내부 `useMemo`로 옮긴다. 

```
export default function LoginPage() {
    const supabase = useMemo(
        () => createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        ),
        [],
    );
    ...
}
```

`useMemo`<span>는 컴포넌트가 실제로 마운트될 때 실행된다. 빌드 시 prerender 단계가 아니라 런타임에 실행되므로 환경변수가 정상적으로 주입된 상태다. </span>`[]`<span> 의존성 배열로 한 번만 생성하게 해서 불필요한 재생성도 막았다.</span>

### (2) 빌드는 되는데 로그인 버튼이 비활성화됨 

빌드 에러는 고쳤는데 이번엔 다른 증상이 나왔다. 로그인 페이지에는 `아이디/비밀번호 저장` 체크박스가 있고 이전에 저장한 값이 있으면 입력 필드를 자동으로 채워주는 기능이 있었다. 그런데 저장한 계정이 있어도 로그인 버튼이 활성화되지 않았다.

작성했던 코드는 아래와 같다. 

```
const [email, setEmail] = useState(
    () => (typeof window !== "undefined" && localStorage.getItem(LS_SAVE) === "1")
        ? (localStorage.getItem(LS_EMAIL) ?? "")
        : "",
);
```

<span>서버에서는 </span>`window`<span>가 없으니까 </span>`typeof window !== "undefined"`<span> 체크하면 될 거라고 생각한 코드다.</span>

### 문제가 되는 이유 → `Hydration Mismatch` 

<span>Next.js </span>`use client` 컴포넌트도 초기 렌더링은 서버에서 한 번, 클라이언트에서 한 번, 총 두 번 일어난다. 

<div color="yellow" data-type="callout" data-color="yellow" class="callout callout-yellow">
<p><strong>서버 렌더</strong></p><p><code>typeof window === "undefined"</code> → <code>email 초기값 = ""</code> </p><p><strong>클라이언트 렌더</strong></p><p><code>localStorage</code>에 값 있음 → <code>email 초기값 = "user@email.com"</code></p>
</div>

두 결과가 다르다. 

그래서 `React`는 이걸 `Hydration Mismatch`라고 감지하고 클라이언트 렌더 결과를 버리고 서버 렌더 결과(빈 값)으로 덮어쓴다. 결국 입력 필드가 빈 채로 남는 셈이 되어 버튼 활성화 조건`email && password`)이 `false`가 된다.

### 해결 방법

`useState`<span> 초기값에서 </span>`localStorage`<span> 접근을 완전히 제거하고 </span>`useEffect`<span>로 마운트 이후에 복원한다.</span>

```
// 초기값은 무조건 빈값 (서버/클라이언트 동일)
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [saveCredentials, setSaveCredentials] = useState(false);

// 마운트 이후 localStorage에서 복원
useEffect(() => {
    if (localStorage.getItem(LS_SAVE) === "1") {
        setSaveCredentials(true);
        setEmail(localStorage.getItem(LS_EMAIL) ?? "");
        setPassword(localStorage.getItem(LS_PASSWORD) ?? "");
    }
}, []);
```

`useEffect`<span>는 서버에서 실행되지 않는다. 브라우저에 마운트된 이후에만 실행된다. </span>

<span>따라서 서버/클라이언트 초기 렌더 결과가 동일하게 빈값이 되고 </span>`hydration`<span>이 성공한다. 이후 </span>`useEffect`<span>가 실행되면서 </span>`localStorage`<span> 값이 복원되고 버튼이 활성화된다.</span>

<div color="red" data-type="callout" data-color="red" class="callout callout-red">
<p>Next.js에서 <code>localStorage</code>, <code>window</code>, <code>document</code> 같은 브라우저 전용 API는 초기 렌더 시점에 절대 접근하면 안 된다<strong>.</strong> 항상 <code>useEffect</code> 또는 <code>useMemo</code> 안에서 마운트 이후에 접근해야 한다.</p>
</div>

## 

# 2. 탭 클릭마다 3-5초 로딩 

## → Next.js에서 layout의 문제 

이 시스템의 핵심 화면은 여러 디자이너별 탭으로 구성된 작업 보드다. 디자이너가 여러 명이고 탭을 자주 전환하면서 업무를 본다. 그런데 탭을 클릭할 때마다 3\~5초씩 로딩이 걸렸다. 사실상 사용이 불가능한 수준이었다.

### 원인 분석 → `layout.tsx`가 매번 실행

<span>Next.js App Router에서 </span>`layout.tsx`<span>는 공통 UI(헤더, 내비게이션 등)를 담는 파일이다. </span>

<span>처음 구조는 이랬다.</span>

```
// board/layout.tsx
export default async function BoardLayout({ children }) {
    const supabase = await createClient();

    // 쿼리 1: 현재 유저 인증 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    // 쿼리 2: 유저 역할(role) 조회
    const { data: profile } = await supabase
        .from("profiles")
        .select("role, name")
        .eq("id", user.id)
        .single();

    // 쿼리 3: 활성 디자이너 목록 조회
    const { data: designers } = await supabase
        .from("designers")
        .select("id, name, avatar_url")
        .eq("is_active", true)
        .order("name");

    return (
        <div>
            <header>...</header>
            <BoardNav designers={designers} isAdmin={...} />
            {children}
        </div>
    );
}
```

문제는 Next.js App Router에서 `layout.tsx`는 라우트가 변경될 때마다 재실행된다는 점이었다.

디자이너 탭은 `/board/designers/1`, `/board/designers/2` 이런 식으로 URL이 바뀐다. 

그러니까 탭을 클릭할 때마다 아래와 같은 순서가 반복되고 있었다. 

<div color="yellow" data-type="callout" data-color="yellow" class="callout callout-yellow">
<p>탭 클릭
  → URL 변경
  → layout.tsx 재실행
  → Vercel 서버에서 Supabase로 쿼리 3번
  → Supabase가 응답
  → Vercel이 HTML 조립
  → 브라우저에 전달</p>
</div>

<span>이 왕복이 매 탭 클릭마다 일어났다. Vercel 서버와 Supabase가 지리적으로 다른 리전에 있을 경우 이 왕복만 수백 ms고, 쿼리 3번이니 직렬로 실행되면 2초에서 5초까지 걸렸다. 네트워크 탭에서 확인해보고 헛웃음이 나왔다. 당연히 사용에 불편을 느끼시고 개선을 요청하셨다. </span>

### 해결 방법

### 1단계. 인증은 `middleware`로 이전 

<span>인증 체크(</span>`supabase.auth.getUser()`<span>)를 layout에서 꺼내 </span>`middleware.ts`<span>로 옮겼다.</span>

```
// middleware.ts
export async function middleware(request: NextRequest) {
    const supabase = createServerClient(...);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user && !request.nextUrl.pathname.startsWith("/login")) {
        return NextResponse.redirect(new URL("/login", request.url));
    }
    if (user && request.nextUrl.pathname.startsWith("/login")) {
        return NextResponse.redirect(new URL("/board", request.url));
    }

    return NextResponse.next();
}
```

<span>middleware는 Next.js의 </span>`Edge Runtime`<span>에서 실행된다. Vercel의 일반 서버리스 함수보다 훨씬 가볍고 빠른데다 인증 쿠키 확인 정도는 충분히 처리 가능하다.</span>

### 2단계. layout을 정적 껍데기로 전환 

```
// board/layout.tsx — 서버 쿼리 전부 제거
export default function BoardLayout({ children }) {
    return (
        <div id="wrap">
            <header>...</header>
            <Suspense>
                <BoardNav />  {/* props 없음 — 자체 fetch */}
            </Suspense>
            <div>{children}</div>
        </div>
    );
}
```

<span>이제 layout은 HTML 구조만 담고 있다. 서버 쿼리가 없어서 바로 렌더링된다.</span>

### 3단계. 데이터는 클라이언트 컴포넌트가 직접 `Supabase` 호출  

```
// BoardNav.tsx
export default function BoardNav() {
    const [designers, setDesigners] = useState([]);
    const [role, setRole] = useState(null);

    useEffect(() => {
        const supabase = createClient(); // 브라우저용 Supabase 클라이언트
        // 브라우저 → Supabase 직접 (Vercel 서버 거치지 않음)
        supabase.from("designers").select(...).then(({ data }) => setDesigners(data));
    }, []);

    return <nav>...</nav>;
}
```

### 결과

<div color="yellow" data-type="callout" data-color="yellow" class="callout callout-yellow">
<p><strong>Before</strong></p><p>브라우저 → Vercel 서버 → Supabase → Vercel 서버 → 브라우저 (3~5초)</p><p><br><strong>After</strong></p><p>layout 바로 렌더 + 브라우저 → Supabase 직접 (0.2~0.5초)</p>
</div>

<span>탭 클릭 후 지연 시간이 사용할 수 있는 수준이 되었다. </span>

<div color="red" data-type="callout" data-color="red" class="callout callout-red">
<p><span>Next.js App Router에서 </span><code>layout.tsx</code><span>에 서버 쿼리를 넣으면 </span>해당 레이아웃 아래 모든 라우트 이동마다 쿼리가 실행된다.<span> 공통 레이아웃에서 데이터를 내려주는 패턴은 직관적으로 보이지만 페이지 이동이 잦은 앱에선 심각한 성능 문제가 된다.</span></p>
</div>

# 3. 작업 상태 변경이 느림 

## → 서버 액션의 보이지 않는 비용

작업 보드에서 주문 상태를 클릭 한번으로 바꾸거나 우선 작업으로 지정하거나 담당 디자이너를 변경하는 기능이 있다. NExt.js의 `서버액션 (Server Action)` 으로 구현했는데 클릭후 반영까지 `300-800ms`가 걸렸다. 목록이 많아지면 더 느려졌다. 

### 서버 액션 

<span>Next.js 서버 액션은 서버에서 실행되는 함수를 클라이언트에서 직접 호출하는 것처럼 쓸 수 있게 해주는 기능이다.</span>

```
// actions.ts
"use server";

export async function updateTaskStatus(id: string, status: string) {
    const supabase = await createClient(); // 서버용 클라이언트
    await supabase.from("tasks").update({ status }).eq("id", id);
}

// BoardTable.tsx (클라이언트 컴포넌트)
import { updateTaskStatus } from "./actions";

<button onClick={() => updateTaskStatus(task.id, "완료")}>완료</button>
```

<span>코드가 깔끔하고 타입도 맞아서 자연스럽게 선택했다. 근데 실제 실행 흐름을 따라가보면 문제가 보인다.</span>

### 원인 분석 → 왕복 2번 + 인증 요청

서버 액션을 호출하면 실제로 이런 일이 일어난다.

<div color="yellow" data-type="callout" data-color="yellow" class="callout callout-yellow">
<p>1. 브라우저에서 Vercel 서버로 HTTP POST 요청 전송
2. Vercel 서버: supabase.auth.getUser() 로 인증 확인 (Supabase 네트워크 요청 1회)
3. Vercel 서버: tasks 테이블 업데이트 쿼리 (Supabase 네트워크 요청 2회)
4. Vercel 서버가 브라우저로 응답 반환</p>
</div>

브라우저와 Vercel 사이 왕복이 1회, Vercel과 Supabase 사이 왕복이 최소 2회. 이게 직렬로 일어난다. 거기다 `getUser()`는 Supabase Auth 서버에 매번 네트워크 요청을 보낸다.

그리고 Vercel의 서버리스 함수는 일정 시간 미사용 시 콜드 스타트가 발생한다. 이렇게 되면첫 요청이 수백 ms 더 걸린다.

### 해결 방법 → `Supabase RLS` 를 믿고 클라이언트에서 직접 호출 

Supabase는 `RLS(Row Level Security)` 라는 기능을 제공한다. 테이블에 정책을 걸어두면 클라이언트가 직접 접근하더라도 해당 유저가 권한 있는 데이터만 읽고 쓸 수 있다. 서버가 중간에서 검증을 대신 할 필요가 없다.

이 점을 활용해서 `clientMutations.ts`를 새로 만들었다.

```
// clientMutations.ts
import { createClient } from "@/lib/supabase/client"; // 브라우저용

async function withUser() {
    const supabase = createClient();

    // getSession()은 네트워크 요청 없이 localStorage에서 즉시 읽음
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", userId)
        .single();

    return { supabase, userId, userName: profile?.name };
}

export async function clientUpdateTaskStatus(id, oldStatus, newStatus) {
    const { supabase, userId, userName } = await withUser();

    // 브라우저 → Supabase 직접 업데이트
    await supabase.from("tasks").update({ status: newStatus }).eq("id", id);

    // 변경 이력도 직접 기록
    await supabase.from("task_logs").insert({
        task_id: id,
        changed_field: "status",
        old_value: oldStatus,
        new_value: newStatus,
        changed_by_name: userName,
    });
}
```

<span>핵심은 </span>`getSession()`<span> vs </span>`getUser()`<span> 다.</span>

<table style="min-width: 75px;">
<colgroup><col style="min-width: 25px;"><col style="min-width: 25px;"><col style="min-width: 25px;"></colgroup><tbody><tr><th colspan="1" rowspan="1"><p></p></th><th colspan="1" rowspan="1"><p><code>getUser()</code></p></th><th colspan="1" rowspan="1"><p><code>getSession()</code></p></th></tr><tr><td colspan="1" rowspan="1"><p>동작</p></td><td colspan="1" rowspan="1"><p>Supabase 서버에 네트워크 요청</p></td><td colspan="1" rowspan="1"><p><code>localStorage</code>에서 즉시 읽음</p></td></tr><tr><td colspan="1" rowspan="1"><p>속도</p></td><td colspan="1" rowspan="1"><p>수십~수백 ms</p></td><td colspan="1" rowspan="1"><p>0ms (동기)</p></td></tr><tr><td colspan="1" rowspan="1"><p>용도</p></td><td colspan="1" rowspan="1"><p>서버 사이드 </p><ul class="tight" data-tight="true"><li><p>토큰 검증 필요</p></li></ul></td><td colspan="1" rowspan="1"><p>클라이언트 사이드</p><ul class="tight" data-tight="true"><li><p>이미 검증된 세션 </p></li></ul></td></tr></tbody>
</table>

<span>브라우저 환경에서는 </span>`Supabase SDK`<span>가 이미 로그인 시 세션을 </span>`localStorage`<span>에 저장해둔다. 클라이언트에서는 그걸 그냥 읽으면 된다. 굳이 서버에 물어볼 이유가 없다.</span>

### 결과 

<div color="yellow" data-type="callout" data-color="yellow" class="callout callout-yellow">
<p><strong>Before</strong></p><p>브라우저 → Vercel → (getUser) → Supabase → Vercel → 브라우저 (300~800ms)<br></p><p><strong>After</strong></p><p>브라우저 → Supabase 직접 (50~150ms)</p>
</div>

<span>상태 변경이 클릭과 비슷하게 반영되는 수준이 됐다.</span>

<div color="red" data-type="callout" data-color="red" class="callout callout-red">
<p><span>서버 액션은 서버에서만 가능한 작업(외부 API 키 사용, 파일 시스템 접근 등)에 써야 한다. </span>단순 DB 읽기/쓰기를 서버 액션으로 하는 건<span> Vercel 서버를 불필요한 중간 다리로 끼우는 것이다. Supabase RLS가 잘 설정돼 있다면 클라이언트에서 직접 호출하는게 더 빠르고 단순하다.</span></p>
</div>
