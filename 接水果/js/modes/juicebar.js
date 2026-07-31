/* 果汁調配模式：依訂單接對水果，限時調出果汁，超時或碰炸彈扣命 */
Modes.register({
  meta:{ id:'juicebar', name:'果汁調配模式', tagline:'依訂單接對水果，限時調出美味果汁！', enabled:true,
    hint:'畫面右上角會顯示訂單需要的水果。<br>限時內接齊食材完成調配就大加分，<b>接到炸彈或訂單超時都會扣一命。</b>' },

  newOrder(engine){
    const keys = engine.fruitTypes.map(t=>t.key);
    const a = keys[(Math.random()*keys.length)|0];
    let b;
    do{ b = keys[(Math.random()*keys.length)|0]; }while(b===a);
    this.order = [a,b];
    this.collected = [];
    this.orderTime = Math.max(10, 18 - engine.elapsed/40);
    this.timeLeft = this.orderTime;
  },

  init(engine){
    this.spawnT = 0.4;
    this.NAMES = {};
    engine.fruitTypes.forEach(t=>{ this.NAMES[t.key]=t.name; });
    this.newOrder(engine);
  },

  update(dt, engine){
    this.spawnT -= dt;
    if(this.spawnT<=0){
      const t = engine.elapsed;
      const vyBase = 150 + 150*(1-Math.exp(-t/22)) + 5*Math.log(1+t/22) + Math.random()*42;
      const vy = vyBase * (engine.H/720) * engine.scale;
      const bombP = 0.35 - 0.25*Math.exp(-t/50);
      const bomb = Math.random() < bombP;
      engine.spawnFruit({ vy, bomb });
      this.spawnT = 0.22 + 0.75*Math.exp(-t/25);
    }

    this.timeLeft -= dt;
    if(this.timeLeft<=0){
      engine.pop(engine.W/2, engine.BASKET_Y - 160*engine.scale, '訂單逾時！', '#FF4E6A');
      engine.loseLife();
      this.newOrder(engine);
    }
  },

  judgeFruit(engine, fruit){
    return 'neutral';
  },

  onFruitCaught(engine, fruit, verdict){
    if(verdict!=='neutral') return;
    const key = fruit.type.key;
    if(this.order.includes(key) && !this.collected.includes(key)){
      this.collected.push(key);
      engine.pop(fruit.x, fruit.y-26*engine.scale, '+'+(this.NAMES[key]||key), fruit.type.juice);
      if(this.collected.length>=this.order.length){
        engine.addScore(80);
        engine.pop(engine.W/2, engine.BASKET_Y - 160*engine.scale, '調配完成！', '#FFF4E4');
        this.newOrder(engine);
      }
    }
  },

  hudReadout(engine){
    const label = this.order.map(k=>{
      const done = this.collected.includes(k);
      return (this.NAMES[k]||k) + (done?'✓':'');
    }).join(' ');
    const frac = Math.max(0, this.timeLeft/this.orderTime);
    const color = frac>0.5 ? '#5FB889' : frac>0.25 ? '#FFC46B' : '#FF4E6A';
    return { label, glassFraction: frac, glassColor: color };
  }
});
