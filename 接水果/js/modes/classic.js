/* 經典模式：移植自原始版本的「每接 10 顆升一籃」難度制，用來驗證架構 */
Modes.register({
  meta:{ id:'classic', name:'經典模式', tagline:'一籃接著一籃，等級越高水果越急', enabled:false,
    hint:'移動滑鼠或手指左右挪動籃子，接住掉下來的水果。<br><b>黑色的炸彈千萬別接。</b>' },

  init(engine){
    this.level = 1;
    this.levelCaught = 0;
    this.spawnT = 0.4;
  },

  update(dt, engine){
    this.spawnT -= dt;
    if(this.spawnT<=0){
      const bombP = Math.min(.3, .1 + this.level*.025);
      const bomb = Math.random() < bombP;
      const vyBase = 112 + this.level*17 + Math.random()*46;
      const vy = vyBase * (engine.H/720) * engine.scale;
      engine.spawnFruit({ vy, bomb });
      this.spawnT = Math.max(.34, 1.05 - this.level*.06);
    }
  },

  onFruitCaught(engine, fruit){
    this.levelCaught++;
    if(this.levelCaught%10===0){
      this.level++;
      engine.pop(engine.W/2, engine.BASKET_Y - 160*engine.scale, '第 '+this.level+' 籃', '#FFF4E4');
    }
  },

  hudReadout(engine){
    const colors = ['#FFC46B','#FF9A2E','#FF6B84','#8E6FD1','#5FB889'];
    return {
      label: '第 '+this.level+' 籃',
      glassFraction: (this.levelCaught%10)/10,
      glassColor: colors[(this.level-1)%colors.length]
    };
  }
});
