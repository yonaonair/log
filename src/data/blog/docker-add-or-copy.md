---
title: '[Docker] `ADD` or `COPY`'
description: 'https://killercoda.com/docker/scenario/add-or-copy'
pubDatetime: 2026-04-10T02:33:57.759Z
modDatetime: 2026-04-10T04:58:20.156Z
slug: docker-add-or-copy
featured: false
draft: false
tags: []
---
<div url="https://killercoda.com/docker/scenario/add-or-copy" title="ADD or COPY | Docker | Killercoda" description="ADD or COPY" image="https://storage.googleapis.com/killercoda-assets-europe1/meta/docker/metav1.png" sitename="killercoda.com" favicon="https://www.google.com/s2/favicons?domain=killercoda.com&amp;sz=32" data-type="bookmark">
</div>

```
You can use ADD and COPY to perform the same action: copy a file. However, it is recomended to use only COPY for that. Modify existed /root/Dockerfile :

copy file copy_file.txt with keyword COPY
copy file add_file.txt with keywork ADD
build image app-image , confirm that files were copied to the container


Add next line to the /root/Dockerfile :
COPY copy_file.txt /app
Add next line to the /root/Dockerfile :
ADD add_file.txt /app

Build image:
docker build -t app-image .

Confirm that files are copied:
docker run --rm app-image ls /app 
```

`COPY`와 `ADD` 명령어는 리눅스 터미널이 아니라 Docker 이미지를 만들기 위한 설정 파일인 `Dockerfile` 내부에서 사용해야한다. 

`Dockerfile`에 지침`instruction`을 적고 저장하면 `docker build` 명령어가 이 파일을 읽고 순차적으로 실행하여 이미지를 생성한다. 

# 1. `Dockerfile` 수정

`/root/Dockerfile`을 열어 제시하는 내용을 기입한다. 터미널 내부의 편집기 `vi` 등을 사용하거나 `echo` 명령어를 사용한다. 

```
echo "COPY copy_file.txt /app" >> /root/Dockerfile 
echo "ADD add_file.txt /app" >> /root/Dockerfile 
```

# 2. 빌드 

```
docker build -t app-image .
```

현재 디렉토리의 `Dockerfile`을 기반으로 `app-image` 생성

# 3. 확인

```
docker run --rm app-image ls /app 
```

임시 컨테이너 실행 =&gt; /app 디렉토리 목록 출력 
