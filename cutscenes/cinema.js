(() => {
  "use strict";

  const glScript = document.createElement("script");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  glScript.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
  glScript.async = true;
  if (!window.THREE) document.head.append(glScript);

  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (t) => Math.max(0, Math.min(1, t));
  const ease = (t) => {
    const x = clamp(t);
    return x * x * (3 - 2 * x);
  };
  const tau = Math.PI * 2;

  function random(seed) {
    return () => {
      seed = (1664525 * seed + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }

  function createStage(T, palette) {
    const scene = new T.Scene();
    scene.background = new T.Color(palette.sky);
    scene.fog = new T.FogExp2(palette.fog, palette.density);
    const camera = new T.PerspectiveCamera(43, 1, .08, 220);
    scene.add(new T.HemisphereLight(palette.fill, palette.ground, palette.ambient));
    const sun = new T.DirectionalLight(palette.key, palette.intensity);
    sun.position.set(...palette.direction);
    scene.add(sun);

    const material = (color, options = {}) => new T.MeshStandardMaterial({color, roughness: .78, ...options});
    const cache = new Map();
    const shape = (key, build) => {
      if (!cache.has(key)) cache.set(key, build());
      return cache.get(key);
    };
    const mesh = (parent, geometry, mat, x, y, z) => {
      const result = new T.Mesh(geometry, mat);
      result.position.set(x, y, z);
      parent.add(result);
      return result;
    };
    const group = (parent, x = 0, y = 0, z = 0) => {
      const node = new T.Group();
      node.position.set(x, y, z);
      parent.add(node);
      return node;
    };
    function box(parent, mat, x, y, z, width, height, depth) {
      const node = mesh(parent, shape("box", () => new T.BoxGeometry()), mat, x, y, z);
      node.scale.set(width, height, depth);
      return node;
    }
    function oval(parent, mat, x, y, z, width, height, depth) {
      const node = mesh(parent, shape("oval", () => new T.SphereGeometry(1, 20, 12)), mat, x, y, z);
      node.scale.set(width, height, depth);
      return node;
    }
    function taper(parent, mat, x, y, z, top, bottom, height, sides = 12) {
      return mesh(parent, shape(`c:${top}:${bottom}:${height}:${sides}`, () =>
        new T.CylinderGeometry(top, bottom, height, sides)), mat, x, y, z);
    }
    function line(parent, mat, a, b, radius, tip = radius) {
      const start = new T.Vector3(...a), end = new T.Vector3(...b);
      const delta = end.clone().sub(start);
      const mid = start.addScaledVector(delta, .5);
      const node = taper(parent, mat, mid.x, mid.y, mid.z, tip, radius, delta.length(), 8);
      node.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), delta.normalize());
      return node;
    }
    function shot(from, to, target, endTarget, progress) {
      const t = ease(progress);
      camera.position.set(...from.map((value, i) => lerp(value, to[i], t)));
      camera.lookAt(...target.map((value, i) => lerp(value, endTarget[i], t)));
    }
    return {T, scene, camera, sun, material, shape, mesh, group, box, oval, taper, line, shot};
  }

  function surface(stage, type, base, mortar) {
    const {T, material} = stage;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext("2d");
    const rng = random(719);
    const wood = type === "wood";
    const width = wood ? 32 : 64;
    const height = wood ? 256 : 32;
    ctx.fillStyle = mortar;
    ctx.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += height) {
      for (let x = wood || y % 64 === 0 ? 0 : -32; x < 256; x += width) {
        ctx.fillStyle = base;
        ctx.fillRect(x + 1, y + 1, width - 2, height - 2);
        ctx.fillStyle = rng() > .5 ? `rgba(249,221,174,${rng() * .15})` : `rgba(10,10,14,${rng() * .32})`;
        ctx.fillRect(x + 1, y + 1, width - 2, height - 2);
        ctx.fillStyle = "rgba(245,222,192,.2)";
        ctx.fillRect(x + 2, y + 2, width - 4, 1);
      }
    }
    for (let i = 0; i < 4300; i++) {
      ctx.fillStyle = rng() < .5 ? "rgba(247,218,182,.10)" : "rgba(6,10,15,.14)";
      ctx.fillRect(rng() * 256, rng() * 256, wood ? 1 : rng() * 3, wood ? 5 + rng() * 20 : 1 + rng() * 2);
    }
    const map = new T.CanvasTexture(canvas);
    map.encoding = T.sRGBEncoding;
    return material(0xffffff, {map, roughness: wood ? .55 : .88});
  }

  function night() {
    return {sky: 0x101c2a, fog: 0x152936, density: .032, fill: 0x88baf0, ground: 0x5d352b,
      ambient: .53, key: 0x9dc7f5, intensity: 1.07, direction: [-7, 9, -12]};
  }

  function wallpaper(s) {
    const paint = document.createElement("canvas");
    paint.width = paint.height = 128;
    const ctx = paint.getContext("2d");
    ctx.fillStyle = "#412637";
    ctx.fillRect(0,0,128,128);
    ctx.strokeStyle = "#755052";
    for (const [x,y] of [[0,0],[128,0],[0,128],[128,128],[64,64]]) {
      ctx.beginPath();
      ctx.moveTo(x,y-63);ctx.lineTo(x+64,y);ctx.lineTo(x,y+63);ctx.lineTo(x-64,y);
      ctx.closePath();ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x,y-26);ctx.bezierCurveTo(x-30,y-13,x+27,y+7,x,y+26);
      ctx.bezierCurveTo(x-27,y+7,x+30,y-13,x,y-26);ctx.stroke();
    }
    const map = new s.T.CanvasTexture(paint);
    map.encoding=s.T.sRGBEncoding;
    map.wrapS=map.wrapT=s.T.RepeatWrapping;
    map.repeat.set(9,4);
    return s.material(0xffffff,{map});
  }

  function goldOwl(s, parent, x, y, z, scale) {
    const {T, group, oval, taper, material} = s;
    const bird = group(parent, x, y, z);
    bird.scale.setScalar(scale);
    const bronze = material(0xb97c29, {roughness: .28, metalness: .38});
    const gold = material(0xf6b642, {roughness: .25, metalness: .22, emissive: 0x703500, emissiveIntensity: .14});
    const eyeRim = material(0xffdb84);
    const eyes = material(0x231511);
    taper(bird, bronze, 0, .08, 0, .35, .46, .16);
    taper(bird, gold, 0, .21, 0, .27, .33, .12);
    oval(bird, gold, 0, .60, 0, .33, .39, .23);
    oval(bird, bronze, 0, .98, .03, .36, .29, .25);
    for (const sign of [-1, 1]) {
      const wing = oval(bird, bronze, sign * .25, .62, .035, .13, .32, .21);
      wing.rotation.z = -sign * .21;
      const tuft = taper(bird, gold, sign * .24, 1.22, 0, 0, .115, .24, 5);
      tuft.rotation.z = -sign * .24;
      oval(bird, eyeRim, sign * .15, 1.02, .245, .132, .133, .06);
      oval(bird, eyes, sign * .15, 1.02, .299, .057, .063, .026);
    }
    const beak = taper(bird, gold, 0, .90, .29, .105, 0, .17, 4);
    beak.rotation.y = Math.PI / 4;
    return bird;
  }

  function owlPerson(s, parent, look) {
    const {group, oval, taper, line, material} = s;
    const person = group(parent);
    const body = material(look.coat);
    const plumage = material(look.face);
    const cream = material(look.cream);
    const deep = material(0x20171a);
    const gold = material(0xf0af43, {roughness: .33, metalness: .27});
    oval(person, deep, -.23, .13, .10, .20, .12, .33);
    oval(person, deep, .23, .13, .10, .20, .12, .33);
    oval(person, body, 0, .71, 0, .52, .65, .36);
    oval(person, plumage, 0, 1.46, .015, .56, .46, .43);
    for (const sign of [-1, 1]) {
      oval(person, cream, .215 * sign, 1.52, .335, .26, .255, .16);
      oval(person, deep, .184 * sign, 1.52, .475, .088, .115, .036);
      oval(person, cream, .166 * sign, 1.565, .506, .022, .025, .012);
    }
    taper(person, gold, 0, 1.37, .48, .135, 0, .24, 4).rotation.y = Math.PI / 4;
    oval(person, body, -.48, .83, .10, .145, .34, .18).rotation.z = -.26;
    const arm = group(person, .43, .99, .13);
    oval(arm, body, 0, -.20, 0, .15, .36, .18);
    if (look.crown) {
      taper(person, gold, 0, 1.91, .015, .43, .34, .24);
      for (let i = 0; i < 8; i++) {
        const a = i * tau / 8;
        taper(person, gold, Math.cos(a) * .395, 2.085, Math.sin(a) * .395, .018, .077, .17, 5);
      }
      const jewel = material(0x9d2d35, {emissive: 0x752627, emissiveIntensity: .20});
      oval(person, jewel, 0, 1.932, .407, .095, .085, .035);
      line(arm, gold, [.045, -.40, .08], [.045, -.40, 1.03], .027, .038);
      oval(arm, gold, .045, -.4, 1.03, .095, .095, .095);
      oval(arm, jewel, .045, -.4, 1.03, .067, .118, .067);
    } else {
      taper(person, body, 0, 1.837, .04, .41, .48, .23);
      oval(person, body, 0, 1.76, .12, .66, .065, .53);
      taper(person, deep, 0, 1.78, .045, .473, .49, .065);
    }
    return {person, arm};
  }

  function point(s, parent, color, x, y, z, intensity, distance) {
    const node = new s.T.PointLight(color, intensity, distance, 1.6);
    node.position.set(x, y, z);
    parent.add(node);
    return node;
  }

  function weather(s, count, bounds, mode) {
    const {T, scene} = s;
    const rng = random(7759);
    const source = Array.from({length: count}, () => [rng(), rng(), rng()]);
    const rain = mode === "rain";
    const positions = new Float32Array(count * (rain ? 6 : 3));
    const geometry = new T.BufferGeometry();
    const pos = new T.BufferAttribute(positions, 3).setUsage(T.DynamicDrawUsage);
    geometry.setAttribute("position", pos);
    const appearance = rain
      ? new T.LineBasicMaterial({color: 0xaad1f2, transparent: true, opacity: .29, depthWrite: false})
      : new T.PointsMaterial({color: 0xffc472, transparent: true, opacity: .68, size: .045, depthWrite: false});
    const particles = rain ? new T.LineSegments(geometry, appearance) : new T.Points(geometry, appearance);
    particles.frustumCulled = false;
    scene.add(particles);
    return (t) => {
      const [width, height, depth, centerZ] = bounds;
      for (let i = 0; i < count; i++) {
        const [a, b, c] = source[i];
        const x = (a - .5) * width + (rain ? Math.sin(b * 8) * .4 : Math.cos(b * 10 + t) * .6);
        const y = ((b + t * (rain ? -1.45 : .10) * (.7 + c)) % 1 + 1) % 1 * height;
        const z = (c - .5) * depth + centerZ;
        const at = i * (rain ? 6 : 3);
        positions[at] = x; positions[at + 1] = y; positions[at + 2] = z;
        if (rain) {
          positions[at + 3] = x + .08; positions[at + 4] = y - .4; positions[at + 5] = z + .018;
        }
      }
      pos.needsUpdate = true;
    };
  }

  function arch(s, parent, x, y, z, width, height, pane, frame) {
    const {T, group, mesh, box, line} = s;
    const opening = group(parent, x, y, z);
    const w = width / 2, h = height - w;
    const outline = new T.Shape();
    outline.moveTo(-w, 0);
    outline.lineTo(w, 0);
    outline.lineTo(w, h);
    outline.absarc(0, h, w, 0, Math.PI, false);
    outline.lineTo(-w, 0);
    mesh(opening, new T.ShapeGeometry(outline), pane, 0, 0, 0);
    for (const side of [-1, 1]) {
      box(opening, frame, side * w, h / 2, .06, .075, h, .1);
    }
    const rim = new T.TorusGeometry(w, .042, 6, 24, Math.PI);
    mesh(opening, rim, frame, 0, h, .059);
    line(opening, frame, [-w, 0, .06], [w, 0, .06], .055);
    return opening;
  }

  function manorFloor(s, type) {
    const stone = type === "stone";
    const tile = surface(s, type, stone ? "#37464d" : "#563224", stone ? "#14232d" : "#24191b");
    tile.map.wrapS = tile.map.wrapT = s.T.RepeatWrapping;
    tile.map.repeat.set(stone ? 11 : 7, stone ? 10 : 5);
    const plane = s.mesh(s.scene, new s.T.PlaneGeometry(50, 55), tile, 0, 0, 0);
    plane.rotation.x = -Math.PI / 2;
  }

  function trophyStand(s, parent, x, z) {
    const wood = surface(s, "wood", "#623c25", "#381d16");
    const trim = s.material(0x9d6537);
    const red = s.material(0x581d28, {roughness: 1});
    s.box(parent, wood, x, .62, z, 1.05, 1.22, .89);
    s.box(parent, trim, x, .085, z, 1.20, .17, 1.02);
    s.box(parent, trim, x, 1.27, z, 1.22, .17, 1.01);
    s.box(parent, red, x, 1.38, z, 1.03, .10, .82);
    return goldOwl(s, parent, x, 1.43, z, .76);
  }

  function conservatory(s) {
    const {T, scene, box, group, material, line, oval, shot} = s;
    manorFloor(s, "stone");
    const strut = material(0x29454b, {metalness: .32});
    const glass = new T.MeshBasicMaterial({color: 0x507588, transparent: true, opacity: .27, side: T.DoubleSide, depthWrite: false});
    const eclipse = new T.MeshBasicMaterial({color: 0xdfebd2, fog: false});
    oval(scene, eclipse, -12, 9.4, -36, 2.05, 2.05, .3);
    for (let i = -3; i <= 3; i++) {
      const x = i * 2.4;
      const window = arch(s, scene, x, .55, -6.6, 2.38, 6.4, glass, strut);
      box(window, strut, 0, 2.7, .10, .055, 5.3, .06);
      for (const y of [1.50, 3.35, 4.55]) box(window, strut, 0, y, .08, 2.38, .048, .065);
      box(scene, strut, x, .31, -6.65, 2.39, .62, .26);
      line(scene, strut, [x, 6.2, -6.6], [x, 7.7, -2], .044);
      line(scene, strut, [x, 7.7, -2], [x, 7.7, 2.8], .044);
    }
    const pottery = material(0x50342f);
    const plant = material(0x2e5849);
    for (const sign of [-1,1]) {
      for (const z of [-4.2,-1.8]) {
        const side = arch(s,scene,sign*8.41,.55,z,2.4,6.4,glass,strut);
        side.rotation.y = -sign*Math.PI/2;
        box(side,strut,0,2.35,.07,.065,4.7,.08);
        for (const y of [1.50,3.35,4.55]) box(side,strut,0,y,.08,2.4,.049,.07);
      }
      const pot = group(scene,sign*3.8,0,-4.1);
      s.taper(pot,pottery,0,.45,0,.49,.32,.90);
      for (let i=0;i<9;i++) {
        const a=i*tau/9;
        const leaves=oval(pot,plant,Math.cos(a)*.42,1.36+(i%3)*.23,Math.sin(a)*.42,.14,.67,.23);
        leaves.rotation.set(.40*Math.sin(a),0,-.6*Math.cos(a));
      }
    }
    const stand = trophyStand(s, scene, 0, -1.35);
    const lid = group(scene, 0, 2.40, -1.82);
    box(lid, glass, 0, 0, .48, 1.14, .032, .96);
    for (const x of [-.56,.56]) {
      box(lid, strut, x, 0, .48, .027, .043, .97);
      box(scene, strut, x, 1.89, -1.83, .026, 1.02, .026);
    }
    box(lid, strut, 0, 0, .96, 1.14, .043, .03);
    const shadow = group(scene, 2.4, 0, -1.2);
    const cloak = material(0x121925, {roughness: 1});
    const blank = material(0x040710);
    s.taper(shadow, cloak, 0, .66, 0, .26, .65, 1.35, 10);
    oval(shadow, cloak, 0, 1.48, 0, .40, .49, .33);
    oval(shadow, blank, 0, 1.49, .28, .285, .31, .11);
    const reach = group(shadow, -.23, 1.18, .14);
    oval(reach, cloak, -.31, 0, 0, .46, .125, .13);
    const warm = point(s, scene, 0xffad56, -.25, 2.95, .45, 3.4, 9);
    const storm = point(s, scene, 0xcce8ff, -4, 5, -4, 1.2, 21);
    const rain = weather(s, 380, [22, 11, 6, -10], "rain");
    return (t) => {
      const cue = t % 8.5;
      const take = ease((cue - 2.1) / 1.55);
      const exit = ease((cue - 4.45) / 2.1);
      shadow.position.x = lerp(2.7, 1.16, ease(cue / 2.4)) + 3.6 * exit;
      reach.rotation.z = lerp(.85, -.20, take) + exit * .56;
      lid.rotation.x = -.95 * ease((cue - 1.55) / .8) * (1 - ease((cue - 4.4) / .9));
      stand.position.set(lerp(0, shadow.position.x - .54, take), 1.43 - take * .2, -1.35 + take * .29);
      stand.rotation.y = -.45 + take * .6;
      storm.intensity = 1.3 + 5.7 * Math.max(0, 1 - Math.abs(cue - .8) * 7);
      warm.intensity = 3.3 + Math.sin(t * 4) * .24;
      rain(t);
      shot([5.1, 3.0, 8.6], [2.45, 2.60, 6.8], [.32, 1.78, -1.2], [.43, 1.75, -1.1], t / 6.5);
    };
  }

  function arrival(s) {
    const {T, scene, box, oval, group, material, shot} = s;
    manorFloor(s, "stone");
    const masonry = surface(s, "stone", "#484f57", "#222a35");
    const facade = surface(s,"stone","#5b5552","#242430");
    facade.map.wrapS = facade.map.wrapT = T.RepeatWrapping;
    facade.map.repeat.set(4,1.3);
    const iron = material(0x2b3942, {roughness: .3, metalness: .4});
    const dark = material(0x16171e);
    const enamel = material(0x264243, {metalness: .42, roughness: .21});
    const brass = material(0xbb9c68, {metalness: .48, roughness: .34});
    const lamp = new T.MeshBasicMaterial({color: 0xef9c4e, toneMapped:false});
    box(scene, facade, 0, 2.9, -8.4, 22, 5.8, 2.3);
    const roof = s.taper(scene, dark, 0, 7.45, -8.35, 0, 12, 3.5, 4);
    roof.rotation.y = Math.PI / 4;
    roof.scale.z = .34;
    for (const x of [-9,-6,-3,0,3,6,9]) {
      const panel = arch(s, scene, x, 2.36, -7.2, x === 0 ? 1.63 : 1.07, 2.62, lamp, iron);
      box(panel, iron, 0, 1.16, .12, .056, 2.31, .13);
      box(panel, iron, 0, 1.45, .11, 1.06, .052, .13);
    }
    for (const sign of [-1,1]) {
      box(scene, masonry, sign * 5.1, 1.96, -3.2, .92, 3.92, .86);
      box(scene, iron, sign * 5.1, 3.97, -3.2, 1.12, .18, 1.12);
      oval(scene, lamp, sign * 5.1, 4.27, -3.2, .19, .31, .19);
      point(s, scene, 0xffb85d, sign * 5.1, 4.25, -2.9, 2.9, 13);
      for (let i = 1; i <= 10; i++) {
        const x = sign * (5.35 + i * .45);
        box(scene, iron, x, 1.56 + Math.sin(i * .22) * .16, -3.2, .050, 2.82, .065);
      }
      box(scene, iron, sign * 7.95, 2.18, -3.2, 5.3, .075, .084);
    }
    const car = group(scene, -.6, .1, 0);
    car.rotation.y = -.38;
    box(car, enamel, 0, .61, 0, 4.9, .65, 1.8);
    box(car, enamel, 1.53, 1.00, 0, 1.70, .41, 1.40);
    box(car, brass, 2.40, .86, 0, .088, .84, 1.12);
    for (let i = -5; i <= 5; i++) box(car, dark, 2.455, .88, i * .085, .027, .64, .023);
    box(car, iron, 2.54, .51, 0, .13, .13, 2.01);
    box(car, dark, -.96, 2.00, 0, 2.77, .13, 1.65);
    for (const x of [-2.29,.35]) {
      for (const z of [-.75,.75]) s.line(car, enamel, [x,.9,z], [x + (x > 0 ? -.23 : .14),2,z], .072);
    }
    box(car, iron, -.94, 1.34, -.764, .079, .87, .065);
    box(car, iron, -1.37, 1.36, .767, .072, .87, .061);
    const coldGlass = new T.MeshBasicMaterial({color:0x718998, opacity:.39, transparent:true, depthWrite:false});
    box(car, coldGlass, .22, 1.5, 0, .039, .85, 1.5).rotation.z = .23;
    box(car, coldGlass, -1.79, 1.50, .76, .85, .83, .039);
    for (const x of [-1.67,1.69]) {
      for (const z of [-.86,.86]) {
        const sign = Math.sign(z);
        s.taper(car, dark, x, .51, z, .51, .51, .21, 24).rotation.x = Math.PI / 2;
        s.taper(car, brass, x, .51, z + sign * .106, .28, .28, .05, 20).rotation.x = Math.PI / 2;
        oval(car, enamel, x - .02, .87, z * .96, .72, .31, .34);
      }
    }
    for (const z of [-.69,.69]) {
      oval(car, brass, 2.43, 1.03, z, .19, .20, .20);
      oval(car, lamp, 2.56, 1.03, z, .082, .151, .156);
    }
    const pip = owlPerson(s, car, {coat: 0x68513e, face: 0x754d31, cream: 0xf1cc96});
    pip.person.position.set(-.59, .85, .25);
    pip.person.scale.setScalar(.54);
    pip.person.rotation.y = .25;
    const flame = oval(car, lamp, -.20, 1.53, .59, .031, .078, .03);
    const match = point(s, car, 0xff9c50, -.12, 1.59, .86, .3, 3);
    const smokeMat = new T.MeshBasicMaterial({color:0xb3c8c4, transparent:true, opacity:.12, depthWrite:false});
    const smoke = Array.from({length:8}, () => oval(car, smokeMat, 0, 0, 0, .1, .1, .1));
    const rain = weather(s, 600, [27, 13, 24, -3], "rain");
    return (t) => {
      const cue = t % 6;
      flame.visible = cue > .9 && cue < 3.2;
      match.intensity = flame.visible ? 1.5 + .3 * Math.sin(t * 22) : .2;
      pip.arm.rotation.x = lerp(.15, -.85, ease(cue - .65)) + .75 * ease(cue - 3.1);
      smoke.forEach((puff, i) => {
        const age = ((cue - 2.1 - i * .37) % 3 + 3) % 3;
        puff.visible = cue > 2.1 + i * .25;
        puff.position.set(-.48 - .14 * age, 1.55 + age * .25, .60 + age * .28);
        puff.scale.setScalar(.04 + age * .065);
      });
      rain(t);
      shot([6.8, 3.35, 8.6], [3.7, 2.55, 6.4], [.10, 1.41, -.72], [-.50, 1.53, -.48], t / 7.3);
    };
  }

  function foyer(s, ending) {
    const {T,scene,box,oval,group,material,line,shot} = s;
    manorFloor(s, "wood");
    const trim = surface(s, "wood", "#664331", "#332320");
    const paper = wallpaper(s);
    const stair = surface(s, "wood", "#554436", "#283531");
    const brass = material(0xc49a56, {roughness:.3, metalness:.28});
    const shadow = material(0x34252d);
    const carpet = material(0x752b39, {roughness: 1});
    const flame = new T.MeshBasicMaterial({color: 0xffdb94});
    box(scene, paper, 0, 3.9, -6.3, 18, 7.8, .26);
    box(scene, trim, 0, .78, -6.05, 18, 1.55, .28);
    box(scene, brass, 0, 1.57, -5.87, 18, .06, .15);
    arch(s, scene, 0, 0, -5.82, 2.75, 4.35, shadow, brass);
    for (const sign of [-1,1]) {
      box(scene, paper, sign * 8.95, 3.9, .15, .25, 7.8, 13);
      box(scene, trim, sign * 8.82, .77, .15, .25, 1.55, 13);
      for (let step = 0; step < 11; step++) {
        const x = sign * (1.15 + step * .45);
        const h = .21 + step * .27;
        box(scene, stair, x, .5 * h, -3.84, .52, h, 2.56);
        box(scene, trim, x, h, -3.84, .54, .082, 2.66);
        box(scene, carpet, x, h + .051, -3.88, .53, .025, 1.38);
        if (step % 2 === 0) s.taper(scene, brass, x, h + .41, -2.59, .036, .07, .83, 7);
      }
      line(scene, trim, [sign * 1.15,1.04,-2.59], [sign * 5.65,3.74,-2.59], .087);
      box(scene, trim, sign * 6.55, 1.44, -3.84, 1.55, 2.89, 2.62);
      for (const x of [sign * 3.9, sign * 7.5]) {
        oval(scene, flame, x, 4.01, -5.83, .083, .14, .09);
        box(scene, brass, x, 3.79, -5.83, .18, .19, .25);
        point(s, scene, 0xffad67, x, 4.03, -5.35, 1.75, 7.5);
      }
    }
    box(scene, carpet, 0, .029, .49, 2.09, .047, 10.5);
    for (const x of [-.96,.96]) box(scene, brass, x, .06, .49, .042, .013, 10.49);
    const chandelier = group(scene, 0, 4.32, -1.4);
    line(chandelier, brass, [0,0,0], [0,3,0], .039);
    s.taper(chandelier, brass, 0, -.06, 0, .23, .19, .28);
    for (let i = 0; i < 8; i++) {
      const a = i * tau / 8;
      const x = Math.cos(a) * .79, z = Math.sin(a) * .79;
      line(chandelier, brass, [0,-.18,0], [x,-.02,z], .044);
      oval(chandelier, flame, x, .17, z, .079, .13, .079);
    }
    const center = point(s, scene, 0xffad66, 0, 4.0, -1, 3.8, 16);
    const traveler = owlPerson(s, scene, ending
      ? {coat:0x403e60, face:0x898574, cream:0xe5d2ad}
      : {coat:0x53443d, face:0x77513b, cream:0xffd8a1});
    const trophy = ending ? trophyStand(s, scene, 1.40, -.25) : null;
    const dust = weather(s, 105, [12, 7, 12, -1], "dust");
    return (t) => {
      center.intensity = 3.8 + .2 * Math.sin(t * 3.2);
      chandelier.rotation.y = .045 * Math.sin(t * .9);
      dust(t * .33);
      if (trophy) {
        traveler.person.position.set(-.3, 0, -.63);
        traveler.person.rotation.y = .40;
        traveler.arm.rotation.x = -.62 + Math.sin(t * 3) * .17;
        shot([5.6, 3.10, 7.9], [3.9, 2.69, 6.65], [.92,1.65,-.35], [.94,1.6,-.32], t / 4.2);
      } else {
        traveler.person.position.set(-.22, Math.abs(Math.sin(t * 5.7)) * .08 * (1 - ease(t / 3)), -3.6 + 3.1 * ease(t / 3.9));
        traveler.arm.rotation.x = -.35 + Math.sin(t * 5.7) * .31 * (1 - ease(t / 4));
        traveler.person.rotation.y = -.1 + ease(t / 4.5) * .28;
        shot([4.7, 3.54, 8.3], [2.8, 2.76, 6.9], [0,1.92,-1.65], [0,1.73,-.85], t / 5.5);
      }
    };
  }

  function daylight(warm) {
    return {
      sky: warm ? 0x746b80 : 0x7597ab, fog: warm ? 0x765a6a : 0x64818e, density: .015,
      fill: 0xabcce7, ground: 0x564939, ambient: .61,
      key: warm ? 0xffbb82 : 0xffe1b3, intensity: 1.56, direction:[-7, 13, 10]
    };
  }

  function valley(s, warm) {
    const {T,scene,mesh,oval,material} = s;
    const sky = new T.ShaderMaterial({
      side:T.BackSide, depthWrite:false, fog:false,
      uniforms:{
        top:{value:new T.Color(warm ? 0x182b52 : 0x3f749a)},
        horizon:{value:new T.Color(warm ? 0xf4a778 : 0xd0d3b3)},
        sunTint:{value:new T.Color(0xffd48b)}
      },
      vertexShader:`
        varying vec3 direction;
        void main() {
          direction = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
        }`,
      fragmentShader:`
        uniform vec3 top, horizon, sunTint;
        varying vec3 direction;
        void main() {
          vec3 p = normalize(direction);
          float sun = max(dot(p, normalize(vec3(-.47,.23,-.86))),0.);
          vec3 color = mix(horizon, top, smoothstep(-.11,.70,p.y));
          color = mix(color,sunTint,pow(sun,14.)*.38);
          color += vec3(1.,.72,.35) * smoothstep(.9982,.99905,sun);
          float cloud = sin(p.x*22.+sin(p.z*13.))*.28 + sin(p.y*94.+p.x*23.)*.27;
          color = mix(color, horizon, smoothstep(.19,.48,cloud)*smoothstep(.02,.15,p.y)*(1.-smoothstep(.11,.43,p.y))*.36);
          gl_FragColor = vec4(color,1.);
          #include <tonemapping_fragment>
          #include <encodings_fragment>
        }`
    });
    const dome = mesh(scene, new T.SphereGeometry(153,32,22), sky, 0, 0, 0);
    dome.renderOrder = -10;

    function height(x, z) {
      const ridges = Math.max(0, Math.abs(x) - 8) * .29 + Math.max(0, -z-18) * .14;
      const contour = Math.sin(x * .22 + z * .14) + Math.cos(z * .29 - x * .19) + Math.sin(x * .83 + z * .74) * .36;
      return Math.min(.03, contour * .12) + ridges * Math.max(.1,.60 + contour * .29);
    }
    const ground = new T.PlaneGeometry(116, 132, 95, 99);
    ground.rotateX(-Math.PI / 2);
    ground.translate(0, 0, -22);
    const position = ground.getAttribute("position");
    const vineyard = new T.Color(0x576d46).convertSRGBToLinear();
    const mud = new T.Color(0x4d5a51).convertSRGBToLinear();
    const ridge = new T.Color(0x929a95).convertSRGBToLinear();
    const color = new T.Color(), colors = [];
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i), z = position.getZ(i);
      const y = height(x,z);
      position.setY(i,y);
      color.copy(vineyard).lerp(mud,clamp((Math.sin(x * .8 + z * .42) + Math.cos(z * 1.4)) * .2 + y * .025));
      color.lerp(ridge,clamp((y - 5) * .14));
      colors.push(color.r,color.g,color.b);
    }
    ground.setAttribute("color",new T.Float32BufferAttribute(colors,3));
    ground.computeVertexNormals();
    mesh(scene,ground,material(0xffffff, {vertexColors:true,flatShading:true}),0,0,0);

    const path = new T.BufferGeometry();
    const verts = [], indices = [];
    for (let i = 0; i <= 44; i++) {
      const z = i * 1.2 - 20;
      const center = 1.18 * Math.sin(z * .19);
      for (const sign of [-1,1]) {
        const x = center + sign * (1.2 + .26 * Math.sin(z * .36));
        verts.push(x, Math.max(height(x,z),0) + .01, z);
      }
      if (i) {
        const n = i * 2;
        indices.push(n-2,n,n-1,n-1,n,n+1);
      }
    }
    path.setAttribute("position",new T.Float32BufferAttribute(verts,3));
    path.setIndex(indices);
    path.computeVertexNormals();
    mesh(scene,path,material(0x9c8965,{side:T.DoubleSide}),0,0,0);

    const count = 196;
    const rng = random(152);
    const trunk = new T.InstancedMesh(new T.CylinderGeometry(.10,.17,1,6),material(0x4c422e),count);
    const needle = new T.InstancedMesh(new T.ConeGeometry(1,1,7),material(0x173024,{flatShading:true}),count * 2);
    const pose = new T.Object3D();
    for (let i = 0; i < count; i++) {
      const sign = rng() > .5 ? 1 : -1;
      const x = sign * (5.8 + rng() * 38);
      const z = -40 + rng() * 74;
      const y = height(x,z);
      const size = .7 + rng() * 1.63;
      pose.position.set(x, y + size * .32, z);
      pose.rotation.y = rng() * tau;
      pose.scale.set(size,size,size);
      pose.updateMatrix();
      trunk.setMatrixAt(i,pose.matrix);
      pose.position.y = y + 1.06 * size;
      pose.scale.set(size * .46,size * 1.45,size * .46);
      pose.updateMatrix();
      needle.setMatrixAt(i * 2,pose.matrix);
      pose.position.y += size * .45;
      pose.scale.multiplyScalar(.71);
      pose.updateMatrix();
      needle.setMatrixAt(i * 2 + 1,pose.matrix);
    }
    scene.add(trunk,needle);
  }

  function banner(s,parent,red,gold,x,y,z,width,height) {
    const {T,group,mesh,box} = s;
    const root = group(parent,x,y,z);
    const fabric = new T.PlaneGeometry(width,height,8,8);
    const source = fabric.attributes.position.array.slice();
    mesh(root,fabric,red,0,-height/2,.08);
    const emblem = s.taper(root,gold,0,-height*.48,.11, .19,.24,.16,4);
    emblem.rotation.z = Math.PI / 4;
    box(root,gold,0,0,.09,width+.18,.057,.065);
    return (t) => {
      const pos = fabric.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const offset = .5-source[i*3+1]/height;
        pos.setZ(i,Math.sin(t * 3.2 + source[i*3] * 4.4 + offset * 2) * offset * .13);
      }
      pos.needsUpdate = true;
      emblem.position.z = .14 + Math.sin(t * 3.2 + .95) * .06;
    };
  }

  function oakwood(s, scale = 1) {
    const {T,scene,box,oval,material,group,line} = s;
    const root = group(scene,0,0,-5.2);
    root.scale.setScalar(scale);
    const masonry = surface(s,"stone","#a0957d","#5b6059");
    const coping = material(0xbeb59a);
    const slate = material(0x313e4b,{flatShading:true});
    const iron = material(0x323639);
    const voidMat = new T.MeshBasicMaterial({color:0x2d2b2b});
    const oak = surface(s,"wood","#79553a","#412e27");
    const gold = material(0xe6b35d,{metalness:.18});
    const red = material(0x881327,{side:T.DoubleSide});
    const fire = new T.MeshBasicMaterial({color:0xffc86f});
    const animations = [];
    box(root,masonry,0,2,-.64,11,4.1,2);
    box(root,coping,0,4.02,.2,11,.22,2.1);
    for (let i = -7; i <= 7; i++) box(root,masonry,i*.72,4.31,.92,.43,.52,.46);
    for (const x of [-4.6,4.6,-2.85,2.85]) {
      const outer = Math.abs(x) > 4;
      const y = outer ? 4.55 : 5.72;
      const z = outer ? .64 : -2.15;
      const r = outer ? 1.0 : 1.18;
      s.taper(root,masonry,x,y/2,z,r*.95,r,y,10);
      s.taper(root,coping,x,y,z,r*1.13,r*.94,.32,10);
      s.taper(root,slate,x,y+.91,z,.10,r*1.14,1.69,10);
      line(root,iron,[x,y+1.58,z],[x,y+2.35,z],.035);
      box(root,red,x+.23,y+2.17,z,.45,.22,.032);
      for (const slitY of [2.25,y-.77]) box(root,voidMat,x,slitY,z+r*.946,.14,.43,.044);
      if (outer) animations.push(banner(s,root,red,gold,x,y-.6,z+r,1.02,1.37));
    }
    arch(s,root,0,.07,.46,2.38,3.15,oak,coping);
    for (const y of [.75,1.42,2.04]) box(root,iron,0,y,.54,2.25,.074,.068);
    for (const x of [-.22,.22]) oval(root,gold,x,1.27,.58,.07,.074,.044);
    box(root,oak,0,.06,2.10,2.47,.11,3.21);
    for (const sign of [-1,1]) {
      line(root,iron,[sign*1.22,.15,3.66],[sign*1.28,2.29,.61],.032);
      box(root,iron,sign*1.19,.07,2.10,.065,.067,3.18);
      oval(root,fire,sign*1.71,1.57,.64,.081,.18,.084);
      const glow = point(s,root,0xffa951,sign*1.71,1.57,.9,1.3,4);
      animations.push((t) => { glow.intensity = 1.3 + .22 * Math.sin(t * 11 + sign * 2); });
    }
    return (t) => animations.forEach((animate) => animate(t));
  }

  function fireDragon(s, parent, scale) {
    const {T, group, oval, taper, line, material, mesh} = s;
    const body = group(parent);
    body.scale.setScalar(scale);
    const scales = material(0x80151a,{flatShading:true,roughness:.66});
    const burgundy = material(0x46152a,{flatShading:true});
    const belly = material(0xb9663d);
    const horn = material(0xeabf83);
    const glow = new T.MeshBasicMaterial({color:0xffd767});
    oval(body,scales,0,0,0,.46,.46,1.13);
    oval(body,belly,0,-.24,.20,.37,.26,.83);
    line(body,scales,[0,.06,.62],[0,.49,1.15],.33,.24);
    const head=group(body,0,.48,1.30);
    oval(head,scales,0,.09,.06,.325,.294,.44);
    oval(head,burgundy,0,.005,.409,.23,.14,.30);
    for (const side of [-1,1]) {
      oval(head,glow,side*.246,.158,.256,.085,.06,.083);
      line(head,horn,[side*.20,.21,-.10],[side*.37,.51,-.35],.079,.011);
      line(body,burgundy,[side*.28,-.05,-.47],[side*.50,-.48,-.73],.17,.085);
      line(body,horn,[side*.50,-.48,-.73],[side*.54,-.55,-.43],.065,.017);
      line(body,burgundy,[side*.25,-.09,.54],[side*.43,-.37,.47],.096,.049);
    }
    for (let i=0;i<6;i++) {
      const z=.82-i*.32;
      taper(body,horn,0,.41,z,.009,.081,.22-i*.016,5).rotation.x=-.27;
    }
    const wings = [];
    for (const sign of [-1,1]) {
      const pivot=group(body,.26*sign,.19,.47);
      const vertices=[
        [0,0,0],[.95,.22,.29],[1.62,.32,-.01],[3.15,.17,-.60],
        [2.24,-.10,-.83],[2.06,-.11,-1.34],[1.44,-.06,-1.03],
        [1.10,-.11,-1.41],[.68,-.08,-.97],[.18,0,-1.04]
      ];
      const shape=new T.BufferGeometry();
      shape.setAttribute("position",new T.Float32BufferAttribute(vertices.flatMap(([x,y,z])=>[x*sign,y,z]),3));
      shape.setIndex([0,1,2,0,2,9,2,3,4,2,4,5,2,5,6,2,6,7,2,7,8,2,8,9]);
      shape.computeVertexNormals();
      const scarlet = material(0x791523,{side:T.DoubleSide,flatShading:true,roughness:.9});
      mesh(pivot,shape,scarlet,0,0,0);
      const v=(i)=>[vertices[i][0]*sign,vertices[i][1]+.012,vertices[i][2]];
      for (const [a,b] of [[0,1],[1,2],[2,3],[2,5],[2,7],[2,9]]) line(pivot,scales,v(a),v(b),a<2?.078:.042,.021);
      wings.push(pivot);
    }
    const tail=group(body,0,0,-.79);
    line(tail,scales,[0,0,0],[0,-.06,-.74],.28,.17);
    line(tail,scales,[0,-.06,-.67],[.16,-.09,-1.47],.176,.11);
    line(tail,scales,[.16,-.09,-1.4],[.52,.02,-2.1],.113,.055);
    line(tail,horn,[.51,.02,-2.08],[.69,.13,-2.38],.074,.006);
    return {body,fly(t) {
      const beat = .21 + Math.sin(t * 4.7) * .58 + Math.sin(t * 9.4) * .07;
      wings[0].rotation.z = -beat;
      wings[1].rotation.z = beat;
      tail.rotation.y = Math.sin(t * 4.7 - .9) * .26;
      head.rotation.x = Math.sin(t * 4.7 - .35) * .12;
    }};
  }

  function shieldKnights(s) {
    const {group,scene,oval,taper,box,material} = s;
    const plate=material(0x74878a,{metalness:.31,roughness:.49});
    const leather=material(0x3f3d39);
    const red=material(0x8f333d);
    const bronze=material(0xcb9460);
    const troops=[];
    for (let i=0;i<8;i++) {
      const knight=group(scene);
      taper(knight,plate,0,.86,0,.23,.32,.53,8);
      oval(knight,plate,0,1.30,.005,.23,.26,.21);
      box(knight,leather,0,1.28,.186,.29,.035,.044);
      oval(knight,red,0,1.55,-.07,.078,.095,.25).rotation.x=.2;
      oval(knight,bronze,.29,.85,.32,.23,.35,.095);
      oval(knight,red,.29,.865,.38,.185,.28,.054);
      const legs=[];
      for(const side of [-1,1]){
        const joint=group(knight,side*.14,.57,0);
        box(joint,plate,0,-.22,0,.17,.42,.22);
        oval(joint,leather,0,-.47,.05,.11,.09,.185);
        legs.push(joint);
      }
      troops.push({knight,legs});
    }
    return (t) => {
      troops.forEach(({knight,legs},i)=>{
        const stride=t*7+i*.96;
        knight.position.set(1.6 + (i%2-.5)*1.05 + Math.sin(t*.7)*.09,Math.abs(Math.sin(stride))*.08,7.5+Math.floor(i/2)*1.42-t%8*.53);
        knight.rotation.y=Math.PI;
        legs[0].rotation.x=Math.sin(stride)*.61;
        legs[1].rotation.x=-Math.sin(stride)*.61;
      });
    };
  }

  function balcony(s) {
    const {T,scene,box,material,shot} = s;
    valley(s,true);
    const sandstone = surface(s,"stone","#a29688","#505254");
    const lintel = material(0xbebaab);
    const alcove = new T.MeshBasicMaterial({color:0x473e48});
    const claret = material(0x8d2f3e,{side:T.DoubleSide});
    const brass = material(0xe7b567,{metalness:.2});
    const pane = arch(s,scene,0,1.13,-1.7,3.1,3.95,alcove,lintel);
    box(scene,sandstone,0,2.85,-1.84,8.4,5.6,.24);
    for(const sign of [-1,1]){
      box(scene,sandstone,sign*2.91,2.46,-1.21,.33,4.9,.75);
      box(scene,lintel,sign*2.91,4.81,-1.2,.47,.21,.99);
    }
    box(scene,sandstone,0,.10,-.6,8,.18,3.2);
    box(scene,sandstone,0,.39,1.01,6.3,.53,.36);
    box(scene,lintel,0,.68,1.01,6.65,.14,.54);
    const flags = [
      banner(s,pane,claret,brass,-1.17,2.6,.19,.68,1.75),
      banner(s,pane,claret,brass,1.17,2.6,.19,.68,1.75)
    ];
    const king = owlPerson(s,scene,{coat:0x813041,face:0x8f5a38,cream:0xf8deb0,crown:true});
    king.person.position.set(0,.18,.33);
    const ash = weather(s,65,[10,7,8,-.5],"dust");
    return (t) => {
      flags.forEach((wave,i)=>wave(t+i*.55));
      ash(t*.44);
      king.arm.rotation.x = -.30 - 1.26 * ease(t/1.65) + Math.sin(t*3.2)*.12;
      king.person.rotation.y = .12 + Math.sin(t*1.63)*.086;
      shot([4.2,2.50,6.5],[2.35,2.28,5.8],[.2,1.65,0],[.22,1.63,.14],t/6);
    };
  }

  function fireworks(s) {
    const {T,scene} = s;
    const rng = random(2538);
    const sources = [[-5.6,8.0,-13.7],[4.8,8.95,-16.2],[1.7,9.6,-19.4]];
    const colors = [0xffc879,0xf6967f,0xffe1a3];
    const bursts = sources.map((source,i)=>{
      const count = 60;
      const offsets = Array.from({length:count},()=>{
        const angle=rng()*tau, u=rng()*2-1, speed=.9+rng()*1.8, r=Math.sqrt(1-u*u);
        return [Math.cos(angle)*r*speed,u*speed,Math.sin(angle)*r*speed];
      });
      const points = new T.BufferGeometry();
      const position = new T.BufferAttribute(new Float32Array(count*3),3).setUsage(T.DynamicDrawUsage);
      points.setAttribute("position",position);
      const material = new T.PointsMaterial({
        color:colors[i],size:.158,transparent:true,depthWrite:false,blending:T.AdditiveBlending
      });
      const stars = new T.Points(points,material);
      stars.frustumCulled=false;
      scene.add(stars);
      return {source,offsets,position,material,stars};
    });
    return (t) => {
      bursts.forEach(({source,offsets,position,material,stars},i)=>{
        const age=t-.28-i*.69;
        stars.visible=age>0 && age<2.3;
        material.opacity=clamp((2.3-age)*.65);
        offsets.forEach(([x,y,z],j)=>{
          position.setXYZ(j,source[0]+x*age,source[1]+y*age-age*age*.52,source[2]+z*age);
        });
        position.needsUpdate=true;
      });
    };
  }

  function dragonVista(s, panel) {
    const ending = panel === 3;
    valley(s,panel === 0 || ending);
    const flags = oakwood(s);
    if (panel === 2) {
      return (t) => {
        flags(t);
        s.shot([-6.6,3.4,12.1],[-2.4,2.64,9.1],[0,2.6,-4],[0,2.66,-4.6],t/5.6);
      };
    }
    const dragon = fireDragon(s,s.scene,ending ? .85 : 1.33);
    if (ending) {
      const burst = fireworks(s);
      return (t) => {
        dragon.body.position.set(4.3 + t*2.62, 7.9 + t*.57, -13 - t*3.3);
        dragon.body.rotation.set(.10,2.32,-.24);
        dragon.fly(t);
        flags(t);
        burst(t);
        s.shot([8.5,5.0,19.5],[6.1,5.65,17.45],[.6,4.2,-5],[.45,4.36,-5.3],t/4.2);
      };
    }
    const knights = shieldKnights(s);
    return (t) => {
      const turn=t*.47;
      dragon.body.position.set(4.48 + Math.cos(turn)*2.04,6.52 + Math.sin(turn*1.25)*.71 + Math.sin(t*4.7)*.15,4.30 - Math.sin(turn)*3.6);
      dragon.body.rotation.set(.11,-1.05 + Math.sin(turn)*.47,Math.cos(turn)*.25);
      dragon.fly(t);
      flags(t);
      knights(t);
      s.shot([12.3,5.75,26.8],[9.15,4.8,23.1],[1.65,3.4,-1.6],[1.83,3.47,-1.15],t/6.6);
    };
  }

  let renderer, active, width, height, disabled = false;
  function releaseScene() {
    if (!active) return;
    const assets = new Set();
    active.scene.traverse((object) => {
      if (object.geometry) assets.add(object.geometry);
      if (object.material) {
        const mat=object.material;
        assets.add(mat);
        if (mat.map) assets.add(mat.map);
      }
      if (object.isInstancedMesh) assets.add(object);
    });
    assets.forEach((asset) => asset.dispose());
    active = null;
  }

  function hide() {
    releaseScene();
    if (!renderer) return;
    const canvas = renderer.domElement;
    canvas.removeEventListener("webglcontextlost", onLost);
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
    renderer = null;
  }

  function onLost() {
    disabled = true;
    hide();
  }

  function show(anchor, title, panel, time) {
    const T = window.THREE;
    if (!T || disabled) return false;
    try {
      if (!renderer) {
        renderer = new T.WebGLRenderer({antialias:true,powerPreference:"low-power"});
        renderer.outputEncoding = T.sRGBEncoding;
        renderer.toneMapping = T.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.09;
        const canvas = renderer.domElement;
        canvas.className = "pip-cinema";
        canvas.setAttribute("aria-hidden","true");
        canvas.addEventListener("webglcontextlost",onLost);
        anchor.after(canvas);
        width = height = 0;
      }
      if (active?.panel !== panel || active?.title !== title) {
        releaseScene();
        const manor = title === "manor";
        const stage = createStage(T,manor ? night() : daylight(panel === 0 || panel === 3));
        active = {...stage, panel, title, start:time};
        active.animate = manor
          ? (panel === 0 ? conservatory(stage) : panel === 1 ? arrival(stage) : foyer(stage,panel === 3))
          : (panel === 1 ? balcony(stage) : dragonVista(stage,panel));
      }
      const w = anchor.clientWidth, h = anchor.clientHeight;
      if (!w || !h) return false;
      if (width !== w || height !== h) {
        width=w;
        height=h;
        renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5,1920/w,1080/h));
        renderer.setSize(w,h,false);
        active.camera.aspect = w/h;
        active.camera.updateProjectionMatrix();
      } else if (active.camera.aspect !== w/h) {
        active.camera.aspect = w/h;
        active.camera.updateProjectionMatrix();
      }
      const elapsed = time-active.start;
      active.animate(motion.matches ? (panel === 3 ? 1.15 : .52) : elapsed);
      renderer.render(active.scene,active.camera);
      return true;
    } catch (error) {
      console.warn("3D cutscene unavailable. Playing the illustrated scene.",error);
      disabled = true;
      hide();
      return false;
    }
  }

  window.PipCutscenes = {show,hide};
  window.addEventListener("pagehide",hide);
})();
