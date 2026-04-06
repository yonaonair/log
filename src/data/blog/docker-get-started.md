---
title: '[Docker] Get Started'
description: 'https://docs.docker.com/get-started/docker-overview/'
pubDatetime: 2026-03-25T07:15:00.000Z
modDatetime: 2026-04-06T08:55:20.395Z
slug: docker-get-started
featured: false
draft: false
tags:
  - docker
  - docs
series: container tech
---
<div url="https://docs.docker.com/get-started/docker-overview/" title="What is Docker?" description="Get an in-depth overview of the Docker platform including what it can be used for, the architecture it employs, and its underlying technology." image="https://docs.docker.com/images/thumbnail.webp" sitename="Docker Documentation" favicon="https://www.google.com/s2/favicons?domain=docs.docker.com&amp;sz=32" data-type="bookmark">
</div>

> Docker is a platform. It composes an environment of the application and makes the environment into a form of container. So when someone uses this container, others can use the application in the same way. i.e. they don't have to install the various dependencies or check the structure for every local or other environments even in distribution.

# Docker 

## Introduction

- an open platform for developing, shipping, and running applications 

- enable

  - separate applications from infrastructure → deliver software quickly 

  - manage the infrastructure in the same ways → manage the applications

  - reduce the delay between `writing code` and `running code in production` 

## Docker's container-based platform

- package and run an application in an isolated environment with security ⇒ i.e. `container` 

  - <mark>don't need to rely on what's installed on the host</mark>

- everyone works in the same way in the same shared container 

- tooling and platform to manage the lifecycle of the containers 

  1. develop 

  2. distribute and test in a container → the unit for distributing and testing 

  3. deploy into the production environment as a container or an orchestrated service ⇒ no matter what the production environment is (ex. `local data center`, `cloud provider`, `a hybrid of the two` )

## Object 

### 1. consistent delivery of the applications

- great for continuous integration and delivery (e.g. `CI/CD`) 

- ex 

  - developers find bugs → fix them in the development environment → redeploy to the test environment for testing and validation → fix to the customer in the production environment 

### 2. Responsive deployment and scaling 

- highly portable workloads 

- run on `a developer's local laptop`, `physical or virtual machines in a data center`, `cloud providers`, `a mixture of environments` 

- portable and lightweight 

  - manage workloads

  - scale up or tear down

  - easy to control as business needs dictate in near real time 

### 3. Running more workloads on the same hardware 

- lightweight & fast ⇒ viable & cost-effective alternative to hypervisor-based virtual machines 

- can use more of the server capacity 

- especially for high density environments & with fewer resources 

## Docker architecture

![Docker Architecture diagram](https://docs.docker.com/get-started/images/docker-architecture.webp)출처

1. a client-server architecture

   1. `The Docker client` talks to `the Docker daemon` 

      - `The Docker client` and `daemon` can run on the same system

      - `A Docker client` can be connected to a remote `Docker daemon` 

   2. `The Docker client` and `daemon` communicate using a `REST API` over `UNIX sockets` or a `network interface` 

   3. `Docker Compose` lets working with applications consisting of a set of `containers` . 
