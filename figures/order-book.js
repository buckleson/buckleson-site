{
const run = () => {
const { AZIMUTH, ELEVATION, ISO_CSS, SHADES, axisVector, boxCorners, cameraOf, circleRing, coil, corners, cylinder, depthOf, dotGrid, dotsSvg, extrude, faceTextSvg, fadeLineSvg, fadedSvg, figureSvg, fitProjection, groupSvg, haloOf, holdStill, insetPlan, iso, joinPaths, knurl, lineOnTop, lineSvg, onTop, pageHtml, pathOf, planOutline, plateHtml, pointsAt, radialTicks, ring, ringOf, ringSeam, rise, roundedPlan, screenRise, segment, sideArc, sideMatrix, sideRing, sideSeam, sideTicks, slabOf, solidSvg, topMatrix, topTicks, towardViewer, translateAlong, wireSvg } = window.IsoKit;

function chipSvg(K, P, C, lit) {
  // One order chip at the origin, on the rail height.
  const plan = { x: -C.CHIP.w / 2, y: -C.CHIP.d / 2, w: C.CHIP.w, d: C.CHIP.d, r: 1.2 };
  const z = C.RAIL_Z;
  return (
    K.solidSvg(K.slabOf(plan, z, C.CHIP.h, P, 2, 0.4), { tone: lit ? 'hi' : 'mid', lit }) +
    K.lineSvg(K.lineOnTop([plan.x + 3, 0], [plan.x + C.CHIP.w - 3, 0], z + C.CHIP.h, P), { tone: 'mid', free: true }) +
    K.lineSvg(K.lineOnTop([plan.x + 3, -2.6], [plan.x + 8, -2.6], z + C.CHIP.h, P), { tone: 'faint', free: true })
  );
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
const P = {"origin":[367.65151464182645,208.95362999123435],"scale":1.8236975624590435,"azimuth":48,"elevation":30};
const C = {"CHIP":{"w":15,"d":13,"h":4.5},"RAIL_Z":6,"MAG":{"xs":[-118,118],"y":0,"w":24,"d":22,"h":46,"count":5},"RAIL":{"y":-7,"d":14,"from":94,"to":18},"JAW":{"open":34,"shut":17,"w":7,"d":20,"h":12},"SHELF":{"x":-70,"y":-58,"w":154,"d":20,"h":10},"LANE":{"x":0,"from":42,"to":22,"w":15},"BARRIER":{"y":28},"MATCH":{"w":44,"d":32,"h":8},"T":{"eject":[0.2,0.6],"slide":[0.6,1.6],"cut":[0.7,1.5],"retreat":[2.6,3.2],"clamp":[1.6,2],"vote":[2,2.6],"lock":[2.6,2.9],"lift":[3,3.5],"back":[3.5,4.4],"open":[3.2,3.6],"loop":5.6},"SLOT_X":71.5};
const K = { slabOf, solidSvg, lineSvg, lineOnTop };
for (const stage of document.querySelectorAll('[data-figure="order-book"]:not([data-iso-ready])')) { stage.setAttribute('data-iso-ready', '');
  const svg = stage.querySelector('svg');
  const q = (name) => svg.querySelector('[data-part="' + name + '"]');
  const bid = q('bid'), ask = q('ask'), trade = q('trade'), cutter = q('cutter'), chain = q('chain');
  const jawBid = q('jaw-bid'), jawAsk = q('jaw-ask'), lockLed = q('lock-led'), barrierLed = q('barrier-led');
  const stacks = [...svg.querySelectorAll('[data-stack]')];
  const votes = [...svg.querySelectorAll('[data-validator]')];
  const figure = stage.closest('.iso-figure');
  const readout = figure.querySelector('[data-readout]');
  const pins = Object.fromEntries([...stage.querySelectorAll('[data-pin]')].map((el) => [el.dataset.pin, el]));
  const steps = [...figure.querySelectorAll('[data-step]')];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const span = (t, [a, b]) => clamp((t - a) / (b - a), 0, 1);
  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const T = C.T;
  let prevT = 0, cycle = 0, shown = '';

  function draw(t) {
    if (t < prevT) cycle++;
    prevT = t;
    const cutting = cycle % 3 === 1;
    // Both front orders eject and ride to the middle.
    const out = ease(span(t, T.eject)), ride = ease(span(t, T.slide));
    const start = C.MAG.xs[1] - 6 * (1 - out);
    const meet = C.CHIP.w / 2 + 0.6;
    const x = start + (meet - start) * ride;
    const lifted = ease(span(t, T.lift)), back = ease(span(t, T.back));
    const merged = t >= T.lock[1];
    bid.setAttribute('transform', translateAlong(P, [-x, 0, 0]));
    ask.setAttribute('transform', translateAlong(P, [x, 0, 0]));
    bid.setAttribute('opacity', merged ? '0' : '1');
    ask.setAttribute('opacity', merged ? '0' : '1');
    // The stacks drop one place as the front order leaves.
    const drop = (C.CHIP.h + 0.6) * (1 - ease(span(t, [T.slide[0], T.slide[0] + 0.4])));
    const h = C.CHIP.h + 0.6;
    const sink = -h * ease(span(t, [T.slide[0], T.slide[0] + 0.4])) * (1 - ease(span(t, [T.loop - 0.5, T.loop])));
    stacks.forEach((s) => s.setAttribute('transform', translateAlong(P, [0, 0, sink])));
    // The jaws clamp, then open after the lift.
    const shut = ease(span(t, T.clamp)) * (1 - ease(span(t, T.open)));
    const dj = (C.JAW.open - C.JAW.shut) * shut;
    jawBid.setAttribute('transform', translateAlong(P, [dj, 0, 0]));
    jawAsk.setAttribute('transform', translateAlong(P, [-dj, 0, 0]));
    // Validators agree, the lock turns green, the trade lifts to the chain.
    votes.forEach((v, i) => {
      const lit = t >= T.vote[0] + i * 0.08 && t < T.back[1];
      v.setAttribute('opacity', lit ? '1' : '0.25');
      v.dataset.state = t >= T.vote[1] && t < T.back[1] ? 'ok' : '';
    });
    lockLed.dataset.state = t >= T.lock[0] && t < T.back[1] ? 'ok' : '';
    lockLed.setAttribute('opacity', t >= T.lock[0] && t < T.back[1] ? '1' : '0.25');
    // The trade lifts off the matcher and lands at the end of the chain.
    const tz = 8 * lifted + (C.SHELF.h - C.RAIL_Z - 8) * back;
    trade.setAttribute('transform', translateAlong(P, [C.SLOT_X * back, (C.SHELF.y + 3 + C.CHIP.d / 2) * back, tz]));
    trade.setAttribute('opacity', merged && t < T.loop - 0.3 ? '1' : '0');
    // A third order tries to cut in from the front lane.
    if (cutting) {
      const inn = ease(span(t, T.cut)), outn = ease(span(t, T.retreat));
      const cy = C.LANE.from - (C.LANE.from - C.BARRIER.y - 7) * inn * (1 - outn);
      cutter.setAttribute('transform', translateAlong(P, [0, cy, 0]));
      cutter.setAttribute('opacity', t >= T.cut[0] - 0.1 && t < T.retreat[1] ? '1' : '0');
      cutter.classList.toggle('fig-bad', t >= T.cut[1] - 0.1);
    } else cutter.setAttribute('opacity', '0');
    const stopped = cutting && t >= T.cut[1] - 0.1 && t < T.retreat[1];
    barrierLed.dataset.state = stopped ? 'bad' : '';
    barrierLed.setAttribute('opacity', stopped ? '1' : '0.25');
    // Labels, steps and readout.
    let stage, on;
    if (t < T.slide[1]) { stage = 'queue'; on = stopped ? ['bids', 'asks', 'barrier'] : ['bids', 'asks']; }
    else if (t < T.lock[0]) { stage = 'match'; on = stopped ? ['match', 'barrier'] : ['match']; }
    else if (t < T.lift[0]) { stage = 'settle'; on = ['lock']; }
    else { stage = 'final'; on = ['chain']; }
    const fill = 48213 + cycle;
    const msg = stopped && t < T.lock[0] ? 'order tried to cut in · stopped at the barrier' : 'fill #' + fill.toLocaleString('en-US') + ' · 0.50 ETH @ 3,412.20 · ' + (t >= T.lock[0] ? 'settled' : 'matching');
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
    stillAt: T.lock[1] + 0.05,
    seek: { queue: 0, match: T.clamp[0], settle: T.lock[0], final: T.lift[0] },
  });
}

};
(window.__isoRun ||= {})["order-book"] = run;
window.IsoKit ? run() : window.addEventListener('isokit', run, { once: true });
}