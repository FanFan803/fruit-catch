/* 共用 HUD：DOM 分數/生命 + 模式自訂讀值欄位 */
const HUD = (function(){
  const $=id=>document.getElementById(id);

  function update(engine, mode){
    $('score').textContent = engine.score;
    [...$('lives').children].forEach((e,i)=>e.classList.toggle('gone', i>=engine.lives));

    if(mode && mode.hudReadout){
      const r = mode.hudReadout(engine);
      $('modeLabel').textContent = r.label;
      $('liquid').style.height = Math.round((r.glassFraction||0)*100)+'%';
      $('liquid').style.background = r.glassColor || 'var(--apricot)';
    }
  }

  return { update };
})();
