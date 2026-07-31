/* 模式選單 UI、overlay 狀態機、啟動流程 */
(function(){
  const overlay = document.getElementById('overlay');
  const board = document.getElementById('board');

  const BEST_PREFIX = 'fruitcatch_best_';
  const getBest = id => +localStorage.getItem(BEST_PREFIX+id) || 0;
  const setBest = (id,val) => localStorage.setItem(BEST_PREFIX+id, val);

  function renderMenu(){
    board.style.cursor='default';
    const cards = Modes.list.map(mode=>{
      const disabled = mode.meta.enabled===false;
      return '<button class="modeCard" data-mode="'+mode.meta.id+'" '+(disabled?'disabled':'')+'>'+
        '<div class="name">'+mode.meta.name+(disabled?'（敬請期待）':'')+'</div>'+
        '<div class="tagline">'+mode.meta.tagline+'</div>'+
      '</button>';
    }).join('');
    overlay.innerHTML =
      '<h1 class="title">接水果<span>ORCHARD DUSK</span></h1>'+
      '<p class="lead">選擇一種模式開始遊玩。</p>'+
      '<div class="modeList">'+cards+'</div>';
    overlay.querySelectorAll('.modeCard:not([disabled])').forEach(btn=>{
      btn.onclick = ()=> Engine.selectMode(btn.dataset.mode);
    });
    overlay.hidden=false;
  }

  function renderReady(mode){
    board.style.cursor='default';
    overlay.innerHTML =
      '<h1 class="title">'+mode.meta.name+'</h1>'+
      '<p class="lead" id="lead">'+(mode.meta.hint||'移動滑鼠或手指左右挪動籃子，接住掉下來的水果。')+'</p>'+
      '<button class="btn" id="startBtn">開始遊戲</button>'+
      '<button class="btn ghost" id="backBtn">‹ 返回選單</button>';
    overlay.querySelector('#startBtn').onclick = ()=> Engine.startGame();
    overlay.querySelector('#backBtn').onclick = ()=> Engine.goMenu();
    overlay.querySelector('#startBtn').focus();
    overlay.hidden=false;
  }

  function renderPlaying(){
    overlay.hidden=true;
  }

  function renderGameOver(mode, score, caught){
    board.style.cursor='default';
    const best = Math.max(getBest(mode.meta.id), score);
    setBest(mode.meta.id, best);
    overlay.innerHTML =
      '<div class="eyebrow" style="color:#FFF4E4;opacity:.6">籃子翻了</div>'+
      '<div class="final">'+score+'</div>'+
      '<div class="best">最佳 '+best+' · 接到 '+caught+' 顆水果</div>'+
      '<p class="lead">果汁灑了一地。<br>再來一次，穩紮穩打。</p>'+
      '<button class="btn" id="startBtn">再玩一次</button>'+
      '<button class="btn ghost" id="backBtn">返回選單</button>';
    overlay.querySelector('#startBtn').onclick = ()=> Engine.startGame();
    overlay.querySelector('#backBtn').onclick = ()=> Engine.goMenu();
    overlay.querySelector('#startBtn').focus();
    overlay.hidden=false;
  }

  Engine.setOnStateChange((state, data)=>{
    if(state==='menu') renderMenu();
    else if(state==='ready') renderReady(data.mode);
    else if(state==='playing') renderPlaying();
    else if(state==='gameover') renderGameOver(data.mode, data.score, data.caught);
  });

  Engine.init();
  renderMenu();
})();
