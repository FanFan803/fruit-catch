/* 指定水果模式：只能接指定種類，接錯或碰到炸彈都扣命 */
Modes.register({
  meta:{ id:'target', name:'指定水果模式', tagline:'只能接指定的水果，接錯或碰到炸彈都會扣命！', enabled:true,
    hint:'畫面右上角會顯示目前要接的目標水果。<br>接對才加分，<b>接錯水果或碰到炸彈都會扣一命。</b>' },

  pickTarget(engine, exclude){
    const types = engine.fruitTypes;
    let pick;
    do{ pick = types[(Math.random()*types.length)|0]; }while(types.length>1 && exclude && pick.key===exclude);
    return pick;
  },

  init(engine){
    this.spawnT = 0.4;
    this.target = this.pickTarget(engine);
  },

  update(dt, engine){
    this.spawnT -= dt;
    if(this.spawnT<=0){
      const t = engine.elapsed;
      const vyBase = 200 + 160*(1-Math.exp(-t/20)) + 5*Math.log(1+t/22) + Math.random()*44;
      const vy = vyBase * (engine.H/720) * engine.scale;
      const bombP = 0.4 - 0.3*Math.exp(-t/50);
      const bomb = Math.random() < bombP;
      engine.spawnFruit({ vy, bomb });
      this.spawnT = 0.16 + 0.55*Math.exp(-t/25);
    }
  },

  judgeFruit(engine, fruit){
    return fruit.type.key===this.target.key ? 'correct' : 'wrong';
  },

  onFruitCaught(engine, fruit, verdict){
    if(verdict==='correct'){
      this.target = this.pickTarget(engine, this.target.key);
    }
  },

  hudReadout(engine){
    return {
      label: '目標：'+(this.target.name||this.target.key),
      glassFraction: 1,
      glassColor: this.target.juice
    };
  }
});
