/* 炸彈雨模式：滿天炸彈、水果稀有，靠存活與躲避拿分，還要閃過齊射彈幕 */
Modes.register({
  meta:{ id:'bombrain', name:'炸彈雨模式', tagline:'滿天炸彈，只接稀有水果，活得越久分越高！', enabled:true,
    /* 暮色偏紅，但刻意維持中明度：炸彈是 #2A2140 深色，背景太暗會看不見 */
    bg:['#8A6577','#C98A74'],
    hint:'這裡幾乎都是炸彈，<b>躲過去就有分</b>，每躲 10 顆額外加分。<br>稀有水果分數三倍，看到<b>「齊射來了！」</b>就要找空隙鑽過去。' },

  VOLLEY_MIN: 5,      // 齊射最短間隔（秒）
  VOLLEY_MAX: 8,      // 齊射最長間隔（秒）
  VOLLEY_WARN: 0.7,   // 警示到落彈的前置時間
  DODGE_BONUS: 10,    // 每躲幾顆給一次獎勵

  volleyPeriod(engine){
    const t = engine.elapsed;
    return this.VOLLEY_MAX - (this.VOLLEY_MAX-this.VOLLEY_MIN)*(1-Math.exp(-t/45));
  },

  fireVolley(engine){
    const cols = 5 + ((Math.random()*2)|0);          // 5 或 6 欄
    const safe = (Math.random()*cols)|0;              // 隨機一欄留空隙
    const colW = engine.W/cols;
    const t = engine.elapsed;
    const vy = (240 + 120*(1-Math.exp(-t/30))) * (engine.H/720) * engine.scale;
    for(let i=0;i<cols;i++){
      if(i===safe) continue;
      engine.spawnFruit({ vy, bomb:true, x:(i+0.5)*colW });
    }
    /* 齊射飛行期間停掉常規落下，否則常規炸彈可能塞進安全空隙變成無解 */
    this.quietT = engine.BASKET_Y/vy * 0.85;
  },

  init(engine){
    this.spawnT = 0.5;
    this.dodges = 0;
    this.surviveT = 0;
    this.volleyT = this.volleyPeriod(engine);
    this.volleyFire = -1;   // >=0 時為警示後的落彈倒數
    this.quietT = 0;        // >0 時暫停常規落下（齊射飛行中）
  },

  update(dt, engine){
    const t = engine.elapsed;

    if(this.quietT>0) this.quietT -= dt;

    /* 常規落下：以炸彈為主，水果稀有。齊射警示與飛行期間暫停 */
    const quiet = this.quietT>0 || this.volleyFire>=0;
    if(!quiet) this.spawnT -= dt;
    if(!quiet && this.spawnT<=0){
      const vyBase = 195 + 200*(1-Math.exp(-t/20)) + 6*Math.log(1+t/20) + Math.random()*42;
      const vy = vyBase * (engine.H/720) * engine.scale;
      /* 開場放軟一點：前幾秒炸彈沒那麼密，免得還沒進入狀況就被打死 */
      const bomb = Math.random() < 0.7 + 0.25*(1-Math.exp(-t/35));
      /* 存活 25 秒後開始出現斜射炸彈 */
      const vx = (bomb && t>25 && Math.random()<0.3)
        ? (Math.random()<0.5?-1:1) * (60+Math.random()*80) * engine.scale
        : 0;
      engine.spawnFruit({ vy, bomb, vx });
      this.spawnT = 0.24 + 0.32*Math.exp(-t/30);
    }

    /* 存活分：每秒結算一次 */
    this.surviveT += dt;
    if(this.surviveT>=1){
      this.surviveT -= 1;
      engine.addScore(5 + Math.floor(t/30));
    }

    /* 齊射：先警示，再同時落下一排 */
    if(this.volleyFire>=0){
      this.volleyFire -= dt;
      if(this.volleyFire<=0){
        this.volleyFire = -1;
        this.fireVolley(engine);
      }
    }else{
      this.volleyT -= dt;
      if(this.volleyT<=0){
        this.volleyT = this.volleyPeriod(engine);
        this.volleyFire = this.VOLLEY_WARN;
        engine.pop(engine.W/2, engine.BASKET_Y - 160*engine.scale, '齊射來了！', '#FF4E6A');
      }
    }
  },

  /* 沒有 judgeFruit：水果一律算接對，沿用引擎預設 */

  onFruitCaught(engine, fruit, verdict){
    if(verdict!=='correct') return;
    /* 引擎已加 1 倍，這裡補 2 倍湊成三倍分 */
    engine.addScore(fruit.type.pts*2);
    engine.pop(fruit.x, fruit.y-56*engine.scale, '稀有水果！', fruit.type.juice);
  },

  /* 中彈已經扣一命，不再清空躲避數（否則 HUD 幾乎永遠是 0）。
     改成給一個喘息拍：把下一波齊射往後推，讓玩家有時間重新站位。 */
  onBombCaught(engine, bomb){
    this.volleyFire = -1;
    this.quietT = Math.max(this.quietT, 1.2);
    this.volleyT = Math.max(this.volleyT, 3);
  },

  onBombMissed(engine, bomb){
    this.dodges++;
    if(this.dodges % this.DODGE_BONUS === 0){
      engine.addScore(30);
      engine.pop(engine.W/2, engine.BASKET_Y - 120*engine.scale, '躲得好！', '#5FB889');
    }
  },

  hudReadout(engine){
    const frac = this.volleyFire>=0 ? 1 : Math.max(0, this.volleyT/this.volleyPeriod(engine));
    const color = this.volleyFire>=0 ? '#FF4E6A'
      : frac>0.5 ? '#5FB889' : frac>0.25 ? '#FFC46B' : '#FF4E6A';
    return { label: '躲避 '+this.dodges, glassFraction: frac, glassColor: color };
  }
});
