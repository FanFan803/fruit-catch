/* 完美模式：沒有炸彈，但漏接一顆水果就扣一命 */
Modes.register({
  meta:{ id:'nomiss', name:'完美模式', tagline:'沒有炸彈，但漏接一顆水果就扣一命！', enabled:true,
    hint:'移動滑鼠或手指左右挪動籃子，接住每一顆掉下來的水果。<br><b>沒有炸彈，但漏接一顆就扣一命。</b>' },

  init(engine){
    this.spawnT = 0.35;
  },

  update(dt, engine){
    this.spawnT -= dt;
    if(this.spawnT<=0){
      const t = engine.elapsed;
      const vyBase = 240 + 150*(1-Math.exp(-t/22)) + 4*Math.log(1+t/25) + Math.random()*40;
      const vy = vyBase * (engine.H/720) * engine.scale;
      engine.spawnFruit({ vy, bomb:false });
      this.spawnT = 0.18 + 0.35*Math.exp(-t/30);
    }
  },

  onMiss(engine, fruit){
    engine.pop(fruit.x, engine.BASKET_Y - 40*engine.scale, 'MISS', '#FF4E6A');
    engine.loseLife();
  },

  onFruitCaught(engine, fruit){ /* 完美模式沒有等級制，無需額外處理 */ },

  hudReadout(engine){
    const t = Math.floor(engine.elapsed);
    const mm = String(Math.floor(t/60)).padStart(2,'0');
    const ss = String(t%60).padStart(2,'0');
    return { label: mm+':'+ss, glassFraction: (t%30)/30, glassColor:'#8E6FD1' };
  }
});
