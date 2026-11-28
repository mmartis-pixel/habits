// OLYX exercise library: names, groups, worked muscles, and 3 movement steps (pictures + one-line captions).
// Pictures: our own mannequin drawn from joint angles. Muscle map polygons: body-highlighter 3.0.2.
//
// body-highlighter — MIT License — Copyright (c) 2020 GV79
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright
// notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
// WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
(function (root) {
  'use strict';
  // muscle polygons, viewBox 0 0 100 220 (front + back); names match muscles[] below
  const POLY = {"front":[["CHEST",["51.8 41.6 51.0 55.1 58.0 58.0 67.8 55.5 70.6 47.3 62.0 41.6","29.8 46.5 31.4 55.5 40.8 58.0 48.2 55.1 47.8 42.0 37.6 42.0"]],["OBLIQUES",["68.6 63.3 67.3 57.1 58.8 59.6 60.0 64.1 60.4 83.3 65.7 78.8 66.5 69.8","33.9 78.4 33.1 71.8 31.0 63.3 32.2 57.1 40.8 59.2 39.2 63.3 39.2 83.7"]],["ABS",["56.3 59.2 58.0 64.1 58.4 78.0 58.4 92.7 56.3 98.4 55.1 104.1 51.4 107.8 51.0 84.5 50.6 67.3 51.0 57.1","43.7 58.8 48.6 57.1 49.0 67.3 48.6 84.5 48.2 107.3 44.5 103.7 40.8 91.4 40.8 78.4 41.2 64.5"]],["BICEPS",["16.7 68.2 18.0 71.4 22.9 66.1 29.0 53.9 27.8 49.4 20.4 55.9","71.4 49.4 70.2 54.7 76.3 66.1 81.6 71.8 82.9 69.0 78.8 55.5"]],["TRICEPS",["69.4 55.5 69.4 61.6 75.9 72.7 77.6 70.2 75.5 67.3","22.4 69.4 29.8 55.5 29.8 60.8 22.9 73.1"]],["NECK",["55.5 23.7 50.6 33.5 50.6 39.2 61.6 40.0 70.6 44.9 69.4 36.7 63.3 35.1 58.4 30.6","29.0 44.9 30.2 37.1 36.3 35.1 41.2 30.2 44.5 24.5 49.0 33.9 48.6 39.2 38.0 39.6"]],["FRONT_DELTOIDS",["78.4 53.1 79.6 47.8 79.2 41.2 75.9 38.0 71.0 36.3 72.2 42.9 71.4 47.3","28.2 47.3 21.2 53.1 20.0 47.8 20.4 40.8 24.5 37.1 28.6 37.1 26.9 43.3"]],["HEAD",["42.4 2.9 40.0 11.8 42.0 19.6 46.1 23.3 49.8 25.3 54.7 22.4 57.6 19.2 59.2 10.2 57.1 2.4 49.8 0.0"]],["ADDUCTORS",["52.7 110.2 54.3 124.9 60.0 110.2 62.0 100.0 64.9 94.3 60.0 92.7 56.7 104.5","47.8 110.6 44.9 125.3 42.0 115.9 40.4 113.1 39.6 107.3 38.0 102.4 34.7 93.9 39.6 92.2 41.6 99.2 43.7 105.3"]],["QUADRICEPS",["34.7 98.8 37.1 108.2 37.1 127.8 34.3 137.1 31.0 132.7 29.4 120.0 28.2 111.4 29.4 100.8 32.2 94.7","63.3 105.7 64.5 100.0 66.9 94.7 70.2 101.2 71.0 111.8 68.2 133.1 65.3 137.6 62.4 128.6 62.0 111.4","38.8 129.4 38.4 112.2 41.2 118.4 44.5 129.4 42.9 135.1 40.0 146.1 36.3 146.5 35.5 140.0","59.6 145.7 55.5 129.0 60.8 113.9 61.2 130.2 64.1 139.6 62.9 146.5","32.7 138.4 26.5 145.7 25.7 136.7 25.7 127.3 26.9 114.3 29.4 133.5","71.8 113.1 73.9 124.1 73.9 140.4 72.7 145.7 66.5 138.4 70.2 133.5"]],["KNEES",["33.9 140.0 34.7 143.3 35.5 147.3 36.3 151.0 35.1 156.7 29.8 156.7 27.3 152.7 27.3 147.3 30.2 144.1","65.7 140.0 72.2 147.8 72.2 152.2 69.8 157.1 64.9 156.7 62.9 151.0"]],["CALVES",["71.4 160.4 73.5 153.5 76.7 161.2 79.6 167.8 78.4 187.8 79.6 195.5 74.7 195.5","24.9 194.7 27.8 164.9 28.2 160.4 26.1 154.3 24.9 157.6 22.4 161.6 20.8 167.8 22.0 188.2 20.8 195.5","72.7 195.1 69.8 159.2 65.3 158.4 64.1 162.4 64.1 165.3 65.7 177.1","35.5 158.4 35.9 162.4 35.9 166.9 35.1 172.2 35.1 176.7 32.2 182.0 30.6 187.3 26.9 194.7 27.3 187.8 28.2 180.4 28.6 175.5 29.0 169.8 29.8 164.1 30.2 158.8"]],["FOREARM",["6.1 88.6 10.2 75.1 14.7 70.2 16.3 74.3 19.2 73.5 4.5 97.6 0.0 100.0","84.5 69.8 83.3 73.5 80.0 73.1 95.1 98.4 100.0 100.4 93.5 89.4 89.8 76.3","77.6 72.2 77.6 77.6 80.4 84.1 85.3 89.8 92.2 101.2 94.7 99.6","6.9 101.2 13.5 90.6 18.8 84.1 21.6 77.1 21.2 71.8 4.9 98.8"]]],"back":[["HEAD",["50.6 0.0 46.0 0.9 40.9 5.5 40.4 12.8 45.1 20.0 55.7 20.0 59.1 13.6 59.6 4.7 55.7 1.3"]],["TRAPEZIUS",["44.7 21.7 47.7 21.7 47.2 38.3 47.7 64.7 38.3 53.2 35.3 40.9 31.1 36.6 39.1 33.2 43.8 27.2","52.3 21.7 55.7 21.7 56.6 27.2 60.9 32.8 68.9 36.6 64.7 40.4 61.7 53.2 52.3 64.7 53.2 38.3"]],["BACK_DELTOIDS",["29.4 37.0 23.0 39.1 17.4 44.3 18.3 53.6 24.3 49.4 27.2 46.4","71.1 37.0 78.3 39.6 82.6 44.7 81.7 53.6 74.9 48.9 72.3 45.1"]],["UPPER_BACK",["31.1 38.7 28.1 48.9 28.5 55.3 34.0 75.3 47.2 71.1 47.2 66.4 36.6 54.0 33.6 41.3","68.9 38.7 71.9 49.4 71.5 56.2 66.0 75.3 52.8 71.1 52.8 66.4 63.4 54.5 66.4 41.7"]],["TRICEPS",["26.8 49.8 17.9 55.7 14.5 72.3 16.6 81.7 21.7 63.8 26.8 55.7","73.6 50.2 82.1 55.7 86.0 73.2 83.4 82.1 77.9 63.0 73.2 55.7","26.8 58.3 26.8 68.5 23.0 75.3 19.1 77.4 22.6 65.5","72.8 58.3 77.0 64.7 80.4 77.4 76.6 75.3 72.8 68.9"]],["LOWER_BACK",["47.7 72.8 34.5 77.0 35.3 83.4 49.4 102.1 46.8 83.0","52.3 72.8 65.5 77.0 64.7 83.4 50.6 102.1 53.2 83.8"]],["FOREARM",["86.4 75.7 91.1 83.4 93.2 94.0 100.0 106.4 96.2 104.3 88.1 89.4 84.3 83.8","13.6 75.7 8.9 83.8 6.8 93.6 0.0 106.4 3.8 104.3 12.3 88.5 15.7 83.0","81.3 79.6 77.4 77.9 79.1 84.7 91.1 103.8 93.2 108.9 94.5 104.7","18.7 79.6 22.1 77.9 20.9 84.3 9.4 103.0 6.8 108.5 5.1 104.7"]],["GLUTEAL",["44.7 99.6 30.2 108.5 29.8 118.7 31.5 126.0 47.2 121.3 49.4 114.9","55.3 99.1 51.1 114.5 52.3 120.9 68.1 126.0 69.8 119.1 69.4 108.5"]],["ADDUCTORS",["48.1 123.0 44.7 123.0 41.3 125.5 45.1 144.3 48.5 135.7 48.9 129.4","51.9 122.6 55.7 123.4 59.1 126.0 54.9 144.3 51.9 136.2 51.1 129.4"]],["HAMSTRING",["28.9 122.1 31.1 129.4 36.6 126.0 35.3 135.3 34.5 150.2 29.4 158.3 28.9 146.8 27.7 141.3 27.2 131.5","71.5 121.7 69.4 128.9 63.8 126.0 65.5 136.6 66.4 150.2 71.1 158.3 71.5 147.7 72.8 142.1 73.6 131.9","38.7 125.5 44.3 146.0 40.4 166.8 36.2 152.8 37.0 135.3","61.7 125.5 63.4 136.2 64.3 153.2 60.0 166.8 56.2 146.4"]],["KNEES",["34.5 153.2 31.1 159.1 33.6 166.4 37.4 162.6","66.4 153.6 63.0 163.0 66.8 166.4 69.4 159.1"]],["CALVES",["29.4 160.4 28.5 167.2 24.7 179.6 23.8 192.8 25.5 197.0 28.5 193.2 29.8 180.0 31.9 171.1 31.9 166.8","37.4 165.1 35.3 167.7 33.2 171.9 31.1 180.4 30.2 191.9 34.0 200.0 38.7 190.6 39.1 168.9","63.0 165.1 61.3 168.5 61.7 190.6 66.4 199.6 70.6 191.9 68.9 179.6 66.8 170.2","70.6 160.4 72.3 168.5 75.7 179.1 76.6 192.8 74.5 196.6 72.3 193.6 70.6 179.6 68.1 168.1"]],["CALVES",["28.5 195.7 30.2 195.7 33.6 201.7 30.6 220.0 28.5 213.6 26.8 198.3"]],["CALVES",["69.8 195.7 71.9 195.7 73.6 198.3 71.9 213.2 70.2 219.6 67.2 202.1"]]]};

  // ---- drawing: front/back muscle map (polygons above) and a side/front-view mannequin ----
  const C = { main: '#E24B4A', help: '#F09595', base: '#3a3f4a', body: '#e8eaed', edge: '#0f1115', gear: '#5b6270', arrow: '#5DCAA5' };
  function muscleMapSvg(main = [], help = []) {
    const fill = m => (main.includes(m) ? C.main : help.includes(m) ? C.help : C.base);
    const view = (v, label) => `<svg viewBox="0 0 100 220" class="mmap" role="img" aria-label="${label}">${POLY[v].map(([m, pts]) =>
      pts.map(p => `<polygon points="${p}" fill="${fill(m)}"/>`).join('')).join('')}</svg>`;
    return view('front', 'Front view, worked muscles in red') + view('back', 'Back view, worked muscles in red');
  }

  // mannequin from joint angles (degrees: 0 = right, 90 = up). Limb lengths stay the same in every picture.
  // anchor: ankle (standing) or hip. thigh = hip→knee, shin = knee→ankle, torso = hip→shoulder, arm = shoulder→elbow, fore = elbow→hand.
  // front: both arms/legs drawn from shoulders/hips spread sideways. *2 = second limb (side view: behind).
  const LEN = { thigh: 25, shin: 25, foot: 11, torso: 38, arm: 17, fore: 15, neck: 13 };
  const go = (p, d, l) => [p[0] + l * Math.cos(d * Math.PI / 180), p[1] - l * Math.sin(d * Math.PI / 180)];
  const P = pts => pts.map(q => q.map(n => Math.round(n * 10) / 10).join(',')).join(' ');
  function fig(f) {
    const L = { ...LEN, ...(f.len || {}) }, hi = f.hi || {}, c = k => hi[k] || 'body';
    let hip = f.hip, knee, ankle;
    if (f.ankle) { ankle = f.ankle; knee = go(ankle, f.shin + 180, L.shin); hip = go(knee, f.thigh + 180, L.thigh); }
    else { knee = go(hip, f.thigh, L.thigh); ankle = go(knee, f.shin, L.shin); }
    const sh = go(hip, f.torso, L.torso), side = d => go([0, 0], f.torso - 90, d);
    const sR = f.front ? [sh[0] + side(11)[0], sh[1] + side(11)[1]] : sh, sL = f.front ? [sh[0] - side(11)[0], sh[1] - side(11)[1]] : sh;
    const hR = f.front ? [hip[0] + side(6)[0], hip[1] + side(6)[1]] : hip, hL = f.front ? [hip[0] - side(6)[0], hip[1] - side(6)[1]] : hip;
    const J = { hip, sh, head: go(sh, f.torso + (f.tilt || 0), L.neck) };
    const parts = [], leg = (h, th, sn, ft, k2) => {
      const kn = k2 ? go(h, th, L.thigh) : (f.front ? go(h, th, L.thigh) : knee), an = k2 || f.front ? go(kn, sn, L.shin) : ankle;
      const to = go(an, ft ?? 0, L.foot);
      parts.push({ p: P([an, to]), w: 6, c: c('foot') }, { p: P([an, kn]), w: 9, c: c('shin') }, { p: P([kn, h]), w: 12, c: c('thigh') });
      return { kn, an, to };
    };
    const armOf = (s, a, fo) => { const el = go(s, a, L.arm), hand = go(el, fo, L.fore); return { el, hand, p: P([s, el, hand]) }; };
    if (f.thigh2 !== undefined) Object.assign(J, { leg2: leg(f.front ? hL : hip, f.thigh2, f.shin2, f.foot2, true) });
    let a2;
    if (f.arm2 !== undefined) { a2 = armOf(f.front ? sL : sh, f.arm2, f.fore2); J.hand2 = a2.hand; J.el2 = a2.el; }
    if (a2 && !f.front) parts.push({ p: a2.p, w: 7.5, c: c('arm') });
    const l1 = leg(f.front ? hR : hip, f.thigh, f.shin, f.foot);
    Object.assign(J, { knee: l1.kn, ankle: l1.an, toe: l1.to });
    parts.push({ p: P([hip, sh]), w: 17, c: c('torso') });
    if (a2 && f.front) parts.push({ p: a2.p, w: 7.5, c: c('arm') });
    const a1 = armOf(f.front ? sR : sh, f.arm, f.fore);
    Object.assign(J, { el: a1.el, hand: a1.hand });
    parts.push({ p: a1.p, w: 7.5, c: c('arm') });
    const r = n => Math.round(n * 10) / 10;
    return { head: J.head.map(r), parts, gear: f.gear ? f.gear(J) : [], arrow: f.arrow ? f.arrow(J) : undefined };
  }
  // small helpers for gear and arrows
  const R1 = n => Math.round(n * 10) / 10;
  const plate = (p, r = 12, dy = 0) => ({ circle: [R1(p[0]), R1(p[1] + dy), r], w: 5 });
  const bell = p => ({ circle: [R1(p[0]), R1(p[1]), 4], w: 3 });
  const ln = (a, b, w = 2) => ({ line: P([a, b]), w });
  const arr = (x1, y1, x2, y2) => {
    const a = Math.atan2(y2 - y1, x2 - x1), h = (d) => `${R1(x2 - 6 * Math.cos(a + d))} ${R1(y2 - 6 * Math.sin(a + d))}`;
    return `M${x1} ${y1} L${x2} ${y2} M${h(0.5)} L${x2} ${y2} L${h(-0.5)}`;
  };
  const STAND = { ankle: [60, 130], shin: 270, thigh: 270, foot: 0, torso: 92 };
  const st = o => fig({ ...STAND, ...o });

  // ---- the library: 3 steps each (or `like` another entry's steps) ----
  const BENCH = [ln([18, 107], [90, 107], 6), ln([28, 110], [28, 133], 4), ln([82, 110], [82, 133], 4)];
  const lying = o => fig({ hip: [72, 101], torso: 180, thigh: 20, shin: 285, foot: 0, len: { shin: 32 }, ...o, gear: J => [...BENCH, ...(o.gear ? o.gear(J) : [])] });
  const bentOver = o => fig({ ankle: [60, 130], shin: 260, thigh: 305, foot: 0, torso: 25, ...o });
  const hang = o => fig({ hip: [60, 76], torso: 90, thigh: 270, shin: 270, foot: 300, ...o });
  const FRONT = { front: true, hip: [60, 82], torso: 90, thigh: 275, shin: 270, foot: 0, thigh2: 265, shin2: 270, foot2: 180 };
  const fr = o => fig({ ...FRONT, ...o });

  // v3 helpers: seated machine, and one-number pose makers for the new entries
  const SEAT = [{ rect: [26, 102, 34, 6] }, { rect: [24, 56, 6, 46] }];
  const seat = o => fig({ hip: [40, 100], torso: 95, thigh: 0, shin: 270, foot: 0, ...o, gear: J => [...SEAT, ...(o.gear ? o.gear(J) : [])] });
  const S = (cap, pose) => ({ cap, pose });
  const hyper = t => fig({ hip: [62, 78], thigh: 225, shin: 225, foot: 315, torso: t, arm: t + 200, fore: t + 20, hi: { torso: 'main', thigh: 'help' },
    gear: () => [ln([62, 89], [73, 78], 6), ln([20, 108], [32, 120], 5), ln([66, 86], [50, 133], 3), ln([26, 116], [34, 133], 3)] });
  const prone = (t, th, a) => fig({ hip: [60, 124], torso: 180 - t, thigh: th, shin: th, foot: 330 + th, arm: 180 - a, fore: 180 - a, hi: { torso: 'main', thigh: 'help' } });
  const PREACH = J => [ln(go(J.sh, 225, 7), go(J.el, 225, 7), 5), bell(J.hand)];
  const wrist = a => fig({ hip: [40, 100], torso: 50, thigh: 0, shin: 270, foot: 0, arm: 270, fore: 0, hi: { arm: 'main' },
    gear: J => [{ rect: [26, 102, 34, 6] }, ln(J.hand, go(J.hand, a, 4), 3), bell(go(J.hand, a, 6))] });
  const walk = (a, b) => fig({ hip: [60, 80], torso: 90, thigh: a, shin: a - 5, foot: 0, thigh2: b, shin2: b + 5, foot2: 0, arm: 270, fore: 270, hi: { arm: 'main', torso: 'help' }, gear: J => [bell(J.hand)] });
  const BAR = () => [ln([22, 8], [98, 8], 4)];
  const deadHang = y => hang({ front: true, hip: [60, y], thigh2: 268, shin2: 270, foot2: 240, foot: 300, arm: 65, fore: 75, arm2: 115, fore2: 105, hi: { arm: 'main', torso: 'help' }, gear: BAR });
  const goblet = o => fig({ ankle: [60, 130], foot: 0, arm: 250, fore: 80, hi: { thigh: 'main', torso: 'help' }, gear: J => [bell(J.hand)], ...o });
  const sCurl = s => fig({ hip: [40, 96], torso: 95, thigh: 0, shin: s, foot: s + 90, arm: 300, fore: 290, hi: { thigh: 'main', shin: 'help' },
    gear: J => [{ rect: [26, 98, 42, 6] }, { rect: [24, 60, 6, 40] }, { rect: [51, 86, 18, 4] }, { circle: [R1(J.ankle[0]), R1(J.ankle[1] + 6), 5], w: 3 }] });
  const nordic = (th, t) => fig({ ankle: [34, 127], shin: 180, thigh: th, foot: 200, torso: t, arm: t - 150, fore: t - 60, hi: { thigh: 'main', shin: 'help' }, gear: () => [{ circle: [34, 120, 5], w: 3 }] });
  const bridge = (th, t) => fig({ ankle: [86, 130], shin: 292, thigh: th, foot: 0, torso: t, arm: 355, fore: 0, hi: { thigh: 'main', shin: 'help' } });
  const kick = a => st({ torso: 78, thigh2: a, shin2: a, foot2: 0, arm: 330, fore: 10, hi: { thigh: 'main' }, gear: J => [ln([100, 20], [100, 133], 4), ln(J.leg2.an, [8, 128])] });
  const stepUp = (sn, th, t, th2, sn2) => fig({ ankle: [76, 109], shin: sn, thigh: th, foot: 0, torso: t, thigh2: th2, shin2: sn2, foot2: 0, arm: 270, fore: 270, hi: { thigh: 'main' },
    gear: J => [{ rect: [64, 112, 40, 21] }, bell(J.hand)] });
  const abd = a => fr({ hip: [60, 96], len: { thigh: 14 }, thigh: 270 + a, shin: 270, thigh2: 270 - a, shin2: 270, arm: 285, fore: 290, arm2: 255, fore2: 250, hi: { thigh: 'main' },
    gear: J => [{ rect: [36, 98, 48, 6] }, { circle: [R1(J.knee[0] + 5), R1(J.knee[1]), 4], w: 3 }, { circle: [R1(J.leg2.kn[0] - 5), R1(J.leg2.kn[1]), 4], w: 3 }] });
  const sCalf = (th, f) => fig({ hip: [40, 96], torso: 95, thigh: th, shin: 270, foot: f, arm: 300, fore: 300, hi: { shin: 'main' },
    gear: J => [{ rect: [26, 98, 30, 6] }, { rect: [R1(J.knee[0] - 9), R1(J.knee[1] - 10), 18, 4] }, { rect: [69, 119, 22, 8] }] });
  const lpCalf = f => fig({ hip: [38, 104], torso: 120, thigh: 35, shin: 35, foot: f, arm: 300, fore: 0, hi: { shin: 'main' },
    gear: J => [ln([34, 112], [8, 66], 6), ln(go(J.toe, 125, 10), go(J.toe, 305, 10), 5)] });
  const donkey = (an, f) => fig({ ankle: an, shin: 270, thigh: 270, foot: f, torso: 12, arm: 270, fore: 270, hi: { shin: 'main' }, gear: () => [{ rect: [56, 124, 22, 9] }, { rect: [96, 104, 18, 29] }] });
  const crunch = t => fig({ hip: [60, 124], torso: t, thigh: 50, shin: 300, foot: 0, arm: t - 150, fore: t, hi: { torso: 'main' } });
  const roll = (th, t, a) => fig({ ankle: [14, 127], shin: 180, thigh: th, foot: 180, torso: t, arm: a, fore: a, hi: { torso: 'main', arm: 'help' },
    gear: J => [{ circle: [R1(J.hand[0]), R1(J.hand[1] + 6), 6], w: 3 }] });
  const bug = (th, sn, a) => fig({ hip: [64, 124], torso: 180, thigh: th, shin: sn, foot: sn + 90, thigh2: 90, shin2: 0, foot2: 90, arm: a, fore: a, arm2: 90, fore2: 90, hi: { torso: 'main' } });
  const rev = (hip, t, th, sn) => fig({ hip, torso: t, thigh: th, shin: sn, foot: sn + 90, arm: 355, fore: 0, hi: { torso: 'main', thigh: 'help' } });
  const legRaise = a => fig({ hip: [62, 124], torso: 180, thigh: a, shin: a, foot: a + 90, arm: 355, fore: 0, hi: { torso: 'main', thigh: 'help' } });
  const sidePlank = (hip, t, l) => fr({ hip, torso: t, thigh: l, shin: l, foot: 0, thigh2: l, shin2: l, foot2: 0, arm: 70, fore: 70, arm2: 270, fore2: 180, hi: { torso: 'main' } });
  const chop = (t, a, a2) => fr({ torso: t, arm: a, fore: a, arm2: a2, fore2: a2, hi: { torso: 'main', arm: 'help' }, gear: J => [ln(J.hand, [114, 8])] });
  const bike = (th, sn, th2, sn2) => fig({ hip: [60, 124], torso: 150, thigh: th, shin: sn, foot: sn + 90, thigh2: th2, shin2: sn2, foot2: sn2 + 90, arm: 60, fore: 200, hi: { torso: 'main' } });
  const pallof = (a, f) => st({ arm: a, fore: f, hi: { torso: 'main' }, gear: J => [ln(J.hand, [116, 60]), bell(J.hand)] });

  const LIST = [
    // Chest
    { key: 'bench-press', name: 'Bench press', group: 'Chest', compound: true, muscles: { main: ['CHEST'], help: ['FRONT_DELTOIDS', 'TRICEPS'] }, steps: [
      { cap: 'Eyes under the bar, shoulder blades pulled back', pose: lying({ hi: { torso: 'main', arm: 'help' }, arm: 85, fore: 90, gear: J => [plate(J.hand)] }) },
      { cap: 'Lower slowly, elbows about 45°', pose: lying({ hi: { torso: 'main', arm: 'help' }, arm: 20, fore: 100, gear: J => [plate(J.hand)], arrow: J => arr(66, 66, 66, 80) }) },
      { cap: 'Touch mid-chest, press back up', pose: lying({ hi: { torso: 'main', arm: 'help' }, arm: 330, fore: 110, gear: J => [plate(J.hand)], arrow: J => arr(66, 84, 66, 70) }) } ] },
    { key: 'dumbbell-bench-press', name: 'Dumbbell bench press', group: 'Chest', compound: true, like: 'bench-press', muscles: { main: ['CHEST'], help: ['FRONT_DELTOIDS', 'TRICEPS'] } },
    { key: 'incline-dumbbell-press', name: 'Incline dumbbell press', group: 'Chest', compound: true, like: 'bench-press', muscles: { main: ['CHEST', 'FRONT_DELTOIDS'], help: ['TRICEPS'] },
      caps: ['Bench at about 30°, dumbbells over the chest', 'Lower to the sides of the upper chest', 'Press up and slightly in'] },
    { key: 'push-up', name: 'Push-up', group: 'Chest', compound: true, muscles: { main: ['CHEST'], help: ['FRONT_DELTOIDS', 'TRICEPS', 'ABS'] }, steps: [
      { cap: 'Hands under shoulders, body in one straight line', pose: fig({ hip: [59, 106], torso: 165, thigh: 335, shin: 335, foot: 290, arm: 270, fore: 275, hi: { torso: 'main', arm: 'help' } }) },
      { cap: 'Lower with elbows about 45° from the body', pose: fig({ hip: [59, 111], torso: 168, thigh: 340, shin: 340, foot: 290, arm: 290, fore: 250, hi: { torso: 'main', arm: 'help' }, arrow: () => arr(30, 80, 30, 94) }) },
      { cap: 'Chest near the floor, push back up', pose: fig({ hip: [59, 116], torso: 172, thigh: 345, shin: 345, foot: 290, arm: 300, fore: 220, hi: { torso: 'main', arm: 'help' }, arrow: () => arr(30, 100, 30, 86) }) } ] },
    { key: 'dips', name: 'Dips', group: 'Chest', compound: true, muscles: { main: ['CHEST', 'TRICEPS'], help: ['FRONT_DELTOIDS'] }, steps: [
      { cap: 'Arms straight on the bars, chest up', pose: fig({ hip: [51, 80], torso: 92, thigh: 270, shin: 225, foot: 200, arm: 270, fore: 270, hi: { torso: 'main', arm: 'main' }, gear: J => [ln([34, J.hand[1]], [68, J.hand[1]], 4)] }) },
      { cap: 'Lean slightly forward and lower', pose: fig({ hip: [51, 88], torso: 85, thigh: 270, shin: 225, foot: 200, arm: 230, fore: 300, hi: { torso: 'main', arm: 'main' }, gear: J => [ln([34, J.hand[1]], [68, J.hand[1]], 4)], arrow: () => arr(86, 50, 86, 64) }) },
      { cap: 'Upper arms level with the bars, push up', pose: fig({ hip: [51, 96], torso: 80, thigh: 270, shin: 225, foot: 200, arm: 200, fore: 310, hi: { torso: 'main', arm: 'main' }, gear: J => [ln([34, J.hand[1]], [68, J.hand[1]], 4)], arrow: () => arr(86, 70, 86, 56) }) } ] },
    { key: 'cable-fly', name: 'Cable fly', group: 'Chest', compound: false, muscles: { main: ['CHEST'], help: ['FRONT_DELTOIDS'] }, steps: [
      { cap: 'Arms wide, slight bend in the elbows', pose: fr({ arm: 350, fore: 340, arm2: 190, fore2: 200, hi: { torso: 'main', arm: 'help' }, gear: J => [ln([112, 14], J.hand), ln([8, 14], J.hand2)] }) },
      { cap: 'Hug the air, keep the elbow angle', pose: fr({ arm: 320, fore: 240, arm2: 220, fore2: 300, hi: { torso: 'main', arm: 'help' }, gear: J => [ln([112, 14], J.hand), ln([8, 14], J.hand2)] }) },
      { cap: 'Hands meet in front of the chest', pose: fr({ arm: 260, fore: 225, arm2: 280, fore2: 315, hi: { torso: 'main', arm: 'help' }, gear: J => [ln([112, 14], J.hand), ln([8, 14], J.hand2)] }) } ] },
    // Back
    { key: 'deadlift', name: 'Deadlift', group: 'Back', compound: true, muscles: { main: ['GLUTEAL', 'HAMSTRING', 'LOWER_BACK'], help: ['TRAPEZIUS', 'FOREARM', 'QUADRICEPS'] }, steps: [
      { cap: 'Bar over mid-foot, flat back, grip the bar', pose: fig({ ankle: [60, 130], shin: 250, thigh: 330, foot: 0, torso: 25, arm: 268, fore: 270, hi: { thigh: 'main', torso: 'main', fore: 'help' }, gear: J => [plate(J.hand, 12, 5)] }) },
      { cap: 'Push the floor away, bar close to the legs', pose: fig({ ankle: [60, 130], shin: 265, thigh: 300, foot: 0, torso: 55, arm: 270, fore: 270, hi: { thigh: 'main', torso: 'main', fore: 'help' }, gear: J => [plate(J.hand, 12, 4)], arrow: () => arr(98, 100, 98, 84) }) },
      { cap: 'Stand tall, hips through, no leaning back', pose: st({ arm: 270, fore: 270, hi: { thigh: 'main', torso: 'main', fore: 'help' }, gear: J => [plate(J.hand, 12, 4)] }) } ] },
    { key: 'romanian-deadlift', name: 'Romanian deadlift', group: 'Legs', compound: true, muscles: { main: ['HAMSTRING', 'GLUTEAL'], help: ['LOWER_BACK'] }, steps: [
      { cap: 'Stand tall, soft knees, bar at the thighs', pose: st({ arm: 270, fore: 270, hi: { thigh: 'main', torso: 'help' }, gear: J => [plate(J.hand, 12, 4)] }) },
      { cap: 'Push the hips back, bar slides down the legs', pose: fig({ ankle: [60, 130], shin: 262, thigh: 300, foot: 0, torso: 50, arm: 270, fore: 270, hi: { thigh: 'main', torso: 'help' }, gear: J => [plate(J.hand, 12, 4)], arrow: () => arr(30, 76, 22, 76) }) },
      { cap: 'Stretch at mid-shin, back flat, then stand', pose: fig({ ankle: [60, 130], shin: 262, thigh: 305, foot: 0, torso: 18, arm: 270, fore: 270, hi: { thigh: 'main', torso: 'help' }, gear: J => [plate(J.hand, 12, 4)] }) } ] },
    { key: 'pull-up', name: 'Pull-up', group: 'Back', compound: true, muscles: { main: ['UPPER_BACK'], help: ['BICEPS', 'BACK_DELTOIDS', 'FOREARM'] }, steps: [
      { cap: 'Hang with straight arms, hands wider than shoulders', pose: hang({ front: true, thigh2: 268, shin2: 270, foot2: 240, foot: 300, arm: 65, fore: 75, arm2: 115, fore2: 105, hi: { torso: 'main', arm: 'help' }, gear: () => [ln([22, 8], [98, 8], 4)] }) },
      { cap: 'Pull the elbows down to your sides', pose: hang({ front: true, hip: [60, 61], thigh2: 268, shin2: 270, foot2: 240, foot: 300, arm: 20, fore: 110, arm2: 160, fore2: 70, hi: { torso: 'main', arm: 'help' }, gear: () => [ln([22, 8], [98, 8], 4)], arrow: () => arr(104, 60, 104, 44) }) },
      { cap: 'Chin over the bar, lower under control', pose: hang({ front: true, hip: [60, 52], thigh2: 268, shin2: 270, foot2: 240, foot: 300, arm: 340, fore: 100, arm2: 200, fore2: 80, hi: { torso: 'main', arm: 'help' }, gear: () => [ln([22, 8], [98, 8], 4)] }) } ] },
    { key: 'chin-up', name: 'Chin-up', group: 'Back', compound: true, like: 'pull-up', muscles: { main: ['UPPER_BACK', 'BICEPS'], help: ['FOREARM'] },
      caps: ['Palms facing you, shoulder-width grip', 'Pull until the elbows reach your ribs', 'Chin over the bar, lower slowly'] },
    { key: 'lat-pulldown', name: 'Lat pulldown', group: 'Back', compound: true, muscles: { main: ['UPPER_BACK'], help: ['BICEPS', 'BACK_DELTOIDS'] }, steps: [
      { cap: 'Thighs under the pad, wide grip, arms long', pose: fr({ hip: [60, 92], len: { thigh: 8 }, arm: 60, fore: 75, arm2: 120, fore2: 105, hi: { torso: 'main', arm: 'help' }, gear: J => [ln([16, J.hand[1]], [104, J.hand[1]], 4), ln([60, J.hand[1]], [60, 2]), { rect: [42, 95, 36, 6] }] }) },
      { cap: 'Chest up, pull the bar toward the collarbone', pose: fr({ hip: [60, 92], len: { thigh: 8 }, arm: 15, fore: 100, arm2: 165, fore2: 80, hi: { torso: 'main', arm: 'help' }, gear: J => [ln([16, J.hand[1]], [104, J.hand[1]], 4), ln([60, J.hand[1]], [60, 2]), { rect: [42, 95, 36, 6] }], arrow: () => arr(108, 30, 108, 44) }) },
      { cap: 'Elbows down and back, then let it rise', pose: fr({ hip: [60, 92], len: { thigh: 8 }, arm: 320, fore: 105, arm2: 220, fore2: 75, hi: { torso: 'main', arm: 'help' }, gear: J => [ln([16, J.hand[1]], [104, J.hand[1]], 4), ln([60, J.hand[1]], [60, 2]), { rect: [42, 95, 36, 6] }] }) } ] },
    { key: 'barbell-row', name: 'Barbell row', group: 'Back', compound: true, muscles: { main: ['UPPER_BACK'], help: ['BACK_DELTOIDS', 'BICEPS', 'LOWER_BACK'] }, steps: [
      { cap: 'Hinge forward, flat back, arms hanging', pose: bentOver({ arm: 270, fore: 270, hi: { torso: 'main', arm: 'help' }, gear: J => [plate(J.hand, 12, 3)] }) },
      { cap: 'Pull the bar toward the belly button', pose: bentOver({ arm: 200, fore: 285, hi: { torso: 'main', arm: 'help' }, gear: J => [plate(J.hand, 12, 3)], arrow: () => arr(100, 100, 100, 84) }) },
      { cap: 'Squeeze the shoulder blades, lower slowly', pose: bentOver({ arm: 160, fore: 280, hi: { torso: 'main', arm: 'help' }, gear: J => [plate(J.hand, 12, 3)] }) } ] },
    { key: 'one-arm-dumbbell-row', name: 'One-arm dumbbell row', group: 'Back', compound: true, like: 'barbell-row', muscles: { main: ['UPPER_BACK'], help: ['BICEPS', 'BACK_DELTOIDS'] },
      caps: ['Hand and knee on a bench, back flat', 'Pull the dumbbell to the hip', 'Squeeze, then lower all the way'] },
    { key: 'seated-cable-row', name: 'Seated cable row', group: 'Back', compound: true, muscles: { main: ['UPPER_BACK'], help: ['BICEPS', 'BACK_DELTOIDS'] }, steps: [
      { cap: 'Sit tall, feet on the plate, arms long', pose: fig({ hip: [40, 104], torso: 95, thigh: 5, shin: 350, foot: 90, arm: 345, fore: 350, hi: { torso: 'main', arm: 'help' }, gear: J => [ln(J.hand, [110, 100]), { rect: [26, 106, 30, 6] }, ln([96, 92], [96, 116], 4)] }) },
      { cap: 'Pull the elbows back past the body', pose: fig({ hip: [40, 104], torso: 95, thigh: 5, shin: 350, foot: 90, arm: 300, fore: 10, hi: { torso: 'main', arm: 'help' }, gear: J => [ln(J.hand, [110, 100]), { rect: [26, 106, 30, 6] }, ln([96, 92], [96, 116], 4)], arrow: () => arr(76, 58, 62, 58) }) },
      { cap: 'Handle to the belly, chest up, then reach', pose: fig({ hip: [40, 104], torso: 95, thigh: 5, shin: 350, foot: 90, arm: 250, fore: 5, hi: { torso: 'main', arm: 'help' }, gear: J => [ln(J.hand, [110, 100]), { rect: [26, 106, 30, 6] }, ln([96, 92], [96, 116], 4)] }) } ] },
    { key: 'face-pull', name: 'Face pull', group: 'Shoulders', compound: false, muscles: { main: ['BACK_DELTOIDS'], help: ['TRAPEZIUS', 'UPPER_BACK'] }, steps: [
      { cap: 'Rope at face height, arms reaching forward', pose: st({ torso: 95, arm: 10, fore: 10, hi: { arm: 'main', torso: 'help' }, gear: J => [ln(J.hand, [112, 30])] }) },
      { cap: 'Pull toward the face, elbows high', pose: st({ torso: 95, arm: 60, fore: 340, hi: { arm: 'main', torso: 'help' }, gear: J => [ln(J.hand, [112, 30])], arrow: () => arr(98, 20, 84, 20) }) },
      { cap: 'Hands beside the ears, squeeze the back', pose: st({ torso: 95, arm: 150, fore: 20, hi: { arm: 'main', torso: 'help' }, gear: J => [ln(J.hand, [112, 30])] }) } ] },
    // Legs
    { key: 'squat', name: 'Squat', group: 'Legs', compound: true, muscles: { main: ['QUADRICEPS', 'GLUTEAL'], help: ['HAMSTRING', 'ADDUCTORS', 'LOWER_BACK'] }, steps: [
      { cap: 'Bar on upper back, feet shoulder-width', pose: st({ arm: 235, fore: 70, hi: { thigh: 'main', torso: 'help' }, gear: J => [plate(J.sh, 15, 1)] }) },
      { cap: 'Sit back and down, chest up', pose: fig({ ankle: [60, 130], shin: 250, thigh: 325, foot: 0, torso: 65, arm: 235, fore: 70, hi: { thigh: 'main', torso: 'help' }, gear: J => [plate(J.sh, 15, 1)], arrow: () => arr(30, 72, 30, 90) }) },
      { cap: 'Thighs parallel, drive up through the whole foot', pose: fig({ ankle: [60, 130], shin: 245, thigh: 355, foot: 0, torso: 55, arm: 235, fore: 70, hi: { thigh: 'main', torso: 'help' }, gear: J => [plate(J.sh, 15, 1)], arrow: () => arr(30, 112, 30, 94) }) } ] },
    { key: 'front-squat', name: 'Front squat', group: 'Legs', compound: true, like: 'squat', muscles: { main: ['QUADRICEPS'], help: ['GLUTEAL', 'ABS', 'UPPER_BACK'] },
      caps: ['Bar on the front of the shoulders, elbows high', 'Sit straight down, torso upright', 'Deep as you can keep the elbows up, stand'] },
    { key: 'leg-press', name: 'Leg press', group: 'Legs', compound: true, muscles: { main: ['QUADRICEPS', 'GLUTEAL'], help: ['HAMSTRING'] }, steps: [
      { cap: 'Back flat on the pad, feet shoulder-width', pose: fig({ hip: [38, 104], torso: 120, thigh: 60, shin: 345, foot: 75, arm: 300, fore: 0, hi: { thigh: 'main', shin: 'help' }, gear: J => [ln([34, 112], [8, 66], 6), ln([J.ankle[0] - 7, J.ankle[1] - 12], [J.ankle[0] + 7, J.ankle[1] + 12], 5)] }) },
      { cap: 'Push the platform away through the heels', pose: fig({ hip: [38, 104], torso: 120, thigh: 50, shin: 10, foot: 75, arm: 300, fore: 0, hi: { thigh: 'main', shin: 'help' }, gear: J => [ln([34, 112], [8, 66], 6), ln([J.ankle[0] - 7, J.ankle[1] - 12], [J.ankle[0] + 7, J.ankle[1] + 12], 5)], arrow: () => arr(92, 98, 104, 90) }) },
      { cap: 'Stop just short of locking the knees', pose: fig({ hip: [38, 104], torso: 120, thigh: 35, shin: 35, foot: 75, arm: 300, fore: 0, hi: { thigh: 'main', shin: 'help' }, gear: J => [ln([34, 112], [8, 66], 6), ln([J.ankle[0] - 7, J.ankle[1] - 12], [J.ankle[0] + 7, J.ankle[1] + 12], 5)] }) } ] },
    { key: 'walking-lunge', name: 'Walking lunge', group: 'Legs', compound: true, muscles: { main: ['QUADRICEPS', 'GLUTEAL'], help: ['HAMSTRING', 'CALVES'] }, steps: [
      { cap: 'Stand tall, dumbbells at your sides', pose: fig({ hip: [60, 80], torso: 90, thigh: 270, shin: 270, foot: 0, thigh2: 268, shin2: 270, foot2: 0, arm: 270, fore: 270, hi: { thigh: 'main' }, gear: J => [bell(J.hand)] }) },
      { cap: 'Long step forward, torso upright', pose: fig({ hip: [58, 88], torso: 90, thigh: 300, shin: 265, foot: 0, thigh2: 240, shin2: 220, foot2: 0, arm: 270, fore: 270, hi: { thigh: 'main' }, gear: J => [bell(J.hand)], arrow: () => arr(84, 70, 98, 70) }) },
      { cap: 'Back knee near the floor, push off the front foot', pose: fig({ hip: [56, 100], torso: 90, thigh: 345, shin: 265, foot: 0, thigh2: 255, shin2: 195, foot2: 0, arm: 270, fore: 270, hi: { thigh: 'main' }, gear: J => [bell(J.hand)] }) } ] },
    { key: 'bulgarian-split-squat', name: 'Bulgarian split squat', group: 'Legs', compound: true, like: 'walking-lunge', muscles: { main: ['QUADRICEPS', 'GLUTEAL'], help: ['HAMSTRING', 'ADDUCTORS'] },
      caps: ['Back foot on a bench, front foot forward', 'Lower straight down, chest up', 'Front thigh near parallel, drive up'] },
    { key: 'hip-thrust', name: 'Hip thrust', group: 'Legs', compound: true, muscles: { main: ['GLUTEAL'], help: ['HAMSTRING'] }, steps: [
      { cap: 'Upper back on the bench, bar over the hips', pose: fig({ ankle: [84, 130], shin: 270, thigh: 20, foot: 0, torso: 138, arm: 330, fore: 0, hi: { thigh: 'main', shin: 'help' }, gear: J => [{ rect: [6, 88, 26, 8] }, plate(J.hip, 11, -11)] }) },
      { cap: 'Drive through the heels, hips up', pose: fig({ ankle: [84, 130], shin: 270, thigh: 10, foot: 0, torso: 146, arm: 330, fore: 0, hi: { thigh: 'main', shin: 'help' }, gear: J => [{ rect: [6, 88, 26, 8] }, plate(J.hip, 11, -11)], arrow: () => arr(60, 82, 60, 68) }) },
      { cap: 'Body flat from knees to shoulders, squeeze', pose: fig({ ankle: [84, 130], shin: 270, thigh: 0, foot: 0, torso: 154, arm: 330, fore: 0, hi: { thigh: 'main', shin: 'help' }, gear: J => [{ rect: [6, 88, 26, 8] }, plate(J.hip, 11, -11)] }) } ] },
    { key: 'leg-curl', name: 'Leg curl', group: 'Legs', compound: false, muscles: { main: ['HAMSTRING'], help: ['CALVES'] }, steps: [
      { cap: 'Lie face down, pad just above the heels', pose: fig({ hip: [60, 90], torso: 180, thigh: 0, shin: 0, foot: 270, arm: 200, fore: 270, hi: { thigh: 'main', shin: 'help' }, gear: J => [{ rect: [10, 96, 78, 6] }, { circle: [R1(J.ankle[0]), R1(J.ankle[1] - 8), 5], w: 3 }] }) },
      { cap: 'Curl the heels toward the glutes', pose: fig({ hip: [60, 90], torso: 180, thigh: 0, shin: 60, foot: 330, arm: 200, fore: 270, hi: { thigh: 'main', shin: 'help' }, gear: J => [{ rect: [10, 96, 78, 6] }, { circle: [R1(J.ankle[0] - 6), R1(J.ankle[1] - 3), 5], w: 3 }], arrow: () => arr(110, 60, 98, 46) }) },
      { cap: 'Squeeze, then lower slowly', pose: fig({ hip: [60, 90], torso: 180, thigh: 0, shin: 100, foot: 10, arm: 200, fore: 270, hi: { thigh: 'main', shin: 'help' }, gear: J => [{ rect: [10, 96, 78, 6] }, { circle: [R1(J.ankle[0] - 8), R1(J.ankle[1] + 2), 5], w: 3 }] }) } ] },
    { key: 'leg-extension', name: 'Leg extension', group: 'Legs', compound: false, muscles: { main: ['QUADRICEPS'], help: [] }, steps: [
      { cap: 'Knees at the edge of the seat, pad on the shins', pose: fig({ hip: [40, 96], torso: 95, thigh: 0, shin: 270, foot: 0, arm: 300, fore: 290, hi: { thigh: 'main' }, gear: J => [{ rect: [26, 98, 42, 6] }, { rect: [24, 60, 6, 40] }, { circle: [R1(J.ankle[0] + 5), R1(J.ankle[1] - 4), 5], w: 3 }] }) },
      { cap: 'Straighten the legs in a smooth motion', pose: fig({ hip: [40, 96], torso: 95, thigh: 0, shin: 315, foot: 45, arm: 300, fore: 290, hi: { thigh: 'main' }, gear: J => [{ rect: [26, 98, 42, 6] }, { rect: [24, 60, 6, 40] }, { circle: [R1(J.ankle[0] + 4), R1(J.ankle[1] + 3), 5], w: 3 }], arrow: () => arr(100, 120, 106, 106) }) },
      { cap: 'Squeeze the thighs at the top, lower slowly', pose: fig({ hip: [40, 96], torso: 95, thigh: 0, shin: 0, foot: 90, arm: 300, fore: 290, hi: { thigh: 'main' }, gear: J => [{ rect: [26, 98, 42, 6] }, { rect: [24, 60, 6, 40] }, { circle: [R1(J.ankle[0]), R1(J.ankle[1] + 6), 5], w: 3 }] }) } ] },
    { key: 'calf-raise', name: 'Calf raise', group: 'Legs', compound: false, muscles: { main: ['CALVES'], help: [] }, steps: [
      { cap: 'Balls of the feet on a step, heels low', pose: st({ ankle: [62, 127], foot: 15, arm: 270, fore: 270, hi: { shin: 'main' }, gear: () => [{ rect: [56, 124, 22, 9] }] }) },
      { cap: 'Rise up onto the toes', pose: st({ ankle: [63, 120], foot: 340, arm: 270, fore: 270, hi: { shin: 'main' }, gear: () => [{ rect: [56, 124, 22, 9] }], arrow: () => arr(40, 100, 40, 86) }) },
      { cap: 'Pause at the top, lower all the way', pose: st({ ankle: [63, 114], foot: 315, arm: 270, fore: 270, hi: { shin: 'main' }, gear: () => [{ rect: [56, 124, 22, 9] }] }) } ] },
    // Shoulders
    { key: 'overhead-press', name: 'Overhead press', group: 'Shoulders', compound: true, muscles: { main: ['FRONT_DELTOIDS'], help: ['TRICEPS', 'TRAPEZIUS'] }, steps: [
      { cap: 'Bar on the front of the shoulders, glutes tight', pose: st({ torso: 95, arm: 250, fore: 75, hi: { arm: 'main', torso: 'help' }, gear: J => [plate(J.hand, 10, -2)] }) },
      { cap: 'Press straight up, head moves back a little', pose: st({ torso: 95, arm: 30, fore: 100, hi: { arm: 'main', torso: 'help' }, gear: J => [plate(J.hand, 9, 0)], arrow: () => arr(90, 40, 90, 26) }) },
      { cap: 'Lock out over the middle of the feet', pose: st({ torso: 95, arm: 95, fore: 92, hi: { arm: 'main', torso: 'help' }, gear: J => [plate(J.hand, 8, 3)] }) } ] },
    { key: 'dumbbell-shoulder-press', name: 'Dumbbell shoulder press', group: 'Shoulders', compound: true, like: 'overhead-press', muscles: { main: ['FRONT_DELTOIDS'], help: ['TRICEPS'] },
      caps: ['Dumbbells at shoulder height, palms forward', 'Press up, slightly together', 'Arms straight overhead, lower slowly'] },
    { key: 'lateral-raise', name: 'Lateral raise', group: 'Shoulders', compound: false, muscles: { main: ['FRONT_DELTOIDS'], help: ['TRAPEZIUS'] }, steps: [
      { cap: 'Dumbbells at your sides, slight bend in elbows', pose: fr({ arm: 285, fore: 275, arm2: 255, fore2: 265, hi: { arm: 'main' }, gear: J => [bell(J.hand), bell(J.hand2)] }) },
      { cap: 'Raise out to the sides, lead with the elbows', pose: fr({ arm: 330, fore: 335, arm2: 210, fore2: 205, hi: { arm: 'main' }, gear: J => [bell(J.hand), bell(J.hand2)], arrow: () => arr(100, 70, 104, 56) }) },
      { cap: 'Stop at shoulder height, lower slowly', pose: fr({ arm: 0, fore: 0, arm2: 180, fore2: 180, hi: { arm: 'main' }, gear: J => [bell(J.hand), bell(J.hand2)] }) } ] },
    { key: 'rear-delt-fly', name: 'Rear delt fly', group: 'Shoulders', compound: false, muscles: { main: ['BACK_DELTOIDS'], help: ['UPPER_BACK', 'TRAPEZIUS'] }, steps: [
      { cap: 'Hinge forward, dumbbells hanging', pose: bentOver({ arm: 270, fore: 275, hi: { arm: 'main', torso: 'help' }, gear: J => [bell(J.hand)] }) },
      { cap: 'Raise the arms out wide', pose: bentOver({ arm: 270, fore: 270, len: { arm: 12, fore: 10 }, hi: { arm: 'main', torso: 'help' }, gear: J => [bell(J.hand)], arrow: () => arr(104, 96, 96, 84) }) },
      { cap: 'Squeeze the back of the shoulders, lower', pose: bentOver({ arm: 275, fore: 275, len: { arm: 7, fore: 6 }, hi: { arm: 'main', torso: 'help' }, gear: J => [bell(J.hand)] }) } ] },
    // Arms
    { key: 'biceps-curl', name: 'Biceps curl', group: 'Arms', compound: false, muscles: { main: ['BICEPS'], help: ['FOREARM'] }, steps: [
      { cap: 'Stand tall, elbows at your sides', pose: st({ arm: 268, fore: 270, hi: { arm: 'main', fore: 'help' }, gear: J => [bell(J.hand)] }) },
      { cap: 'Curl up without swinging', pose: st({ arm: 268, fore: 0, hi: { arm: 'main', fore: 'help' }, gear: J => [bell(J.hand)], arrow: () => arr(90, 78, 90, 64) }) },
      { cap: 'Squeeze at the top, lower slowly', pose: st({ arm: 268, fore: 60, hi: { arm: 'main', fore: 'help' }, gear: J => [bell(J.hand)] }) } ] },
    { key: 'hammer-curl', name: 'Hammer curl', group: 'Arms', compound: false, like: 'biceps-curl', muscles: { main: ['BICEPS', 'FOREARM'], help: [] },
      caps: ['Palms facing each other, elbows at your sides', 'Curl up, thumbs leading', 'Squeeze, then lower slowly'] },
    { key: 'triceps-pushdown', name: 'Triceps pushdown', group: 'Arms', compound: false, muscles: { main: ['TRICEPS'], help: [] }, steps: [
      { cap: 'Elbows pinned to your sides, hands at the chest', pose: st({ arm: 265, fore: 60, hi: { arm: 'main' }, gear: J => [ln(J.hand, [80, 4])] }) },
      { cap: 'Push down until the arms are straight', pose: st({ arm: 265, fore: 330, hi: { arm: 'main' }, gear: J => [ln(J.hand, [80, 4])], arrow: () => arr(92, 60, 92, 76) }) },
      { cap: 'Squeeze at the bottom, let it rise slowly', pose: st({ arm: 265, fore: 280, hi: { arm: 'main' }, gear: J => [ln(J.hand, [80, 4])] }) } ] },
    { key: 'skull-crusher', name: 'Skull crusher', group: 'Arms', compound: false, muscles: { main: ['TRICEPS'], help: [] }, steps: [
      { cap: 'Lie on the bench, bar over the shoulders', pose: lying({ arm: 85, fore: 88, hi: { arm: 'main' }, gear: J => [plate(J.hand, 9)] }) },
      { cap: 'Bend only the elbows, lower toward the forehead', pose: lying({ arm: 95, fore: 150, hi: { arm: 'main' }, gear: J => [plate(J.hand, 9)], arrow: () => arr(46, 58, 34, 70) }) },
      { cap: 'Stop above the head, extend back up', pose: lying({ arm: 100, fore: 175, hi: { arm: 'main' }, gear: J => [plate(J.hand, 9)] }) } ] },
    { key: 'overhead-triceps-extension', name: 'Overhead triceps extension', group: 'Arms', compound: false, muscles: { main: ['TRICEPS'], help: [] }, steps: [
      { cap: 'Weight behind the head, elbows pointing up', pose: st({ arm: 75, fore: 200, hi: { arm: 'main' }, gear: J => [bell(J.hand)] }) },
      { cap: 'Straighten the arms, elbows stay close', pose: st({ arm: 75, fore: 135, hi: { arm: 'main' }, gear: J => [bell(J.hand)], arrow: () => arr(40, 24, 50, 12) }) },
      { cap: 'Arms straight overhead, lower slowly', pose: st({ arm: 75, fore: 78, hi: { arm: 'main' }, gear: J => [bell(J.hand)] }) } ] },
    // Core
    { key: 'plank', name: 'Plank', group: 'Core', compound: false, muscles: { main: ['ABS'], help: ['OBLIQUES', 'FRONT_DELTOIDS'] }, steps: [
      { cap: 'Forearms under the shoulders, knees down', pose: fig({ hip: [59, 106], torso: 152, thigh: 300, shin: 0, foot: 0, arm: 270, fore: 180, hi: { torso: 'main' } }) },
      { cap: 'Lift into one straight line', pose: fig({ hip: [59, 111], torso: 168, thigh: 345, shin: 345, foot: 290, arm: 270, fore: 180, hi: { torso: 'main' }, arrow: () => arr(62, 128, 62, 116) }) },
      { cap: 'Brace the belly, breathe, hold', pose: fig({ hip: [59, 111], torso: 168, thigh: 345, shin: 345, foot: 290, arm: 270, fore: 180, hi: { torso: 'main' } }) } ] },
    { key: 'hanging-leg-raise', name: 'Hanging leg raise', group: 'Core', compound: false, muscles: { main: ['ABS'], help: ['OBLIQUES', 'FOREARM'] }, steps: [
      { cap: 'Hang from the bar, legs straight', pose: hang({ hip: [60, 80], arm: 90, fore: 90, hi: { torso: 'main', thigh: 'help' }, gear: () => [ln([30, 10], [90, 10], 4)] }) },
      { cap: 'Raise the legs without swinging', pose: hang({ hip: [60, 80], thigh: 315, shin: 300, foot: 30, arm: 90, fore: 90, hi: { torso: 'main', thigh: 'help' }, gear: () => [ln([30, 10], [90, 10], 4)], arrow: () => arr(100, 110, 104, 94) }) },
      { cap: 'Legs at hip height or higher, lower slowly', pose: hang({ hip: [60, 80], thigh: 0, shin: 355, foot: 80, arm: 90, fore: 90, hi: { torso: 'main', thigh: 'help' }, gear: () => [ln([30, 10], [90, 10], 4)] }) } ] },
    { key: 'cable-crunch', name: 'Cable crunch', group: 'Core', compound: false, muscles: { main: ['ABS'], help: ['OBLIQUES'] }, steps: [
      { cap: 'Kneel, rope beside the head', pose: fig({ hip: [60, 103], thigh: 270, shin: 180, foot: 270, torso: 95, arm: 60, fore: 200, hi: { torso: 'main' }, gear: J => [ln(J.hand, [74, 4])] }) },
      { cap: 'Crunch down, rounding the spine', pose: fig({ hip: [60, 103], thigh: 270, shin: 180, foot: 270, torso: 60, arm: 30, fore: 170, hi: { torso: 'main' }, gear: J => [ln(J.hand, [74, 4])], arrow: () => arr(98, 50, 102, 66) }) },
      { cap: 'Elbows toward the knees, then rise slowly', pose: fig({ hip: [60, 103], thigh: 270, shin: 180, foot: 270, torso: 28, arm: 0, fore: 140, hi: { torso: 'main' }, gear: J => [ln(J.hand, [74, 4])] }) } ] },
    { key: 'russian-twist', name: 'Russian twist', group: 'Core', compound: false, muscles: { main: ['OBLIQUES'], help: ['ABS'] }, steps: [
      { cap: 'Sit, lean back a little, weight at the chest', pose: fr({ hip: [60, 104], thigh: 330, shin: 270, thigh2: 210, shin2: 270, arm: 250, fore: 160, arm2: 290, fore2: 20, hi: { torso: 'main' }, gear: J => [bell(J.hand)] }) },
      { cap: 'Rotate the shoulders to one side', pose: fr({ hip: [60, 104], thigh: 330, shin: 270, thigh2: 210, shin2: 270, arm: 300, fore: 250, arm2: 270, fore2: 300, hi: { torso: 'main' }, gear: J => [bell(J.hand)], arrow: () => arr(70, 116, 86, 116) }) },
      { cap: 'Then to the other side, keep the chest up', pose: fr({ hip: [60, 104], thigh: 330, shin: 270, thigh2: 210, shin2: 270, arm: 240, fore: 290, arm2: 230, fore2: 250, hi: { torso: 'main' }, gear: J => [bell(J.hand)], arrow: () => arr(50, 116, 34, 116) }) } ] },
    // ---- v3 additions ----
    { key: 'incline-bench-press', name: 'Incline bench press', group: 'Chest', compound: true, like: 'bench-press', muscles: { main: ['CHEST', 'FRONT_DELTOIDS'], help: ['TRICEPS'] },
      caps: ['Bench at about 30°, bar over the upper chest', 'Lower to the top of the chest, elbows in', 'Press back up over the shoulders'] },
    { key: 'machine-chest-press', name: 'Machine chest press', group: 'Chest', compound: true, muscles: { main: ['CHEST'], help: ['FRONT_DELTOIDS', 'TRICEPS'] }, steps: [
      S('Handles at mid-chest, back against the pad', seat({ arm: 255, fore: 5, hi: { torso: 'main', arm: 'help' }, gear: J => [bell(J.hand)] })),
      S('Press forward, shoulders stay back', seat({ arm: 320, fore: 5, hi: { torso: 'main', arm: 'help' }, gear: J => [bell(J.hand)] })),
      S('Arms long without locking, return slowly', seat({ arm: 350, fore: 358, hi: { torso: 'main', arm: 'help' }, gear: J => [bell(J.hand)] })) ] },
    { key: 'pec-deck', name: 'Pec deck', group: 'Chest', compound: false, like: 'cable-fly', muscles: { main: ['CHEST'], help: ['FRONT_DELTOIDS'] },
      caps: ['Sit tall, hands on the handles, arms wide', 'Bring the arms together in an arc', 'Squeeze the chest, open slowly'] },
    { key: 't-bar-row', name: 'T-bar row', group: 'Back', compound: true, like: 'barbell-row', muscles: { main: ['UPPER_BACK'], help: ['BACK_DELTOIDS', 'BICEPS', 'LOWER_BACK'] },
      caps: ['Straddle the bar, hinge forward, chest up', 'Pull the handle to the chest', 'Squeeze the back, lower under control'] },
    { key: 'straight-arm-pulldown', name: 'Straight-arm pulldown', group: 'Back', compound: false, muscles: { main: ['UPPER_BACK'], help: ['TRICEPS', 'BACK_DELTOIDS'] }, steps: [
      S('Lean forward a little, arms straight up front', st({ torso: 78, arm: 35, fore: 35, hi: { torso: 'main', arm: 'help' }, gear: J => [ln(J.hand, [112, 6])] })),
      S('Sweep the bar down, arms stay straight', st({ torso: 78, arm: 330, fore: 330, hi: { torso: 'main', arm: 'help' }, gear: J => [ln(J.hand, [112, 6])] })),
      S('Bar to the thighs, squeeze the lats', st({ torso: 78, arm: 285, fore: 285, hi: { torso: 'main', arm: 'help' }, gear: J => [ln(J.hand, [112, 6])] })) ] },
    { key: 'back-extension', name: 'Back extension', group: 'Back', compound: false, muscles: { main: ['LOWER_BACK'], help: ['GLUTEAL', 'HAMSTRING'] }, steps: [
      S('Hips on the pad, upper body hanging down', hyper(300)), S('Lift the chest with a flat back', hyper(0)), S('Stop in line with the legs, lower slowly', hyper(45)) ] },
    { key: 'good-morning', name: 'Good morning', group: 'Back', compound: true, muscles: { main: ['HAMSTRING', 'LOWER_BACK'], help: ['GLUTEAL'] }, steps: [
      S('Bar on the upper back, soft knees', st({ arm: 235, fore: 70, hi: { thigh: 'main', torso: 'main' }, gear: J => [plate(J.sh, 15, 1)] })),
      S('Push the hips back, back stays flat', fig({ ankle: [60, 130], shin: 262, thigh: 300, foot: 0, torso: 50, arm: 235, fore: 70, hi: { thigh: 'main', torso: 'main' }, gear: J => [plate(J.sh, 15, 1)] })),
      S('Torso near parallel, then drive the hips forward', fig({ ankle: [60, 130], shin: 262, thigh: 305, foot: 0, torso: 12, arm: 235, fore: 70, hi: { thigh: 'main', torso: 'main' }, gear: J => [plate(J.sh, 15, 1)] })) ] },
    { key: 'superman', name: 'Superman', group: 'Back', compound: false, muscles: { main: ['LOWER_BACK'], help: ['GLUTEAL', 'HAMSTRING'] }, steps: [
      S('Lie face down, arms reaching forward', prone(0, 0, 0)), S('Lift arms, chest and legs together', prone(8, 6, 12)), S('Hold a moment, lower slowly', prone(15, 12, 20)) ] },
    { key: 'rack-pull', name: 'Rack pull', group: 'Back', compound: true, like: 'deadlift', muscles: { main: ['LOWER_BACK', 'GLUTEAL'], help: ['TRAPEZIUS', 'HAMSTRING', 'FOREARM'] },
      caps: ['Bar on the rack just below the knees', 'Push the hips forward, bar close to the legs', 'Stand tall, squeeze the glutes'] },
    { key: 'arnold-press', name: 'Arnold press', group: 'Shoulders', compound: true, like: 'overhead-press', muscles: { main: ['FRONT_DELTOIDS'], help: ['TRICEPS'] },
      caps: ['Dumbbells at the chest, palms facing you', 'Turn the palms out as you press up', 'Arms straight overhead, reverse on the way down'] },
    { key: 'cable-lateral-raise', name: 'Cable lateral raise', group: 'Shoulders', compound: false, like: 'lateral-raise', muscles: { main: ['FRONT_DELTOIDS'], help: ['TRAPEZIUS'] },
      caps: ['Low pulley, handle across the body', 'Raise out to the side, elbow slightly bent', 'Stop at shoulder height, lower slowly'] },
    { key: 'front-raise', name: 'Front raise', group: 'Shoulders', compound: false, muscles: { main: ['FRONT_DELTOIDS'], help: ['CHEST'] }, steps: [
      S('Dumbbells in front of the thighs', st({ arm: 275, fore: 275, hi: { arm: 'main' }, gear: J => [bell(J.hand)] })),
      S('Raise forward, arms almost straight', st({ arm: 320, fore: 320, hi: { arm: 'main' }, gear: J => [bell(J.hand)] })),
      S('Stop at shoulder height, lower slowly', st({ arm: 0, fore: 0, hi: { arm: 'main' }, gear: J => [bell(J.hand)] })) ] },
    { key: 'upright-row', name: 'Upright row', group: 'Shoulders', compound: true, muscles: { main: ['FRONT_DELTOIDS', 'TRAPEZIUS'], help: ['BICEPS'] }, steps: [
      S('Bar at the thighs, hands shoulder-width', st({ arm: 270, fore: 270, hi: { arm: 'main', torso: 'help' }, gear: J => [plate(J.hand, 9)] })),
      S('Pull up along the body, elbows lead', st({ arm: 320, fore: 240, hi: { arm: 'main', torso: 'help' }, gear: J => [plate(J.hand, 9)] })),
      S('Elbows at shoulder height, lower slowly', st({ arm: 0, fore: 200, hi: { arm: 'main', torso: 'help' }, gear: J => [plate(J.hand, 9)] })) ] },
    { key: 'shrug', name: 'Shrug', group: 'Back', compound: false, muscles: { main: ['TRAPEZIUS'], help: ['FOREARM'] }, steps: [
      S('Dumbbells at your sides, arms long', st({ arm: 270, fore: 270, hi: { torso: 'main' }, gear: J => [bell(J.hand)] })),
      S('Lift the shoulders straight up', st({ arm: 270, fore: 270, len: { torso: 40.5 }, hi: { torso: 'main' }, gear: J => [bell(J.hand)] })),
      S('Hold at the top, lower slowly', st({ arm: 270, fore: 270, len: { torso: 42 }, hi: { torso: 'main' }, gear: J => [bell(J.hand)] })) ] },
    { key: 'ez-bar-curl', name: 'EZ-bar curl', group: 'Arms', compound: false, like: 'biceps-curl', muscles: { main: ['BICEPS'], help: ['FOREARM'] },
      caps: ['Grip the angled bar, elbows at your sides', 'Curl up without swinging', 'Squeeze at the top, lower slowly'] },
    { key: 'cable-curl', name: 'Cable curl', group: 'Arms', compound: false, like: 'biceps-curl', muscles: { main: ['BICEPS'], help: ['FOREARM'] },
      caps: ['Face the low pulley, elbows at your sides', 'Curl the handle toward the shoulders', 'Squeeze, then lower against the cable'] },
    { key: 'preacher-curl', name: 'Preacher curl', group: 'Arms', compound: false, muscles: { main: ['BICEPS'], help: ['FOREARM'] }, steps: [
      S('Upper arms flat on the pad, arms nearly straight', st({ torso: 80, arm: 315, fore: 310, hi: { arm: 'main' }, gear: PREACH })),
      S('Curl up, upper arms stay on the pad', st({ torso: 80, arm: 315, fore: 40, hi: { arm: 'main' }, gear: PREACH })),
      S('Stop before vertical, lower all the way', st({ torso: 80, arm: 315, fore: 95, hi: { arm: 'main' }, gear: PREACH })) ] },
    { key: 'concentration-curl', name: 'Concentration curl', group: 'Arms', compound: false, like: 'preacher-curl', muscles: { main: ['BICEPS'], help: [] },
      caps: ['Sit, elbow braced on the inner thigh', 'Curl up slowly, upper arm still', 'Squeeze at the top, lower all the way'] },
    { key: 'close-grip-bench-press', name: 'Close-grip bench press', group: 'Arms', compound: true, like: 'bench-press', muscles: { main: ['TRICEPS', 'CHEST'], help: ['FRONT_DELTOIDS'] },
      caps: ['Hands shoulder-width, eyes under the bar', 'Lower to the lower chest, elbows tucked', 'Press up, lock out the elbows'] },
    { key: 'rope-pushdown', name: 'Rope pushdown', group: 'Arms', compound: false, like: 'triceps-pushdown', muscles: { main: ['TRICEPS'], help: [] },
      caps: ['Rope at chest height, elbows pinned', 'Push down and spread the rope ends', 'Squeeze at the bottom, let it rise slowly'] },
    { key: 'diamond-push-up', name: 'Diamond push-up', group: 'Arms', compound: true, like: 'push-up', muscles: { main: ['TRICEPS', 'CHEST'], help: ['FRONT_DELTOIDS', 'ABS'] },
      caps: ['Hands close together under the chest', 'Lower with the elbows close to the body', 'Chest near the hands, push back up'] },
    { key: 'triceps-kickback', name: 'Triceps kickback', group: 'Arms', compound: false, muscles: { main: ['TRICEPS'], help: [] }, steps: [
      S('Hinge forward, upper arm along the body', bentOver({ arm: 200, fore: 270, hi: { arm: 'main' }, gear: J => [bell(J.hand)] })),
      S('Straighten the arm back, elbow stays still', bentOver({ arm: 200, fore: 235, hi: { arm: 'main' }, gear: J => [bell(J.hand)] })),
      S('Arm straight, squeeze, then lower', bentOver({ arm: 200, fore: 200, hi: { arm: 'main' }, gear: J => [bell(J.hand)] })) ] },
    { key: 'wrist-curl', name: 'Wrist curl', group: 'Arms', compound: false, muscles: { main: ['FOREARM'], help: [] }, steps: [
      S('Forearms on the thighs, wrists past the knees', wrist(300)), S('Curl the weight up with the wrists only', wrist(0)), S('Squeeze at the top, lower slowly', wrist(50)) ] },
    { key: 'reverse-wrist-curl', name: 'Reverse wrist curl', group: 'Arms', compound: false, like: 'wrist-curl', muscles: { main: ['FOREARM'], help: [] },
      caps: ['Palms down, forearms on the thighs', 'Lift the backs of the hands up', 'Hold, then lower slowly'] },
    { key: 'reverse-curl', name: 'Reverse curl', group: 'Arms', compound: false, like: 'biceps-curl', muscles: { main: ['FOREARM'], help: ['BICEPS'] },
      caps: ['Palms facing down, elbows at your sides', 'Curl up, wrists stay straight', 'Squeeze, then lower slowly'] },
    { key: 'farmers-walk', name: "Farmer's walk", group: 'Arms', compound: true, muscles: { main: ['FOREARM', 'TRAPEZIUS'], help: ['ABS', 'GLUTEAL'] }, steps: [
      S('Heavy dumbbells at your sides, stand tall', walk(285, 255)), S('Walk with short, quick steps', walk(270, 270)), S('Shoulders back, grip hard the whole way', walk(255, 285)) ] },
    { key: 'dead-hang', name: 'Dead hang', group: 'Arms', compound: false, muscles: { main: ['FOREARM'], help: ['UPPER_BACK'] }, steps: [
      S('Grip the bar, hands shoulder-width or wider', deadHang(76)), S('Hang with straight arms, shoulders active', deadHang(74)), S('Breathe and hold as long as you can', deadHang(74)) ] },
    { key: 'goblet-squat', name: 'Goblet squat', group: 'Legs', compound: true, muscles: { main: ['QUADRICEPS', 'GLUTEAL'], help: ['ADDUCTORS', 'ABS'] }, steps: [
      S('Hold one dumbbell at the chest', goblet({ shin: 270, thigh: 270, torso: 92 })),
      S('Sit down between the knees, chest up', goblet({ shin: 250, thigh: 325, torso: 75 })),
      S('Elbows inside the knees, stand back up', goblet({ shin: 245, thigh: 355, torso: 68 })) ] },
    { key: 'hack-squat', name: 'Hack squat', group: 'Legs', compound: true, like: 'squat', muscles: { main: ['QUADRICEPS'], help: ['GLUTEAL', 'ADDUCTORS'] },
      caps: ['Back on the pad, shoulders under the pads', 'Lower under control, knees over the toes', 'Thighs parallel, push up through the feet'] },
    { key: 'stiff-leg-deadlift', name: 'Stiff-leg deadlift', group: 'Legs', compound: true, like: 'romanian-deadlift', muscles: { main: ['HAMSTRING'], help: ['GLUTEAL', 'LOWER_BACK'] },
      caps: ['Legs almost straight, bar at the thighs', 'Hinge at the hips, bar close to the legs', 'Feel the stretch, back flat, then stand'] },
    { key: 'single-leg-rdl', name: 'Single-leg Romanian deadlift', group: 'Legs', compound: true, like: 'romanian-deadlift', muscles: { main: ['HAMSTRING', 'GLUTEAL'], help: ['LOWER_BACK'] },
      caps: ['Stand on one leg, weight in the other hand', 'Hinge forward, the free leg goes back', 'Body level, hips square, then stand'] },
    { key: 'seated-leg-curl', name: 'Seated leg curl', group: 'Legs', compound: false, muscles: { main: ['HAMSTRING'], help: ['CALVES'] }, steps: [
      S('Legs straight, pad under the lower calves', sCurl(0)), S('Curl the heels down and back', sCurl(300)), S('Squeeze, then let the legs rise slowly', sCurl(250)) ] },
    { key: 'nordic-curl', name: 'Nordic curl', group: 'Legs', compound: false, muscles: { main: ['HAMSTRING'], help: ['GLUTEAL', 'CALVES'] }, steps: [
      S('Kneel, ankles held down, body upright', nordic(270, 90)), S('Lower forward slowly, hips stay straight', nordic(240, 60)),
      S('Go as far as you can, catch, push back up', nordic(220, 40)) ] },
    { key: 'glute-bridge', name: 'Glute bridge', group: 'Legs', compound: false, muscles: { main: ['GLUTEAL'], help: ['HAMSTRING'] }, steps: [
      S('Lie on your back, knees bent, feet flat', bridge(40, 180)), S('Drive through the heels, lift the hips', bridge(20, 195)),
      S('Straight line knees to shoulders, squeeze', bridge(0, 207)) ] },
    { key: 'cable-kickback', name: 'Cable kickback', group: 'Legs', compound: false, muscles: { main: ['GLUTEAL'], help: ['HAMSTRING'] }, steps: [
      S('Cuff on the ankle, hold the frame', kick(268)), S('Kick the leg straight back, hips square', kick(240)), S('Squeeze the glute at the top, return slowly', kick(215)) ] },
    { key: 'step-up', name: 'Step-up', group: 'Legs', compound: true, muscles: { main: ['GLUTEAL', 'QUADRICEPS'], help: ['HAMSTRING', 'CALVES'] }, steps: [
      S('One whole foot flat on the box', stepUp(250, 0, 80, 250, 285)), S('Drive up through the front heel', stepUp(265, 330, 85, 255, 260)),
      S('Stand tall on the box, step down slowly', stepUp(270, 270, 90, 268, 270)) ] },
    { key: 'sumo-deadlift', name: 'Sumo deadlift', group: 'Legs', compound: true, like: 'deadlift', muscles: { main: ['GLUTEAL', 'QUADRICEPS', 'ADDUCTORS'], help: ['HAMSTRING', 'LOWER_BACK'] },
      caps: ['Wide stance, toes out, hands inside the knees', 'Push the knees out, drive the floor away', 'Stand tall, hips through'] },
    { key: 'hip-abduction', name: 'Hip abduction machine', group: 'Legs', compound: false, muscles: { main: ['GLUTEAL'], help: [] }, steps: [
      S('Sit tall, pads on the outside of the knees', abd(30)), S('Push the knees out wide', abd(60)), S('Pause, then bring them back slowly', abd(85)) ] },
    { key: 'single-leg-calf-raise', name: 'Single-leg calf raise', group: 'Legs', compound: false, like: 'calf-raise', muscles: { main: ['CALVES'], help: [] },
      caps: ['One foot on the step, hold on for balance', 'Rise up as high as you can', 'Pause, lower the heel below the step'] },
    { key: 'seated-calf-raise', name: 'Seated calf raise', group: 'Legs', compound: false, muscles: { main: ['CALVES'], help: [] }, steps: [
      S('Pad on the thighs, balls of the feet on the block', sCalf(0, 16)), S('Push up onto the toes', sCalf(10, 353)), S('Pause at the top, lower all the way', sCalf(18, 335)) ] },
    { key: 'leg-press-calf-raise', name: 'Leg press calf raise', group: 'Legs', compound: false, muscles: { main: ['CALVES'], help: [] }, steps: [
      S('Legs straight, balls of the feet on the edge', lpCalf(140)), S('Push the platform away with the toes', lpCalf(115)), S('Squeeze, then let the heels come back', lpCalf(95)) ] },
    { key: 'donkey-calf-raise', name: 'Donkey calf raise', group: 'Legs', compound: false, muscles: { main: ['CALVES'], help: [] }, steps: [
      S('Hinge forward, hands on a support, heels low', donkey([62, 127], 15)), S('Rise up onto the toes', donkey([63, 120], 340)), S('Pause at the top, lower slowly', donkey([63, 114], 315)) ] },
    { key: 'crunch', name: 'Crunch', group: 'Core', compound: false, muscles: { main: ['ABS'], help: ['OBLIQUES'] }, steps: [
      S('On your back, knees bent, arms crossed', crunch(180)), S('Curl the shoulders off the floor', crunch(162)), S('Squeeze the abs, lower slowly', crunch(148)) ] },
    { key: 'ab-wheel-rollout', name: 'Ab wheel rollout', group: 'Core', compound: false, muscles: { main: ['ABS'], help: ['OBLIQUES', 'UPPER_BACK'] }, steps: [
      S('Kneel, hands on the wheel under the shoulders', roll(260, 25, 270)), S('Roll forward slowly, belly tight', roll(245, 20, 296)),
      S('Go as far as your back stays flat, roll back', roll(230, 18, 312)) ] },
    { key: 'dead-bug', name: 'Dead bug', group: 'Core', compound: false, muscles: { main: ['ABS'], help: ['OBLIQUES'] }, steps: [
      S('On your back, knees and arms up', bug(90, 0, 90)), S('Reach one arm back, the opposite leg out', bug(55, 15, 115)),
      S('Low back stays down, return and switch sides', bug(25, 20, 135)) ] },
    { key: 'reverse-crunch', name: 'Reverse crunch', group: 'Core', compound: false, muscles: { main: ['ABS'], help: ['OBLIQUES'] }, steps: [
      S('On your back, knees bent at 90°', rev([62, 124], 180, 80, 0)), S('Pull the knees toward the chest', rev([62, 124], 180, 110, 20)),
      S('Lift the hips a little, lower slowly', rev([64, 118], 190, 125, 40)) ] },
    { key: 'lying-leg-raise', name: 'Lying leg raise', group: 'Core', compound: false, muscles: { main: ['ABS'], help: [] }, steps: [
      S('On your back, legs straight, hands by your sides', legRaise(5)), S('Raise the legs, keep them straight', legRaise(45)),
      S('Legs up, lower slowly, back stays flat', legRaise(85)) ] },
    { key: 'side-plank', name: 'Side plank', group: 'Core', compound: false, muscles: { main: ['OBLIQUES'], help: ['ABS', 'GLUTEAL'] }, steps: [
      S('On one forearm, elbow under the shoulder', sidePlank([57, 120], 151, 348)), S('Lift the hips into one straight line', sidePlank([57, 113], 160, 340)),
      S('Hold, breathe, then switch sides', sidePlank([57, 113], 160, 340)) ] },
    { key: 'woodchopper', name: 'Cable woodchopper', group: 'Core', compound: false, muscles: { main: ['OBLIQUES'], help: ['ABS', 'FRONT_DELTOIDS'] }, steps: [
      S('Cable high to one side, arms long', chop(92, 40, 25)), S('Pull down across the body, turn the chest', chop(90, 320, 300)),
      S('Finish low by the other hip, return slowly', chop(86, 245, 235)) ] },
    { key: 'bicycle-crunch', name: 'Bicycle crunch', group: 'Core', compound: false, muscles: { main: ['OBLIQUES', 'ABS'], help: [] }, steps: [
      S('Hands behind the head, shoulders off the floor', bike(100, 20, 15, 15)), S('Elbow toward the opposite knee', bike(60, 0, 60, 0)),
      S('Switch sides in a slow pedalling motion', bike(15, 15, 100, 20)) ] },
    { key: 'pallof-press', name: 'Pallof press', group: 'Core', compound: false, muscles: { main: ['OBLIQUES', 'ABS'], help: [] }, steps: [
      S('Side-on to the cable, handle at the chest', pallof(250, 15)), S('Press straight out, do not let it turn you', pallof(320, 5)),
      S('Hold with arms long, bring it back slowly', pallof(355, 0)) ] },
    // ---- v3.1: from the user's own exercise list ----
    { key: 'bayesian-curl', name: 'Bayesian curl', group: 'Arms', compound: false, like: 'biceps-curl', muscles: { main: ['BICEPS'], help: ['FOREARM'] },
      caps: ['Face away from a low cable, arm behind you', 'Curl forward, the elbow stays back', 'Squeeze at the top, lower slowly'] },
    { key: 'wide-grip-cable-row', name: 'Wide-grip cable row', group: 'Back', compound: true, like: 'seated-cable-row', muscles: { main: ['UPPER_BACK', 'BACK_DELTOIDS'], help: ['BICEPS', 'TRAPEZIUS'] },
      caps: ['Wide bar, sit tall, arms long', 'Pull to the upper belly, elbows out', 'Squeeze the upper back, reach forward slowly'] },
    { key: 'reverse-pec-deck', name: 'Reverse pec deck', group: 'Shoulders', compound: false, like: 'cable-fly', reverse: true, muscles: { main: ['BACK_DELTOIDS'], help: ['UPPER_BACK', 'TRAPEZIUS'] },
      caps: ['Chest to the pad, arms in front at shoulder height', 'Open the arms out wide', 'Squeeze the rear shoulders, return slowly'] },
    { key: 'hip-adduction', name: 'Hip adduction machine', group: 'Legs', compound: false, muscles: { main: ['ADDUCTORS'], help: [] }, steps: [
      S('Sit tall, pads on the inside of the knees', abd(85)), S('Squeeze the knees together', abd(60)), S('Pause, then open slowly', abd(30)) ] },
  ];
  // groups and their subgroups; a group without subgroups lists its own exercises
  const GROUPS = [{ name: 'Chest' }, { name: 'Back', subs: ['Lats & upper back', 'Lower back'] }, { name: 'Shoulders' },
    { name: 'Arms', subs: ['Biceps', 'Triceps', 'Forearms'] }, { name: 'Legs', subs: ['Quads', 'Hamstrings', 'Glutes', 'Calves'] }, { name: 'Core', subs: ['Abs', 'Obliques'] }];
  const SUB = {
    'Lats & upper back': 'pull-up chin-up lat-pulldown barbell-row one-arm-dumbbell-row seated-cable-row t-bar-row straight-arm-pulldown wide-grip-cable-row shrug',
    'Lower back': 'deadlift back-extension good-morning superman rack-pull',
    Biceps: 'biceps-curl hammer-curl ez-bar-curl cable-curl preacher-curl concentration-curl bayesian-curl',
    Triceps: 'triceps-pushdown rope-pushdown skull-crusher overhead-triceps-extension close-grip-bench-press diamond-push-up triceps-kickback',
    Forearms: 'wrist-curl reverse-wrist-curl reverse-curl farmers-walk dead-hang',
    Quads: 'squat front-squat goblet-squat hack-squat leg-press leg-extension walking-lunge bulgarian-split-squat',
    Hamstrings: 'romanian-deadlift stiff-leg-deadlift single-leg-rdl leg-curl seated-leg-curl nordic-curl',
    Glutes: 'hip-thrust glute-bridge cable-kickback step-up sumo-deadlift hip-abduction hip-adduction',
    Calves: 'calf-raise single-leg-calf-raise seated-calf-raise leg-press-calf-raise donkey-calf-raise',
    Abs: 'plank crunch hanging-leg-raise cable-crunch ab-wheel-rollout dead-bug reverse-crunch lying-leg-raise',
    Obliques: 'russian-twist side-plank woodchopper bicycle-crunch pallof-press',
  };
  const byKey = key => LIST.find(e => e.key === key) || null;
  for (const [sub, keys] of Object.entries(SUB)) for (const k of keys.split(' ')) byKey(k).sub = sub;
  const find = name => { const n = String(name || '').trim().toLowerCase(); return LIST.find(e => e.name.toLowerCase() === n) || null; };
  // `like` reuses another entry's pictures; `caps` can replace its captions (reverse: the same pictures played the opposite way)
  const stepsOf = e => { const like = e.steps || byKey(e.like).steps, base = e.reverse ? [...like].reverse() : like; return base.map((s, i) => ({ cap: (e.caps && e.caps[i]) || s.cap, pose: s.pose })); };
  const CREDIT = 'Muscle map: body-highlighter (MIT)';

  // animated mannequin: moves pose 1 → 2 → 3, holds, and back (SMIL: offline, no script). Every pose of an
  // exercise has the same parts and gear in the same order, so each shape just changes its numbers.
  const esc = s => String(s).replace(/[&<"]/g, c => ({ '&': '&amp;', '<': '&lt;', '"': '&quot;' })[c]);
  function animSvg(e, label) {
    const poses = stepsOf(e).map(s => s.pose), seq = [0, 1, 2, 2, 1, 0];
    const timing = `dur="3.2s" repeatCount="indefinite" keyTimes="0;0.25;0.45;0.55;0.75;1" calcMode="spline" keySplines="${Array(5).fill('0.4 0 0.6 1').join(';')}"`;
    const el = (tag, fixed, attrs) => `<${tag} ${fixed} ${Object.entries(attrs).map(([k, v]) => `${k}="${v[0]}"`).join(' ')}>`
      + Object.entries(attrs).filter(([, v]) => v.some(x => x !== v[0])).map(([k, v]) => `<animate attributeName="${k}" values="${seq.map(i => v[i]).join(';')}" ${timing}/>`).join('')
      + `</${tag}>`;
    const all = f => poses.map(f);
    const line = (fixed, pts) => el('polyline', `fill="none" ${fixed} stroke-linecap="round" stroke-linejoin="round"`, { points: pts });
    const gear = poses[0].gear.map((g, i) => (g.circle ? el('circle', `fill="none" stroke="${C.gear}" stroke-width="${g.w || 4}"`,
      { cx: all(p => p.gear[i].circle[0]), cy: all(p => p.gear[i].circle[1]), r: all(p => p.gear[i].circle[2]) })
      : g.rect ? el('rect', `rx="2" fill="${C.gear}"`, { x: all(p => p.gear[i].rect[0]), y: all(p => p.gear[i].rect[1]), width: all(p => p.gear[i].rect[2]), height: all(p => p.gear[i].rect[3]) })
      : line(`stroke="${C.gear}" stroke-width="${g.w || 2}"`, all(p => p.gear[i].line)))).join('');
    const body = poses[0].parts.map((q, i) => { const pts = all(p => p.parts[i].p);
      return line(`stroke="${C.edge}" stroke-width="${q.w + 3}"`, pts) + line(`stroke="${C[q.c] || C.body}" stroke-width="${q.w}"`, pts); }).join('');
    const head = el('circle', `r="9" fill="${C.body}" stroke="${C.edge}" stroke-width="1.5"`, { cx: all(p => p.head[0]), cy: all(p => p.head[1]) });
    return `<svg viewBox="0 0 120 140" class="pose" role="img" aria-label="${esc(label)}"><rect width="120" height="140" rx="10" fill="${C.edge}"/>`
      + `<line x1="8" y1="133" x2="112" y2="133" stroke="#2a2f38" stroke-width="2"/>${gear}${body}${head}</svg>`;
  }

  const api = { LIST, GROUPS, byKey, find, stepsOf, muscleMapSvg, animSvg, CREDIT };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.OlyxExercises = api;
})(this);
