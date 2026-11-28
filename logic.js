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
    // a deleted workout takes its unfinished draft with it (finished history stays)
    if (list === 'templates') g.workouts = g.workouts.filter(w => w.done || w.tpl !== id);
    if (list === 'exercises') for (const t of g.templates) {
      if (t.items.some(i => i.ex === id)) { t.items = t.items.filter(i => i.ex !== id); t.updated = now; }
    }
    (data.deleted = data.deleted || {})[id] = now;
  }

  // ---- training style: the user's own scale from strength to hypertrophy (Balanced = where most people train) ----
  const STYLES = [
    { label: 'Strength', reps: '4–8', rest: '5 min', sets: '3', restMin: 5, setsN: 3 },
    { label: '', reps: '5–9', rest: '4 min', sets: '3', restMin: 4, setsN: 3 },
    { label: 'Balanced', reps: '6–10', rest: '3 min', sets: '2', restMin: 3, setsN: 2 },
    { label: '', reps: '7–11', rest: '2–3 min', sets: '2', restMin: 2.5, setsN: 2 },
    { label: 'Hypertrophy', reps: '8–12', rest: '2–3 min', sets: '1–2', restMin: 2.5, setsN: 2 },
  ];
  const styleOf = data => STYLES[data.gym && Number.isInteger(data.gym.style) ? data.gym.style : 2];
  // per exercise in a workout: working sets 1–8, warm-ups 0–4; older items (no or bad numbers) = 3 / 0
  const count = (x, lo, hi, d) => (Number.isInteger(x) && x >= lo && x <= hi ? x : d);
  const planOf = i => ({ sets: count(i && i.sets, 1, 8, 3), warm: count(i && i.warm, 0, 4, 0) });

  // ---- split helper: proven splits, no AI. Library keys (exercises.js has names and pictures). ----
  // Picked from the user's own list (2026-11-28) and well-known lifts that are easy to learn: machines, cables and
  // dumbbells first; no barbell squat, deadlift, pull-up or barbell row. compound = gets more warm-ups (helperPlan).
  const SPLIT_KEYS = {
    push: { compound: ['machine-chest-press', 'incline-dumbbell-press', 'dumbbell-shoulder-press', 'dips'], isolation: ['lateral-raise', 'pec-deck', 'triceps-pushdown', 'overhead-triceps-extension'] },
    pull: { compound: ['lat-pulldown', 'seated-cable-row', 'one-arm-dumbbell-row', 'wide-grip-cable-row'], isolation: ['reverse-pec-deck', 'preacher-curl', 'bayesian-curl', 'shrug', 'reverse-curl'] },
    legs: { compound: ['hack-squat', 'leg-press', 'romanian-deadlift', 'hip-thrust'], isolation: ['leg-curl', 'leg-extension', 'calf-raise', 'hip-adduction', 'cable-crunch'] },
    upper: { compound: ['machine-chest-press', 'lat-pulldown', 'incline-dumbbell-press', 'seated-cable-row', 'dumbbell-shoulder-press'], isolation: ['lateral-raise', 'triceps-pushdown', 'preacher-curl', 'reverse-pec-deck', 'pec-deck'] },
    lower: { compound: ['hack-squat', 'romanian-deadlift', 'leg-press', 'hip-thrust'], isolation: ['leg-curl', 'leg-extension', 'calf-raise', 'hip-adduction', 'cable-crunch'] },
    full: { compound: ['leg-press', 'machine-chest-press', 'lat-pulldown', 'romanian-deadlift', 'dumbbell-shoulder-press', 'seated-cable-row'], isolation: ['lateral-raise', 'leg-curl', 'triceps-pushdown', 'preacher-curl', 'cable-crunch'] },
    anterior: { compound: ['hack-squat', 'machine-chest-press', 'incline-dumbbell-press', 'dumbbell-shoulder-press', 'leg-press'], isolation: ['leg-extension', 'lateral-raise', 'pec-deck', 'preacher-curl', 'cable-crunch'] },
    posterior: { compound: ['romanian-deadlift', 'lat-pulldown', 'seated-cable-row', 'hip-thrust', 'wide-grip-cable-row'], isolation: ['leg-curl', 'reverse-pec-deck', 'triceps-pushdown', 'calf-raise', 'shrug'] },
    chestback: { compound: ['machine-chest-press', 'lat-pulldown', 'incline-dumbbell-press', 'seated-cable-row', 'dips', 'wide-grip-cable-row'], isolation: ['pec-deck', 'reverse-pec-deck', 'straight-arm-pulldown'] },
    shoulderarms: { compound: ['dumbbell-shoulder-press', 'dips'], isolation: ['lateral-raise', 'preacher-curl', 'triceps-pushdown', 'reverse-pec-deck', 'bayesian-curl', 'overhead-triceps-extension', 'shrug', 'reverse-curl'] },
  };
  // split types to pick from; each lists the workout order for the times a week it supports
  const FB = ['Full body A', 'Full body B'], UL = ['Upper', 'Lower'], PPL = ['Push', 'Pull', 'Legs'], AP = ['Anterior', 'Posterior'], ARN = ['Chest & back', 'Shoulders & arms', 'Legs'];
  const SPLIT_TYPES = {
    fb: { name: 'Full body', seq: { 2: FB, 3: [...FB, FB[0]] } },
    fbeod: { name: 'Full body every other day', seq: { 3: [...FB, FB[0]], 4: [...FB, ...FB] }, days: { 3: [0, 2, 4], 4: [0, 2, 4, 6] } },
    ul: { name: 'Upper / Lower', seq: { 2: UL, 4: [...UL, ...UL] } },
    ppl: { name: 'Push / Pull / Legs', seq: { 3: PPL, 6: [...PPL, ...PPL] } },
    ulppl: { name: 'Upper / Lower + PPL', seq: { 5: [...UL, ...PPL] } },
    ap: { name: 'Anterior / Posterior', seq: { 2: AP, 4: [...AP, ...AP] } },
    arnold: { name: 'Arnold split', seq: { 3: ARN, 6: [...ARN, ...ARN] } },
  };
  const DEFAULT_TYPE = { 2: 'fb', 3: 'ppl', 4: 'ul', 5: 'ulppl', 6: 'ppl' };
  // what the helper offers for each number of sessions a week (at most 3, the usual pick first), with a one-line "about"
  const SPLIT_OPTIONS = { 2: ['fb', 'ul', 'ap'], 3: ['fb', 'ppl', 'arnold'], 4: ['ul', 'ap', 'fbeod'], 5: ['ulppl'], 6: ['ppl', 'arnold'] };
  Object.assign(SPLIT_TYPES.fb, { about: 'The whole body every session. Great for beginners. About 60 min.' });
  Object.assign(SPLIT_TYPES.fbeod, { about: 'The whole body, always a rest day in between. About 60 min.' });
  Object.assign(SPLIT_TYPES.ul, { about: 'Upper: chest, back, shoulders, arms. Lower: legs, glutes, core. About 60 min.' });
  Object.assign(SPLIT_TYPES.ppl, { about: 'Push: chest, shoulders, triceps. Pull: back, biceps. Legs. About 60–75 min.' });
  Object.assign(SPLIT_TYPES.ulppl, { about: 'Upper and lower, then push, pull and legs. About 60 min.' });
  Object.assign(SPLIT_TYPES.ap, { about: 'Front: quads, chest, shoulders, biceps, abs. Back: hamstrings, glutes, back, triceps. About 60 min.' });
  Object.assign(SPLIT_TYPES.arnold, { about: 'Chest and back, shoulders and arms, legs. Longer sessions, about 75 min.' });
  const SPLIT_TYPE = { 'Full body A': 'full', 'Full body B': 'full', Push: 'push', Pull: 'pull', Legs: 'legs', Upper: 'upper', Lower: 'lower',
    Anterior: 'anterior', Posterior: 'posterior', 'Chest & back': 'chestback', 'Shoulders & arms': 'shoulderarms' };
  const PREF_DAYS = { 2: [0, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 3, 4], 6: [0, 1, 2, 3, 4, 5] };
  // the helper decides sets and warm-ups (the user's rule: compound lifts get more warm-ups than isolation)
  function helperPlan(style, compound) {
    if (style <= 1) return compound ? { sets: 3, warm: 3 } : { sets: 2, warm: 1 }; // strength
    return compound ? { sets: 2, warm: 2 } : { sets: 2, warm: 1 };                // balanced / hypertrophy (1–2 working)
  }
  // preferred weekdays; a day off moves to the nearest free unused day (later first). [] = not enough free days
  function pickDays(perWeek, daysOff, pref = PREF_DAYS[perWeek]) {
    const free = [0, 1, 2, 3, 4, 5, 6].filter(d => !daysOff.includes(d)), out = [];
    if (!pref || free.length < perWeek) return [];
    for (const d of pref) {
      if (free.includes(d) && !out.includes(d)) { out.push(d); continue; }
      for (let k = 1; k <= 6; k++) {
        const c = [d + k, d - k].find(x => x >= 0 && x <= 6 && free.includes(x) && !out.includes(x));
        if (c !== undefined) { out.push(c); break; }
      }
    }
    return out.sort((x, y) => x - y);
  }
  // → [{ name, days, style, items: [{ lib, sets, warm }] }]; exercise count from session length and the style's sets × rest.
  // own = the user picks the exercises: empty workouts, no style (My week then asks sets / warm-ups per exercise)
  function suggestSplit({ type, perWeek, daysOff = [], minutes, style = 2, own = false }) {
    const T = SPLIT_TYPES[type || DEFAULT_TYPE[perWeek]], seq = T && T.seq[perWeek];
    const days = seq ? pickDays(perWeek, daysOff, (T.days && T.days[perWeek]) || PREF_DAYS[perWeek]) : [];
    if (days.length !== perWeek || !seq) return [];
    if (own) {
      const out = [];
      seq.forEach((name, i) => { let t = out.find(x => x.name === name); if (!t) out.push(t = { name, days: [], items: [] }); t.days.push(days[i]); });
      return out;
    }
    const st = STYLES[style] || STYLES[2], per = 2 + st.setsN * (st.restMin + 1);
    const n = Math.max(3, Math.min(8, Math.floor((minutes - 5) / per))), out = [];
    seq.forEach((name, i) => {
      let t = out.find(x => x.name === name);
      if (!t) {
        const k = SPLIT_KEYS[SPLIT_TYPE[name]];
        const comp = name === 'Full body B' ? [...k.compound.slice(3), ...k.compound.slice(0, 3)] : k.compound;
        const order = style <= 1 ? [...comp, ...k.isolation] : [...comp.slice(0, 2), ...k.isolation, ...comp.slice(2)];
        t = { name, days: [], style, items: order.slice(0, n).map(lib => ({ lib, ...helperPlan(style, k.compound.includes(lib)) })) };
        out.push(t);
      }
      t.days.push(days[i]);
    });
    return out;
  }
  // replace the split; exercises by library key (names via nameOf), link the Workout habit, keep the chosen style
  function applySplit(data, split, today, now = Date.now(), nameOf = k => k) {
    const g = gymOf(data);
    for (const t of [...g.templates]) deleteGym(data, 'templates', t.id, now);
    for (const t of split) {
      const tpl = { id: newId(), name: t.name, days: [...t.days], updated: now,
        items: t.items.map(i => ({ ex: ensureExercise(data, nameOf(i.lib), now, i.lib), ...planOf(i) })) };
      if (Number.isInteger(t.style)) tpl.style = t.style; // helper workouts keep their style (the hint line)
      g.templates.push(tpl);
    }
    if (Number.isInteger(split.style)) g.style = split.style;
    return { habit: linkWorkoutHabit(data, today, now) };
  }
  // exercise id: library key first, then name (any case); a new name creates the exercise
  function ensureExercise(data, name, now = Date.now(), lib) {
    const g = gymOf(data), n = name.trim();
    let e = (lib && g.exercises.find(x => x.lib === lib)) || g.exercises.find(x => x.name.toLowerCase() === n.toLowerCase());
    if (!e) { e = { id: newId(), name: n, updated: now }; if (lib) e.lib = lib; g.exercises.push(e); }
    else if (lib && !e.lib) { e.lib = lib; e.updated = now; }
    return e.id;
  }
  // my week: one workout per day. '' = rest day; an existing name is assigned (shared exercises);
  // a workout used only on this day is renamed; otherwise a new one copies this day's exercises
  function setDayWorkout(data, day, name, now = Date.now()) {
    const g = gymOf(data), n = (name || '').trim();
    const cur = g.templates.find(t => t.days.includes(day));
    const off = t => { if (t.days.includes(day)) { t.days = t.days.filter(x => x !== day); t.updated = now; } };
    let tpl = null;
    if (!n) g.templates.forEach(off);
    else if ((tpl = g.templates.find(t => t.name.trim().toLowerCase() === n.toLowerCase()))) {
      g.templates.filter(t => t !== tpl).forEach(off);
      if (!tpl.days.includes(day)) { tpl.days = [...tpl.days, day].sort((x, y) => x - y); tpl.updated = now; }
    } else if (cur && cur.days.length === 1) { tpl = cur; tpl.name = n; tpl.updated = now; }
    else {
      if (cur) off(cur);
      tpl = { id: newId(), name: n, days: [day], items: cur ? cur.items.map(i => ({ ex: i.ex, ...planOf(i) })) : [], updated: now };
      g.templates.push(tpl);
    }
    linkWorkoutHabit(data, dayKey(new Date(now)), now); // a new Workout habit starts today
    return tpl;
  }
  // link the Workout habit (linked one → one named "Workout" → new) and give it the days of the whole split.
  // With no planned days it only links an existing habit and leaves its days alone; returns the habit or null.
  function linkWorkoutHabit(data, today, now = Date.now()) {
    const g = gymOf(data), live = h => h && !h.archived;
    const days = [...new Set(g.templates.flatMap(t => t.days))].sort((x, y) => x - y);
    let habit = data.habits.find(h => h.id === g.habitId);
    if (!live(habit)) habit = data.habits.find(h => live(h) && h.name.trim().toLowerCase() === 'workout');
    if (!habit && !days.length) return null;
    if (!habit) {
      habit = { id: newId(), name: 'Workout', note: '', type: 'check', freq: { kind: 'daily' }, created: today, archived: false };
      data.habits.push(habit);
    }
    if (days.length) { habit.freq = days.length === 7 ? { kind: 'daily' } : { kind: 'days', days }; habit.updated = now; }
    g.habitId = habit.id;
    return habit;
  }

  // ---- workouts: one unfinished draft at a time; sets prefilled from the last time ----
  const finishedWorkouts = (g, excludeId) => g.workouts.filter(w => w.done && w.id !== excludeId);
  const newestFirst = (x, y) => (x.day === y.day ? (y.updated || 0) - (x.updated || 0) : x.day < y.day ? 1 : -1);
  const doneKgs = sets => sets.filter(s => s.done && !s.warm && typeof s.kg === 'number').map(s => s.kg); // warm-ups never count
  function todayTemplate(data, day) {
    return gymOf(data).templates.find(t => t.days.includes(dow(day))) || null;
  }
  // the done sets of this exercise in the most recent finished workout (other than excludeId)
  function lastSets(data, exId, excludeId) {
    const w = finishedWorkouts(gymOf(data), excludeId).filter(x => x.items.some(i => i.ex === exId)).sort(newestFirst)[0];
    if (!w) return null;
    return w.items.find(i => i.ex === exId).sets.filter(s => s.done).map(s => {
      const o = typeof s.kg === 'number' ? { kg: s.kg, reps: s.reps } : { reps: s.reps };
      if (s.warm) o.warm = true;
      return o;
    });
  }
  // the n-th row (0-based) of a kind, prefilled from last time's n-th row of that kind; reps 0 = not filled in
  function prefillRow(data, exId, warm, n, excludeId) {
    const last = (lastSets(data, exId, excludeId) || []).filter(s => !!s.warm === warm)[n];
    const row = last ? { ...last, done: false } : { reps: 0, done: false };
    if (warm) row.warm = true;
    return row;
  }
  // warm-up n (0-based) from the top working weight, the user's rule: 50–60% × 8–10, 66–75% × 5–7, 80–90% × 3–5 (4th: 90% × 2)
  const WARM_STEPS = [[0.55, 9], [0.7, 6], [0.85, 4], [0.9, 2]];
  // top weight: the heaviest working kg typed in this workout, else last time's heaviest working set
  function warmRow(data, it, n, excludeId) {
    const kgs = rows => rows.filter(s => !s.warm && typeof s.kg === 'number').map(s => s.kg);
    const now = kgs(it.sets), last = kgs(lastSets(data, it.ex, excludeId) || []), top = Math.max(0, ...(now.length ? now : last));
    const [pct, reps] = WARM_STEPS[Math.min(n, WARM_STEPS.length - 1)], row = { reps, done: false, warm: true };
    if (top) row.kg = Math.round(top * pct / 2.5) * 2.5; // ponytail: plates in 2.5 kg steps; light dumbbells may want 1 kg steps
    return row;
  }
  // a workout exercise starts with one working set; its plan says how many set / warm-up chips it gets.
  // Added mid-workout (no template): 3 sets, 2 warm-ups.
  const workoutItem = (data, exId, plan = { sets: 3, warm: 2 }) => ({ ex: exId, plan, sets: [prefillRow(data, exId, false, 0)] });
  // a chip: give exercise idx n rows of a kind (warm-ups on top, at least 1 working set). Removes only undone rows, from the end.
  function setRowCount(data, w, idx, warm, n, now = Date.now()) {
    const it = w.items[idx];
    if (!it) return;
    const rows = it.sets.filter(s => !!s.warm === warm), other = it.sets.filter(s => !!s.warm !== warm);
    n = Math.max(warm ? 0 : 1, n);
    while (rows.length < n) rows.push(warm ? warmRow(data, it, rows.length, w.id) : prefillRow(data, it.ex, false, rows.length, w.id));
    while (rows.length > n && !rows[rows.length - 1].done) rows.pop();
    it.sets = warm ? [...rows, ...other] : [...other, ...rows];
    w.updated = now;
  }
  function startWorkout(data, day, tplId, now = Date.now()) {
    const g = gymOf(data), draft = g.workouts.find(w => !w.done);
    if (draft) return draft;
    const tpl = g.templates.find(t => t.id === tplId);
    const w = { id: newId(), day, items: tpl ? tpl.items.map(i => workoutItem(data, i.ex, planOf(i))) : [], done: false, updated: now };
    if (tpl) w.tpl = tpl.id;
    g.workouts.push(w);
    return w;
  }
  function bestKg(data, exId, excludeId) {
    let best = null;
    for (const w of finishedWorkouts(gymOf(data), excludeId)) for (const i of w.items) {
      if (i.ex === exId) for (const kg of doneKgs(i.sets)) if (best === null || kg > best) best = kg;
    }
    return best;
  }
  // records = beat a previous best (the very first time is not a record); ticks the linked habit on that day
  function finishWorkout(data, id, now = Date.now()) {
    const g = gymOf(data), w = g.workouts.find(x => x.id === id);
    if (!w) return { records: [] };
    const records = [];
    for (const i of w.items) {
      const kgs = doneKgs(i.sets), prev = bestKg(data, i.ex, id);
      if (kgs.length && prev !== null && Math.max(...kgs) > prev && !records.some(r => r.ex === i.ex)) records.push({ ex: i.ex, kg: Math.max(...kgs) });
    }
    w.done = true;
    w.updated = now;
    if (g.habitId && data.habits.some(h => h.id === g.habitId) && !isDone(data, g.habitId, w.day)) toggle(data, g.habitId, w.day, now);
    return { records };
  }
  // heaviest done kg per finished workout, oldest first (bodyweight-only workouts are skipped)
  function exerciseHistory(data, exId) {
    return finishedWorkouts(gymOf(data))
      .map(w => { const kgs = doneKgs(w.items.filter(i => i.ex === exId).flatMap(i => i.sets)); return kgs.length ? { day: w.day, kg: Math.max(...kgs) } : null; })
      .filter(Boolean).sort((x, y) => (x.day < y.day ? -1 : x.day > y.day ? 1 : 0));
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
          && w.items.every(i => i && Array.isArray(i.sets) && i.sets.every(s => s && int(s.reps, 0, 10000) && kgOk(s.kg) && (s.warm === undefined || typeof s.warm === 'boolean'))))
        && (g.style === undefined || int(g.style, 0, 4));
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

  const api = { gymOf, mergeGym, deleteGym, STYLES, styleOf, SPLIT_KEYS, suggestSplit, applySplit, ensureExercise, setDayWorkout, linkWorkoutHabit, todayTemplate, lastSets, planOf, helperPlan, SPLIT_TYPES, SPLIT_OPTIONS, DEFAULT_TYPE, workoutItem, setRowCount, startWorkout, bestKg, finishWorkout, exerciseHistory, reminderText, reminderPlan, REMIND_HOURS, dayKey, addDays, weekStart, dow, isScheduled, isDone, isPaused, toggle, togglePause, merge, deleteHabit, weekCount, isDue, dayScore, isPerfect, perfectStreak,
    streak, bestStreak, percent, percentBetween, monthStats, cellStatus, weakDay, validate, newId, defaultData };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.HabitLogic = api;
})(this);
