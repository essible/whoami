---
title: 'Example writeup'
description: 'One sentence on what this writeup covers.'
date: 2026-11-04
platform: 'PortSwigger Web Security Academy'
difficulty: 'Apprentice'
tags: ['sql-injection']
draft: true
---

Delete this paragraph. Save the writeup as `src/content/writeups/your-lab-name/index.md`: the folder
name becomes the address, and screenshots go in the same folder. Set `draft: false` to publish.
A draft is hidden on the site but visible on GitHub, because the repository is public.
The steps and the screenshot privacy checklist are in `docs/publishing.md`.

## Summary

What the lab asked for, in one or two sentences.

## The vulnerability

How this class of bug works and why it ends up in real applications.

## Exploitation

The steps you took, with the requests and payloads that mattered.

```http
GET /filter?category=Gifts'+OR+1=1-- HTTP/2
Host: <lab-id>.web-security-academy.net
```

To show a screenshot from this folder, with an optional caption in italics on the next line:

```md
![Burp Repeater: the request with the payload, and every product in the response](./burp-repeater.png)
*The payload in Burp Repeater.*
```

## Fix

How the code should change to prevent it.

## Takeaways

What you learned and what you'd try first next time.
