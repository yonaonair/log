---
title: '[UIUX] Corner Radius와 Squircle'
description: 동글동글 사각형 만들기
pubDatetime: 2026-03-05T08:27:00.000Z
modDatetime: 2026-04-06T08:28:46.613Z
slug: uiux-corner-radius와-squircle
featured: false
draft: false
tags:
  - uiux
series: web
---
모바일 UIUX 디자인을 기획하다 아무래도 요즘 모바일 환경에서 대다수가 사용하는 squircle에 대해 알아보게 됐다. 단순히 Corner Radius 값을 준다고 생각했는데 그게 아니었다. squircle이라는 명칭도 그때 알았다.

참고링크 : 이 분의 티스토리 글이 많이 도움됐다.\
[\[UI & UX\] Corner Radius에 대해서..](https://swiftkit.tistory.com/entry/UI-UX-Corner-Radius%EC%97%90-%EB%8C%80%ED%95%B4%EC%84%9C)

> Corner Radius에 대한 개인적인 생각 이번 WWDC를 준비하면서 UI에 대한 많은 고민들을 해봤던 것 같다. 그중에서도 Corner Radius에 대한 궁금점이 많았다. 요즘 거의 모든 곳에 Corner radius가 적용되어 있다. 완벽한 사각형은 드물다. 날카로운 모서리보다 둥근 모서리가 심리적으로 안정적이라는 이야기가 있다. 내 생각에는 지금 거의 모든 책상, 쓰레기통, 상자 등등 많은 것들이 네모로 되어있는데 날카로운 모서리는 아프다. 하지만 둥근 모서리는 덜 위험해 보이는데 이것과 연관이 있지 않을까 싶다. 어쨌든 인터넷 창이든 앱 아이콘이든 우리가 손으로 터치를 하는 공간이니 아무리 화면 안에 있어서 우리에게 상처를 주진 않겠지만, 둥근 모서리가 더 터치하기 편안하지 않을까? Roun..SwiftKit

[\[UX & UI\] 애플의 Corner Radius](https://swiftkit.tistory.com/entry/UX-UI-%EC%95%A0%ED%94%8C%EC%9D%98-Corner-Radius)\
[Daniel Shim (@sdreamerh) on Threads](https://www.threads.net/@sdreamerh/post/Cw7h6-7S0-m)

### 1. Round vs squircle

- **일반적인 Corner Radius :** 직선에서 원호로 꺾이는 지점이 생긴다.

- **Squircle (Corner Smoothing) :** 직선에서 곡선으로 넘어가는 구간의 곡률을 서서히 변화시킨다. 훨씬 매끄럽고 자연스러운 느낌. 애플 사가 디자인 전반에 사용한다.

아래는 두가지 모두를 피그마에서 구현한 모습이다. 좌측 단순히 모서리 반경 값만 적용한 모습으로 각각 30/70/120, 우측은 Corner Smoothing 60을 적용해 같은 수치를 입힌 Squircle. 미세한 차이지만 우측의 곡선이 더 자연스럽게 적용되었고, 이 효과는 모서리 반경의 둥글기 수치가 커질 수록 눈에 띤다.

![](https://velog.velcdn.com/images/pbdorbit/post/2eb081c3-36e3-472f-b039-218e7686e2de/image.png)### 2. Squircle 사용 이유

단순히 예뻐서라기에는 애플 같은 기업들이 집착이 대단하다. 일단 조사한 내용으로는

- **시각적 불연속성 (Visual Discountinuity) 제거** 일반적인 라운드 사각형은 직선이 끝나는 지점에서 원호가 갑자기 시작되기 때문에, 우리 뇌는 이 미세한 변화점을 포착하면 미묘한 이질감과 어색함을 느낀다. 반면에 스쿼클은 곡률이 0에서부터 서서히 변화하기 때문에 눈이 훨씬 편안하다.

- **물리적 실체감** 자연계에는 완벽한 직선 - 완벽한 원이 접점하는 형태가 드물다. 마모된 조약돌이나 비누 같은 형태를 떠올리면 스쿼클에 훨씬 가깝다. 때문에 사용자가 스쿼클 디자인을 보는 경우가 훨씬 더 실제 물건 같고 부드럽다는 인상을 받기 쉽다.

- **모서리 강조 완화** 일반적인 라운드는 모서리 부분이 툭 튀어나와 보이곤 한다. 스쿼클은 전체적인 형태가 하나로 통합되어 보여 콘텐츠 자체데 더 집중하게 만들어준다.

개인적으로는 작업할 때 내용물이 좀 더 부드럽고, 영하고, 트렌디하거나 가벼운 느낌을 줄 때 자주 사용하게 된다.

### 3. 플랫폼 별 구현방법

요즘에는 거의 모든 환경에서 해당 효과가 적용되는 만큼 대다수의 플랫폼이 Squircle을 지원하고 있다.

- **iOS/SwiftUI** `.continuous` 코너 스타일 사용 =&gt; `RoundedRectangle(cornerRadius: 20, style: .continuous)`

- **FIgma** 모서리 반경 설정 후 `Corner Smoothing` 슬라이더 조절 =&gt; 보통 iOS 스타일은 60% 이상이라고 보는 듯 하다

- **Android** `ShapeAppearanceModel` 또는 라이브러리 =&gt; 제트팩 컴포즈에서 커스텀 Shape 구현 필요

- **Web(CSS) :** `border-radius` 만으로는 불가\
  =&gt; clip-path나 SVG mask를 활용한 트릭 필요. 완벽한 스쿼클은 아니지만 훨씬 부드러운 느낌

```css
.squircle-like {
  width: 200px;
  height: 200px;
  background: #3498db;
  /* 가로 곡률 / 세로 곡률을 다르게 설정하여 부드럽게 유도 */
  border-radius: 60px / 60px; 
}
```
