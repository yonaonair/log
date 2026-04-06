---
title: Linux Fundamentals (1)
description: ''
pubDatetime: 2026-03-26T06:17:00.000Z
modDatetime: 2026-04-06T08:56:42.329Z
slug: linux-fundamentals-1
featured: false
draft: false
tags:
  - lunux
  - docs
series: linux
---

<div url="https://killercoda.com/pawelpiwosz/course/linuxFundamentals" title="Pawel Piwosz | Killercoda" description="DevOps Institute Ambassador. CD.Foundation Ambassador. AWS Community Builder. 
Engineer, leader, mentor, speaker.

My focus is on CALMS.  I am building better understanding of DevOps as driver for the organization. I led the DevOps Academy at EPAM Systems Poland, where we were shaping new engineers to be professionals. Currently I am Cloud Solution Architect at Tameshi.

I am devoted to Serverless and CI/CD." image="https://storage.googleapis.com/killercoda-assets-europe1/meta/generated/pawelpiwosz.png?v=1775433600" sitename="killercoda.com" favicon="https://www.google.com/s2/favicons?domain=killercoda.com&amp;sz=32" data-type="bookmark">
</div>

# 1. Syntax

Linux command is composed of the `command` and the `argument` 

```bash
ls -l
```

`-` : `one letter argument` `ex. l`

`--` : `more than one letter argument `⇒ commonly in English words 

- each columns has different meanings 

  1. permissions 

  2. number of hard links 

  3. owner

  4. group

  5. file size in the bytes 

  6. date and time of `last modification` of the object

  7. file name 

- every arguments can be multiplied 

- In Linux filesystem, `the root` is the first point we can access. This root directory is represented by `/` symbol. On the top level of the filestytem is always `/` directory. 

- absolute path / relative path 

- `root` user is the most powerful entity in the whole Linux system 

  - The home directory of the `root` user is `/root` 

  - Other user's home directories are under `/home` 

- there's a variable for the home path 

  - `cd $HOME` / `cd` / `cd ~`

- `~` = home directory 

- `*` wild card ⇒ any string

  - ex. `ls my*file` 

- `?` any single character 

```
root@ubuntu:~$ touch try1 try2 try01
root@ubuntu:~$ ls try*
try01  try1  try2
root@ubuntu:~$ ls try?
try1  try2
```

- `l (pipe)` combine the commands 

  - `command1 | command2` 

  - `command1 | command2 | command3` 

  - ⇒ The output of `command1` is taken over as input to `command2` 

- `>` redirects all output from the left side of the sign, to the file on the right side of the sign 

  - `ls -al > directorylist.txt`

  - `notice` 

    - if file doesn't exist, create it

    - add content from redirected output

    - if file exists and it is not empty, clear the file and write the redirected output in empty file

- `>>` add the output of the command on the end of existing content (only if there is any content in the fill) 

2\. times in Linux 

## `atime` : the last time when file was accessed 

`mtime` : last modification time 

`ctime` : last metadata modification time 

 `ex. permissions change, location of the file, etc`

# 3. basic commands 

## `ls` : show lists

- `ls -1` shows lists in one line

- `ls -a` for hidden files

- `ls -l` detailed list 

- `ls -F` with `/` in the name of files 

- `ls -la` for various informations about the lists 

  - permissions, ownership, size, modification date

- `ls -lh` shows lists in order to the size 

- `ls -d * /` show only the folders

## `clear` : clear all window

- the same by running `/bin/echo -e "\x1b\x5b\x48\x1b\x5b\x32\x4a\c"`

## `man` : show a document for the command 

## `mkdir` : create directories 

- `mkdir testdir{1..10}` make directories from 1 to 10 

- `mkdir -p parentdir/childdir{01..100}` create parent directory  

## `cd` : short for `Change Directory` 

## `pwd` : show current work directory 

## `rmdir` : remove the directory 

- `rmdir testdir{1..10}` remove the directories from 1st to 19th 

- <mark>can remove parent directory only when it is empty</mark>

- works for files 

- `-r` go recursively through directories and treat everything as file 

- `-f` force / do not ask ⇒ risky command 

## `touch ` : create empty file 

- or use `vim` 

## `grep` : search for given pattern in the output 

⇒ ex. `grep case .bashrc` : search for pattern `case` in a file `.bashrc` 

## `wc` : a utility for counting words, newlines, bytes. 

- `wc -l .bashrc `count how many lines are in `.bashrc` file 

## `sort` sort the output in alphabetical order

- `uniq` always works beest with `sort` ⇒ `sort` is first 

- ⇒ ex. `cat numbers.txt | sort | uniq | wc -l`

## `man` document 
