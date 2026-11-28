// Run: node test.js
const assert = require('assert');
const L = require('./logic.js');

// --- day boundary 04:00 ---
assert.strictEqual(L.dayKey(new Date(2026, 10, 20, 3, 59)), '2026-11-19');
assert.strictEqual(L.dayKey(new Date(2026, 10, 20, 4, 0)), '2026-11-20');
assert.strictEqual(L.dayKey(new Date(2026, 0, 1, 1, 0)), '2025-12-31');

// --- date math ---
assert.strictEqual(L.addDays('2026-11-30', 1), '2026-12-01');
assert.strictEqual(L.addDays('2026-12-31', 1), '2027-01-01');
assert.strictEqual(L.addDays('2026-03-01', -1), '2026-02-28');
assert.strictEqual(L.weekStart('2026-11-22'), '2026-11-16'); // Sunday -> Monday
assert.strictEqual(L.weekStart('2026-11-16'), '2026-11-16'); // Monday stays

// helpers
const T = '2026-11-19'; // Thursday
const daily = (created = '2026-11-01') => ({ id: 'd', name: 'D', note: '', type: 'check', freq: { kind: 'daily' }, created, archived: false });
const weekly = (times, created = '2026-10-01') => ({ id: 'w', name: 'W', note: '', type: 'check', freq: { kind: 'weekly', times }, created, archived: false });
const data = (habits, doneDays = {}, pauses = []) => {
  const log = {};
  for (const [id, days] of Object.entries(doneDays)) for (const k of days) (log[k] = log[k] || []).push(id);
  return { version: 1, habits, log, pauses, lastExport: null };
};

// --- toggle / pause ---
{
  const d = data([daily()]);
  L.toggle(d, 'd', T);
  assert.ok(L.isDone(d, 'd', T));
  L.toggle(d, 'd', T);
  assert.ok(!L.isDone(d, 'd', T));
  assert.ok(!(T in d.log), 'empty day removed from log');
  L.togglePause(d, T);
  assert.ok(L.isPaused(d, T));
  L.togglePause(d, T);
  assert.ok(!L.isPaused(d, T));
}

// --- daily streak ---
{
  const h = daily();
  // today undone, 3 days before done -> 3
  assert.strictEqual(L.streak(data([h], { d: ['2026-11-16', '2026-11-17', '2026-11-18'] }), h, T), 3);
  // today done too -> 4
  assert.strictEqual(L.streak(data([h], { d: ['2026-11-16', '2026-11-17', '2026-11-18', T] }), h, T), 4);
  // pause in the middle doesn't break
  assert.strictEqual(L.streak(data([h], { d: ['2026-11-16', '2026-11-18'] }, ['2026-11-17']), h, T), 2);
  // yesterday undone, today undone -> 0
  assert.strictEqual(L.streak(data([h], { d: ['2026-11-16', '2026-11-17'] }), h, T), 0);
  // stops at created date
  const h2 = daily('2026-11-18');
  assert.strictEqual(L.streak(data([h2], { d: ['2026-11-17', '2026-11-18', T] }), h2, T), 2);
}

