---
title: 'Example writeup'
description: 'One sentence on what this writeup covers.'
date: 2026-11-04
platform: 'PortSwigger Web Security Academy'
difficulty: 'Apprentice'
tags: ['sql-injection']
draft: true
---

This file is a template. Drafts only show up in `npm run dev`, never on the live site. Copy this file, give it a new name (the file name becomes the URL), fill it in, and set `draft: false` to publish.

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

## Fix

How the code should change to prevent it.

## Takeaways

What you learned and what you'd try first next time.
