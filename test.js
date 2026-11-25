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

// --- gym: split helper ---
{
  let s = L.suggestSplit({ days: [4, 0, 2], minutes: 60, goal: 'muscle' });
  assert.deepStrictEqual(s.map(t => t.name), ['Push', 'Pull', 'Legs']);
  assert.deepStrictEqual(s.map(t => t.days), [[0], [2], [4]]);
  assert.ok(s.every(t => t.items.length === 5 && t.items.every(i => i.sets === 3 && i.reps === '8-12')));
  assert.strictEqual(s[0].items[0].name, 'Bench press');
  s = L.suggestSplit({ days: [0, 1, 3, 4], minutes: 60, goal: 'muscle' });
  assert.deepStrictEqual(s.map(t => [t.name, t.days]), [['Upper', [0, 3]], ['Lower', [1, 4]]]);
  s = L.suggestSplit({ days: [1, 3], minutes: 45, goal: 'muscle' });
  assert.deepStrictEqual(s[0].items.map(i => i.name), ['Squat', 'Bench press', 'Barbell row', 'Overhead press']);
  assert.strictEqual(s[1].name, 'Full body B');
  assert.strictEqual(s[1].items[0].name, 'Overhead press');
  s = L.suggestSplit({ days: [0, 2, 4], minutes: 90, goal: 'strength' });
  assert.strictEqual(s[0].items.length, 7);
  assert.deepStrictEqual([s[0].items[0], s[0].items[1], s[0].items[2]].map(i => [i.sets, i.reps]), [[4, '4-6'], [4, '4-6'], [3, '8-10']]);
  assert.ok(Object.values(L.GYM_LIBRARY).every(list => list.length === 7));

  // apply: links the existing "workout" habit, sets its days, creates templates
  const d = data([{ ...daily(), id: 'h1', name: 'workout' }]);
  let r = L.applySplit(d, L.suggestSplit({ days: [0, 2, 4], minutes: 60, goal: 'muscle' }), T, 50);
  assert.strictEqual(r.habit.id, 'h1');
  assert.deepStrictEqual(d.habits[0].freq, { kind: 'days', days: [0, 2, 4] });
  assert.strictEqual(d.gym.habitId, 'h1');
  assert.strictEqual(d.gym.templates.length, 3);
  const firstTpl = d.gym.templates.map(t => t.id);
  L.applySplit(d, L.suggestSplit({ days: [0, 2, 4], minutes: 60, goal: 'muscle' }), T, 60);
  assert.strictEqual(d.gym.exercises.filter(e => e.name === 'Bench press').length, 1);
  assert.ok(firstTpl.every(id => d.deleted[id]));
  assert.ok(d.gym.templates.every(t => t.items.every(i => d.gym.exercises.some(e => e.id === i.ex))));
  // no workout habit: one is created
  const e = data([daily()]);
  r = L.applySplit(e, L.suggestSplit({ days: [0, 1, 2, 3, 4, 5, 6].slice(0, 6), minutes: 45, goal: 'muscle' }), T, 70);
  assert.strictEqual(r.habit.name, 'Workout');
  assert.strictEqual(r.habit.created, T);
  assert.ok(e.habits.includes(r.habit) && L.validate(e));
}

console.log('all tests passed');
