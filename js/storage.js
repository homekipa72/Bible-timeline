/* storage.js — localStorage 안전 래퍼 */
'use strict';
// ===== 안전한 저장소 래퍼 =====
// 사생활 보호 모드·저장 공간 부족·손상된 데이터가 있어도 앱이 멈추지 않도록
// localStorage 접근을 모두 이 래퍼(store)로 처리합니다. 저장이 막히면 이 화면에서만 임시 보관합니다.
const store=(function(){
  const mem=Object.create(null);
  let real=null,warned=false;
  try{ real=window.localStorage; real.setItem('__mg_probe','1'); real.removeItem('__mg_probe'); }catch(e){ real=null; }
  function warn(msg){ if(warned)return; warned=true; try{ if(typeof toast==='function')toast(msg); }catch(e){} }
  if(!real) setTimeout(()=>warn('이 브라우저에서는 저장이 막혀 있어, 화면을 닫으면 기록이 사라집니다. 백업을 내려받아 주세요.'),1500);
  const api={
    getItem(k){ k=String(k); if(k in mem)return mem[k]; if(real){ try{ return real.getItem(k); }catch(e){} } return null; },
    setItem(k,v){
      k=String(k); v=String(v);
      if(real){ try{ real.setItem(k,v); delete mem[k]; return true; }catch(e){ warn('저장 공간이 부족하거나 저장할 수 없습니다. 통독 기록 탭에서 백업을 내려받아 주세요.'); } }
      mem[k]=v; return false;
    },
    removeItem(k){ k=String(k); delete mem[k]; if(real){ try{ real.removeItem(k); }catch(e){} } }
  };
  return new Proxy(api,{
    get(t,p){ if(typeof p==='symbol')return undefined; if(p in api)return api[p]; const v=api.getItem(p); return v===null?undefined:v; },
    set(t,p,v){ api.setItem(p,v); return true; },
    deleteProperty(t,p){ api.removeItem(p); return true; },
    has(t,p){ return (p in api)||api.getItem(p)!==null; }
  });
})();
function isPlainObj(v){ return !!v&&typeof v==='object'&&!Array.isArray(v); }
function systemPrefersDark(){ try{ return window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches; }catch(e){ return false; } }
function resolveTheme(pref){
  if(pref==='dark'||pref==='light') return pref;
  return systemPrefersDark()?'dark':'light';
}
function applyTheme(pref){
  const mode=pref==null?(store.themePref||'system'):pref;
  if(pref!=null) store.themePref=mode;
  const resolved=resolveTheme(mode==='system'?null:mode);
  if(mode==='system') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', mode);
  const meta=document.querySelector('meta[name="theme-color"]');
  if(meta) meta.setAttribute('content', resolved==='dark'?'#0f141b':'#172b43');
  const btn=$('themeToggle');
  if(btn){
    const label=mode==='dark'?'라이트 모드':(mode==='light'?'시스템 테마':'다크 모드');
    btn.textContent=label;
    btn.setAttribute('aria-pressed', mode==='dark'?'true':'false');
    btn.title='표시 테마: '+(mode==='system'?'시스템':mode==='dark'?'다크':'라이트');
  }
}
function toggleTheme(){
  const cur=store.themePref||'system';
  const next=cur==='system'?'dark':(cur==='dark'?'light':'system');
  applyTheme(next);
  try{ toast(next==='dark'?'다크 모드':(next==='light'?'라이트 모드':'시스템 테마')); }catch(e){}
}
// 저장된 JSON을 읽습니다. 없거나·손상되었거나·형태가 다르면 기본값을 돌려주고, 손상본은 복구용으로 따로 남깁니다.
function jget(key,fallback,valid){
  let raw=null;
  try{
    raw=store.getItem(key);
    if(raw==null||raw==='')return fallback;
    const v=JSON.parse(raw);
    if(valid&&!valid(v))throw new Error('unexpected shape');
    return v;
  }catch(e){
    try{ if(raw)store.setItem(key+'__corrupt',String(raw).slice(0,200000)); }catch(_){}
    return fallback;
  }
}
