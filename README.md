# Alkawn Hub – Attendance

A single-page web app for running classes: attendance, students, classes, programs and labels, and attendance history. It works on a laptop or phone, keeps working without a signal, and keeps every device in step through a Supabase cloud database.

> Everything lives in a handful of static files (`index.html`, `sw.js`, `manifest.json` and the icons). There is no server of our own: the browser talks straight to Supabase.

## What it does

**Attendance**
- Pick a date and a class, then mark each student present or absent (with an optional absence reason).
- Complete or reopen a class's attendance, cancel a lesson (with a reason), and add temporary students.
- **Edit this day**: change the time, move the lesson to another day, change who is coming, and write notes for that one day. This never changes the recurring class itself.
- The class list shows a green tick for classes already marked, and a line such as "2 classes left to mark" or "Tuesday attendance complete".

**Students, programs and labels**
- Students belong to one program and can have that program's labels. Student names must be unique (capitals and extra spaces do not count as different).
- The Students tab shows how many students are being shown, with search plus program and label filters.
- Deleting a student removes them from lessons that have not been marked; attendance already marked stays in the history.

**Classes**
- Recurring (chosen weekdays) or once-off (one date). A new recurring class only appears from its start date.
- A class can be paused from a date, with an optional date it comes back. Paused classes are listed last.
- Search plus program and label filters, listed A to Z.

**History**
- Per class: session by session (with previous/next), or a month calendar (green = held, red = cancelled, amber = not marked, grey = paused) with the day notes.
- Per student: attendance profile by month.

**Backup and restore**
- Backup downloads a JSON file. In Chrome and Edge on a computer, one chosen file is overwritten each time and is also refreshed automatically after changes. An automatic backup never replaces a fuller backup with a smaller one.
- Restore replaces the data in the cloud, and therefore on every device, with the backup file. It shows the backup's counts first and asks you to confirm. If the cloud cannot be updated, nothing is changed.

## How the data is stored and kept in sync

- All data for one login is stored as **one JSON document** in the Supabase table `alkawn_data` (one row per user: `user_id`, `data`, `updated_at`).
- Each device also keeps a copy in its browser (`localStorage`), so the app opens and works offline.
- The cloud copy is the shared source of truth. Every save checks that nobody else saved first. If someone did, the two sets of changes are **merged** item by item; if the very same item was changed in both places, the cloud value is kept and a backup file of the device's own version is downloaded.
- Changes made offline are kept on the device and uploaded, then merged, when the connection returns. This also works if the app was closed and reopened in between.
- Open devices check for newer cloud data about every 10 seconds, and when you return to the tab.
- A small note next to the Backup button shows "Offline" or "Changes not saved to the cloud – retrying" whenever data is waiting to be saved. Failed saves retry automatically.

## Setting it up

1. **Supabase project.** Create a project, then run this in the SQL Editor:

```sql
create table if not exists public.alkawn_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.alkawn_data enable row level security;

create policy "Users can view their own Alkawn data" on public.alkawn_data
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can create their own Alkawn data" on public.alkawn_data
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their own Alkawn data" on public.alkawn_data
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete their own Alkawn data" on public.alkawn_data
  for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.alkawn_data to authenticated;
```

2. **App settings.** In `index.html`, set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` (Project settings → API). The publishable key is designed to be visible in a web page; the row-level-security policies above are what protect the data. **Never put a `service_role` or secret key in this app.**
3. **Login URLs.** In Supabase → Authentication → URL Configuration, add the address the app is served from as the Site URL and a Redirect URL.
4. **Hosting.** Put `index.html`, `sw.js`, `manifest.json` and the three `icon-*.png` files in the same folder of a static host (for example the root of a GitHub Pages repository). The page must be served over HTTPS.

## Checking that the data is private

Run these in the Supabase SQL Editor and check the results:

```sql
-- 1. Row Level Security must be on (rowsecurity = true)
select relname, relrowsecurity from pg_class where oid = 'public.alkawn_data'::regclass;

-- 2. Every policy should compare auth.uid() with user_id
select policyname, cmd, roles, qual, with_check from pg_policies where tablename = 'alkawn_data';

-- 3. Only signed-in users should have access (no 'anon' row)
select grantee, privilege_type from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'alkawn_data';
```

Finally, create a second test account and confirm it cannot see the first account's students.

## Updating the app

1. Replace the changed files in the repository and commit.
2. Reload the app **twice** on each device (the first load installs the new version, the second runs it).
3. Check the version label under the app name (for example `v2026-10-11`). If it is old, hard-refresh (Ctrl+Shift+R) or clear the site's data; the cloud data is not affected.

Please update all devices after a release. An old copy of the app cannot use newer features and does not have the newest safety checks.

## Using it offline

Open the app online once (twice after an update) on each device so it can save a copy of itself. After that it opens without a signal, shows an amber "Offline" note, and syncs when you reconnect. A device that has been logged out will not open offline.

## Known limits

- One login equals one set of data; there are no separate roles or shared accounts yet.
- When two devices change the very same item at the same moment, the cloud value wins (a backup of the other version is downloaded).
- Duplicate student names are blocked when saving a student, but two devices adding the same new name at the same moment while offline could still create a duplicate after the merge.
- Payments, venues and the wider business modules are not part of this attendance version.

## Testing

The sync, offline, restore, backup, calendar and class logic have been exercised with automated simulations (simulated browser, cloud and several devices). Real-device checks are still worth doing after each release:

- [ ] Edit different students on two devices; both changes appear on both.
- [ ] Edit the same student on two devices (different fields, then the same field).
- [ ] Turn on airplane mode, mark attendance, close the app, reopen it offline, then reconnect.
- [ ] Take a backup, make changes, restore the backup, and check it on both devices.
- [ ] Check dates around midnight (the app uses the device's local date).
