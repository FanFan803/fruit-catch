/* 模式註冊表 */
const Modes = (function(){
  const list = [];
  const map = {};
  function register(mode){ list.push(mode); map[mode.meta.id]=mode; }
  function get(id){ return map[id]; }
  return { register, get, get list(){ return list.slice(); } };
})();
