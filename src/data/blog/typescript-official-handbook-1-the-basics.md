---
title: 'TypeScript official handbook: 1. The Basics '
description: '꼭꼭 씹어먹기 '
pubDatetime: 2026-04-21T02:31:33.093Z
modDatetime: 2026-04-21T04:48:03.925Z
slug: typescript-official-handbook-1-the-basics
featured: false
draft: true
tags: []
---
> Each and every value in JavaScript has a set of behaviors you can observe from running different operations. That sounds abstract, but as a quick example, consider some operations we might run on a variable named `message`.
>
> ```
> // Accessing the property 'toLowerCase'
> // on 'message' and then calling it
> message.toLowerCase();
> // Calling 'message'
> message();
> ```

# core concept: the relationship between values and behaviors

→ In JavaScript, every value has its own actions. You can see these actions when you use the data in different ways. For example let’s look at what we can do with a variable named `message`. 

```
// Accessing the property 'toLowerCase'
// on 'message' and then calling it
message.toLowerCase();
// Calling 'message'
message();
```

## 1. behaviors and operations 

- Behavior : what a value is naturally capable of doing
  - a string has the behavior of being transformed into lowercase. 
- Operation : the actual code you write to trigger tha behavior. 

<div color="gray" data-type="callout" data-color="gray" class="callout callout-gray">
<ul class="tight" data-tight="true"><li><p>Property Access : using <code>.toLowerCase</code> is an operation to access a specific capability of a string. </p></li><li><p>Calling : using <code>()</code> is an operation to execute a value as a function. </p></li></ul>
</div>
