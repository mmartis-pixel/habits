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

  function toggle(data, id, key) {
    const day = data.log[key] || [];
    data.log[key] = day.includes(id) ? day.filter(x => x !== id) : [...day, id];
    if (!data.log[key].length) delete data.log[key];
  }
  function togglePause(data, key) {
    data.pauses = isPaused(data, key) ? data.pauses.filter(k => k !== key) : [...data.pauses, key];
  }

  // eligible = habit exists that day and day is not paused
  const eligible = (data, habit, key) => key >= habit.created && !isPaused(data, key);

  function weekCount(data, habit, key) {
    const start = weekStart(key);
    let n = 0;
    for (let i = 0; i < 7; i++) if (isDone(data, habit.id, addDays(start, i))) n++;
    return n;
  }

  function isDue(data, habit, key) {
    if (habit.freq.kind === 'daily' || isDone(data, habit.id, key)) return true;
    return weekCount(data, habit, key) < habit.freq.times;
  }

  function dayScore(data, key) {
    const hs = data.habits.filter(h => !h.archived && h.created <= key && isDue(data, h, key));
    return { done: hs.filter(h => isDone(data, h.id, key)).length, total: hs.length };
  }

  function streak(data, habit, today) {
    let n = 0;
    if (habit.freq.kind === 'daily') {
      for (let k = today; k >= habit.created; k = addDays(k, -1)) {
        if (isPaused(data, k)) continue;
        if (isDone(data, habit.id, k)) n++;
        else if (k !== today) break; // unfinished today doesn't break
      }
      return n;
    }
    // weekly: required = min(times, eligible days in that week)
    for (let w = weekStart(today); addDays(w, 6) >= habit.created; w = addDays(w, -7)) {
      let possible = 0, done = 0;
      for (let i = 0; i < 7; i++) {
        const k = addDays(w, i);
        if (!eligible(data, habit, k)) continue;
        possible++;
        if (isDone(data, habit.id, k)) done++;
      }
      const required = Math.min(habit.freq.times, possible);
      if (required === 0) continue;
      if (done >= required) n++;
      else if (w !== weekStart(today)) break; // unfinished current week doesn't break
    }
    return n;
  }

  function percent(data, habit, today, days) {
    let elig = 0, done = 0;
    for (let i = 0; i < days; i++) {
      const k = addDays(today, -i);
      if (!eligible(data, habit, k)) continue;
      const d = isDone(data, habit.id, k);
      if (k === today && !d) continue; // today not over yet
      elig++;
      if (d) done++;
    }
    if (!elig) return null;
    const expected = elig * (habit.freq.kind === 'daily' ? 1 : habit.freq.times / 7);
    return Math.min(100, Math.round(done / expected * 100));
  }

  function validate(o) {
    const isKey = k => typeof k === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(k);
    return !!o && o.version === 1 && Array.isArray(o.habits) && Array.isArray(o.pauses)
      && !!o.log && typeof o.log === 'object' && !Array.isArray(o.log)
      && o.pauses.every(isKey)
      && Object.entries(o.log).every(([k, v]) => isKey(k) && Array.isArray(v))
      && o.habits.every(h => h && typeof h.id === 'string' && typeof h.name === 'string' && isKey(h.created)
        && h.freq && (h.freq.kind === 'daily' || (h.freq.kind === 'weekly' && h.freq.times >= 1 && h.freq.times <= 7)));
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

  const api = { dayKey, addDays, weekStart, isDone, isPaused, toggle, togglePause, weekCount, isDue, dayScore, streak, percent, validate, newId, defaultData };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.HabitLogic = api;
})(this);
