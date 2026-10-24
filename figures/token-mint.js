{
const run = () => {
const { AZIMUTH, ELEVATION, ISO_CSS, SHADES, axisVector, boxCorners, cameraOf, circleRing, coil, corners, cylinder, depthOf, dotGrid, dotsSvg, extrude, faceTextSvg, fadeLineSvg, fadedSvg, figureSvg, fitProjection, groupSvg, haloOf, holdStill, insetPlan, iso, joinPaths, knurl, lineOnTop, lineSvg, onTop, pageHtml, pathOf, planOutline, plateHtml, pointsAt, radialTicks, ring, ringOf, ringSeam, rise, roundedPlan, screenRise, segment, sideArc, sideMatrix, sideRing, sideSeam, sideTicks, slabOf, solidSvg, topMatrix, topTicks, towardViewer, translateAlong, wireSvg } = window.IsoKit;

function ramLive(K, P, C, dz, coil) {
  // The die, its rod and the return spring, rebuilt as the ram moves.
  const p = C.PRESS;
  const z = p.rest + dz;
  const spring = coil(p.x, 0, 4.4, z + 6.6, p.beam[0] - 6, 7, P, K.iso, K.depthOf, K.pathOf);
  return [
    K.solidSvg(K.cylinder(p.x, 0, p.die, z, 4.2, P, 36, 0.5), { tone: 'mid' }),
    K.solidSvg(K.cylinder(p.x, 0, 4.6, z + 4.2, 2.4, P, 28, 0.3), { tone: 'mid', crease: 'none' }),
    K.lineSvg(spring.back, { tone: 'lo' }),
    K.solidSvg(K.cylinder(p.x, 0, 2.2, z + 6.6, p.beam[0] - z - 6.6, P, 18), { tone: 'hi', crease: 'none' }),
    K.lineSvg(spring.front, { tone: 'mid' }),
  ].join('');
}
function meterNeedle(K, P, C, turn) {
  const m = C.METER;
  const cx = m.x + m.w / 2;
  const cy = m.y + m.d / 2;
  const a = -2.2 + turn;
  const tip = [cx + Math.cos(a) * 6.4, cy + Math.sin(a) * 6.4, m.h + 0.6];
  return K.lineSvg(K.pathOf([K.iso([cx, cy, m.h + 0.6], P), K.iso(tip, P)]), { tone: 'hi' }) + K.dotsSvg([K.iso([cx, cy, m.h + 0.6], P)], { size: 0.7, tone: 'hi' });
}
function vcoil(cx, cy, r, z0, z1, turns, P, iso, depthOf, pathOf) {
  const count = Math.max(8, Math.round(turns * 18));
  const back = [];
  const front = [];
  let run = [];
  let near = null;
  for (let i = 0; i <= count; i++) {
    const s = i / count;
    const a = s * turns * Math.PI * 2;
    const p = iso([cx + r * Math.cos(a), cy + r * Math.sin(a), z0 + (z1 - z0) * s], P);
    const facing = depthOf([Math.cos(a), Math.sin(a), 0], P) > 0;
    if (near === null) near = facing;
    if (facing !== near) {
      run.push(p);
      (near ? front : back).push(pathOf(run));
      run = [p];
      near = facing;
      continue;
    }
    run.push(p);
  }
  if (run.length > 1) (near ? front : back).push(pathOf(run));
  return { back: back.join(''), front: front.join('') };
}
function playFigure(stage, draw, opts) {
  const { loop = 0, seek = {}, onSeek, stillAt = 0 } = opts || {};
  const figure = stage.closest('.iso-figure') || stage;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let frame = 0, prev = 0, clock = 0, visible = false, failed = false;
  // Phones and tablets draw at 30 frames a second: the motion stays smooth
  // and the main thread gets half the work.
  const minStep = matchMedia('(pointer: coarse)').matches ? 1000 / 30 - 2 : 0;
  const run = (dt) => {
    try { draw(clock, dt); } catch (err) { if (!failed) { failed = true; console.warn('figure frame', err); } }
  };
  function tick(now) {
    frame = visible ? requestAnimationFrame(tick) : 0;
    if (minStep && prev && now - prev < minStep) return;
    const dt = prev ? Math.min(0.05, (now - prev) / 1000) : 0;
    prev = now;
    clock = loop ? (clock + dt) % loop : clock + dt;
    run(dt);
  }
  const jump = (id) => {
    if (seek[id] != null) { clock = seek[id]; prev = 0; run(0); }
    if (onSeek) onSeek(id);
    if (!still && visible && !frame) frame = requestAnimationFrame(tick);
  };
  for (const el of figure.querySelectorAll('[data-step]')) el.addEventListener('click', () => jump(el.dataset.step));
  for (const el of stage.querySelectorAll('[data-pin][data-seek]')) el.addEventListener('click', () => jump(el.dataset.seek));
  clock = still ? stillAt : 0;
  run(0);
  if (still) return;
  new IntersectionObserver((entries) => {
    visible = entries[entries.length - 1].isIntersecting;
    prev = 0;
    if (visible && !frame) frame = requestAnimationFrame(tick);
  }, { rootMargin: '120px 0px' }).observe(stage);
}
const P = {"origin":[391.6854154940496,245.05402000813035],"scale":1.4654197371945352,"azimuth":52,"elevation":30};
const C = {"PRESS":{"x":-30,"posts":[-26,24],"beam":[80,88],"rest":48,"die":7.5},"METER":{"x":-150,"y":26,"w":26,"d":20,"r":2.5,"h":12},"VAULT":{"x":-166,"y":-46,"w":54,"d":62,"r":3,"h":56},"TRACK":{"from":-112,"to":-38,"ys":[-7,3]},"BELT_Z":8,"STATIONS":{"start":-118,"press":-30,"gate":34,"wallet":86},"HELD":{"x":44,"y":14,"w":24,"d":22,"r":2,"h":5},"PUSHER":{"x":52,"y":-30,"w":10,"d":8},"T":{"out":[0.2,0.7],"track":[0.7,1.7],"down":[1.8,2.05],"up":[2.05,2.5],"belt":[2.6,3.6],"check":[3.6,4.2],"go":[4.2,5],"push":[4.3,4.9],"loop":6.2}};
const K = { cylinder, solidSvg, lineSvg, dotsSvg, pathOf, iso, depthOf };
for (const stage of document.querySelectorAll('[data-figure="token-mint"]:not([data-iso-ready])')) { stage.setAttribute('data-iso-ready', '');
  const svg = stage.querySelector('svg');
  const q = (name) => svg.querySelector('[data-part="' + name + '"]');
  const barEl = q('bar'), ramEl = q('ram'), tokenEl = q('token'), heldEl = q('held-token'), pusherEl = q('pusher');
  const needleEl = q('needle'), gateLed = q('gate-led'), walletLed = q('wallet-led');
  const figure = stage.closest('.iso-figure');
  const readout = figure.querySelector('[data-readout]');
  const pins = Object.fromEntries([...stage.querySelectorAll('[data-pin]')].map((el) => [el.dataset.pin, el]));
  const steps = [...figure.querySelectorAll('[data-step]')];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const span = (t, [a, b]) => clamp((t - a) / (b - a), 0, 1);
  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const T = C.T, S = C.STATIONS;
  let prevT = 0, cycle = 0, reserve = 12, supply = 12, held = 0, shown = '', lastRam = '', lastNeedle = '';

  function draw(t) {
    if (t < prevT) cycle++;
    prevT = t;
    const blocked = cycle % 3 === 2;
    // The bar leaves the vault, rides the track and sits on the anvil.
    const out = ease(span(t, T.out)), ride = ease(span(t, T.track));
    const minted = t >= T.down[1];
    const bx = S.start + (S.press - S.start) * ride - 8 * (1 - out);
    barEl.setAttribute('transform', translateAlong(P, [bx, -2, (C.BELT_Z - 6) * ride]));
    barEl.setAttribute('opacity', t >= T.out[0] && !minted ? '1' : '0');
    // The ram comes down hard and lifts back on its spring.
    const down = t < T.down[1] ? span(t, T.down) ** 2 : 1 - ease(span(t, T.up));
    const dz = -(C.PRESS.rest - C.BELT_Z - 2.6) * (t >= T.down[0] && t < T.up[1] ? down : 0);
    const ramKey = dz.toFixed(2);
    if (ramKey !== lastRam) { lastRam = ramKey; ramEl.innerHTML = ramLive(K, P, C, dz, vcoil); }
    // The meter counts the bar as it leaves; supply goes up at the stamp.
    const counted = t >= T.out[1];
    const turn = (counted ? 1 : 0) * 0.32 + ((cycle % 6) * 0.32);
    const needleKey = turn.toFixed(2);
    if (needleKey !== lastNeedle) { lastNeedle = needleKey; needleEl.innerHTML = meterNeedle(K, P, C, turn); }
    // The token rides the belt to the gate, then on or aside.
    const belt = ease(span(t, T.belt));
    let tx = S.press + (S.gate - S.press) * belt, ty = 0;
    let gone = false;
    if (!blocked) {
      tx += (S.wallet - S.gate) * ease(span(t, T.go));
      gone = t >= T.go[1] - 0.05;
    } else {
      const push = ease(span(t, T.push));
      ty = (C.HELD.y + C.HELD.d / 2) * push;
      tx = S.gate + (C.HELD.x + C.HELD.w / 2 - S.gate) * push;
      pusherEl.setAttribute('transform', translateAlong(P, [0, 14 * Math.sin(span(t, T.push) * Math.PI), 0]));
      gone = t >= T.push[1];
    }
    tokenEl.setAttribute('transform', translateAlong(P, [tx, ty, ty > 4 ? -(C.BELT_Z - 1.2) * span(t, [T.push[0] + 0.3, T.push[1]]) : 0]));
    tokenEl.setAttribute('opacity', minted && !gone ? '1' : '0');
    heldEl.setAttribute('transform', translateAlong(P, [C.HELD.x + C.HELD.w / 2, C.HELD.y + C.HELD.d / 2, -(C.BELT_Z - 1.2)]));
    heldEl.setAttribute('opacity', blocked && gone ? '1' : held ? '0.55' : '0');
    // Lights: the gate checks, then shows the answer; the wallet blinks on delivery.
    const checking = t >= T.check[0] && t < T.check[1];
    const decided = t >= T.check[1] && t < T.loop - 0.4;
    gateLed.dataset.state = decided ? (blocked ? 'bad' : 'ok') : '';
    gateLed.setAttribute('opacity', checking ? String(0.4 + 0.6 * Math.abs(Math.sin(t * 14))) : decided ? '1' : '0.25');
    walletLed.dataset.state = !blocked && t >= T.go[1] - 0.1 ? 'ok' : '';
    walletLed.setAttribute('opacity', !blocked && t >= T.go[1] - 0.1 && t < T.loop - 0.3 ? '1' : '0.25');
    // Labels, steps and readout.
    let stage, on;
    if (t < T.out[1]) { stage = 'custody'; on = ['vault']; }
    else if (t < T.down[0]) { stage = 'reserve'; on = ['reserve']; }
    else if (t < T.belt[1]) { stage = 'mint'; on = ['press']; }
    else if (t < T.check[1]) { stage = 'check'; on = ['gate']; }
    else { stage = 'check'; on = blocked ? ['gate', 'held'] : ['gate', 'wallet']; }
    const r = reserve + (cycle % 6) + (counted ? 1 : 0), s = supply + (cycle % 6) + (minted ? 1 : 0);
    const msg = t >= T.check[1] && blocked ? 'investor over the limit · held for review' : 'reserve ' + r + ' bars · supply ' + s + ' tokens';
    const key = on.join() + '|' + msg;
    if (key !== shown) {
      shown = key;
      for (const [id, el] of Object.entries(pins)) { el.toggleAttribute('data-on', on.includes(id)); el.toggleAttribute('data-dim', !on.includes(id)); }
      for (const st of steps) st.toggleAttribute('data-on', st.dataset.step === stage);
      if (readout) readout.textContent = msg;
    }
  }
  playFigure(stage, (t) => draw(t), {
    loop: T.loop,
    stillAt: T.belt[1] + 0.2,
    seek: { custody: 0, reserve: T.out[1], mint: T.down[0] - 0.1, check: T.belt[0] + 0.6 },
  });
}

};
(window.__isoRun ||= {})["token-mint"] = run;
window.IsoKit ? run() : window.addEventListener('isokit', run, { once: true });
}