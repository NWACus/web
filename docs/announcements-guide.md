# Announcements — User Guide

Announcements are short, timely messages you can show to visitors on your
center's website — a storm warning, an event reminder, a fundraising push, a
site notice. You create and manage them in the admin panel; no developer help
needed.

There are two kinds:

- **Banner** — a strip across the top of the site. Good for ongoing notices
  that shouldn't interrupt anyone.
- **Pop-up** — a box that appears in the middle of the screen and has to be
  closed. Good for one important thing you want people to see right away.

Everything you create is scoped to your own center — you only see and manage
your center's announcements.

---

## Creating an announcement

1. In the admin panel, open **Content → Announcements**.
2. Click **Create New**.
3. Fill in the fields below.
4. Click **Save** (see [Draft vs. published](#draft-vs-published) — saving a
   draft does **not** put it on the site yet).

### Title

A short name for the announcement. On a banner and pop-up this is shown to
visitors as the heading, so write it for them (e.g. "Avalanche Warning in
Effect"), not just as an internal label.

### Type

Choose **Banner** or **Pop-up**. A few extra options (below) appear only for
pop-ups.

### Content

The body of the announcement. This is a rich-text editor, so you can add
formatting, links, buttons, images, and sponsor logos. Keep banners short —
they sit at the very top of the page.

### Scheduling: Start Date and End Date

Both are optional.

- **Start Date** — the announcement stays hidden until this date/time, then
  appears automatically. Leave blank to show it as soon as it's published.
- **End Date** — the announcement disappears automatically after this
  date/time. Leave blank to show it until you unpublish or delete it.

Set both to run an announcement for a fixed window (e.g. a weekend event). The
start date can't be after the end date.

> Scheduling changes can take up to a minute to appear on the live site.

### Device targeting (banners and pop-ups)

**Which devices this announcement is shown on:**

- **All devices** (default)
- **Mobile only** — phones and tablets (narrow screens)
- **Desktop only** — wider screens

Use this when a message only makes sense on one kind of device.

---

## Pop-up-only options

These appear in the sidebar only when **Type** is set to **Pop-up**.

### How often it's shown ("Display Frequency")

Controls how often the *same* visitor sees the pop-up:

- **Once ever** (default) — a visitor sees it a single time. After they close
  it, it won't come back for them.
- **Once per session** — shown once each visit. If they come back another day,
  they'll see it again.
- **Every N views** — shown every so many page views. Set the number with
  **Display Interval** (default 3 = show it every third page they view).

### Where it shows ("Page Scope")

- **All pages** (default) — the pop-up can appear anywhere on the site.
- **Homepage only** — the pop-up only appears on your center's homepage.

---

## Draft vs. published

Announcements use a draft/publish workflow, like the rest of the site:

- **Save as draft** — saves your work but does **not** show it on the site.
  Use this while you're still writing.
- **Publish** — makes it eligible to appear on the site (subject to its start
  and end dates).

To take a live announcement down, **unpublish** it (or set an end date in the
past). You don't have to delete it.

---

## What visitors see

**Banners** appear as a strip at the top of the site. Up to **three** banners
show at once (the most recently published come first). Visitors can collapse
the strip to get it out of the way, and it stays collapsed as they browse; a
small "Announcements" tab lets them reopen it.

**Pop-ups** appear in the center of the screen a moment after the page loads.
Each one has a **"Don't show this again"** link so visitors can dismiss it for
good, and closing it normally follows the frequency rule you set. If several
pop-ups are eligible on the same page, they're shown one after another.

---

## Tips

- **Keep banners short.** They sit above the page content, so a long banner
  pushes everything down — especially on phones.
- **Prefer a banner for anything ongoing.** Pop-ups interrupt people; save them
  for the one thing that truly needs immediate attention.
- **Use start/end dates for anything time-bound** so you don't have to remember
  to take it down.
- **Test with "Once per session"** while you're setting a pop-up up — it lets
  you see it again by reloading in a new session, whereas "Once ever" hides it
  after the first view.
