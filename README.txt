ALKAWN HUB — ATTENDANCE V1

Files:
- index.html: the complete app
- manifest.json: installable web-app metadata
- sw.js: basic offline caching

How to use:
1. Open index.html in a modern browser.
2. Add students.
3. Add recurring classes and choose their default students.
4. Open Attendance, choose a class/date, and mark Present or Absent.
5. Use a student profile to see that student's attendance history.
6. Use History to filter by student, class and month.
7. Use Backup regularly to download a JSON copy of the data.
8. Use Restore to load a previous JSON backup.

Important:
- This version stores data in the browser's local storage.
- It is intended as the first attendance-only stage, not yet the full Alkawn Hub.
- The data model deliberately keeps recurring class membership separate from attendance history.
- Temporary students are recorded for one session only.
