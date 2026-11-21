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

console.log('all tests passed');
