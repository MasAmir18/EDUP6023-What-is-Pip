(() => {
  const mount = document.querySelector('[data-course-forest]');
  if (!mount) return;
  mount.innerHTML = `<div class="forest-bg" aria-hidden="true">
  <div class="sky-stars" id="stars"></div>
  <div class="beam b1"></div>
  <div class="beam b2"></div>
  <div class="beam b3"></div>

  <div class="tree-layer far" id="layerFar"><div class="tree-track" id="trackFar"></div></div>
  <div class="mist m1"></div>
  <div class="tree-layer mid" id="layerMid"><div class="tree-track" id="trackMid"></div></div>
  <div class="mist m2"></div>
  <div class="tree-layer near" id="layerNear"><div class="tree-track" id="trackNear"></div></div>
  <div class="mist m3"></div>

  <div class="fireflies" id="fireflies"></div>
  <div class="leaves" id="leaves"></div>
</div>`;
  const $ = selector => mount.querySelector(selector);

  function mulberry32(seed){
    let a=seed>>>0;
    return function(){
      a|=0;a=a+0x6D2B79F5|0;
      let t=Math.imul(a^a>>>15,1|a);
      t=t+Math.imul(t^t>>>7,61|t)^t;
      return((t^t>>>14)>>>0)/4294967296;
    };
  }

  /* ---------- 2. Build Night Forest Background ---------- */
  (function buildForest(){
    const rnd=mulberry32(202603);

    // 70 twinkling stars in upper 60%
    const starsEl=$('#stars');
    for(let i=0;i<70;i++){
      const s=document.createElement('span');
      s.className='star';
      const sz=rnd()>.55?4:3;
      s.style.cssText=`left:${(rnd()*100).toFixed(2)}%;top:${(rnd()*60).toFixed(2)}%;width:${sz}px;height:${sz}px;--dur:${(2.4+rnd()*2.8).toFixed(2)}s;--del:${(-rnd()*5).toFixed(2)}s`;
      starsEl.appendChild(s);
    }

    // Seamless pine layers with enough tiles to cover the viewport.
    function makePineLayer(trackEl,cfg){
      const r=mulberry32(cfg.seed);
      const W=1600,H=cfg.viewH;
      const trees=[];
      let x=12;
      while(x<W){
        const h=cfg.minH+r()*(cfg.maxH-cfg.minH);
        const w=h*(0.42+r()*0.12);
        trees.push({x,h,w});
        if(x-w*0.5<0) trees.push({x:x+W,h,w});
        if(x+w*0.5>W) trees.push({x:x-W,h,w});
        x+=cfg.stepMin+r()*cfg.stepVar;
      }

      let shapes=`<rect x="0" y="${H-28}" width="${W}" height="28" fill="${cfg.dark}"/>`;
      trees.forEach(t=>{
        const baseY=H-18;
        const tw=Math.max(8,t.w*0.13);
        const th=t.h*0.18;
        shapes+=`<rect x="${(t.x-tw/2).toFixed(1)}" y="${(baseY-th).toFixed(1)}" width="${tw.toFixed(1)}" height="${(th+18).toFixed(1)}" fill="${cfg.trunk}"/>`;
        const crownBottom=baseY-th*0.65;
        const crownH=t.h-th*0.65;
        for(let tier=0;tier<4;tier++){
          const f0=tier/4;
          const yBot=crownBottom-crownH*(f0*0.72);
          const yTop=yBot-crownH*(0.38-tier*0.02);
          const halfW=(t.w*0.5)*(1-tier*0.19);
          shapes+=`<polygon points="${t.x.toFixed(1)},${yTop.toFixed(1)} ${(t.x-halfW).toFixed(1)},${yBot.toFixed(1)} ${(t.x+halfW).toFixed(1)},${yBot.toFixed(1)}" fill="url(#${cfg.gradId})"/>`;
        }
      });

      const svgMarkup=`<svg class="tree-tile" width="1600" height="${H}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="${cfg.gradId}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${cfg.top}"/>
            <stop offset="100%" stop-color="${cfg.dark}"/>
          </linearGradient>
        </defs>
        ${shapes}
      </svg>`;
      const tiles = Math.max(3, Math.ceil(window.innerWidth / W) + 1);
      trackEl.style.width = tiles * W + 'px';
      trackEl.innerHTML = Array.from({length:tiles}, (_, i) =>
        svgMarkup.replaceAll(cfg.gradId, cfg.gradId + '-' + i)).join('');

    }

    makePineLayer($('#trackFar'),{
      seed:101,viewH:370,minH:200,maxH:330,stepMin:58,stepVar:42,
      top:'#14566a',dark:'#0b3644',trunk:'#092a35',gradId:'pineFarG'
    });
    makePineLayer($('#trackMid'),{
      seed:202,viewH:510,minH:260,maxH:470,stepMin:74,stepVar:54,
      top:'#0f6a52',dark:'#084233',trunk:'#063126',gradId:'pineMidG'
    });
    makePineLayer($('#trackNear'),{
      seed:303,viewH:660,minH:360,maxH:620,stepMin:98,stepVar:72,
      top:'#093a2d',dark:'#042119',trunk:'#031711',gradId:'pineNearG'
    });

    // 30 fireflies
    const ffEl=$('#fireflies');
    for(let i=0;i<30;i++){
      const f=document.createElement('span');
      f.className='firefly';
      const dx1=(rnd()*68-34).toFixed(0)+'px';
      const dy1=(rnd()*56-28).toFixed(0)+'px';
      const dx2=(rnd()*68-34).toFixed(0)+'px';
      const dy2=(rnd()*56-28).toFixed(0)+'px';
      f.style.cssText=`left:${(4+rnd()*92).toFixed(1)}%;top:${(18+rnd()*76).toFixed(1)}%;--dx1:${dx1};--dy1:${dy1};--dx2:${dx2};--dy2:${dy2};--wdur:${(9+rnd()*8).toFixed(1)}s;--gdur:${(2.1+rnd()*2.2).toFixed(1)}s;--wdel:${(-rnd()*12).toFixed(1)}s;--gdel:${(-rnd()*4).toFixed(1)}s`;
      ffEl.appendChild(f);
    }

    // 16 falling leaves
    const leafEl=$('#leaves');
    const leafColors=['#388e5a','#5eb572','#f4c95d','#e09f3e','#ff7a59'];
    for(let i=0;i<16;i++){
      const l=document.createElement('span');
      l.className='leaf';
      const col=leafColors[i%leafColors.length];
      l.style.cssText=`left:${(rnd()*98).toFixed(1)}%;background:${col};--swayA:${(24+rnd()*36).toFixed(0)}px;--swayB:${(-24-rnd()*36).toFixed(0)}px;--ldur:${(12+rnd()*10).toFixed(1)}s;--ldel:${(-rnd()*18).toFixed(1)}s`;
      leafEl.appendChild(l);
    }
  })();
  const forest = $('.forest-bg');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let frame;
  function updateParallax() {
    frame = undefined;
    const scrollRange = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const progress = reducedMotion.matches ? 0 : Math.max(0, Math.min(1, window.scrollY / scrollRange));
    for (const [depth, offset] of [['far',30],['mid',70],['near',120]]) {
      forest.style.setProperty('--' + depth + '-y', (-offset * progress).toFixed(1) + 'px');
    }
  }
  function refresh() {
    if (frame === undefined) frame = window.requestAnimationFrame(updateParallax);
  }
  window.addEventListener('scroll', refresh, { passive: true });
  window.addEventListener('resize', refresh);
  reducedMotion.addEventListener('change', refresh);
  refresh();
})();
