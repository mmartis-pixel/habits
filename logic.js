// Pure habit logic. Browser: global HabitLogic. Node: require('./logic.js').
// Day keys are 'YYYY-MM-DD' strings; a day ends at 04:00 local time.
(function (root) {
  const DAY_START_HOUR = 4;

  const pad = n => String(n).padStart(2, '0');
  const parse = key => { const [y, m, d] = key.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); };
  const fmt = dt => dt.toISOString().slice(0, 10);

  function dayKey(date) {
    const d = new Date(date.getTime() - DAY_START_HOUR * 3600e3);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  function addDays(key, n) { const d = parse(key); d.setUTCDate(d.getUTCDate() + n); return fmt(d); }
  function weekStart(key) { return addDays(key, -((parse(key).getUTCDay() + 6) % 7)); }

  const isDone = (data, id, key) => (data.log[key] || []).includes(id);
  const isPaused = (data, key) => data.pauses.includes(key);

  // every toggle stamps its cell ('day|habitId' or 'day|pause') so two devices can merge (newer wins)
  const stamp = (data, cell, now) => { (data.stamps = data.stamps || {})[cell] = now; };

  function toggle(data, id, key, now = Date.now()) {
    const day = data.log[key] || [];
    const on = !day.includes(id);
    data.log[key] = on ? [...day, id] : day.filter(x => x !== id);
    if (!data.log[key].length) delete data.log[key];
    stamp(data, `${key}|${id}`, now);
    // logging a day before the habit was added = it really started then
    const h = data.habits.find(x => x.id === id);
    if (on && h && key < h.created) { h.created = key; h.updated = now; }
  }
  function togglePause(data, key, now = Date.now()) {
    data.pauses = isPaused(data, key) ? data.pauses.filter(k => k !== key) : [...data.pauses, key];
    stamp(data, `${key}|pause`, now);
  }

  // Permanently remove a habit and its history. A tombstone (`deleted[id] = time`) stops sync from bringing it back.
  function deleteHabit(data, id, now = Date.now()) {
    data.habits = data.habits.filter(h => h.id !== id);
    for (const [k, ids] of Object.entries(data.log)) {
      data.log[k] = ids.filter(x => x !== id);
      if (!data.log[k].length) delete data.log[k];
    }
    for (const c of Object.keys(data.stamps || {})) if (c.slice(11) === id) delete data.stamps[c];
    (data.deleted = data.deleted || {})[id] = now;
  }

  // Merge two copies of the data (phone + computer). Cells: newer stamp wins, no stamps = union.
  // Habits: newer `updated` wins per id; order from the side edited most recently. Deleted ids stay deleted.
  function merge(a, b) {
    const deleted = { ...(a.deleted || {}) };
    for (const [id, t] of Object.entries(b.deleted || {})) deleted[id] = Math.max(deleted[id] || 0, t);
    const newest = d => d.habits.reduce((m, h) => Math.max(m, h.updated || 0), 0);
    const [first, second] = newest(a) >= newest(b) ? [a, b] : [b, a];
    const byId = new Map();
    for (const h of [...first.habits, ...second.habits]) {
      if (deleted[h.id]) continue;
      const cur = byId.get(h.id);
      if (!cur || (h.updated || 0) > (cur.updated || 0)) byId.set(h.id, h);
    }
    const cells = d => {
      const s = new Set(d.pauses.map(k => `${k}|pause`));
      for (const [k, ids] of Object.entries(d.log)) for (const id of ids) s.add(`${k}|${id}`);
      return s;
    };
    const ca = cells(a), cb = cells(b), sa = a.stamps || {}, sb = b.stamps || {};
    const out = { version: 1, habits: [...byId.values()].map(h => ({ ...h })), log: {}, pauses: [], stamps: {},
      lastExport: [a.lastExport, b.lastExport].filter(Boolean).sort().pop() || null };
    if (Object.keys(deleted).length) out.deleted = deleted;
    for (const c of new Set([...ca, ...cb, ...Object.keys(sa), ...Object.keys(sb)])) {
      if (deleted[c.slice(11)]) continue;
      const ta = sa[c] || 0, tb = sb[c] || 0;
      const on = ta === tb ? ca.has(c) || cb.has(c) : ta > tb ? ca.has(c) : cb.has(c);
      if (ta || tb) out.stamps[c] = Math.max(ta, tb);
      if (!on) continue;
      const day = c.slice(0, 10), id = c.slice(11);
      if (id === 'pause') out.pauses.push(day);
      else (out.log[day] = out.log[day] || []).push(id);
    }
    out.pauses.sort();
    return out;
  }

  // ---- schedule ----
  // freq: { kind: 'daily' } | { kind: 'days', days: [0..6] } (0 = Monday) | { kind: 'weekly', times: 1..7 }
  const dow = key => (parse(key).getUTCDay() + 6) % 7;
  const isScheduled = (habit, key) => habit.freq.kind === 'daily' || (habit.freq.kind === 'days' && habit.freq.days.includes(dow(key)));

  // eligible = habit exists that day and day is not paused; counts = eligible and scheduled (daily / days habits)
  const eligible = (data, habit, key) => key >= habit.created && !isPaused(data, key);
  const counts = (data, habit, key) => eligible(data, habit, key) && isScheduled(habit, key);

  function weekCount(data, habit, key) {
    const start = weekStart(key);
    let n = 0;
    for (let i = 0; i < 7; i++) if (isDone(data, habit.id, addDays(start, i))) n++;
    return n;
  }

  // due = belongs in that day's score. Done on an unscheduled day = bonus, not due.
  function isDue(data, habit, key) {
    if (habit.freq.kind !== 'weekly') return isScheduled(habit, key);
    return isDone(data, habit.id, key) || weekCount(data, habit, key) < habit.freq.times;
  }

  function dayScore(data, key) {
    const hs = data.habits.filter(h => !h.archived && h.created <= key && isDue(data, h, key));
    return { done: hs.filter(h => isDone(data, h.id, key)).length, total: hs.length };
  }

  // perfect day = not paused, something was due, and all of it was done
  function isPerfect(data, key) {
    if (isPaused(data, key)) return false;
    const s = dayScore(data, key);
    return s.total > 0 && s.done === s.total;
  }
  // Perfect days in a row. Paused days and days with nothing due are skipped; an unfinished today doesn't break it.
  function perfectStreak(data, today) {
    const first = data.habits.reduce((m, h) => (!m || h.created < m ? h.created : m), null);
    let n = 0;
    for (let k = today; first && k >= first; k = addDays(k, -1)) {
      if (isPaused(data, k) || !dayScore(data, k).total) continue;
      if (isPerfect(data, k)) n++;
      else if (k !== today) break;
    }
    return n;
  }

  // Met (true) / missed (false) units since creation, oldest first: scheduled days for daily/days habits,
  // weeks for weekly ones (required = min(times, non-paused days that week)). The current day/week is left
  // out while it can still be met, so an unfinished today never breaks a streak.
  function outcomes(data, habit, today) {
    const out = [];
    if (habit.freq.kind !== 'weekly') {
      for (let k = habit.created; k <= today; k = addDays(k, 1)) {
        if (!counts(data, habit, k)) continue;
        const d = isDone(data, habit.id, k);
        if (k !== today || d) out.push(d);
      }
      return out;
    }
    const cur = weekStart(today);
    for (let w = weekStart(habit.created); w <= cur; w = addDays(w, 7)) {
      let possible = 0, done = 0;
      for (let i = 0; i < 7; i++) {
        const k = addDays(w, i);
        if (!eligible(data, habit, k)) continue;
        possible++;
        if (isDone(data, habit.id, k)) done++;
      }
      const required = Math.min(habit.freq.times, possible);
      if (!required) continue;
      if (done >= required) out.push(true);
      else if (w !== cur) out.push(false);
    }
    return out;
  }
  function streak(data, habit, today) {
    const o = outcomes(data, habit, today);
    let n = 0;
    while (n < o.length && o[o.length - 1 - n]) n++;
    return n;
  }
  function bestStreak(data, habit, today) {
    let best = 0, run = 0;
    for (const met of outcomes(data, habit, today)) { run = met ? run + 1 : 0; best = Math.max(best, run); }
    return best;
  }

  // % done between two days (inclusive). Today only counts once it's done.
  function percentBetween(data, habit, from, to, today) {
    const weekly = habit.freq.kind === 'weekly';
    let elig = 0, done = 0;
    for (let k = from; k <= to; k = addDays(k, 1)) {
      if (!(weekly ? eligible : counts)(data, habit, k)) continue;
      const d = isDone(data, habit.id, k);
      if (k === today && !d) continue; // today not over yet
      elig++;
      if (d) done++;
    }
    if (!elig) return null;
    const expected = elig * (weekly ? habit.freq.times / 7 : 1);
    return Math.min(100, Math.round(done / expected * 100));
  }
  const percent = (data, habit, today, days) => percentBetween(data, habit, addDays(today, -(days - 1)), today, today);

  // Calendar month ('YYYY-MM') summary up to today; null for a future month.
  function monthStats(data, ym, today) {
    const first = `${ym}-01`;
    if (first > today) return null;
    const [y, m] = ym.split('-').map(Number);
    const end = fmt(new Date(Date.UTC(y, m, 0)));
    const last = end < today ? end : today;
    let days = 0, perfect = 0, run = 0, bestRun = 0, checkins = 0, planned = 0, done = 0;
    for (let k = first; k <= last; k = addDays(k, 1)) {
      days++;
      checkins += (data.log[k] || []).length;
      if (isPaused(data, k)) continue;
      const s = dayScore(data, k);
      planned += s.total; done += s.done;
      if (s.total && s.done === s.total) { perfect++; bestRun = Math.max(bestRun, ++run); }
      else if (s.total && k !== today) run = 0;
    }
    const ranked = data.habits.filter(h => !h.archived && h.created <= last)
      .map(h => ({ id: h.id, name: h.name, pct: percentBetween(data, h, h.created > first ? h.created : first, last, today) }))
      .filter(x => x.pct !== null).sort((a, b) => b.pct - a.pct);
    const worst = ranked.length > 1 && ranked[ranked.length - 1].pct < ranked[0].pct ? ranked[ranked.length - 1] : null;
    return { ym, days, perfect, bestRun, checkins, completion: planned ? Math.round(done / planned * 100) : null, best: ranked[0] || null, worst };
  }

  // Badges, all derived from the data (nothing stored): { id, name, desc, need, progress, unlocked }
  function achievements(data, today) {
    const ids = new Set(data.habits.map(h => h.id));
    let checkins = 0;
    for (const v of Object.values(data.log)) checkins += v.filter(id => ids.has(id)).length;
    const first = data.habits.reduce((m, h) => (!m || h.created < m ? h.created : m), null);
    let perfectDays = 0, run = 0, bestRun = 0, off = 0, comeback = false, early = false;
    for (let k = first; first && k <= today; k = addDays(k, 1)) {
      if (isPaused(data, k) || !dayScore(data, k).total) continue;
      if (isPerfect(data, k)) {
        perfectDays++; bestRun = Math.max(bestRun, ++run);
        if (off >= 3) comeback = true;
        off = 0;
        if (!early) { // finished the whole day before 9:00 that morning
          const lastTick = Math.max(0, ...(data.log[k] || []).map(id => (data.stamps || {})[`${k}|${id}`] || 0));
          if (lastTick && dayKey(new Date(lastTick)) === k && new Date(lastTick).getHours() < 9) early = true;
        }
      } else if (k !== today) { run = 0; off++; }
    }
    const bestHabit = Math.max(0, ...data.habits.map(h => bestStreak(data, h, today)));
    let bestMonth = 0;
    for (let ym = first && first.slice(0, 7); ym && ym < today.slice(0, 7); ym = addDays(`${ym}-28`, 7).slice(0, 7)) {
      bestMonth = Math.max(bestMonth, monthStats(data, ym, today).completion || 0);
    }
    const planned = new Set();
    for (const h of data.habits) if (!h.archived) (h.freq.kind === 'daily' ? [0, 1, 2, 3, 4, 5, 6] : h.freq.kind === 'days' ? h.freq.days : []).forEach(d => planned.add(d));
    const A = (id, name, desc, have, need) => ({ id, name, desc, need, progress: Math.min(have, need), unlocked: have >= need });
    return [
      A('first', 'First step', 'Log your first habit', checkins, 1),
      A('perfect1', 'Perfect day', 'Finish everything planned for a day', perfectDays, 1),
      A('week', 'Perfect week', '7 perfect days in a row', bestRun, 7),
      A('early', 'Early bird', 'A perfect day finished before 9:00', early ? 1 : 0, 1),
      A('comeback', 'Comeback', 'A perfect day after 3+ days without one', comeback ? 1 : 0, 1),
      A('planner', 'Full week', 'Habits planned on all 7 days', planned.size, 7),
      A('ember', 'Ember', 'A 7-day streak on any habit', bestHabit, 7),
      A('blue', 'Blue flame', 'A 30-day streak on any habit', bestHabit, 30),
      A('gold', 'Golden flame', 'A 100-day streak on any habit', bestHabit, 100),
      A('legend', 'Legend', 'A 365-day streak on any habit', bestHabit, 365),
      A('c100', 'Century', '100 check-ins', checkins, 100),
      A('c500', 'Committed', '500 check-ins', checkins, 500),
      A('c1000', 'Unstoppable', '1,000 check-ins', checkins, 1000),
      A('month90', 'Strong month', '90 % or more over a whole month', bestMonth, 90),
    ];
  }

  // What one habit looked like on one day — drives the stats grid.
  function cellStatus(data, habit, key, today) {
    if (key < habit.created || key > today) return 'none';
    if (isPaused(data, key)) return 'paused';
    const d = isDone(data, habit.id, key);
    if (habit.freq.kind === 'weekly') return d ? 'done' : 'off';
    if (!isScheduled(habit, key)) return d ? 'bonus' : 'off';
    return d ? 'done' : key === today ? 'pending' : 'missed';
  }

  // Weekday (0 = Monday) missed most often in the last `days` — only when it clearly stands out:
  // ≥ 5 samples, missed ≥ 35 % of the time and ≥ 20 points worse than the habit's overall miss rate.
  function weakDay(data, habit, today, days = 90) {
    if (habit.freq.kind === 'weekly') return null;
    const n = Array(7).fill(0), miss = Array(7).fill(0);
    for (let i = 1; i <= days; i++) { // from yesterday back: today isn't over
      const k = addDays(today, -i);
      if (!counts(data, habit, k)) continue;
      n[dow(k)]++;
      if (!isDone(data, habit.id, k)) miss[dow(k)]++;
    }
    const total = n.reduce((a, b) => a + b, 0);
    const overall = total ? miss.reduce((a, b) => a + b, 0) / total : 0;
    let worst = null;
    for (let w = 0; w < 7; w++) {
      if (n[w] < 5) continue;
      const rate = miss[w] / n[w];
      if (rate >= 0.35 && rate >= overall + 0.2 && (!worst || rate > worst.rate)) worst = { day: w, rate };
    }
    return worst;
  }

  function validate(o) {
    const isKey = k => typeof k === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(k);
    const int = (x, lo, hi) => Number.isInteger(x) && x >= lo && x <= hi;
    const freqOk = f => !!f && (f.kind === 'daily' || (f.kind === 'weekly' && int(f.times, 1, 7))
      || (f.kind === 'days' && Array.isArray(f.days) && f.days.length > 0 && f.days.every(d => int(d, 0, 6))));
    return !!o && o.version === 1 && Array.isArray(o.habits) && Array.isArray(o.pauses)
      && !!o.log && typeof o.log === 'object' && !Array.isArray(o.log)
      && o.pauses.every(isKey)
      && Object.entries(o.log).every(([k, v]) => isKey(k) && Array.isArray(v))
      && o.habits.every(h => h && typeof h.id === 'string' && typeof h.name === 'string' && isKey(h.created) && freqOk(h.freq));
  }

  let seq = 0;
  const newId = () => Date.now().toString(36) + (seq++).toString(36) + Math.random().toString(36).slice(2, 6);

  function defaultData(today) {
    const h = (name, note = '') => ({ id: newId(), name, note, type: 'check', freq: { kind: 'daily' }, created: today, archived: false });
    return {
      version: 1,
      habits: [h('Morning routine'), h('Evening routine'), h('Creatine', '5 g'), h('Diet'), h('Sleep', '7+ h'), h('Phone off before bed')],
      log: {}, pauses: [], lastExport: null,
    };
  }

  const api = { dayKey, addDays, weekStart, dow, isScheduled, isDone, isPaused, toggle, togglePause, merge, deleteHabit, weekCount, isDue, dayScore, isPerfect, perfectStreak,
    streak, bestStreak, percent, percentBetween, monthStats, achievements, cellStatus, weakDay, validate, newId, defaultData };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.HabitLogic = api;
})(this);
