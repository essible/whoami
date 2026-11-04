---
title: 'OverTheWire Natas, levels 0–8: web security basics'
description: 'The first nine levels of OverTheWire’s web security wargame: what each page exposed, how I got through, and how a real site should prevent it. No passwords.'
date: 2026-11-04
platform: 'OverTheWire'
tags: ['web', 'http', 'curl', 'access-control', 'path-traversal']
draft: false
---

Natas is OverTheWire's web security wargame. Each level is a web page behind a username and password, and the password for the next level is hidden somewhere in or behind the page. I solved levels 0 to 8, then paused at level 9; more on that at the end.

**Spoiler warning:** if you're playing Natas yourself, try each level before reading. There are no passwords here, as OverTheWire asks.

Every level has its own address and the same kind of login:

```text
URL:       http://natasN.natas.labs.overthewire.org
Username:  natasN
Password:  from the previous level (level 0's is natas0)
```

On the command line I used `curl`. Leaving the password out of `-u` makes curl ask for it, so it never lands in my shell history:

```bash
curl -u natas0 http://natas0.natas.labs.overthewire.org/
```

## Everything in the page source is public

**Level 0 → 1.** The password is in an HTML comment. Browsers don't display comments, but they're part of the page everyone downloads.

**Level 1 → 2.** The same idea, but the page blocks right-clicking. That only disables a menu: the source is still one shortcut (`Ctrl+U`) or one `curl` command away.

**In real applications:** anything sent to the browser is public, including comments, hidden fields and JavaScript. Secrets, internal notes and debug output must never reach the client.

## Files the page never links to

**Level 2 → 3.** The page shows an image, and the image's address points into a `/files/` folder. Opening that folder directly listed everything in it, including a file with the next password.

**Level 3 → 4.** This one was much harder for me than the first three. The page hints that search engines won't find the password, and `robots.txt`, the file that tells search engines what to skip, listed a folder called `/s3cr3t/`. The password was inside.

**In real applications:** directory listing should be turned off, and `robots.txt` is public: listing a secret path there is like putting up a sign pointing to it. Hidden is not the same as protected.

## Trusting what the browser sends

**Level 4 → 5.** The page only lets in visitors who arrive from the level 5 site. It checks the `Referer` header, which the browser sends and the visitor controls. So I sent it myself:

```bash
curl -v -u natas4 --referer "http://natas5.natas.labs.overthewire.org/" http://natas4.natas.labs.overthewire.org/
```

**Level 5 → 6.** The page says I'm not logged in, and it keeps that answer in a cookie: `loggedin=0`. I changed it to `1`. With curl, that's:

```bash
curl -u natas5 --cookie "loggedin=1" http://natas5.natas.labs.overthewire.org/
```

**In real applications:** headers and cookies are user input. Access decisions belong on the server, tied to a session the user can't edit. Getting this wrong is broken access control, the top risk on the OWASP Top 10.

## Files the server shouldn't hand out

**Level 6 → 7.** This page links to its own source code, which loads a secret from `includes/secret.inc`. Files ending in `.inc` aren't run as PHP, so when I opened that address, the server sent the file as plain text, with the secret phrase right there in the source. Entering the phrase in the form gave the password.

**Level 7 → 8.** The page picks its content from a `page` parameter in the address (`?page=home`). Nothing stops that parameter from pointing at any file on the server, so I pointed it at the file that the page's own hint mentions:

```text
http://natas7.natas.labs.overthewire.org/index.php?page=/etc/natas_webpass/natas8
```

**In real applications:** this is path traversal, or local file inclusion: user input deciding which file the server opens. The fix is an allowlist of pages, never a file path taken from the request. And source and configuration files shouldn't sit anywhere the web server can serve them.

## Encoding is not encryption

**Level 8 → 9.** The source code shows how the secret is stored: Base64-encoded, then reversed, then converted to hex. Every one of those steps can be undone, so I ran them backwards: hex to bytes, reverse, Base64-decode. In a shell, that's one line:

```bash
echo '<encoded secret from the page>' | xxd -r -p | rev | base64 -d
```

**In real applications:** encoding hides nothing from anyone who can read the code. A secret that has to be checked belongs on the server, compared against a hash, never shipped in a form that can be reversed.

## Where I stopped, and why

Level 9 takes what you type and puts it into a shell command on the server. That's command injection, and later levels move on to SQL injection. I didn't have the base knowledge for them yet; back then I didn't know SQL injection at all. So I paused Natas to learn these vulnerabilities properly. I'm now working through PortSwigger's Web Security Academy, starting with SQL injection, and I'll come back to level 9 ready for it.

## What Natas taught me

- Anything the browser receives is public: source code, comments, hidden fields.
- Hidden is not protected. Unlinked folders and `robots.txt` entries are one guess away.
- Headers and cookies are user input. Never trust them for access decisions.
- A file path taken from the request is a door to every file on the server.
- Encoding is not encryption.
