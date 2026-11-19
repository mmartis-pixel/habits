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

console.log('all tests passed');
