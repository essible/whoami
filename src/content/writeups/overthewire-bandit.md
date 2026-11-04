---
title: 'How I solved OverTheWire Bandit (levels 0–33)'
description: 'All 34 levels of the Bandit wargame, grouped by technique: the commands I used, why they work, and the alternatives I tried. No passwords.'
date: 2026-11-04
platform: 'OverTheWire'
tags: ['linux', 'bash', 'ssh', 'networking', 'git']
draft: false
---

Bandit is OverTheWire's Linux wargame. Each level is an account on a remote server, and the password for the next account is hidden somewhere the current one can reach. I solved all 34 levels, from 0 to 33. Below are my solutions, grouped by technique rather than by level, with the commands I used, why they work, and the alternatives I tried.

**Spoiler warning:** if you're playing Bandit yourself, try each level before reading. There are no passwords or keys here, as OverTheWire asks. Where a command needs the current level's password, it reads it from `/etc/bandit_pass/`, where each level can read its own password and nothing else. That's also the safer habit: a password typed into a command ends up in your shell history.

**Highlights**

- [A one-liner that scans a thousand ports and tests every open one over TLS in parallel](#talking-to-network-services)
- [Unpacking a file wrapped in eight layers of compression](#encodings-and-compression)
- [Escaping a pager into a shell, and running commands as other users through setuid and cron](#getting-out-of-restricted-shells)
- [Recovering deleted secrets from git history, branches and tags](#git-secrets-in-the-history)

## Getting in

Every level starts with an SSH login. Only the username changes:

```bash
ssh bandit0@bandit.labs.overthewire.org -p 2220
```

- `bandit0` is the user for level 0
- `-p 2220` is the port; Bandit doesn't use the default SSH port, 22

My first note was a rule for myself: "I don't have to know everything from the manual right now." I looked up exactly what each level needed in `man`, used it, and moved on. That's how the commands below piled up.

## Files with awkward names

**Level 0 → 1.** The password is in a file called `readme` in the home folder: `cat readme`.

**Level 1 → 2.** The file is called `-`. To most commands, `-` means "read from standard input", so `cat -` just waits for you to type. A path, or a redirect, gets around that:

```bash
cat ./-
cat < -
```

**Level 2 → 3.** The name has spaces and starts with dashes. Quotes keep it as one argument, and `--` tells `cat` that everything after it is a file name, not an option:

```bash
cat -- "file name with spaces"
cat ./"file name with spaces"
```

**Level 3 → 4.** The file is hidden: its name starts with a dot, so plain `ls` skips it. `ls -la` lists everything, with permissions, owners and sizes.

## Finding the right file

**Level 4 → 5.** Ten files, and only one is human-readable. `file` reads what a file contains, whatever its name says:

```bash
file ./*
```

`ASCII text` is readable; `data` means binary. The same check works through `find`, which runs `file` on everything it finds:

```bash
find . -maxdepth 1 -type f -exec file {} \;
```

`{}` is replaced by each file `find` finds, and `\;` marks the end of the command.

**Level 5 → 6.** The file is somewhere in a tree of folders, and the level describes it: 1033 bytes, not executable. `find` searches for exactly that:

```bash
find . -type f -size 1033c ! -executable
```

- `-type f`: files only, no folders
- `-size 1033c`: exactly 1033 bytes (`c` means bytes)
- `! -executable`: not executable (`!` means "not")

**Level 6 → 7.** This time the file could be anywhere on the server. It's owned by user `bandit7` and group `bandit6`, and it's 33 bytes:

```bash
find / -user bandit7 -group bandit6 -size 33c 2>/dev/null
```

Searching from `/` produces hundreds of "Permission denied" errors. `2>/dev/null` sends error output (stream 2) nowhere, so only real results are left. I used this pattern more than anything else in the game.

## Filtering text

**Level 7 → 8.** The password sits next to the word "millionth" in a large file:

```bash
grep -F "millionth" data.txt
```

`-F` searches for the exact text instead of treating it as a pattern. My first version piped `cat` into `grep`, but `grep` can read the file itself.

**Level 8 → 9.** The password is the only line that appears exactly once. `uniq` only notices duplicates that are next to each other, so the file has to be sorted first:

```bash
sort data.txt | uniq -c | grep " 1 " | awk '{print $2}'
```

`uniq -c` counts each line, `grep " 1 "` keeps the lines counted once, and `awk` prints the line itself. `sort data.txt | uniq -u` does the same in one step.

**Level 9 → 10.** The file is mostly binary, with a few readable strings that start with several `=` signs. `strings` pulls out the readable parts:

```bash
strings data.txt | grep "==="
```

**Level 17 → 18.** Two files, `passwords.old` and `passwords.new`, differ by one line. `diff` finds it, and `tail` and `awk` cut it down to the new password:

```bash
diff passwords.old passwords.new | tail -1 | awk '{print $2}'
```

## Encodings and compression

**Level 10 → 11.** Base64 turns binary data into letters, digits, `+`, `/` and `=` padding. It's an encoding, not encryption, so anyone can reverse it:

```bash
base64 -d data.txt
```

**Level 11 → 12.** Every letter is shifted 13 places (ROT13). `tr` maps one set of characters onto another, so it undoes the shift:

```bash
tr 'A-Za-z' 'N-ZA-Mn-za-m' < data.txt
```

**Level 12 → 13.** The longest level. `data.txt` is a hex dump of a file that was compressed over and over with different tools. The home folder isn't writable, so I worked in a temporary folder:

```bash
cd "$(mktemp -d)"
cp ~/data.txt .
xxd -r data.txt > pass       # turn the hex dump back into binary
file pass                    # gzip compressed data
mv pass pass.gz
gzip -d pass.gz
file pass                    # bzip2 compressed data
mv pass pass.bz2
bzip2 -d pass.bz2
```

From there it's a loop: `file` says what it is, I give it the matching extension, and decompress or unpack it. It took eight layers (gzip, bzip2, gzip, tar, tar, bzip2, tar, gzip) before `file` finally said `ASCII text`.

The tools differ in one way worth knowing: `gzip` and `bzip2` compress a single file, while `tar` bundles many files into one. They're often combined, as in `.tar.gz` (`tar -xzf`) and `.tar.bz2` (`tar -xjf`).

## Talking to network services

**Level 13 → 14.** Instead of a password, this level gives you a private SSH key, `sshkey.private`, that logs you in as `bandit14`. Reading the next password directly fails, because each password file is readable only by its own user:

```text
bandit13@bandit:/etc/bandit_pass$ cat bandit14
cat: bandit14: Permission denied
```

The server no longer allows logging in from one level to another through `localhost`, so I copied the key to my own machine. SSH refuses to use a key that other users can read, so the permissions come first:

```bash
chmod 600 bandit14_key
ssh -i bandit14_key bandit14@bandit.labs.overthewire.org -p 2220
cat /etc/bandit_pass/bandit14
```

**Level 14 → 15.** A service on port 30000 returns the next password if you send it the current one. `nc` (netcat) opens a plain TCP connection:

```bash
cat /etc/bandit_pass/bandit14 | nc localhost 30000
```

**Level 15 → 16.** The same idea, but port 30001 expects TLS, so `nc` gets nothing back. `openssl s_client` handles the encryption:

```bash
cat /etc/bandit_pass/bandit15 | openssl s_client -connect localhost:30001 -quiet
```

**Level 16 → 17.** Somewhere between ports 31000 and 32000 is the one service that returns the next credentials. The others don't speak TLS, or only echo back what you send. I scanned the range with `nmap`, then sent the password to every open port at once:

```bash
nmap localhost -p 31000-32000 \
  | awk '/^[0-9]+\/tcp.*open/ {print $1}' | cut -d/ -f1 \
  | xargs -P 10 -I {} sh -c 'cat /etc/bandit_pass/bandit16 | timeout 5 openssl s_client -connect localhost:{} -ign_eof 2>/dev/null' \
  | awk '/BEGIN RSA PRIVATE KEY/, /END RSA PRIVATE KEY/'
```

- `awk` and `cut` turn the nmap output into a list of port numbers
- `xargs -P 10` runs up to ten connections in parallel, and `{}` becomes each port
- `timeout 5` stops connections that hang
- the last `awk` keeps only the lines between the key's BEGIN and END markers

The answer wasn't a password but an SSH private key for `bandit17`. I also wrote a second version with `socat` in place of `openssl`: `socat - OPENSSL-CONNECT:localhost:{},verify=0`.

**Level 20 → 21.** Here the roles flip. A setuid program, `suconnect`, connects to a port you choose and, if it receives the current password, sends back the next one. So I started a listener in the background that serves the password, then pointed `suconnect` at it:

```bash
cat /etc/bandit_pass/bandit20 | nc -l -p 12345 &
./suconnect 12345
```

**Level 24 → 25.** A service on port 30002 wants the current password plus a secret 4-digit PIN, and the only way to find the PIN is to try all 10,000. I generated every combination into a file and sent them all in one connection:

```bash
cd "$(mktemp -d)"
pass=$(cat /etc/bandit_pass/bandit24)
for pin in $(seq -w 0 9999); do echo "$pass $pin"; done > combinations.txt
nc localhost 30002 < combinations.txt | grep -v Wrong
```

`seq -w` pads the numbers to the same width, so 7 becomes 0007, and `grep -v Wrong` hides the failed attempts.

## Getting out of restricted shells

**Level 18 → 19.** `.bashrc` was edited to log you out as soon as you connect. When you give SSH a command, it runs that command without starting an interactive session, so the logout never happens:

```bash
ssh bandit18@bandit.labs.overthewire.org -p 2220 "cat ~/readme"
```

Asking for a different shell works too: `ssh -t bandit18@bandit.labs.overthewire.org -p 2220 /bin/sh`.

**Level 25 → 26.** Logging in is easy: the private key for `bandit26` is in `bandit25`'s home folder, so I used it with `ssh -i`. Getting a shell is the hard part, because `bandit26` doesn't use bash. Its login shell shows a text file with `more` and exits. But `more` only waits for a key press when the text doesn't fit on screen, so I shrank my terminal (`resize -s 2 1`) before connecting. With `more` paused, `v` opens the file in `vi`, and `vi` can run commands:

```text
v                                          (in more: open vi)
:terminal cat /etc/bandit_pass/bandit26
```

**Level 32 → 33.** The "uppercase shell" turns everything you type into capitals, so `ls` becomes `LS`, which doesn't exist. Variables survive, though: `$0` holds the name of the running shell, so typing it starts a normal one:

```text
>> $0
$ cat /etc/bandit_pass/bandit33
```

## Borrowing privileges: setuid and cron

**Level 19 → 20.** `bandit20-do` is a setuid program: it runs as its owner, `bandit20`, no matter who starts it. So anything it runs can read `bandit20`'s files:

```bash
./bandit20-do cat /etc/bandit_pass/bandit20
```

**Level 26 → 27.** The same technique, still inside `vi` from the previous level: `:terminal ./bandit27-do cat /etc/bandit_pass/bandit27`.

**Level 21 → 22.** A cron job, a command the system runs on a schedule, runs as `bandit22`. Its configuration and its script are readable:

```bash
cat /etc/cron.d/cronjob_bandit22
cat /usr/bin/cronjob_bandit22.sh
```

The script copies the password into a file in `/tmp` and makes it readable for everyone, so reading that file is enough.

**Level 22 → 23.** This script builds its file name from the user name: an MD5 hash of the text "I am user bandit23". Running the same line myself gives the file name:

```bash
echo I am user bandit23 | md5sum | cut -d ' ' -f 1
```

**Level 23 → 24.** This cron job runs every script in `/var/spool/bandit24/foo` as `bandit24`, then deletes it. So I wrote one, with a debug line that records when it ran:

```bash
#!/bin/bash
cat /etc/bandit_pass/bandit24 > /tmp/bandit24_pass_$(whoami)
echo "Script executed at $(date)" > /tmp/cron_debug
```

After `chmod +x` and a minute's wait, cron had run the script and deleted it, and the password was in `/tmp/bandit24_pass_bandit24`.

## Git: secrets in the history

All five git levels start the same way: clone the repository over SSH on port 2220, with the current level's password.

```bash
git clone ssh://bandit27-git@bandit.labs.overthewire.org:2220/home/bandit27-git/repo
```

- **Level 27 → 28.** The password is in the README.
- **Level 28 → 29.** The password was removed from the README, but git keeps every version. `git log --oneline` lists the commits, and `git show <commit>:README.md` prints the file as it was in an older one.
- **Level 29 → 30.** The main branch has no password. `git branch -a` lists every branch, including remote ones, and `git checkout dev` switches to the one that has it.
- **Level 30 → 31.** One commit and no other branches, but there's a tag. `git tag` lists one called `secret`, and `git show secret` prints it.
- **Level 31 → 32.** This time you push. The README asks for a file `key.txt` containing "May I come in?", but `.gitignore` excludes `.txt` files, so `git add -f` forces it in:

```bash
echo 'May I come in?' > key.txt
git add -f key.txt
git commit -m 'May I come in?'
git push
```

## What I'd tell myself at level 0

- Read only the part of the manual you need right now.
- Run `file` before assuming what something is.
- Add `2>/dev/null` to every search from `/`.
- Small commands joined with pipes beat one big command.
- Look at what the system runs for you: setuid programs and cron jobs are where privileges leak.
- Git never forgets. A deleted secret is still in the history, branches and tags.