// --- weekly streak (3x/week) ---
{
  const h = weekly(3);
  // weeks starting 11-02 and 11-09 met, current week (11-16) has 1 -> 2
  const d = data([h], { w: ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-09', '2026-11-11', '2026-11-13', '2026-11-17'] });
  assert.strictEqual(L.streak(d, h, T), 2);
  // current week met -> 3
  L.toggle(d, 'w', '2026-11-18'); L.toggle(d, 'w', T);
  assert.strictEqual(L.streak(d, h, T), 3);
  // week with 5 pause days needs only 2 done
  const p = ['2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13'];
  const d2 = data([h], { w: ['2026-11-14', '2026-11-15'] }, p);
  assert.strictEqual(L.streak(d2, h, T), 1);
  assert.strictEqual(L.weekCount(d, h, T), 3);
}

// --- isDue / dayScore ---
{
  const h = weekly(1);
  const d = data([daily(), h], { w: ['2026-11-17'] });
  assert.ok(!L.isDue(d, h, T), 'weekly target already met -> not due');
  assert.deepStrictEqual(L.dayScore(d, T), { done: 0, total: 1 });
  L.toggle(d, 'd', T);
  assert.deepStrictEqual(L.dayScore(d, T), { done: 1, total: 1 });
  // habit created later than the day doesn't count
  assert.deepStrictEqual(L.dayScore(data([daily(T)]), '2026-11-18'), { done: 0, total: 0 });
  // archived habit doesn't count
  const a = daily(); a.archived = true;
  assert.deepStrictEqual(L.dayScore(data([a]), T), { done: 0, total: 0 });
}

// --- percent ---
{
  const h = daily('2026-11-17');
  // created 2 days before today, both done, today undone -> 100
  assert.strictEqual(L.percent(data([h], { d: ['2026-11-17', '2026-11-18'] }), h, T, 7), 100);
  // 1 of 2 -> 50
  assert.strictEqual(L.percent(data([h], { d: ['2026-11-17'] }), h, T, 7), 50);
  // paused day excluded
  assert.strictEqual(L.percent(data([h], { d: ['2026-11-17'] }, ['2026-11-18']), h, T, 7), 100);
  // created today, undone -> null
  const h2 = daily(T);
  assert.strictEqual(L.percent(data([h2]), h2, T, 7), null);
  // weekly 2x: 2 done in 7 days (today undone -> 6 eligible days, expected 6*2/7) -> capped 100
  const w = weekly(2);
  assert.strictEqual(L.percent(data([w], { w: ['2026-11-14', '2026-11-16'] }), w, T, 7), 100);
  // weekly 2x, 1 done in 30 days -> low
  assert.ok(L.percent(data([w], { w: ['2026-11-16'] }), w, T, 30) < 20);
}

// --- validate ---
assert.ok(!L.validate(null));
assert.ok(!L.validate({}));
assert.ok(!L.validate({ version: 1, habits: [], pauses: [] }));
assert.ok(!L.validate({ version: 1, habits: [{ id: 1 }], log: {}, pauses: [] }));
assert.ok(L.validate(L.defaultData(T)));
assert.strictEqual(L.defaultData(T).habits.length, 6);
assert.notStrictEqual(L.newId(), L.newId());

// --- toggles leave timestamps (needed for sync) ---
{
  const d = data([daily()]);
  L.toggle(d, 'd', T, 111);
  assert.strictEqual(d.stamps[`${T}|d`], 111);
  L.togglePause(d, T, 222);
  assert.strictEqual(d.stamps[`${T}|pause`], 222);
}

// --- merge (two devices) ---
{
  const base = () => data([daily()]);
  // tick on one device only -> kept
  let a = base(), b = base();
  L.toggle(a, 'd', T, 10);
  assert.ok(L.isDone(L.merge(a, b), 'd', T));
  assert.ok(L.isDone(L.merge(b, a), 'd', T));
  // newer untick beats older tick
  a = base(); b = base();
  L.toggle(b, 'd', T, 10);
  L.toggle(a, 'd', T, 5); L.toggle(a, 'd', T, 20); // ticked then unticked at 20
  assert.ok(!L.isDone(L.merge(a, b), 'd', T));
  assert.ok(!L.isDone(L.merge(b, a), 'd', T));
  // newer tick beats older untick
  L.toggle(b, 'd', T, 30); L.toggle(b, 'd', T, 31); // b: unticked at 30, ticked again at 31
  assert.ok(L.isDone(L.merge(a, b), 'd', T));
  // no stamps (old data) -> union
  a = data([daily()], { d: ['2026-11-17'] });
  b = data([daily()], { d: ['2026-11-18'] });
  const u = L.merge(a, b);
  assert.ok(L.isDone(u, 'd', '2026-11-17') && L.isDone(u, 'd', '2026-11-18'));
  // pauses merge too
  a = base(); b = base();
  L.togglePause(b, T, 50);
  assert.ok(L.isPaused(L.merge(a, b), T));
  // habits: newer edit wins, habits from both sides kept, lastExport = latest
  a = base(); b = base();
  b.habits[0] = { ...b.habits[0], name: 'Renamed', updated: 100 };
  b.habits.push({ ...weekly(2), updated: 90 });
  a.lastExport = '2026-11-18'; b.lastExport = '2026-11-10';
  const m = L.merge(a, b);
  assert.deepStrictEqual(m.habits.map(h => h.name), ['Renamed', 'W']);
  assert.strictEqual(m.lastExport, '2026-11-18');
  // merging a result with itself changes nothing
  assert.deepStrictEqual(L.merge(m, m), m);
  assert.ok(L.validate(m));
}

// --- schedule: specific weekdays (0 = Monday) ---
{
  assert.strictEqual(L.dow('2026-11-16'), 0); // Monday
  assert.strictEqual(L.dow('2026-11-22'), 6); // Sunday
  const mwf = { id: 's', name: 'Gym', note: '', type: 'check', freq: { kind: 'days', days: [0, 2, 4] }, created: '2026-11-01', archived: false };
  assert.ok(L.isScheduled(mwf, '2026-11-16') && !L.isScheduled(mwf, T)); // Mon yes, Thu no
  const d = data([mwf], { s: ['2026-11-13', '2026-11-16', '2026-11-18'] }); // Fri, Mon, Wed
  // Thu (today) is not scheduled -> doesn't break, Tue/Thu skipped, Wed 11-11 missed -> 3
  assert.strictEqual(L.streak(d, mwf, T), 3);
  assert.strictEqual(L.bestStreak(d, mwf, T), 3);
  assert.strictEqual(L.percent(d, mwf, T, 7), 100); // 11-13, 11-16, 11-18 all done
  assert.strictEqual(L.percent(data([mwf], { s: ['2026-11-13', '2026-11-18'] }), mwf, T, 7), 67);
  assert.deepStrictEqual(L.dayScore(d, '2026-11-16'), { done: 1, total: 1 });
  assert.deepStrictEqual(L.dayScore(d, T), { done: 0, total: 0 }); // not scheduled today
  // ticking on an unscheduled day = bonus: doesn't count in score or streak
  L.toggle(d, 's', T);
  assert.deepStrictEqual(L.dayScore(d, T), { done: 0, total: 0 });
  assert.strictEqual(L.cellStatus(d, mwf, T, T), 'bonus');
  assert.strictEqual(L.streak(d, mwf, T), 3);
  // cell states
  assert.strictEqual(L.cellStatus(d, mwf, '2026-11-16', T), 'done');
  assert.strictEqual(L.cellStatus(d, mwf, '2026-11-11', T), 'missed');
  assert.strictEqual(L.cellStatus(d, mwf, '2026-11-17', T), 'off');
  assert.strictEqual(L.cellStatus(d, mwf, '2026-10-30', T), 'none');      // before created
  assert.strictEqual(L.cellStatus(d, mwf, '2026-11-20', T), 'none');      // future
  const dd = daily(), pd = data([dd], {}, ['2026-11-18']);
  assert.strictEqual(L.cellStatus(pd, dd, T, T), 'pending');               // today, not done yet
  assert.strictEqual(L.cellStatus(pd, dd, '2026-11-18', T), 'paused');
  const w = weekly(2);
  assert.strictEqual(L.cellStatus(data([w], { w: [T] }), w, T, T), 'done');
  assert.strictEqual(L.cellStatus(data([w]), w, '2026-11-18', T), 'off');
}

// --- best streak ---
{
  const h = daily('2026-11-01');
  const d = data([h], { d: ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-07', '2026-11-08'] });
  assert.strictEqual(L.bestStreak(d, h, T), 5);
  assert.strictEqual(L.streak(d, h, T), 0);
  const w = weekly(1, '2026-11-02');
  const dw = data([w], { w: ['2026-11-03', '2026-11-10', T] });
  assert.strictEqual(L.bestStreak(dw, w, T), 3);
}

// --- weakest weekday ---
{
  const h = daily('2026-08-01');
  const done = [];
  for (let k = '2026-08-01'; k < T; k = L.addDays(k, 1)) if (L.dow(k) !== 5) done.push(k); // skips every Saturday
  const d = data([h], { d: done });
  assert.deepStrictEqual(L.weakDay(d, h, T), { day: 5, rate: 1 });
  const all = [];
  for (let k = '2026-08-01'; k < T; k = L.addDays(k, 1)) all.push(k);
  assert.strictEqual(L.weakDay(data([h], { d: all }), h, T), null);
  assert.strictEqual(L.weakDay(data([weekly(3)]), weekly(3), T), null);
}

// --- validate schedule ---
{
  const withFreq = freq => { const d = L.defaultData(T); d.habits[0].freq = freq; return d; };
  assert.ok(L.validate(withFreq({ kind: 'days', days: [0, 2, 4] })));
  assert.ok(!L.validate(withFreq({ kind: 'days', days: [] })));
  assert.ok(!L.validate(withFreq({ kind: 'days', days: [7] })));
  assert.ok(!L.validate(withFreq({ kind: 'weekly', times: 0 })));
}

// --- perfect days (everything scheduled done) ---
{
  const h = daily('2026-11-10');
  const gym = { id: 'g', name: 'Gym', note: '', type: 'check', freq: { kind: 'days', days: [0] }, created: '2026-11-10', archived: false }; // Mondays
  // 11-15..11-18 all done (Mon 11-16 needs gym too), 11-14 missed, 11-17 paused, today pending
  const d = data([h, gym], { d: ['2026-11-15', '2026-11-16', '2026-11-18'], g: ['2026-11-16'] }, ['2026-11-17']);
  assert.ok(L.isPerfect(d, '2026-11-16') && !L.isPerfect(d, '2026-11-14') && !L.isPerfect(d, '2026-11-17'));
  assert.strictEqual(L.perfectStreak(d, T), 3);          // 15, 16, 18 (17 paused, today not over)
  L.toggle(d, 'd', T);
  assert.strictEqual(L.perfectStreak(d, T), 4);          // today done too
  L.toggle(d, 'g', '2026-11-16');                         // un-do gym on Monday -> Monday not perfect
  assert.strictEqual(L.perfectStreak(d, T), 2);
  assert.strictEqual(L.perfectStreak(data([]), T), 0);   // no habits
}

// --- permanent delete (from archive) survives sync ---
{
  const a = data([daily(), weekly(2)], { d: ['2026-11-18', T], w: [T] });
  const b = JSON.parse(JSON.stringify(a));                 // other device still has the habit
  L.toggle(b, 'd', '2026-11-17', 50);                      // ...and even logs it later
  L.deleteHabit(a, 'd', 100);
  assert.deepStrictEqual(a.habits.map(h => h.id), ['w']);
  assert.ok(!L.isDone(a, 'd', T) && L.isDone(a, 'w', T));
  assert.ok(!Object.keys(a.stamps || {}).some(k => k.endsWith('|d')));
  const m = L.merge(a, b), m2 = L.merge(b, a);
  for (const x of [m, m2]) {
    assert.deepStrictEqual(x.habits.map(h => h.id), ['w']);     // doesn't come back
    assert.ok(!Object.values(x.log).some(ids => ids.includes('d')));
    assert.ok(x.deleted && x.deleted.d === 100);
  }
  assert.ok(L.validate(m));
}

// --- logging a day before the habit was added moves its start back (added Gym on Sat, log Friday) ---
{
  const gym = { id: 'g', name: 'Gym', note: '', type: 'check', freq: { kind: 'days', days: [0, 1, 2, 4] }, created: '2026-11-21', archived: false };
  const d = data([gym]);
  assert.deepStrictEqual(L.dayScore(d, '2026-11-20'), { done: 0, total: 0 }); // not started yet
  L.toggle(d, 'g', '2026-11-20', 500);                                         // Friday
  assert.strictEqual(gym.created, '2026-11-20');
  assert.strictEqual(gym.updated, 500);                                         // so the new start date syncs
  assert.deepStrictEqual(L.dayScore(d, '2026-11-20'), { done: 1, total: 1 });
  assert.strictEqual(L.cellStatus(d, gym, '2026-11-20', '2026-11-21'), 'done');
  L.toggle(d, 'g', '2026-11-20', 600);                                          // unticking keeps the start
  assert.strictEqual(gym.created, '2026-11-20');
}

// --- percent over any window + monthly stats ---
{
  const a = daily('2026-10-01'), b = daily('2026-10-01'); b.id = 'b'; b.name = 'B';
  const done = { d: [], b: [] };
  for (let k = '2026-10-01'; k <= '2026-10-31'; k = L.addDays(k, 1)) {
    done.d.push(k);                                  // A every day in October
    if (k <= '2026-10-15') done.b.push(k);           // B only first half
  }
  const d = data([a, b], done, ['2026-10-20']);       // one paused day
  assert.strictEqual(L.percentBetween(d, a, '2026-10-01', '2026-10-31', T), 100);
  assert.strictEqual(L.percentBetween(d, b, '2026-10-01', '2026-10-31', T), 50); // 15 of 30 (pause skipped)
  const m = L.monthStats(d, '2026-10', T);
  assert.strictEqual(m.days, 31);
  assert.strictEqual(m.perfect, 15);                  // 1–15
  assert.strictEqual(m.bestRun, 15);
  assert.strictEqual(m.checkins, 31 + 15);
  assert.strictEqual(m.completion, Math.round(45 / 60 * 100)); // done/planned without the paused day
  assert.strictEqual(m.best.name, 'D');
  assert.strictEqual(m.worst.name, 'B');
  assert.strictEqual(L.monthStats(d, '2026-12', T), null);     // future month
  assert.strictEqual(L.monthStats(d, '2026-11', T).days, 19);  // current month counts up to today
}

// --- reminders: text (service worker + app) and the app's 7-day schedule ---
{
  const h = (id, name) => ({ id, name, note: '', type: 'check', freq: { kind: 'daily' }, created: '2026-11-01', archived: false });
  const two = (doneDays = {}, pauses = []) => data([h('a', 'Read'), h('b', 'Run')], doneDays, pauses);
  const at = (key, hour, min = 0) => { const [y, m, d] = key.split('-').map(Number); return new Date(y, m - 1, d, hour, min); };
  const prev = n => L.addDays(T, -n);

  let r = L.reminderText(two(), at(T, 9));
  assert.deepStrictEqual(r, { title: 'Today: 2 habits', body: 'Read, Run', skip: false });
  r = L.reminderText(two({ a: [T] }), at(T, 18));
  assert.deepStrictEqual(r, { title: '1 habit left today', body: 'Run', skip: false });
  r = L.reminderText(two({ a: [prev(1), prev(2), prev(3)], b: [prev(1), prev(2), prev(3)] }), at(T, 21));
  assert.deepStrictEqual(r, { title: 'Keep your 3-day streak alive', body: 'Still open: Read, Run', skip: false });
  assert.strictEqual(L.reminderText(two({ a: [T], b: [T] }), at(T, 9)).skip, true);     // day complete
  assert.strictEqual(L.reminderText(two({}, [T]), at(T, 9)).skip, true);                // paused
  assert.strictEqual(L.reminderText(data([]), at(T, 9)).skip, true);                    // no habits
  assert.deepStrictEqual(L.REMIND_HOURS, [9, 18, 21]);

  // complete day: nothing more today, first reminder tomorrow 9:00
  let p = L.reminderPlan(two({ a: [T], b: [T] }), at(T, 8));
  assert.ok(p.every(x => L.dayKey(x.at) !== T));
  assert.strictEqual(+p[0].at, +at(L.addDays(T, 1), 9));
  // paused day: nothing that day
  p = L.reminderPlan(two({}, [T]), at(T, 8));
  assert.ok(p.every(x => L.dayKey(x.at) !== T));
  // weekly quota met on Monday → nothing until next Monday
  p = L.reminderPlan(data([weekly(1)], { w: ['2026-11-16'] }), at(T, 8));
  assert.strictEqual(+p[0].at, +at('2026-11-23', 9));
  // opened after 21:00: tomorrow onward, 6 days × 3
  p = L.reminderPlan(two(), at(T, 21, 30));
  assert.strictEqual(+p[0].at, +at(L.addDays(T, 1), 9));
  assert.strictEqual(p.length, 18);
  // DST weekend (Europe/Prague ends DST 2026-10-25): still 9/18/21 local, on the hour
  p = L.reminderPlan(data([{ ...h('a', 'Read'), created: '2026-10-01' }]), new Date(2026, 9, 24, 10, 0));
  assert.ok(p.length > 0 && p.every(x => [9, 18, 21].includes(x.at.getHours()) && x.at.getMinutes() === 0));
  // stable unique ids 1..21
  p = L.reminderPlan(two(), at(T, 0, 30));
  const ids = p.map(x => x.id);
  assert.strictEqual(new Set(ids).size, ids.length);
  assert.ok(ids.every(i => i >= 1 && i <= 21));
  assert.ok(p.every(x => x.title && x.body && x.at > at(T, 0, 30)));
}

// --- gym: data ---
{
  const gymData = (gym) => Object.assign(data([daily()]), { gym });
  const ex = (id, name, updated = 1) => ({ id, name, updated });
  const wk = (id, day, items = [], done = true) => ({ id, day, items, done, updated: 1 });
  assert.ok(L.validate(data([daily()])));
  assert.ok(L.validate(gymData({ exercises: [], templates: [], workouts: [] })));
  assert.ok(L.validate(gymData({ workouts: [wk('w1', T, [{ ex: 'e1', sets: [{ kg: 80, reps: 8, done: true }, { reps: 10, done: true }] }])] })));
  assert.ok(!L.validate(gymData({ workouts: [wk('w1', 'x')] })));
  assert.ok(!L.validate(gymData({ workouts: [wk('w1', T, [{ ex: 'e1', sets: [{ reps: -1, done: true }] }])] })));
  assert.ok(!L.validate(gymData({ workouts: [wk('w1', T, [{ ex: 'e1', sets: [{ kg: 'heavy', reps: 5, done: true }] }])] })));
  assert.ok(!L.validate(gymData({ templates: [{ id: 't1', name: 'Push', days: [7], items: [], updated: 1 }] })));

  // merge: newer wins per id, union of workouts, tombstones drop
  const A = gymData({ exercises: [ex('e1', 'Bench', 1)], templates: [], workouts: [wk('w1', T)] });
  const B = gymData({ exercises: [ex('e1', 'Bench press', 2)], templates: [], workouts: [wk('w2', T)] });
  let m = L.merge(A, B);
  assert.strictEqual(m.gym.exercises.find(e => e.id === 'e1').name, 'Bench press');
  assert.deepStrictEqual(m.gym.workouts.map(w => w.id).sort(), ['w1', 'w2']);
  m = L.merge(Object.assign(A, { deleted: { e1: 5 } }), B);
  assert.ok(!m.gym.exercises.some(e => e.id === 'e1'));
  assert.ok(!('gym' in L.merge(data([daily()]), data([daily()]))));   // old data keeps its shape

  // delete an exercise: templates drop it, past workouts keep it
  const d = gymData({ exercises: [ex('e1', 'Bench press')], templates: [{ id: 't1', name: 'Push', days: [0], items: [{ ex: 'e1', sets: 3, reps: '8-12' }], updated: 1 }],
    workouts: [wk('w1', T, [{ ex: 'e1', sets: [{ kg: 80, reps: 8, done: true }] }])] });
  L.deleteGym(d, 'exercises', 'e1', 9);
  assert.strictEqual(d.gym.exercises.length, 0);
  assert.strictEqual(d.gym.templates[0].items.length, 0);
  assert.strictEqual(d.gym.workouts[0].items[0].ex, 'e1');
  assert.strictEqual(d.deleted.e1, 9);
  assert.deepStrictEqual(L.gymOf(data([])), { exercises: [], templates: [], workouts: [] });
}

// --- gym: split helper (v2: times a week, days off, training style; library keys, no reps) ---
{
  const keys = t => t.items.map(i => i.lib);
  let s = L.suggestSplit({ perWeek: 3, daysOff: [5, 6], minutes: 60, style: 2 });
  assert.deepStrictEqual(s.map(t => t.name), ['Push', 'Pull', 'Legs']);
  assert.deepStrictEqual(s.map(t => t.days), [[0], [2], [4]]);
  assert.ok(s.every(t => t.items.length === 5 && t.items.every(i => Object.keys(i).join() === 'lib,sets,warm')));
  assert.deepStrictEqual(keys(s[0]).slice(0, 3), ['machine-chest-press', 'dumbbell-shoulder-press', 'incline-dumbbell-press']); // chest, shoulders, chest: muscles rest in between
  s = L.suggestSplit({ perWeek: 3, daysOff: [0], minutes: 60, style: 2 });
  assert.deepStrictEqual(s.flatMap(t => t.days).sort(), [1, 2, 4]);                        // Monday off → Tue/Wed/Fri
  s = L.suggestSplit({ perWeek: 3, minutes: 60, style: 0 });
  assert.ok(s.every(t => t.items.length === 3));
  assert.deepStrictEqual(keys(s[0]), ['machine-chest-press', 'dumbbell-shoulder-press', 'incline-dumbbell-press']); // 3 exercises: the top priorities, in workout order
  assert.strictEqual(L.suggestSplit({ perWeek: 3, minutes: 60, style: 4 })[0].items.length, 6);
  assert.deepStrictEqual(L.suggestSplit({ perWeek: 6, daysOff: [0, 1], minutes: 60, style: 2 }), []);
  s = L.suggestSplit({ perWeek: 4, minutes: 60, style: 2 });
  assert.deepStrictEqual(s.map(t => [t.name, t.days]), [['Upper', [0, 3]], ['Lower', [1, 4]]]);
  s = L.suggestSplit({ perWeek: 2, minutes: 45, style: 2 });
  assert.deepStrictEqual(s.map(t => [t.name, t.days]), [['Full body A', [0]], ['Full body B', [3]]]);
  assert.strictEqual(s[1].items[0].lib, 'hack-squat');                                       // B starts 3 compounds later

  // apply: names from a lookup, links the existing "workout" habit, sets its days and the style
  const names = { 'machine-chest-press': 'Machine chest press' }, nameOf = k => names[k] || k;
  const d = data([{ ...daily(), id: 'h1', name: 'workout' }]);
  let r = L.applySplit(d, Object.assign(L.suggestSplit({ perWeek: 3, minutes: 60, style: 2 }), { style: 1 }), T, 50, nameOf);
  assert.strictEqual(r.habit.id, 'h1');
  assert.deepStrictEqual(d.habits[0].freq, { kind: 'days', days: [0, 2, 4] });
  assert.strictEqual(d.gym.style, 1);
  assert.strictEqual(d.gym.templates.length, 3);
  const bench = d.gym.exercises.find(e => e.lib === 'machine-chest-press');
  assert.strictEqual(bench.name, 'Machine chest press');
  const firstTpl = d.gym.templates.map(t => t.id);
  L.applySplit(d, L.suggestSplit({ perWeek: 3, minutes: 60, style: 2 }), T, 60, nameOf);
  assert.strictEqual(d.gym.exercises.filter(e => e.lib === 'machine-chest-press').length, 1);
  assert.ok(firstTpl.every(id => d.deleted[id]));
  assert.ok(d.gym.templates.every(t => t.items.every(i => d.gym.exercises.some(e => e.id === i.ex))));
  const e = data([daily()]);
  r = L.applySplit(e, L.suggestSplit({ perWeek: 6, minutes: 45, style: 2 }), T, 70);
  assert.strictEqual(r.habit.name, 'Workout');
  assert.strictEqual(r.habit.created, T);
  assert.ok(e.habits.includes(r.habit) && L.validate(e));
}

// --- gym: workouts ---
{
  const gymFix = () => Object.assign(data([daily()]), { gym: { habitId: 'd',
    exercises: [{ id: 'e1', name: 'Bench press', updated: 1 }, { id: 'e2', name: 'Pull-up', updated: 1 }],
    templates: [{ id: 't1', name: 'Push', days: [3], items: [{ ex: 'e1', sets: 3, reps: '8-12' }], updated: 1 }], workouts: [] } });
  const d = gymFix();
  assert.strictEqual(L.todayTemplate(d, T).id, 't1');                  // T is a Thursday
  assert.strictEqual(L.todayTemplate(d, '2026-11-20'), null);
  const w1 = L.startWorkout(d, T, 't1', 10);
  assert.deepStrictEqual(w1.items[0].sets, [{ reps: 0, done: false }]);   // one empty working set to start
  assert.deepStrictEqual(w1.items[0].plan, { sets: 3, warm: 0 });         // v20 item sets:3 kept, reps ignored
  assert.strictEqual(L.startWorkout(d, T, 't1', 11).id, w1.id);          // a draft is continued, not duplicated
  w1.items[0].sets = [{ kg: 80, reps: 8, done: true }, { kg: 82.5, reps: 8, done: true }, { kg: 82.5, reps: 7, done: true }];
  assert.deepStrictEqual(L.finishWorkout(d, w1.id, 20).records, []);   // first time ever: no record
  assert.ok(L.isDone(d, 'd', T));                                       // linked habit ticked
  const w2 = L.startWorkout(d, '2026-11-26', 't1', 30);
  assert.deepStrictEqual(w2.items[0].sets.map(s => [s.kg, s.reps, s.done]), [[80, 8, false]]);
  L.setRowCount(d, w2, 0, false, 3, 31);                                // "3rd set" chip: rows 2 and 3 from last time's 2nd and 3rd
  assert.deepStrictEqual(w2.items[0].sets.map(s => [s.kg, s.reps, s.done]), [[80, 8, false], [82.5, 8, false], [82.5, 7, false]]);
  assert.deepStrictEqual(L.lastSets(d, 'e1', w2.id).map(s => s.kg), [80, 82.5, 82.5]);
  w2.items[0].sets[0] = { kg: 85, reps: 6, done: true };
  w2.items[0].sets.push({ kg: 90, reps: 1, done: false });             // not done: ignored
  assert.deepStrictEqual(L.finishWorkout(d, w2.id, 40).records, [{ ex: 'e1', kg: 85 }]);
  assert.strictEqual(L.bestKg(d, 'e1'), 85);
  assert.strictEqual(L.bestKg(d, 'e1', w2.id), 82.5);
  assert.deepStrictEqual(L.exerciseHistory(d, 'e1'), [{ day: T, kg: 82.5 }, { day: '2026-11-26', kg: 85 }]);
  // bodyweight only: never a record, no NaN, not in the chart
  const w3 = L.startWorkout(d, '2026-11-27', null, 50);
  assert.deepStrictEqual(w3.items, []);
  w3.items.push({ ex: 'e2', sets: [{ reps: 10, done: true }] });
  assert.deepStrictEqual(L.finishWorkout(d, w3.id, 60).records, []);
  assert.strictEqual(L.bestKg(d, 'e2'), null);
  assert.deepStrictEqual(L.exerciseHistory(d, 'e2'), []);
  assert.ok(L.validate(d));
  // two drafts (from two devices): start picks one, adds none
  const d2 = gymFix();
  d2.gym.workouts.push({ id: 'a', day: T, items: [], done: false, updated: 1 }, { id: 'b', day: T, items: [], done: false, updated: 2 });
  assert.ok(['a', 'b'].includes(L.startWorkout(d2, T, 't1', 70).id));
  assert.strictEqual(d2.gym.workouts.length, 2);
  // before 04:00 the workout belongs to the previous day
  const d3 = gymFix();
  assert.strictEqual(L.startWorkout(d3, L.dayKey(new Date(2026, 10, 20, 2, 0)), null, 80).day, '2026-11-19');
}

// --- gym: own split keeps the Workout habit in step ---
{
  const d = data([daily()]);
  const g = L.gymOf(d);
  const bench = L.ensureExercise(d, 'Bench press', 5);
  assert.strictEqual(L.ensureExercise(d, 'bench PRESS', 6), bench);           // reused by name
  assert.strictEqual(g.exercises.length, 1);
  g.templates.push({ id: 't1', name: 'Push', days: [1, 4], items: [{ ex: bench, sets: 3, reps: '8-12' }], updated: 5 });
  const h = L.linkWorkoutHabit(d, T, 7);
  assert.strictEqual(h.name, 'Workout');
  assert.deepStrictEqual(h.freq, { kind: 'days', days: [1, 4] });
  assert.strictEqual(g.habitId, h.id);
  g.templates[0].days = [];                                                  // no days: link only, freq untouched
  assert.strictEqual(L.linkWorkoutHabit(d, T, 8), h);
  assert.deepStrictEqual(h.freq, { kind: 'days', days: [1, 4] });
  const e = data([daily()]);
  L.gymOf(e).templates.push({ id: 't2', name: 'Any', days: [], items: [], updated: 1 });
  assert.strictEqual(L.linkWorkoutHabit(e, T, 9), null);                     // nothing planned, no habit yet: none created
  assert.strictEqual(e.habits.length, 1);
}

// --- gym v2: training style, my week, warm-ups ---
{
  assert.strictEqual(L.styleOf(data([])).label, 'Balanced');
  assert.deepStrictEqual(L.STYLES.map(s => s.reps), ['4–8', '5–9', '6–10', '7–11', '8–12']);

  // my week: one workout per day, shared by name, copy on a new name, rename when used only here
  const d = data([daily()]);
  const up = L.setDayWorkout(d, 0, 'Upper', 1);
  L.gymOf(d);
  up.items.push({ ex: L.ensureExercise(d, 'Bench press', 1, 'bench-press') });
  const low = L.setDayWorkout(d, 2, 'Lower', 2);
  assert.notStrictEqual(low.id, up.id);
  assert.strictEqual(L.setDayWorkout(d, 4, 'upper', 3).id, up.id);
  assert.deepStrictEqual(up.days, [0, 4]);
  const upB = L.setDayWorkout(d, 4, 'Upper B', 4);                       // shared → copy, Monday keeps Upper
  assert.notStrictEqual(upB.id, up.id);
  assert.deepStrictEqual(upB.items.map(i => i.ex), up.items.map(i => i.ex));
  assert.deepStrictEqual(up.days, [0]);
  assert.strictEqual(L.setDayWorkout(d, 2, '', 5), null);                // rest day
  assert.deepStrictEqual(low.days, []);
  const ren = L.setDayWorkout(d, 0, 'Push', 6);                         // Upper only on Monday → renamed
  assert.strictEqual(ren.id, up.id);
  assert.strictEqual(up.name, 'Push');
  assert.ok(d.gym.templates.every(t => t.days.filter(x => x === 0).length <= 1));
  const wh = d.habits.find(h => h.id === d.gym.habitId);                    // my week created the Workout habit
  assert.ok(wh && /^\d{4}-\d{2}-\d{2}$/.test(wh.created) && L.validate(d));
  assert.strictEqual(L.ensureExercise(d, 'BENCH press', 7), up.items[0].ex);  // name match
  assert.strictEqual(L.ensureExercise(d, 'Flat bench', 8, 'bench-press'), up.items[0].ex); // lib match wins

  // warm-ups never count; a warm-up chip prefills from last time's warm-up
  const g = Object.assign(data([daily()]), { gym: { habitId: 'd', exercises: [{ id: 'e1', name: 'Bench press', updated: 1 }],
    templates: [{ id: 't1', name: 'Push', days: [3], items: [{ ex: 'e1' }], updated: 1 }], workouts: [] } });
  const w1 = L.startWorkout(g, T, 't1', 10);
  assert.deepStrictEqual(w1.items[0].sets, [{ reps: 0, done: false }]);
  w1.items[0].sets = [{ kg: 120, reps: 5, done: true, warm: true }, { kg: 80, reps: 8, done: true }, { kg: 80, reps: 8, done: true }];
  L.finishWorkout(g, w1.id, 20);
  assert.strictEqual(L.bestKg(g, 'e1'), 80);
  assert.deepStrictEqual(L.exerciseHistory(g, 'e1'), [{ day: T, kg: 80 }]);
  const w2 = L.startWorkout(g, '2026-11-26', 't1', 30);
  assert.deepStrictEqual(w2.items[0].sets, [{ kg: 80, reps: 8, done: false }]);
  L.setRowCount(g, w2, 0, true, 1, 31);                                  // "1st warm-up" chip: on top, 55% of top 80 kg × 9
  assert.deepStrictEqual(w2.items[0].sets[0], { reps: 9, done: false, warm: true, kg: 45 });
  assert.strictEqual(w2.items[0].sets.length, 2);
  w2.items[0].sets = [{ kg: 200, reps: 1, done: true, warm: true }, { kg: 85, reps: 6, done: true }];
  assert.deepStrictEqual(L.finishWorkout(g, w2.id, 40).records, [{ ex: 'e1', kg: 85 }]);
  assert.ok(L.validate(g));
  g.gym.style = 4; assert.ok(L.validate(g));
  g.gym.style = 9; assert.ok(!L.validate(g));
  g.gym.style = 2; g.gym.workouts[0].items[0].sets[0].warm = 'yes'; assert.ok(!L.validate(g));
}

// --- gym: deleting a workout drops its unfinished draft (a new split must not reopen the old workout) ---
{
  const d = Object.assign(data([daily()]), { gym: { exercises: [{ id: 'e1', name: 'Bench press', updated: 1 }],
    templates: [{ id: 't1', name: 'Old', days: [3], items: [{ ex: 'e1' }], updated: 1 }], workouts: [] } });
  const draft = L.startWorkout(d, T, 't1', 5);
  const done = { id: 'w0', day: '2026-11-12', tpl: 't1', items: [], done: true, updated: 1 };
  d.gym.workouts.push(done);
  L.applySplit(d, L.suggestSplit({ perWeek: 3, minutes: 60, style: 2 }), T, 9);
  assert.ok(!d.gym.workouts.some(w => w.id === draft.id));          // unfinished workout of the replaced split is gone
  assert.ok(d.gym.workouts.some(w => w.id === 'w0'));               // history stays
  const nd = L.startWorkout(d, T, d.gym.templates[0].id, 10);
  assert.notStrictEqual(nd.id, draft.id);
}

// --- gym v3: sets and warm-ups per exercise, chips, style only on helper workouts ---
{
  const s = L.suggestSplit({ perWeek: 3, minutes: 60, style: 0 });
  // the helper decides: strength compound 3 warm-ups + 3 sets, isolation 1 + 2; balanced/hypertrophy compound 2 + 2, isolation 1 + 2
  assert.deepStrictEqual(s[0].items.map(i => [i.sets, i.warm]), [[3, 3], [3, 3], [3, 3]]); // 60 min of strength = the 3 multi-joint lifts
  assert.deepStrictEqual(L.helperPlan(4, true), { sets: 2, warm: 2 });
  assert.deepStrictEqual(L.helperPlan(2, false), { sets: 2, warm: 1 });
  assert.strictEqual(s[0].style, 0);
  const d = data([daily()]);
  L.applySplit(d, s, T, 5);
  const t = d.gym.templates[0];
  assert.strictEqual(t.style, 0);
  assert.deepStrictEqual([t.items[0].sets, t.items[0].warm], [3, 3]);
  const own = L.setDayWorkout(d, 6, 'Arms', 6);
  assert.strictEqual(own.style, undefined);                               // own workouts: no style
  assert.deepStrictEqual(L.planOf({ ex: 'x' }), { sets: 3, warm: 0 });   // v2 item
  assert.deepStrictEqual(L.planOf({ sets: 9, warm: -1 }), { sets: 3, warm: 0 });
  assert.deepStrictEqual(L.planOf({ sets: 5, warm: 4 }), { sets: 5, warm: 4 });

  // chips: done rows are never removed; at least one working set; mid-workout exercise = 3 sets / 2 warm-ups
  const w = L.startWorkout(d, T, t.id, 10);
  assert.deepStrictEqual(w.items[0].plan, { sets: 3, warm: 3 });
  assert.strictEqual(w.items[0].sets.length, 1);
  L.setRowCount(d, w, 0, false, 3, 11);
  L.setRowCount(d, w, 0, true, 2, 12);
  assert.deepStrictEqual(w.items[0].sets.map(x => !!x.warm), [true, true, false, false, false]);
  w.items[0].sets[3].done = true;
  L.setRowCount(d, w, 0, false, 1, 13);                                   // 3rd goes, 2nd is done: stays
  assert.deepStrictEqual(w.items[0].sets.map(x => !!x.warm), [true, true, false, false]);
  L.setRowCount(d, w, 0, false, 0, 14);
  L.setRowCount(d, w, 0, true, 0, 15);
  assert.strictEqual(w.items[0].sets.length, 2);
  assert.ok(w.items[0].sets.every(x => !x.warm));
  const mid = L.workoutItem(d, 'e9');
  assert.deepStrictEqual(mid, { ex: 'e9', plan: { sets: 3, warm: 2 }, sets: [{ reps: 0, done: false }] });
  assert.ok(L.validate(d));

  // warm-ups from the top working weight typed now: 55% × 9, 70% × 6, 85% × 4 (2.5 kg steps); no weight yet = reps only
  const wi = { ex: 'e9', plan: { sets: 3, warm: 3 }, sets: [{ kg: 100, reps: 5, done: false }] }, ww = { id: 'ww', items: [wi] };
  L.setRowCount(d, ww, 0, true, 3, 20);
  assert.deepStrictEqual(wi.sets.filter(x => x.warm).map(x => [x.kg, x.reps]), [[55, 9], [70, 6], [85, 4]]);
  const wn = { ex: 'e8', sets: [{ reps: 0, done: false }] };
  L.setRowCount(d, { id: 'wn', items: [wn] }, 0, true, 1, 21);
  assert.deepStrictEqual(wn.sets[0], { reps: 9, done: false, warm: true });
}

// --- gym: split types to choose from, and "I'll add my own exercises" ---
{
  const names = s => s.map(t => `${t.name}:${t.days.join('')}`);
  assert.deepStrictEqual(names(L.suggestSplit({ type: 'ap', perWeek: 4, minutes: 60 })), ['Anterior:03', 'Posterior:14']);
  assert.deepStrictEqual(names(L.suggestSplit({ type: 'arnold', perWeek: 3, minutes: 60 })), ['Chest & back:0', 'Shoulders & arms:2', 'Legs:4']);
  assert.deepStrictEqual(names(L.suggestSplit({ type: 'ulppl', perWeek: 5, minutes: 60 })), ['Upper:0', 'Lower:1', 'Push:2', 'Pull:3', 'Legs:4']);
  assert.deepStrictEqual(names(L.suggestSplit({ type: 'fbeod', perWeek: 4, minutes: 60 })), ['Full body A:04', 'Full body B:26']); // every other day
  assert.deepStrictEqual(names(L.suggestSplit({ type: 'fb', perWeek: 3, minutes: 60 })), ['Full body A:04', 'Full body B:2']);
  assert.deepStrictEqual(L.suggestSplit({ type: 'ppl', perWeek: 4, minutes: 60 }), []);
  // the user's order for Upper: chest, back, triceps (after back), biceps (before chest), chest, shoulders, back
  assert.deepStrictEqual(L.suggestSplit({ type: 'ul', perWeek: 4, minutes: 82, style: 2 })[0].items.map(i => i.lib),
    ['machine-chest-press', 'lat-pulldown', 'triceps-pushdown', 'preacher-curl', 'incline-dumbbell-press', 'lateral-raise', 'seated-cable-row']);              // PPL is 3 or 6 a week
  for (const [k, T] of Object.entries(L.SPLIT_TYPES)) for (const n of Object.keys(T.seq))
    assert.ok(L.suggestSplit({ type: k, perWeek: Number(n), minutes: 60 }).every(t => t.items.length >= 3), k + n);
  // the helper offers at most 3 splits per times a week, each works for that number and has an "about"
  for (const [n, keys] of Object.entries(L.SPLIT_OPTIONS)) {
    assert.ok(keys.length >= 1 && keys.length <= 3 && keys.includes(L.DEFAULT_TYPE[n]), 'options ' + n);
    for (const k of keys) assert.ok(L.SPLIT_TYPES[k].about && L.SPLIT_TYPES[k].time && L.suggestSplit({ type: k, perWeek: Number(n), minutes: 60 }).length, k + n);
  }
  const own = L.suggestSplit({ type: 'ul', perWeek: 4, minutes: 60, own: true });
  assert.deepStrictEqual(own, [{ name: 'Upper', days: [0, 3], items: [] }, { name: 'Lower', days: [1, 4], items: [] }]); // no style: My week asks sets
  const d = data([daily()]);
  L.applySplit(d, own, T, 5);
  assert.ok(d.gym.templates.every(t => !t.items.length && t.style === undefined) && L.validate(d));
}

// --- exercise library (exercises.js) ---
{
  const EX = require('./exercises.js');
  const keys = EX.LIST.map(e => e.key);
  assert.strictEqual(new Set(keys).size, keys.length);
  assert.ok(keys.length >= 35);
  for (const k of Object.values(L.SPLIT_KEYS).flatMap(t => t.map(e => e[0]))) assert.ok(EX.byKey(k), 'missing library key ' + k);
  const valid = new Set(['CHEST', 'OBLIQUES', 'ABS', 'BICEPS', 'TRICEPS', 'NECK', 'FRONT_DELTOIDS', 'ADDUCTORS', 'QUADRICEPS', 'CALVES', 'FOREARM',
    'TRAPEZIUS', 'BACK_DELTOIDS', 'UPPER_BACK', 'LOWER_BACK', 'GLUTEAL', 'HAMSTRING']);
  for (const e of EX.LIST) {
    assert.ok(['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'].includes(e.group), e.key);
    assert.ok(e.muscles.main.length && [...e.muscles.main, ...e.muscles.help].every(m => valid.has(m)), e.key);
    const st = EX.stepsOf(e);
    assert.strictEqual(st.length, 3, e.key);
    assert.ok(st.every(s => s.cap && s.cap.length <= 60 && Array.isArray(s.pose.parts) && s.pose.parts.length), e.key);
  }
  assert.strictEqual(EX.find('bench PRESS').key, 'bench-press');
  assert.strictEqual(EX.find('nope'), null);
  const map = EX.muscleMapSvg(['CHEST'], ['TRICEPS']);
  assert.ok(map.includes('#E24B4A') && map.includes('#F09595') && map.split('<svg').length === 3);
  // the user's numbers per muscle (2026-11-28), and every pose of an exercise has the same shapes (the animation morphs them)
  const WANT = { Chest: 7, Lats: 5, 'Upper back': 5, 'Lower back': 3, Shoulders: 6, Biceps: 6, Triceps: 6, Forearms: 4, Quads: 5, Hamstrings: 4, Glutes: 4, Calves: 4, Abs: 6, Obliques: 4 };
  for (const g of EX.GROUPS) for (const sub of g.subs || [g.name]) {
    const n = EX.LIST.filter(e => e.group === g.name && (!g.subs || e.sub === sub)).length;
    assert.strictEqual(n, WANT[sub], sub);
  }
  assert.ok(EX.LIST.every(e => !!e.sub === !!EX.GROUPS.find(g => g.name === e.group).subs), 'sub missing');
  const shape = p => JSON.stringify([p.parts.map(q => q.p.split(' ').length + q.c), p.gear.map(g => Object.keys(g).join() + (g.line ? g.line.split(' ').length : ''))]);
  for (const e of EX.LIST) { const ps = EX.stepsOf(e).map(s => shape(s.pose)); assert.ok(ps.every(x => x === ps[0]), 'poses differ: ' + e.key); }
  const svg = EX.animSvg(EX.byKey('squat'), 'Squat "x"');
  assert.ok(svg.includes('<animate attributeName="points"') && svg.includes('&quot;x&quot;'));
  assert.ok(svg.startsWith('<svg') && svg.includes('#E24B4A'));
  assert.ok(/MIT/.test(EX.CREDIT));
}

console.log('all tests passed');
