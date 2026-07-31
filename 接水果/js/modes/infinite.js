/* 無限模式：難度隨存活時間持續、無上限提升 */
Modes.register({
  meta:{ id:'infinite', name:'無限模式', tagline:'水果會越接越快，撐到最後一刻！', enabled:true,
    hint:'移動滑鼠或手指左右挪動籃子，接住掉下來的水果。<br><b>黑色的炸彈千萬別接。</b>' },

  init(engine){
    this.spawnT = 0.6;
  },

  update(dt, engine){
    this.spawnT -= dt;
    if(this.spawnT<=0){
      const t = engine.elapsed;
      const vyBase = 190 + 220*(1-Math.exp(-t/16)) + 6*Math.log(1+t/20) + Math.random()*46;
      const vy = vyBase * (engine.H/720) * engine.scale;
      const bombP = 0.5 - 0.4*Math.exp(-t/45);
      const bomb = Math.random() < bombP;
      engine.spawnFruit({ vy, bomb });
      this.spawnT = 0.13 + 0.55*Math.exp(-t/25);
    }
  },

  onFruitCaught(engine, fruit){ /* 無限模式沒有等級制，無需額外處理 */ },

  hudReadout(engine){
    const t = Math.floor(engine.elapsed);
    const mm = String(Math.floor(t/60)).padStart(2,'0');
    const ss = String(t%60).padStart(2,'0');
    return { label: mm+':'+ss, glassFraction: (t%30)/30, glassColor:'#FFC46B' };
  }
});
