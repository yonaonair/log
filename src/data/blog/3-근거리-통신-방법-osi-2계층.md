---
title: 3. 근거리 통신 방법 (OSI 2계층)
description: >-
  내 컴퓨터로부터 멀리 떨어진 컴퓨터오아 데이터를 주고 받으려면 일단 내 컴퓨터가 연결된 네트워크에서 인터넷으로 나갈 수 있는 네트워크 장치와
  통신해야한다.
pubDatetime: 2026-04-22T01:45:35.894Z
modDatetime: 2026-04-27T08:03:27.844Z
slug: 3-근거리-통신-방법-osi-2계층
featured: false
draft: true
tags: []
---
# 데이터 링크 계층

- OSI 모델에서 2계층
- 같은 LAN에서 특정 컴퓨터를 찾아가서 통신 할 수 있게 해줌.
- 통신하는 네트워크 장치 사이의 데이터가 잘 전달 될 수 있도록

1. 데이터의 흐름을 관리하는 스위칭
2. 데이터의 오류를 점검하는 기능

역할을 수행

## 데이터의 흐름을 관리하는 스위칭

- 네트워크 장치는 포터에 랜선으로 컴퓨터를 연결했을 때 해당 컴퓨터의 고유한 주소를 저장 → 데이터를 전송할 컴퓨터가 연결된 포트 구분. 이런 기능을 스위칭이라고 함\
  → OSI 모델의 테이터 링크 계층에서는 `MAC (Media acess control)` 주소를 사용함.

## 오류 점검

- 네트워크 패킷 구조 중 푸터에는 오류를 점검하기 위해 헤더와 페이로드를 이용해 복잡한 수식으로 계산한 값을 넣음. 푸터에는 일반적으로 `CRC(cyclic redundancy check, 순환중복검사)`라는 방식으로 계산한 값을 추가.

## 

# MAC 주소

- 택배를 위해 주소를 사용하듯, 네트워크도 osi 2-4계층까지 각 계층에서 사용하는 대표 주소가 있음. 2계층에서는 `MAC주소`를 사용함.

- 같은 LAN에서 특정 네트워크 장치를 찾아가기 위해 특정 장치를 고유하게 식별할 수 있게 해줌. 인터넷으로 통신하는 모든 장치에는 랜카드가 연결되어 있고 이 랜카드에 MAC 주소가 할당되어 있음

- 12자리의 16진수 숫자로 구성.

  - 예: `00:1A:2B:3C:4D:5E` , `00-1A-2B-3C-4D-5E` 같은 형태

  - 16진수 한자리 = 2진수 4자리 \
    2진수 한자리 = 1bit \
    16진수 한자리 = 4bits \
    → MAC 주소 = 16진수 12개 = 48bits = 6bytes

    <div color="blue" data-type="callout" data-color="blue" class="callout callout-blue"><p>네트워크 인터페이스 카드 network interface card</p><ul class="tight" data-tight="true"><li><p>랜카드의 정식 명칭</p></li><li><p>과거에는 인터넷 사용자가 많지 않아 컴퓨터로 인터넷에 접속하려면 네트워크 인터페이스 카드를 추가해야 했음</p></li><li><p>요즘은 메인보드에 랜카드 기능이 대부분 기본으로 설치되어 있어서 별도 장착 없이 바로 인터넷 연결이 가능함</p></li></ul></div>

## Ethernet 프로토콜 `총 14 bytes`

- `MAC주소`를 이용해서 특정 장치에 데이터를 보내려면 주소를 작성할 양식이 필요. 

- "OSI 2계층"에서 사용하는 `MAC 주소`를 작성하는 대표적인 양식은 'Ethernet 프로토콜'

<img src="https://blog.kakaocdn.net/dna/SOuwr/btsB8VBGF2X/AAAAAAAAAAAAAAAAAAAAADFl1AoN2m1f5NdWG6X-eCWX7blrkL6GWbGfAp2ls8SN/img.png?credential=yqXZFxpELC7KVnFOS48ylbz2pIh7yKj8&expires=1777561199&allow_ip=&allow_referer=&signature=lJqH8IXaNPZ8Ikfu7cQ0RSfzBEU%3D" style="display:block;margin:0 auto">

- `Ethernet Type` 부터 `Destination Address` 까지만 'Ethernet 프로토콜'
- 그 앞은 `프리엠블`, 뒷부분은 페이로드에 담긴 `Data`. 

### \
(영역 외) 프리엠블 preamble 

- 'Ethernet 프로토콜'이 시작되는 지점을 알려주는 기능
  - 전송의 동기화 및 시작을 알리기 위해 프레임(데이터 운반체) 단위별로 각 프레임의 맨 앞에 붙이는 영역 
- 총 `8bytes`, `1010 1010`이 일곱번 반복하면서 (`7bytes`) 전기 신호를 보내는 쪽의 속도와 받는 쪽의 속도 동기화 → 마지막 `1byte`로 `1010 1011`을 전송 → 그 다음부터 `Ethernet 프로토콜`의 시작을 알림. 
  - `SFD` , start of frame delimiter 
    - 시작을 알려주는 마지막 `1byte` 

### (1) MAC 주소 `6 bytes`

### (2) 출발지 MAC 주소 `6 bytes` 

### (3) 상위 프로토콜의 유형 `2 bytes` 
