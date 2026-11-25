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
    if (a.gym || b.gym) out.gym = mergeGym(a, b, deleted, out.habits);
    return out;
  }

  // ---- gym (optional data.gym): exercises, templates (the split), workouts. Items carry id + updated. ----
  const GYM_LISTS = ['exercises', 'templates', 'workouts'];
  function gymOf(data) {
    const g = data.gym = data.gym || {};
    for (const k of GYM_LISTS) g[k] = g[k] || [];
    return g;
  }
  // per list: union by id, newer `updated` wins, deleted ids stay deleted
  function mergeGym(a, b, deleted = {}, habits = []) {
    const ga = a.gym || {}, gb = b.gym || {}, out = {};
    for (const k of GYM_LISTS) {
      const byId = new Map();
      for (const x of [...(ga[k] || []), ...(gb[k] || [])]) {
        if (deleted[x.id]) continue;
        const cur = byId.get(x.id);
        if (!cur || (x.updated || 0) > (cur.updated || 0)) byId.set(x.id, x);
      }
      out[k] = [...byId.values()].map(x => JSON.parse(JSON.stringify(x)));
    }
    const has = id => id && habits.some(h => h.id === id);
    const habitId = has(ga.habitId) ? ga.habitId : gb.habitId || ga.habitId;
    if (habitId) out.habitId = habitId;
    return out;
  }
  // remove + tombstone; a deleted exercise leaves the templates, past workouts keep their sets
  function deleteGym(data, list, id, now = Date.now()) {
    const g = gymOf(data);
    g[list] = g[list].filter(x => x.id !== id);
    if (list === 'exercises') for (const t of g.templates) {
      if (t.items.some(i => i.ex === id)) { t.items = t.items.filter(i => i.ex !== id); t.updated = now; }
    }
    (data.deleted = data.deleted || {})[id] = now;
  }

  // ---- split helper: proven splits by training days, no AI. Compound lifts first in every list. ----
  const GYM_LIBRARY = {
    push: ['Bench press', 'Overhead press', 'Incline dumbbell press', 'Dips', 'Lateral raise', 'Triceps pushdown', 'Cable fly'],
    pull: ['Deadlift', 'Pull-up', 'Barbell row', 'Lat pulldown', 'Seated cable row', 'Face pull', 'Biceps curl'],
    legs: ['Squat', 'Romanian deadlift', 'Leg press', 'Walking lunge', 'Leg curl', 'Leg extension', 'Calf raise'],
    upper: ['Bench press', 'Barbell row', 'Overhead press', 'Pull-up', 'Incline dumbbell press', 'Lateral raise', 'Biceps curl'],
    lower: ['Squat', 'Romanian deadlift', 'Leg press', 'Leg curl', 'Walking lunge', 'Leg extension', 'Calf raise'],
    full: ['Squat', 'Bench press', 'Barbell row', 'Overhead press', 'Romanian deadlift', 'Pull-up', 'Plank'],
  };
  const SPLITS = { 2: ['Full body A', 'Full body B'], 3: ['Push', 'Pull', 'Legs'], 4: ['Upper', 'Lower', 'Upper', 'Lower'],
    5: ['Push', 'Pull', 'Legs', 'Upper', 'Lower'], 6: ['Push', 'Pull', 'Legs', 'Push', 'Pull', 'Legs'] };
  const SPLIT_LIB = { 'Full body A': ['full', 0], 'Full body B': ['full', 3], Push: ['push', 0], Pull: ['pull', 0], Legs: ['legs', 0], Upper: ['upper', 0], Lower: ['lower', 0] };
  // days: weekdays 0..6 (2–6 of them) → [{ name, days, items: [{ name, sets, reps }] }]; same name = one template on several days
  function suggestSplit({ days, minutes, goal }) {
    const ds = [...days].sort((x, y) => x - y), seq = SPLITS[ds.length] || [];
    const n = { 45: 4, 60: 5, 90: 7 }[minutes] || 5, out = [];
    seq.forEach((name, i) => {
      let t = out.find(x => x.name === name);
      if (!t) {
        const [lib, start] = SPLIT_LIB[name], list = GYM_LIBRARY[lib];
        t = { name, days: [], items: Array.from({ length: n }, (_, j) => {
          const heavy = goal === 'strength' && j < 2;
          return { name: list[(start + j) % list.length], sets: heavy ? 4 : 3, reps: heavy ? '4-6' : goal === 'strength' ? '8-10' : '8-12' };
        }) };
        out.push(t);
      }
      t.days.push(ds[i]);
    });
    return out;
  }
  // replace the split, reuse exercises by name, link (or create) the Workout habit and give it the split's days
  function applySplit(data, split, today, now = Date.now()) {
    const g = gymOf(data);
    const exId = name => {
      let e = g.exercises.find(x => x.name.toLowerCase() === name.toLowerCase());
      if (!e) { e = { id: newId(), name, updated: now }; g.exercises.push(e); }
      return e.id;
    };
    for (const t of [...g.templates]) deleteGym(data, 'templates', t.id, now);
    for (const t of split) g.templates.push({ id: newId(), name: t.name, days: [...t.days],
      items: t.items.map(i => ({ ex: exId(i.name), sets: i.sets, reps: i.reps })), updated: now });
    const live = h => h && !h.archived;
    let habit = data.habits.find(h => h.id === g.habitId);
    if (!live(habit)) habit = data.habits.find(h => live(h) && h.name.trim().toLowerCase() === 'workout');
    if (!habit) {
      habit = { id: newId(), name: 'Workout', note: '', type: 'check', freq: { kind: 'daily' }, created: today, archived: false };
      data.habits.push(habit);
    }
    const days = [...new Set(split.flatMap(t => t.days))].sort((x, y) => x - y);
    habit.freq = days.length === 7 ? { kind: 'daily' } : { kind: 'days', days };
    habit.updated = now;
    g.habitId = habit.id;
    return { habit };
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
      && o.habits.every(h => h && typeof h.id === 'string' && typeof h.name === 'string' && isKey(h.created) && freqOk(h.freq))
      && gymOk(o.gym);
    function gymOk(g) {
      if (g === undefined) return true;
      if (!g || typeof g !== 'object') return false;
      const list = k => g[k] === undefined || Array.isArray(g[k]);
      const kgOk = kg => kg === undefined || (typeof kg === 'number' && isFinite(kg) && kg >= 0);
      return GYM_LISTS.every(list)
        && (g.exercises || []).every(e => e && typeof e.id === 'string' && typeof e.name === 'string')
        && (g.templates || []).every(t => t && typeof t.id === 'string' && typeof t.name === 'string'
          && Array.isArray(t.days) && t.days.every(d => int(d, 0, 6)) && Array.isArray(t.items))
        && (g.workouts || []).every(w => w && typeof w.id === 'string' && isKey(w.day) && typeof w.done === 'boolean' && Array.isArray(w.items)
          && w.items.every(i => i && Array.isArray(i.sets) && i.sets.every(s => s && int(s.reps, 0, 10000) && kgOk(s.kg))));
    }
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

  // ---- reminders: one text per slot (9:00 plan, 18:00 what's left, 21:00 last call) ----
  // skip = nothing worth a reminder (no habits, paused, nothing due, day complete); the service worker still shows the text
  const REMIND_HOURS = [9, 18, 21];
  function reminderText(data, at) {
    const t = dayKey(at), hour = at.getHours();
    if (!data || !data.habits.length) return { title: 'OLYX', body: 'Time for a quick check-in.', skip: true };
    const s = dayScore(data, t), ps = perfectStreak(data, t);
    if (isPaused(data, t) || !s.total) return { title: 'OLYX', body: 'Nothing planned today. Enjoy the rest.', skip: true };
    if (s.done === s.total) return { title: 'Day complete', body: ps > 1 ? `Perfect day locked in — ${ps} in a row.` : 'Everything done today. Nice work.', skip: true };
    const left = data.habits.filter(h => !h.archived && h.created <= t && isDue(data, h, t) && !isDone(data, h.id, t)).map(h => h.name);
    const n = left.length, names = left.slice(0, 3).join(', ') + (n > 3 ? ` +${n - 3}` : '');
    const plural = n === 1 ? '' : 's';
    if (hour < 12) return { title: s.done ? `${n} to go today` : `Today: ${n} habit${plural}`, body: (ps ? `${ps}-day streak. ` : '') + names, skip: false };
    if (hour < 20) return { title: `${n} habit${plural} left today`, body: names, skip: false };
    return { title: ps ? `Keep your ${ps}-day streak alive` : 'Last call for today', body: `Still open: ${names}`, skip: false };
  }
  // the Android app's schedule: every slot after `now` for `days` days, id = stable slot number 1..days*3
  function reminderPlan(data, now, days = 7) {
    const out = [], [y, m, d] = dayKey(now).split('-').map(Number);
    for (let i = 0; i < days; i++) REMIND_HOURS.forEach((hour, j) => {
      const at = new Date(y, m - 1, d + i, hour);
      if (at <= now) return;
      const r = reminderText(data, at);
      if (!r.skip) out.push({ id: i * REMIND_HOURS.length + j + 1, at, title: r.title, body: r.body });
    });
    return out;
  }

  const api = { gymOf, mergeGym, deleteGym, GYM_LIBRARY, suggestSplit, applySplit, reminderText, reminderPlan, REMIND_HOURS, dayKey, addDays, weekStart, dow, isScheduled, isDone, isPaused, toggle, togglePause, merge, deleteHabit, weekCount, isDue, dayScore, isPerfect, perfectStreak,
    streak, bestStreak, percent, percentBetween, monthStats, cellStatus, weakDay, validate, newId, defaultData };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.HabitLogic = api;
})(this);
