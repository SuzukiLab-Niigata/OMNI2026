/* OMNI 2026 — timetable used by the live "Now" bar (assets/now.js).
   Times are local time in İzmir (Europe/Istanbul, UTC+3 all year). d: day of September 2026.
   id → a paper in papers.js (title and link come from there); key → an i18n label for non-paper items. */
window.OMNI_SCHEDULE = [
  { d: 29, s: "09:00", e: "09:15", key: "it.opening", anchor: "p-open" },
  { d: 29, s: "09:15", e: "09:45", id: "Keynote A" },
  { d: 29, s: "10:00", e: "10:20", id: "A-1" },
  { d: 29, s: "10:20", e: "10:40", id: "A-2" },
  { d: 29, s: "10:40", e: "11:00", id: "A-3" },
  { d: 29, s: "11:00", e: "11:20", id: "A-4" },
  { d: 29, s: "11:20", e: "11:40", key: "it.coffee" },
  { d: 29, s: "11:40", e: "12:00", id: "A-5" },
  { d: 29, s: "12:00", e: "12:20", id: "A-6" },
  { d: 29, s: "12:20", e: "12:40", id: "A-7" },
  { d: 29, s: "12:40", e: "12:45", key: "it.photo" },
  { d: 29, s: "12:45", e: "13:45", key: "it.lunch" },
  { d: 29, s: "13:50", e: "14:20", id: "Keynote B" },
  { d: 29, s: "14:30", e: "14:50", id: "B-1" },
  { d: 29, s: "14:50", e: "15:10", id: "B-2" },
  { d: 29, s: "15:10", e: "15:30", id: "B-3" },
  { d: 29, s: "15:30", e: "15:50", key: "it.coffee" },
  { d: 29, s: "15:50", e: "16:10", id: "B-4" },
  { d: 29, s: "16:10", e: "16:30", id: "B-5" },
  { d: 29, s: "16:30", e: "16:50", id: "B-6" },
  { d: 29, s: "16:50", e: "17:10", id: "B-7" },
  { d: 29, s: "17:20", e: "17:30", key: "it.closing", anchor: "p-close" },
  { d: 29, s: "18:00", e: "21:00", key: "it.banquet" },
  { d: 30, s: "09:00", e: "10:00", key: "it.dep", anchor: "tour" },
  { d: 30, s: "10:00", e: "12:00", key: "it.tour", anchor: "tour" },
  { d: 30, s: "12:00", e: "12:30", key: "it.return", anchor: "tour" }
];
