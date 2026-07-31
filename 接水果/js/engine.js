/* 共用遊戲引擎：canvas/DPR/resize、背景美術、粒子、彈出文字、籃子、碰撞、主迴圈 */
const Engine = (function(){
  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');
  const board = document.getElementById('board');
  const INK = '#2A2140';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const bg = document.createElement('canvas');
  const bgctx = bg.getContext('2d');

  const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));

  let W=0, H=0, dpr=1, scale=1;
  let BASKET_Y=0, BW=0;

  let items=[], parts=[], pops=[];
  let basket={x:0,tx:0};
  let shake=0, flash=0;
  let score=0, lives=3, caught=0, elapsed=0;
  let last=0;
  let currentMode=null;
  let state='menu'; // menu | ready | playing | gameover
  let onStateChange=null;

  /* ---------- 水果（單位座標，半徑 1） ---------- */
  function seeds(g,pts,c){ g.fillStyle=c; pts.forEach(([x,y,r])=>{g.beginPath();g.ellipse(x,y,r||.07,(r||.07)*1.5,0,0,7);g.fill();}); }
  const FRUITS = [
    { key:'watermelon', name:'西瓜', juice:'#FF6B84', pts:15, draw(g){
        g.fillStyle='#5FB889'; g.beginPath(); g.arc(0,0,1,0,Math.PI); g.closePath(); g.fill(); g.stroke();
        g.fillStyle='#FF5E7A'; g.beginPath(); g.arc(0,0,.76,0,Math.PI); g.closePath(); g.fill(); g.stroke();
        seeds(g,[[-.36,.3],[0,.46],[.36,.3],[-.15,.14],[.18,.14]],INK); } },
    { key:'orange', name:'橘子', juice:'#FF9A2E', pts:10, draw(g){
        g.fillStyle='#FF9A2E'; g.beginPath(); g.arc(0,.05,.92,0,7); g.fill(); g.stroke();
        g.fillStyle='#FFC46B'; g.beginPath(); g.arc(-.3,-.28,.26,0,7); g.fill();
        g.fillStyle='#5FB889'; g.beginPath(); g.ellipse(.34,-.82,.32,.16,-.5,0,7); g.fill(); g.stroke(); } },
    { key:'strawberry', name:'草莓', juice:'#FF3F5F', pts:20, draw(g){
        g.fillStyle='#FF3F5F'; g.beginPath(); g.moveTo(0,1);
        g.bezierCurveTo(-1.05,.2,-.95,-.72,0,-.6); g.bezierCurveTo(.95,-.72,1.05,.2,0,1);
        g.fill(); g.stroke();
        g.fillStyle='#5FB889'; g.beginPath(); g.moveTo(-.62,-.6); g.lineTo(0,-.44); g.lineTo(.62,-.6);
        g.lineTo(.3,-.9); g.lineTo(0,-.62); g.lineTo(-.3,-.9); g.closePath(); g.fill(); g.stroke();
        seeds(g,[[-.36,.06,.05],[.34,.06,.05],[0,.3,.05],[-.2,.52,.05],[.22,.52,.05]],'#FFE27A'); } },
    { key:'grape', name:'葡萄', juice:'#8E6FD1', pts:15, draw(g){
        g.fillStyle='#8E6FD1';
        [[-.44,.1],[.44,.1],[0,.1],[-.24,-.4],[.24,-.4],[0,.62]].forEach(([x,y])=>{
          g.beginPath(); g.arc(x,y,.38,0,7); g.fill(); g.stroke(); });
        g.strokeStyle='#5FB889'; g.lineWidth=.16; g.beginPath(); g.moveTo(0,-.7); g.lineTo(.16,-1); g.stroke();
        g.strokeStyle=INK; g.lineWidth=.1; } },
    { key:'lemon', name:'檸檬', juice:'#FFD23F', pts:10, draw(g){
        g.fillStyle='#FFD23F'; g.beginPath(); g.ellipse(0,0,.98,.66,-.35,0,7); g.fill(); g.stroke();
        g.fillStyle='#FFF0A8'; g.beginPath(); g.ellipse(-.28,-.24,.28,.14,-.35,0,7); g.fill(); } },
  ];
  function drawBomb(g){
    g.fillStyle='#2A2140'; g.beginPath(); g.arc(0,.1,.85,0,7); g.fill();
    g.strokeStyle='#151024'; g.stroke();
    g.fillStyle='#151024'; g.fillRect(-.24,-.98,.48,.28);
    g.strokeStyle='#8E7FB8'; g.lineWidth=.14; g.beginPath();
    g.moveTo(.1,-.86); g.quadraticCurveTo(.6,-1.1,.5,-1.4); g.stroke();
    g.fillStyle='#FF7E62'; g.beginPath(); g.arc(.5,-1.5,.2,0,7); g.fill();
    g.fillStyle='#FFE27A'; g.beginPath(); g.arc(.5,-1.5,.1,0,7); g.fill();
    g.fillStyle='rgba(255,255,255,.28)'; g.beginPath(); g.arc(-.3,-.2,.24,0,7); g.fill();
    g.strokeStyle=INK; g.lineWidth=.1;
  }

  /* ---------- 背景（淡漸層，resize 或換模式時重繪） ---------- */
  const BG_DEFAULT = ['#F7E3BE','#EFC98C'];
  function paintBg(){
    const g=bgctx;
    g.setTransform(dpr,0,0,dpr,0,0);
    g.clearRect(0,0,W,H);
    const stops = (currentMode && currentMode.meta.bg) || BG_DEFAULT;
    const grad=g.createLinearGradient(0,0,0,H);
    grad.addColorStop(0,stops[0]);
    grad.addColorStop(1,stops[1]);
    g.fillStyle=grad;
    g.fillRect(0,0,W,H);
  }

  function resize(){
    const rect = board.getBoundingClientRect();
    const cssW = Math.max(1,rect.width), cssH = Math.max(1,rect.height);
    dpr = Math.min(window.devicePixelRatio||1, 2);
    cv.style.width=cssW+'px'; cv.style.height=cssH+'px';
    cv.width = Math.round(cssW*dpr); cv.height = Math.round(cssH*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    W=cssW; H=cssH;
    bg.width = cv.width; bg.height = cv.height;
    bg.style.width=cssW+'px'; bg.style.height=cssH+'px';

    BASKET_Y = H - clamp(H*0.14, 90, 150);
    BW = clamp(W*0.22, 90, 170);
    scale = clamp(Math.min(W,H)/600, 0.75, 2.2);

    paintBg();

    if(!basket.x){ basket.x=W/2; basket.tx=W/2; }
    basket.x = clamp(basket.x, BW/2, W-BW/2);
    basket.tx = clamp(basket.tx, BW/2, W-BW/2);
  }

  let resizeTimer=null;
  function scheduleResize(){
    clearTimeout(resizeTimer);
    resizeTimer=setTimeout(resize, 120);
  }

  /* ---------- 粒子 / 彈出文字 ---------- */
  function burst(x,y,color,n,pow){
    for(let i=0;i<n;i++){ const a=Math.random()*6.28, s=(.4+Math.random())*pow*scale;
      parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-60*scale,r:(2+Math.random()*5)*scale,c:color,life:1}); }
  }
  function pop(x,y,txt,c){ pops.push({x,y,txt,c,life:1}); }

  /* x / vx / type 皆為選用：未給時沿用原本的隨機行為 */
  function spawnFruit({vy, bomb, x, vx, type}){
    const t = (type && FRUITS.find(f=>f.key===type)) || FRUITS[(Math.random()*FRUITS.length)|0];
    const r = (bomb?24:22+Math.random()*8) * scale;
    const px = (x==null) ? r+Math.random()*(W-2*r) : clamp(x, r, W-r);
    items.push({ bomb, type:t, x:px, y:-r*2.2,
      r, vy, vx:vx||0, rot:Math.random()*6, vr:(Math.random()-.5)*2.4 });
  }

  function loseLife(){
    lives--; shake=reduce?0:10*scale; flash=Math.max(flash,.6);
    HUD.update(api, currentMode);
    if(lives<=0){ gameOver(); return true; }
    return false;
  }

  function addScore(n){
    score += n;
    HUD.update(api, currentMode);
  }

  function catchIt(f){
    if(f.bomb){
      const handled = (currentMode && currentMode.onBombCaught)
        ? currentMode.onBombCaught(api, f) === 'handled' : false;
      shake=reduce?0:16*scale; flash=1;
      burst(f.x,f.y,'#2A2140',26,220); burst(f.x,f.y,'#FF7E62',14,180);
      pop(f.x,f.y-30*scale,'BOOM','#FF4E6A');
      if(handled){ HUD.update(api, currentMode); return; }
      lives--;
      HUD.update(api, currentMode);
      if(lives<=0){ gameOver(); return; }
      return;
    }

    const verdict = (currentMode && currentMode.judgeFruit) ? currentMode.judgeFruit(api, f) : 'correct';

    if(verdict==='wrong'){
      burst(f.x,f.y,'#2A2140',10,140);
      pop(f.x,f.y-26*scale,'接錯了','#FF4E6A');
      if(currentMode && currentMode.onFruitCaught) currentMode.onFruitCaught(api, f, verdict);
      loseLife();
      return;
    }

    if(verdict==='neutral'){
      if(currentMode && currentMode.onFruitCaught) currentMode.onFruitCaught(api, f, verdict);
      HUD.update(api, currentMode);
      return;
    }

    caught++;
    const g=f.type.pts; score+=g;
    burst(f.x,f.y,f.type.juice,14,150);
    pop(f.x,f.y-26*scale,'+'+g,'#2A2140');
    if(currentMode && currentMode.onFruitCaught) currentMode.onFruitCaught(api, f, verdict);
    HUD.update(api, currentMode);
  }

  function step(dt){
    elapsed += dt;
    if(currentMode && currentMode.update) currentMode.update(dt, api);

    basket.x = clamp(basket.tx, BW/2, W-BW/2);

    for(let i=items.length-1;i>=0;i--){
      const f=items[i]; f.y+=f.vy*dt; f.rot+=f.vr*dt;
      if(f.vx){
        f.x+=f.vx*dt;
        if(f.x<f.r || f.x>W-f.r){ f.vx*=-1; f.x=clamp(f.x, f.r, W-f.r); }
      }
      if(f.y+f.r>BASKET_Y && f.y-f.r<BASKET_Y+10*scale && Math.abs(f.x-basket.x)<BW/2){
        items.splice(i,1); catchIt(f); continue;
      }
      if(f.y-f.r>H){
        items.splice(i,1);
        /* 炸彈走獨立 hook：既有模式的 onMiss 會扣命，不能對炸彈觸發 */
        if(f.bomb){
          if(currentMode && currentMode.onBombMissed) currentMode.onBombMissed(api, f);
        }else if(currentMode && currentMode.onMiss){
          currentMode.onMiss(api, f);
        }
      }
    }
    for(let i=parts.length-1;i>=0;i--){ const p=parts[i];
      p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=560*scale*dt; p.life-=dt*1.5;
      if(p.life<=0) parts.splice(i,1); }
    for(let i=pops.length-1;i>=0;i--){ const p=pops[i]; p.y-=48*scale*dt; p.life-=dt*1.2;
      if(p.life<=0) pops.splice(i,1); }
    if(shake>0) shake=Math.max(0,shake-dt*44*scale);
    if(flash>0) flash=Math.max(0,flash-dt*2.4);
  }

  function drawBasket(){
    const x=basket.x, y=BASKET_Y, s=scale;
    ctx.save(); ctx.translate(x,y); ctx.lineJoin='round';
    ctx.strokeStyle=INK; ctx.lineWidth=5*s; ctx.beginPath();
    ctx.moveTo(-BW/2+8*s,0); ctx.quadraticCurveTo(0,-46*s,BW/2-8*s,0); ctx.stroke();
    ctx.fillStyle='#C9803F'; ctx.beginPath();
    ctx.moveTo(-BW/2,0); ctx.lineTo(BW/2,0); ctx.lineTo(BW/2-16*s,52*s);
    ctx.quadraticCurveTo(0,60*s,-BW/2+16*s,52*s); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.clip();
    ctx.strokeStyle='rgba(42,33,64,.3)'; ctx.lineWidth=3*s;
    for(let i=-2;i<=2;i++){ ctx.beginPath(); ctx.moveTo(i*20*s,0); ctx.lineTo(i*15*s,56*s); ctx.stroke(); }
    for(let j=1;j<3;j++){ ctx.beginPath(); ctx.moveTo(-BW,j*17*s); ctx.lineTo(BW,j*17*s); ctx.stroke(); }
    ctx.restore();
    ctx.lineWidth=4*s; ctx.strokeStyle=INK; ctx.stroke();
    ctx.fillStyle='#E0A163'; ctx.beginPath();
    ctx.roundRect(-BW/2-6*s,-11*s,BW+12*s,18*s,9*s); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  function render(){
    ctx.save();
    if(shake>0) ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);
    ctx.drawImage(bg,0,0,W,H);

    items.forEach(f=>{
      ctx.save(); ctx.translate(f.x,f.y); ctx.rotate(f.rot); ctx.scale(f.r,f.r);
      ctx.lineWidth=.1; ctx.strokeStyle=INK; ctx.lineJoin='round';
      f.bomb?drawBomb(ctx):f.type.draw(ctx);
      ctx.restore();
    });
    drawBasket();

    parts.forEach(p=>{ ctx.globalAlpha=Math.max(0,p.life); ctx.fillStyle=p.c;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,7); ctx.fill(); });
    ctx.globalAlpha=1;

    ctx.textAlign='center'; ctx.font='900 '+(26*scale)+'px "Arial Black",sans-serif';
    pops.forEach(p=>{ ctx.globalAlpha=Math.max(0,p.life); ctx.fillStyle=p.c;
      ctx.strokeStyle='rgba(255,244,228,.9)'; ctx.lineWidth=5*scale;
      ctx.strokeText(p.txt,p.x,p.y); ctx.fillText(p.txt,p.x,p.y); });
    ctx.globalAlpha=1;
    ctx.restore();

    if(flash>0){ ctx.fillStyle='rgba(255,78,106,'+(flash*.45)+')'; ctx.fillRect(0,0,W,H); }
  }

  function frame(t){
    const dt=Math.min(.05,(t-last)/1000||0); last=t;
    if(state==='playing') step(dt);
    render();
    requestAnimationFrame(frame);
  }

  /* ---------- 操控 ---------- */
  function aim(clientX){
    const r=board.getBoundingClientRect();
    basket.tx=clamp((clientX-r.left)/r.width*W, BW/2, W-BW/2);
  }
  function bindControls(){
    board.addEventListener('pointermove', e=>{ if(state==='playing') aim(e.clientX); });
    board.addEventListener('pointerdown', e=>{ if(state==='playing') aim(e.clientX); });
    addEventListener('keydown', e=>{
      if(state!=='playing') return;
      if(e.key==='ArrowLeft') basket.tx=Math.max(BW/2,basket.tx-48*scale);
      if(e.key==='ArrowRight') basket.tx=Math.min(W-BW/2,basket.tx+48*scale);
    });
  }

  /* ---------- 狀態流程 ---------- */
  function goMenu(){
    state='menu'; currentMode=null;
    paintBg();
    if(onStateChange) onStateChange('menu',{});
  }
  function selectMode(modeId){
    currentMode = Modes.get(modeId);
    state='ready';
    paintBg();
    if(onStateChange) onStateChange('ready',{mode:currentMode});
  }
  function startGame(){
    if(!currentMode) return;
    items=[]; parts=[]; pops=[];
    score=0; lives=3; caught=0; elapsed=0;
    shake=0; flash=0;
    basket.tx = W/2;
    currentMode.init(api);
    state='playing';
    HUD.update(api, currentMode);
    if(onStateChange) onStateChange('playing',{mode:currentMode});
  }
  function gameOver(){
    state='gameover';
    shake=0; flash=0;
    if(onStateChange) onStateChange('gameover',{mode:currentMode, score, caught});
  }

  const api = {
    get W(){return W}, get H(){return H}, get scale(){return scale},
    get BASKET_Y(){return BASKET_Y}, get BW(){return BW},
    get score(){return score}, get lives(){return lives},
    get caught(){return caught}, get elapsed(){return elapsed},
    get fruitTypes(){ return FRUITS.map(f=>({key:f.key, name:f.name, pts:f.pts, juice:f.juice})); },
    spawnFruit, burst, pop, loseLife, addScore,
  };

  function init(){
    resize();
    bindControls();
    addEventListener('resize', scheduleResize);
    addEventListener('orientationchange', scheduleResize);
    if(window.visualViewport) visualViewport.addEventListener('resize', scheduleResize);
    requestAnimationFrame(t=>{ last=t; frame(t); });
  }

  return {
    init,
    get state(){return state},
    get currentMode(){return currentMode},
    setOnStateChange(fn){ onStateChange=fn; },
    goMenu, selectMode, startGame,
    api,
  };
})();
