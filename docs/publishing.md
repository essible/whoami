# Publishing a writeup from the browser

No local setup is needed. GitHub works as the admin panel: it handles the login, keeps every
version of every file, and Cloudflare publishes each change within a couple of minutes.

Before the first time: turn on two-factor authentication or a passkey for both the GitHub and the
Cloudflare account. Whoever controls those accounts controls the site.

## 1. Write it

1. Open [`src/content/writeups`](https://github.com/essible/whoami/tree/main/src/content/writeups)
   and choose **Add file → Create new file**.
2. Name the file `your-lab-name/index.md`. Typing the `/` creates a folder, which will hold the
   writeup and its screenshots. Use lowercase words and dashes: the folder name becomes the
   address, `/writeups/your-lab-name/`.
3. Copy [the template](../templates/writeup.md) into the editor and fill it in. The block between
   the two `---` lines holds the details: `date` is written `2026-11-04`, and `difficulty` can be
   removed if the platform has none. Set `draft: false` to publish.
4. Check the **Preview** tab, then choose **Commit changes**, keep **Commit directly to the
   `main` branch**, and confirm.

The repository is public. A file is public on GitHub from the moment it's committed, even with
`draft: true`, which only hides it from the site. Write drafts somewhere private, such as your
notes app, and commit a writeup when it's ready.

## 2. Add screenshots

1. Go through the [privacy checklist](#screenshot-privacy-checklist) for every image.
2. Open the writeup's folder and choose **Add file → Upload files**. Drag the images in and
   commit.
3. In `index.md`, put each image where it belongs. The text in square brackets describes the image
   for people who can't see it. A caption is optional: write it in italics on the very next line.

   ```md
   ![Burp Repeater: the request with the payload, and every product in the response](./burp-repeater.png)
   *The payload in Burp Repeater.*
   ```

PNG, JPG and WebP all work. The build turns each image into small WebP files in several sizes, so
nobody downloads more than their screen needs.

On a laptop there's a faster way: press `.` on the repository page to open a full editor in the
browser (github.dev). You can create the folder, drag in the images and write the text, then
commit everything at once from the **Source Control** panel on the left.

## 3. Check that it's live

- Every commit starts a build on Cloudflare. GitHub shows the result next to the commit: a yellow
  dot while it builds, a green check when it's live, a red cross if it failed.
- If a build fails, for example because of a typo in the details block or a missing image, the
  site keeps showing the previous version. Open the failed deployment in Cloudflare to read the
  error, fix the file, and commit again.
- To correct a published writeup, open the file, click the pencil icon, edit and commit.
- To undo a change on the live site right away, open the project's **Deployments** list in
  Cloudflare and choose **Rollback** on an earlier deployment. The file's **History** on GitHub
  shows every earlier version if you want to restore one.

## Screenshot privacy checklist

The original files you upload are public, and they stay in the repository's history even if you
delete them later. The site only serves copies made by the build, which drops metadata, but the
originals are still downloadable from GitHub. Check every image before uploading it.

**On the screen**

- [ ] Terminal prompt: it shows your username and computer name (`user@host`). Crop it, or switch
      to a plain prompt before taking screenshots: `PS1='$ '` in bash, `PROMPT='$ '` in zsh.
- [ ] Passwords, flags, session cookies, API keys and tokens, including in Burp's request and
      response panes. Cover them with a solid box or crop them out; blurred or pixelated text can
      sometimes be recovered.
- [ ] IP addresses: your home or VPN address in tool output, the browser or VPN logs.
- [ ] The browser: other tabs, bookmarks, the address bar, account names and email addresses.
      In Burp, use its built-in browser so the proxy history holds only the lab.
- [ ] The desktop: taskbar, clock, keyboard-layout indicator, notifications, window titles and
      other open apps.
- [ ] Your system language: dates and messages in it. For English output, run commands with
      `LC_ALL=C`, for example `LC_ALL=C ls -la`.

**In the file**

- [ ] Metadata. Phone photos carry the location they were taken at, so use screenshots, not photos
      of the screen. Strip metadata before uploading:
      - Linux: `exiftool -all= -overwrite_original burp-repeater.png`, or `mat2 burp-repeater.png`
        (which saves a cleaned copy next to the original).
      - Windows: right-click the file → **Properties → Details → Remove Properties and Personal
        Information**.
- [ ] The file name. Screenshot tools name files with the date, the time and your system language,
      like `Screenshot from 2026-11-04 21-03-11.png`. Rename each file after what it shows, like
      `burp-repeater.png`.
- [ ] Size: keep originals under about 2 MB. The published versions are made smaller anyway.

## Before you publish

- Only write up retired machines and finished events. Platforms ban spoilers for active ones.
- Never publish passwords or flags that a platform asks you to keep private, OverTheWire's
  included.
