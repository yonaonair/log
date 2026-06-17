---
title: '`ls -l` 출력 결과 해석'
description: '리눅스 기초 명령어 '
pubDatetime: 2026-06-17T05:28:33.063Z
modDatetime: 2026-06-17T05:49:36.688Z
slug: ls-l-출력-결과-해석
featured: false
draft: false
tags: []
series: linux
category: Tech
---
```
d  rwxr-xr-x.  2 root root  6  3월 22 21:48 공개
└┬┘└──┬─────┘      └─┬─┘
 │    │            소유자/그룹
 │    └─ 권한 (현재사용자 / 그룹사용자 / 기타사용자)
 └─ d: 디렉토리 / -: 파일
```

**시작 알파벳** 

`d`: 디렉토리 

`-`: 파일 

**rwx                               r-x                                        r-x** 

`read` : 읽기                  root 그룹: 읽기/실행             root 그룹: 읽기/실행

`write` : 쓰기 

`execute` : 실행 

- `.` 으로 시작하는 이름은 숨김파일 

```
ubuntu@ubuntuserver:~$ ls -l /var
total 44
drwxr-xr-x  2 root root   4096 Apr 22  2024 backups
drwxr-xr-x 16 root root   4096 Jun 17 03:11 cache
drwxrwsrwt  2 root root   4096 Feb 10 00:26 crash
drwxr-xr-x 44 root root   4096 Jun 17 03:11 lib
drwxrwsr-x  2 root staff  4096 Apr 22  2024 local
lrwxrwxrwx  1 root root      9 Feb 10 00:16 lock -> /run/lock
drwxrwxr-x 10 root syslog 4096 Jun 17 04:52 log
drwxrwsr-x  2 root mail   4096 Feb 10 00:16 mail
drwxr-xr-x  2 root root   4096 Feb 10 00:16 opt
lrwxrwxrwx  1 root root      4 Feb 10 00:16 run -> /run
drwxr-xr-x  2 root root   4096 Nov 21  2025 snap
drwxr-xr-x  4 root root   4096 Feb 10 00:34 spool
drwxrwxrwt  8 root root   4096 Jun 17 05:07 tmp

ubuntu@ubuntuserver:~$ ls -la
total 44
drwxr-x--- 4 ubuntu ubuntu 4096 Jun 17 05:07 .
drwxr-xr-x 3 root   root   4096 Jun 17 01:41 ..
-rw------- 1 ubuntu ubuntu  637 Jun 17 04:55 .bash_history
-rw-r--r-- 1 ubuntu ubuntu  220 Mar 31  2024 .bash_logout
-rw-r--r-- 1 ubuntu ubuntu 3771 Mar 31  2024 .bashrc
drwx------ 2 ubuntu ubuntu 4096 Jun 17 02:03 .cache
-rw------- 1 ubuntu ubuntu   20 Jun 17 05:07 .lesshst
-rw-r--r-- 1 ubuntu ubuntu  807 Mar 31  2024 .profile
drwx------ 2 ubuntu ubuntu 4096 Jun 17 01:45 .ssh
-rw-r--r-- 1 ubuntu ubuntu    0 Jun 17 02:03 .sudo_as_admin_successful
-rw------- 1 ubuntu ubuntu  816 Jun 17 02:48 .viminfo
-rw------- 1 ubuntu ubuntu   58 Jun 17 05:06 .Xauthority
```
