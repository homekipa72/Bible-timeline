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
const books=[
["창세기",9,50,"Gn"],["탈출기",80,40,"Ex"],["레위기",137,27,"Lv"],["민수기",178,36,"Nm"],["신명기",235,34,"Dt"],["여호수아기",286,24,"Jos"],["판관기",320,21,"Jgs"],["룻기",355,4,"Ru"],["사무엘기 상권",361,31,"1Sm"],["사무엘기 하권",407,24,"2Sm"],["열왕기 상권",446,22,"1Kgs"],["열왕기 하권",490,25,"2Kgs"],["역대기 상권",532,29,"1Chr"],["역대기 하권",571,36,"2Chr"],["에즈라기",617,10,"Ezr"],["느헤미야기",632,13,"Neh"],["토빗기",652,14,"Tb"],["유딧기",670,16,"Jdt"],["에스테르기",691,10,"Est"],["마카베오기 상권",708,16,"1Mc"],["마카베오기 하권",750,15,"2Mc"],["욥기",781,42,"Jb"],["시편",820,150,"Ps"],["잠언",903,31,"Prv"],["코헬렛",932,12,"Eccl"],["아가",944,8,"Sng"],["지혜서",951,19,"Wis"],["집회서",972,51,"Sir"],["이사야서",1028,66,"Is"],["예레미야서",1096,52,"Jer"],["애가",1172,5,"Lam"],["바룩서",1180,6,"Bar"],["에제키엘서",1191,48,"Ez"],["다니엘서",1258,14,"Dn"],["호세아서",1287,14,"Hos"],["요엘서",1298,4,"Jl"],["아모스서",1303,9,"Am"],["오바드야서",1313,1,"Ob"],["요나서",1316,4,"Jon"],["미카서",1320,7,"Mi"],["나훔서",1327,3,"Na"],["하바쿡서",1331,3,"Hb"],["스바니야서",1335,3,"Zep"],["하까이서",1339,2,"Hg"],["즈카르야서",1342,14,"Zec"],["말라키서",1354,3,"Mal"],["마태오 복음서",1360,28,"Mt"],["마르코 복음서",1411,16,"Mk"],["루카 복음서",1445,24,"Lk"],["요한 복음서",1500,21,"Jn"],["사도행전",1542,28,"Acts"],["로마 신자들에게 보낸 서간",1591,16,"Rom"],["코린토 신자들에게 보낸 첫째 서간",1613,16,"1Cor"],["코린토 신자들에게 보낸 둘째 서간",1635,13,"2Cor"],["갈라티아 신자들에게 보낸 서간",1650,6,"Gal"],["에페소 신자들에게 보낸 서간",1659,6,"Eph"],["필리피 신자들에게 보낸 서간",1667,4,"Phil"],["콜로새 신자들에게 보낸 서간",1673,4,"Col"],["테살로니카 신자들에게 보낸 첫째 서간",1679,5,"1Thes"],["테살로니카 신자들에게 보낸 둘째 서간",1685,3,"2Thes"],["티모테오에게 보낸 첫째 서간",1689,6,"1Tm"],["티모테오에게 보낸 둘째 서간",1696,4,"2Tm"],["티토에게 보낸 서간",1701,3,"Ti"],["필레몬에게 보낸 서간",1705,1,"Phlm"],["히브리인들에게 보낸 서간",1708,13,"Heb"],["야고보 서간",1724,5,"Jas"],["베드로의 첫째 서간",1731,5,"1Pt"],["베드로의 둘째 서간",1738,3,"2Pt"],["요한의 첫째 서간",1743,5,"1Jn"],["요한의 둘째 서간",1750,1,"2Jn"],["요한의 셋째 서간",1752,1,"3Jn"],["유다 서간",1754,1,"Jude"],["요한 묵시록",1757,22,"Rv"]
];
const $=id=>document.getElementById(id);
function unit(bi){return books[bi][3]==='Ps'?'편':'장'}
function chLabel(bi,ch){return books[bi][0]+' '+ch+unit(bi)}
// 연대순 책 인덱스 (가톨릭 성경 기준)
// Great Adventure 스타일 12시대 (색상 + 핵심 구간)
const periods = [
  {id:1, name:'초기 세계', color:'#0d9488', desc:'창조와 인류의 시작'},
  {id:2, name:'성조 시대', color:'#6b21a8', desc:'아브라함과 계약'},
  {id:3, name:'이집트와 탈출', color:'#dc2626', desc:'해방과 구원'},
  {id:4, name:'광야 생활', color:'#a16207', desc:'약속의 땅을 향한 여정'},
  {id:5, name:'정복과 판관 시대', color:'#16a34a', desc:'약속의 땅 정착'},
  {id:6, name:'왕국 시대', color:'#7c3aed', desc:'이스라엘 왕국의 전성기'},
  {id:7, name:'분열 왕국', color:'#1f2937', desc:'왕국의 분열과 쇠퇴'},
  {id:8, name:'유배 시대', color:'#0ea5e9', desc:'바빌론 유배와 상실'},
  {id:9, name:'귀환 시대', color:'#eab308', desc:'고향으로 돌아오다'},
  {id:10, name:'마카베오 항쟁', color:'#ea580c', desc:'신앙과 율법을 지키기 위한 투쟁'},
  {id:11, name:'메시아의 성취', color:'#ca8a04', desc:'예수 그리스도 안에서 이루어진 구원'},
  {id:12, name:'교회 시대', color:'#f8fafc', desc:'성령과 교회의 탄생'}
];

// 장 단위 연대순: [bookIndex, fromChapter, toChapter, periodId]
// toChapter inclusive. books[bi][2] is total chapters.
const chronoRanges = [
  // 1. 초기 세계 — 창세기 1–11장
  [0,1,11,1],
  // 2. 성조 시대 — 창세기 12–50장
  [0,12,50,2],
  // 3. 이집트와 탈출 — 탈출기
  [1,1,40,3],
  // 4. 광야 생활 — 민수기
  [3,1,36,4],
  // 5. 정복과 판관 시대 — 여호수아기 · 판관기
  [5,1,24,5], [6,1,21,5],
  // 6. 왕국 시대 — 사무엘기 · 열왕기 상권 1–11장
  [8,1,31,6], [9,1,24,6], [10,1,11,6],
  // 7. 분열 왕국 — 열왕기 상권 12장 – 열왕기 하권 16장
  [10,12,22,7], [11,1,16,7],
  // 8. 유배 시대 — 열왕기 하권 17–25장
  [11,17,25,8],
  // 9. 귀환 시대 — 에즈라기 · 느헤미야기
  [14,1,10,9], [15,1,13,9],
  // 10. 마카베오 항쟁 — 마카베오기 상·하권
  [19,1,16,10], [20,1,15,10],
  // 11. 메시아의 성취 — 루카 복음서
  [48,1,24,11],
  // 12. 교회 시대 — 사도행전
  [50,1,28,12]
];

let planType=store.planType||'all';
let customPeriodSet=jget('customPeriods',[1,2,3,4,5,6,7,8,9,10,11,12],Array.isArray);
let customBookSet=jget('customBooks',null);
if(!Array.isArray(customBookSet)) customBookSet=[...Array(books.length).keys()];
// 저장된 통독 계획 (최대 5개)
let savedPlans=[];
try{ savedPlans=JSON.parse(store.savedPlans||'[]'); if(!Array.isArray(savedPlans)) savedPlans=[]; }catch(e){ savedPlans=[]; }
// 구버전 단일 계획 마이그레이션
if(!savedPlans.length && store.planType && store.start){
  savedPlans=[{
    id:'p'+Date.now(),
    name:({all:'전체통독',ot:'구약',nt:'신약',chrono:'연대순',psalms:'시편',gospels:'복음서',custom:'시대 선택',customBooks:'개별 선택'})[store.planType]||'통독',
    planType:store.planType,
    days:+store.days||365,
    start:store.start,
    customPeriodSet:jget('customPeriods',[1,2,3,4,5,6,7,8,9,10,11,12],Array.isArray),
    customBookSet:jget('customBooks',null)
  }];
  if(!Array.isArray(savedPlans[0].customBookSet)) savedPlans[0].customBookSet=[...Array(books.length).keys()];
  store.savedPlans=JSON.stringify(savedPlans);
}
if(savedPlans.length>5){ savedPlans=savedPlans.slice(0,5); store.savedPlans=JSON.stringify(savedPlans); }
let planSkipSundays=false; // 기간 설정: 주일 제외 배분
let planCalendarDays=365; // 주일 제외 전 전체 달력 일수
function persistPlans(){ store.savedPlans=JSON.stringify(savedPlans); }
let activePlanId=store.activePlanId||'';
let editingPlanId='';
let editingPlanSnapshot=null;
let lastReadByPlan={};
try{ lastReadByPlan=JSON.parse(store.lastReadByPlan||'{}')||{}; }catch(e){ lastReadByPlan={}; }
function persistLastRead(){ store.lastReadByPlan=JSON.stringify(lastReadByPlan); }
let activeReadPlanId='';
let planReadingState={};
try{planReadingState=JSON.parse(store.planReadingState_v1||'{}')||{}}catch(e){planReadingState={}}
function savePlanReadingState(){store.planReadingState_v1=JSON.stringify(planReadingState)}
let cumulativeReading={};try{cumulativeReading=JSON.parse(store.cumulativeReading_v1||'{}')||{}}catch(e){cumulativeReading={}}
function persistCumulativeReading(){store.cumulativeReading_v1=JSON.stringify(cumulativeReading)}
function recordCumulative(id,key,verses){if(!id)return;const uid=String(id)+'|'+String(key);const prior=cumulativeReading[uid]||{planId:String(id),key:String(key)};prior.verses=Array.isArray(verses)?[...new Set(verses)].sort((a,b)=>a-b):(prior.verses||[]);prior.done=!!(planState(id).chapters[key]);prior.updatedAt=new Date().toISOString();if(prior.done||prior.verses.length||cumulativeReading[uid])cumulativeReading[uid]=prior;persistCumulativeReading()}
function backfillCumulative(){for(const [id,st] of Object.entries(planReadingState)){for(const key of new Set([...Object.keys(st.chapters||{}),...Object.keys(st.verses||{})]))recordCumulative(id,key,st.verses&&st.verses[key])}}
function planState(id){if(!id)return null;if(!planReadingState[id])planReadingState[id]={chapters:{},verses:{}};const st=planReadingState[id];if(!st.chapters)st.chapters={};if(!st.verses)st.verses={};return st}
function planChapterDone(id,key){const st=planReadingState[id];return !!(st&&st.chapters&&st.chapters[key])}
function planVerseMarks(id,key){const st=planReadingState[id];return st&&st.verses&&Array.isArray(st.verses[key])?st.verses[key]:[]}
function setPlanChapterDone(id,key,done,verseNumbers){if(!id)return;const st=planState(id);if(done)st.chapters[key]=true;else delete st.chapters[key];if(Array.isArray(verseNumbers)){if(verseNumbers.length)st.verses[key]=verseNumbers;else delete st.verses[key]}else if(!done)delete st.verses[key];savePlanReadingState();recordCumulative(id,key,st.verses[key]||[])}
function togglePlanVerse(id,key,verseNo){const st=planState(id);let arr=Array.isArray(st.verses[key])?st.verses[key]:[];if(st.chapters[key]&&currentVerses.length)arr=currentVerses.map(v=>v.n);st.verses[key]=arr.includes(verseNo)?arr.filter(n=>n!==verseNo):[...arr,verseNo].sort((a,b)=>a-b);if(currentVerses.length&&st.verses[key].length===currentVerses.length)st.chapters[key]=true;else delete st.chapters[key];if(!st.verses[key].length)delete st.verses[key];savePlanReadingState();recordCumulative(id,key,st.verses[key]||[])}

function setActivePlan(id){
  activePlanId=id||'';
  store.activePlanId=activePlanId;
}
function getActivePlan(){
  if(!savedPlans.length) return null;
  let p=savedPlans.find(x=>x.id===activePlanId);
  if(!p) p=savedPlans[0];
  return p;
}
function rememberLastRead(bi, ch, planId){
  const pid=planId||activeReadPlanId;
  if(!pid) return;
  lastReadByPlan[pid]={book:+bi, chapter:+ch, at:new Date().toISOString()};
  persistLastRead();
}
function planProgress(p){
  const seq=buildSeqForPlan(p);
  let done=0;
  for(const it of seq) if(planChapterDone(p.id,verseKey(it.book,it.chapter))) done++;
  const pct=seq.length?Math.round(done/seq.length*100):0;
  const day=dayIndexForPlan(p);
  const start=new Date((p.start||'')+'T00:00:00');
  const spanDays=p.skipSundays ? (p.calendarDays||365) : (p.days||1);
  const end=new Date(start); end.setDate(end.getDate()+spanDays-1);
  const endStr=isNaN(end.getTime())?'':end.toISOString().slice(0,10);
  const today=new Date(); today.setHours(0,0,0,0);
  let status='진행 중';
  const calendarDuration=p.skipSundays?(p.calendarDays||p.days||1):(p.days||1);
  const elapsedCalendarDays=isNaN(start.getTime())?0:Math.floor((today-start)/86400000)+1;
  const expired=elapsedCalendarDays>calendarDuration;
  if(!isNaN(start.getTime()) && today<start) status='시작 전';
  else if(seq.length>0 && done>=seq.length) status='완료';
  else if(expired) status='기간 종료 · 미완료';
  else if(pct===0) status='시작 가능';
  else status='진행 중 · '+day+'일차';
  const backlog=backlogForPlan(p,seq);
  const skk=p.skipped||{};
  let skipped=0;
  for(const it of seq){ const k=verseKey(it.book,it.chapter); if(skk[k]&&!planChapterDone(p.id,k)) skipped++; }
  return {seq, done, total:seq.length, pct, day, endStr, status, backlog, skipped};
}

function buildSeqForPlan(p){
  const prev={planType, customPeriodSet, customBookSet};
  planType=p.planType;
  customPeriodSet=p.customPeriodSet||[1,2,3,4,5,6,7,8,9,10,11,12];
  customBookSet=Array.isArray(p.customBookSet)?p.customBookSet:[...Array(books.length).keys()];
  rebuildPlanSeq();
  const seq=planSeq.slice();
  planType=prev.planType; customPeriodSet=prev.customPeriodSet; customBookSet=prev.customBookSet;
  rebuildPlanSeq();
  return seq;
}
function chaptersInSavedPlans(){
  const set=new Set();
  for(const p of savedPlans){
    const seq=buildSeqForPlan(p);
    for(const it of seq) set.add(verseKey(it.book,it.chapter));
  }
  return set;
}
function countNonSundays(startStr, calendarDays){
  let count=0;
  const d=new Date(startStr+'T00:00:00');
  if(isNaN(d.getTime())) return Math.max(1, calendarDays - Math.floor(calendarDays/7));
  for(let i=0;i<calendarDays;i++){
    if(d.getDay()!==0) count++;
    d.setDate(d.getDate()+1);
  }
  return Math.max(1, count);
}
/** 시작일~기준일(포함) 사이 주일을 제외한 읽기 일수 */
function countReadingDaysElapsed(startStr, untilDate, skipSundays){
  const s=new Date(startStr+'T00:00:00');
  const t=new Date(untilDate); t.setHours(0,0,0,0);
  if(isNaN(s.getTime()) || t<s) return 0;
  let count=0;
  const cur=new Date(s);
  while(cur<=t){
    if(!skipSundays || cur.getDay()!==0) count++;
    cur.setDate(cur.getDate()+1);
  }
  return count;
}
function dayIndexForPlan(p){
  const t=new Date(); t.setHours(0,0,0,0);
  const startStr=p.start||start;
  const skip=!!p.skipSundays;
  if(skip){
    let d=countReadingDaysElapsed(startStr, t, true);
    if(d<1) d=1;
    if(d>p.days) d=p.days;
    return d;
  }
  const s=new Date(startStr+'T00:00:00');
  let d=Math.floor((t-s)/86400000)+1;
  if(d<1) d=1;
  if(d>p.days) d=p.days;
  return d;
}
function todayItemsForPlan(p){
  const seq=buildSeqForPlan(p);
  const total=seq.length;
  if(!total||!p.days) return [];
  // 주일 제외 계획: 일요일에는 배정 없음
  if(p.skipSundays){
    const t=new Date(); t.setHours(0,0,0,0);
    if(t.getDay()===0) return [];
  }
  const mk=it=>{
    const key=verseKey(it.book,it.chapter);
    return {planId:p.id, planName:p.name, book:it.book, chapter:it.chapter, period:it.period||0,
      key, done:planChapterDone(p.id,key), label:chLabel(it.book,it.chapter)};
  };
  // 밀리면 남은 기간에 다시 배분하는 방식
  if(p.catchUp==='follow') return followItemsForPlan(p,seq).map(mk);
  const day=dayIndexForPlan(p);
  const a=Math.floor((day-1)*total/p.days);
  const z=Math.max(a+1, Math.floor(day*total/p.days));
  const items=[];
  for(let i=a;i<Math.min(z,total);i++) items.push(mk(seq[i]));
  return items;
}
// 시대별 포함 성경 안내 (표시용)
const periodBookLabels={
  1:'창세기 1–11장',
  2:'창세기 12–50장',
  3:'탈출기',
  4:'민수기',
  5:'여호수아기 · 판관기',
  6:'사무엘기 · 열왕기 상권 1–11장',
  7:'열왕기 상권 12장 – 열왕기 하권 16장',
  8:'열왕기 하권 17–25장',
  9:'에즈라기 · 느헤미야기',
  10:'마카베오기 상·하권',
  11:'루카 복음서',
  12:'사도행전'
};

let planSeq=[]; // [{book,chapter,period}, ...]
function rebuildPlanSeq(){
  planSeq=[];
  const useChronoRanges = (planType==='chrono'||planType==='custom');
  if(useChronoRanges){
    const allow = planType==='custom' ? new Set(customPeriodSet.map(Number)) : null;
    for(const [bi,from,to,pid] of chronoRanges){
      if(allow && !allow.has(pid)) continue;
      const maxC=books[bi][2];
      for(let c=from;c<=Math.min(to,maxC);c++) planSeq.push({book:bi,chapter:c,period:pid});
    }
  } else {
    let idxs;
    if(planType==='ot') idxs=[...Array(46).keys()];
    else if(planType==='nt') idxs=[...Array(27).keys()].map(i=>i+46);
    else if(planType==='psalms') idxs=[22];
    else if(planType==='gospels') idxs=[46,47,48,49];
    else if(planType==='customBooks') idxs=customBookSet.slice().map(Number).filter(bi=>bi>=0&&bi<books.length).sort((a,b)=>a-b);
    else idxs=[...Array(books.length).keys()];
    if(planType==='customBooks' && !idxs.length) idxs=[0]; // 최소 1권 방지용 폴백 없음 — 빈 계획 허용하되 preview 대비
    for(const bi of idxs){
      const n=books[bi][2];
      for(let c=1;c<=n;c++) planSeq.push({book:bi,chapter:c,period:0});
    }
  }
}
rebuildPlanSeq();
let notes=jget('notes',[],Array.isArray),days=+(store.days||365),start=store.start||new Date().toISOString().slice(0,10);
let verseTotal=jget('verseTotal_v1',{},isPlainObj);let verseRead=jget('verseRead_v1',{},isPlainObj),chapterRead=jget('chapterRead_v1',{},isPlainObj),selectedBook=0,selectedChapter=1,currentVerses=[],chapterCache={};
if(store.planReadingMigrated_v1!=='1'){const legacyPlan=savedPlans.find(p=>p.id===activePlanId)||savedPlans[0];if(legacyPlan&&Object.keys(chapterRead).length){planReadingState[legacyPlan.id]={chapters:{...chapterRead},verses:{...verseRead}};savePlanReadingState()}store.planReadingMigrated_v1='1'}
backfillCumulative();
$('today').textContent=new Date().toLocaleDateString('ko-KR',{year:'numeric',month:'long',day:'numeric',weekday:'long'});
$('days').value=days;$('start').value=start;$('ndate').value=new Date().toISOString().slice(0,10);
$('verseBook').innerHTML=books.map((b,n)=>'<option value="'+n+'">'+b[0]+'</option>').join('');
let missaItems=[],currentMissaDate='',missaLoaded=false,missaRequestSeq=0;
function setMissaStatus(message,isError=false){const el=$('missaStatus');el.textContent=message;el.classList.toggle('error',isError);$('missaRetry').classList.toggle('hidden',!isError)}
function renderMissaNavigation(){
  const select=$('missaDate');select.replaceChildren();
  for(const item of missaItems){const option=document.createElement('option');option.value=item.date;option.textContent=(item.dateLabel||item.date)+' · '+item.title;select.appendChild(option)}
  if(currentMissaDate)select.value=currentMissaDate;
  const index=missaItems.findIndex(item=>item.date===currentMissaDate);
  $('missaPrev').disabled=index<=0;$('missaNext').disabled=index<0||index>=missaItems.length-1;
}
function moveMissaDate(delta){const index=missaItems.findIndex(item=>item.date===currentMissaDate);const next=missaItems[index+delta];if(next)loadMissa(next.date)}
async function loadMissa(date){
  const request=++missaRequestSeq;const today=!date;
  setMissaStatus('매일미사를 불러오는 중…');$('missaContent').classList.add('hidden');
  try{
    const url=today?'/api/missa?today=1':'/api/missa?date='+encodeURIComponent(date);
    const response=await fetch(url,{headers:{Accept:'application/json'}});
    const data=await response.json();
    if(!response.ok)throw new Error(data.error||'매일미사 응답 오류');
    if(request!==missaRequestSeq)return;
    missaItems=Array.isArray(data.items)?data.items:[];
    currentMissaDate=data.mass.date;renderMissaNavigation();
    $('missaDateLabel').textContent=data.mass.dateLabel||data.mass.date;
    $('missaHeading').textContent=data.mass.heading||data.mass.title;
    const list=$('missaReadings');list.replaceChildren();
    for(const section of data.mass.sections||[]){
      const card=document.createElement('article');card.className='card missa-reading';
      const heading=document.createElement('h3');heading.textContent=section.title;
      const text=document.createElement('p');text.className='textpage';text.textContent=section.text;
      card.append(heading,text);list.appendChild(card);
    }
    $('missaContent').classList.remove('hidden');missaLoaded=true;
    setMissaStatus('한국어 매일미사를 원문에서 불러왔습니다.');
  }catch(error){
    if(request!==missaRequestSeq)return;
    missaLoaded=false;setMissaStatus('매일미사를 불러오지 못했습니다. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.',true);
  }
}
function view(id,planId){
  if(id==='read') activeReadPlanId=planId||'';
  document.querySelectorAll('main section').forEach(s=>s.classList.add('hidden'));
  $(id).classList.remove('hidden');
  document.querySelectorAll('.nav button, .bottom-nav button').forEach(b=>{
    const on=b.dataset.v===id;
    b.classList.toggle('active',on);
    if(on) b.setAttribute('aria-current','page'); else b.removeAttribute('aria-current');
  });
  document.body.classList.toggle('read-mode', id==='read');
  if(id!=='read'&&copyMode) toggleCopyMode(false);
  if(id==='home')dashboard();
  if(id==='missa'&&!missaLoaded)loadMissa();
  if(id==='plan'){onAutoModeChange();if($('autoEnd')&&!$('autoEnd').value){const d=new Date();d.setDate(d.getDate()+364);$('autoEnd').value=d.toISOString().slice(0,10)}renderRangePreview();renderSavedPlans();syncPeriodFromAuto();preview();}
  if(id==='notes'){renderNotes();try{renderOneLine();}catch(e){}}
  if(id==='stats')stats();
  if(id==='read'){loadChapter(false);renderReadPlanPreview();updateMarkButtons();}
  window.scrollTo(0,0);
}
document.querySelectorAll('.nav button').forEach(b=>b.onclick=()=>view(b.dataset.v));
function db(){return new Promise((ok,no)=>{let r=indexedDB.open('malssumgil-bible',1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('chapters'))r.result.createObjectStore('chapters')};r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)})}
async function cacheGet(key){try{let d=await db();return await new Promise((ok,no)=>{let r=d.transaction('chapters').objectStore('chapters').get(key);r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)})}catch(e){return null}}
async function cachePut(key,value){try{let d=await db();return await new Promise((ok,no)=>{let t=d.transaction('chapters','readwrite');t.objectStore('chapters').put(value,key);t.oncomplete=ok;t.onerror=()=>no(t.error);t.onabort=()=>no(t.error)})}catch(e){return null}}
function applyTextStyle(){let el=$('bibleText');el.style.fontFamily=$('fontFamily').value;el.style.fontSize=$('fontSize').value+'px';el.style.lineHeight=$('lineHeight').value;store.fontFamily=$('fontFamily').value;store.fontSize=$('fontSize').value;store.lineHeight=$('lineHeight').value}
(function initReadingStyle(){
  const setSel=(id,v,def)=>{const el=$(id);el.value=v;if(el.value!==String(v))el.value=def;};
  setSel('fontFamily',store.fontFamily||"'Noto Serif KR',serif","'Noto Serif KR',serif");
  setSel('fontSize',store.fontSize||'18','18');
  setSel('lineHeight',store.lineHeight||'2.05','2.05');
  applyTextStyle();
})();
function selectBook(index){selectedBook=Math.max(0,Math.min(books.length-1,index));$('verseBook').value=selectedBook;let count=books[selectedBook][2],u=unit(selectedBook);$('chapterUnitLabel').childNodes[0].textContent=u+' ';$('verseChapter').innerHTML=Array.from({length:count},(_,i)=>'<option value="'+(i+1)+'">'+(i+1)+u+'</option>').join('');if($('btnPrevCh')){$('btnPrevCh').textContent='이전 '+u;$('btnNextCh').textContent='다음 '+u;$('btnMarkCh').textContent='이 '+u+' 완료'}selectedChapter=1;$('verseChapter').value='1';loadChapter(false)}
function selectChapter(ch){selectedChapter=+ch;rememberLastRead(selectedBook,selectedChapter);loadChapter(false)}
function moveChapter(delta){let c=selectedChapter+delta,b=selectedBook;if(c<1){if(b===0)return;b--;c=books[b][2]}else if(c>books[b][2]){if(b===books.length-1)return;b++;c=1}selectedBook=b;selectedChapter=c;$('verseBook').value=String(b);$('verseChapter').innerHTML=Array.from({length:books[b][2]},(_,i)=>'<option value="'+(i+1)+'">'+(i+1)+unit(b)+'</option>').join('');$('verseChapter').value=String(c);if($('btnPrevCh')){$('btnPrevCh').textContent='이전 '+unit(b);$('btnNextCh').textContent='다음 '+unit(b);$('btnMarkCh').textContent='이 '+unit(b)+' 완료'}if($('chapterUnitLabel'))$('chapterUnitLabel').childNodes[0].textContent=unit(b)+' ';rememberLastRead(b,c);loadChapter(false)}
function verseKey(b,c){return b+':'+c}
function saveVerseData(){store.verseRead_v1=JSON.stringify(verseRead);store.chapterRead_v1=JSON.stringify(chapterRead);if(periodChart||testamentChart||bookChart)updateCharts();if($('todayList'))renderTodayList()}
function htmlToText(root){let out='';const blocks=new Set(['ADDRESS','ARTICLE','ASIDE','BLOCKQUOTE','BR','DD','DIV','DL','DT','H1','H2','H3','H4','LI','OL','P','SECTION','SPAN','TABLE','TR','UL']);function walk(node){if(node.nodeType===3){out+=node.nodeValue;return}if(node.nodeType!==1)return;const tag=node.tagName;if(tag==='SCRIPT'||tag==='STYLE'||tag==='NOSCRIPT')return;if(blocks.has(tag))out+='\n';for(const child of node.childNodes)walk(child);if(blocks.has(tag))out+='\n'}walk(root);return out.replace(/\n{3,}/g,'\n\n')}
function extractVerses(html,bi=selectedBook,ch=selectedChapter){
  const doc=new DOMParser().parseFromString(html,'text/html');
  const text=htmlToText(doc.body).replace(/\r/g,'').replace(/\u00a0/g,' ');
  const headingRe=new RegExp(books[bi][0]+'\\s*'+ch+'\\s*'+'(?:장|편)');
  const headingMatch=text.match(headingRe);
  if(!headingMatch)throw new Error('본문 제목을 찾을 수 없습니다. 공식 사이트의 페이지 구성이 변경되었을 수 있습니다.');
  // 본문 영역에서 절 번호와 절 내용을 함께 읽어 메뉴나 소제목이 섞이지 않도록 합니다.
  const content=doc.querySelector('#bibleContents');
  if(content){
    const parsed=Array.from(content.children).map(row=>{
      const number=row.querySelector('.col-1 .highlight');
      const words=row.querySelector('.col-11');
      const label=number&&number.textContent.trim();
      if(!words||!/^\d{1,3}$/.test(label||''))return null;
      const verseText=htmlToText(words).replace(/\s+/g,' ').trim();
      return verseText?{n:+label,text:verseText}:null;
    }).filter(Boolean);
    if(parsed.length)return parsed;
  }
  // 이전 구조의 공식 페이지를 위한 기존 텍스트 추출 방식입니다.
  let body=text.slice(headingMatch.index+headingMatch[0].length);
  const end=body.search(/\n성경\s*\n(?:구약|신약)/);
  if(end>=0)body=body.slice(0,end);
  let lines=body.split('\n').map(x=>x.trim()).filter(Boolean),verses=[],started=false;
  for(let line of lines){
    if(/^\d{1,3}$/.test(line)){verses.push({n:+line,text:''});started=true;continue}
    let inline=line.match(/^(\d{1,3})\s+(.+)$/);
    if(inline){verses.push({n:+inline[1],text:inline[2]});started=true;continue}
    if(started){if(/^(함께보기|장 바로가기|성경|구약|신약)$/.test(line))break;verses[verses.length-1].text+=(verses[verses.length-1].text?' ':'')+line}
  }
  verses=verses.filter(v=>v.n>0&&v.text);
  if(!verses.length)throw new Error('본문 절을 구분하지 못했습니다.');
  return verses;
}
async function loadChapter(force){copySel.clear();updateCopyBar();const b=books[selectedBook],key=b[3]+'/'+selectedChapter;$('verseBook').value=String(selectedBook);$('verseChapter').value=String(selectedChapter);$('chapterHeading').textContent=chLabel(selectedBook,selectedChapter);$('readerTitle').textContent=chLabel(selectedBook,selectedChapter);$('chapterStatus').textContent='본문 확인 중…';renderChapterGrid();try{let verses=!force?await cacheGet(key):null;if(!verses){const r=await fetch('/api/bible?book='+encodeURIComponent(b[3])+'&chapter='+selectedChapter);if(!r.ok)throw new Error('성경 본문 서버 응답 오류 ('+r.status+')');const html=await r.text();verses=extractVerses(html);await cachePut(key,verses)}currentVerses=verses;renderChapter();$('chapterStatus').textContent='본문 '+verses.length+'절 · '+(force?'공식 사이트에서 새로 가져와 저장했습니다.':'기기 저장본을 사용했습니다.')}catch(e){$('chapterStatus').textContent='본문을 불러오지 못했습니다: '+e.message;let cached=await cacheGet(key).catch(()=>null);if(cached){currentVerses=cached;renderChapter();$('chapterStatus').textContent='온라인 연결 실패 · 기기에 저장된 본문 '+cached.length+'절을 표시합니다.'}}}
function renderChapter(){ try{updateMarkButtons()}catch(e){} let key=verseKey(selectedBook,selectedChapter),marked=activeReadPlanId?(planChapterDone(activeReadPlanId,key)?currentVerses.map(v=>v.n):planVerseMarks(activeReadPlanId,key)):(verseRead[key]||[]);let host=$('bibleText');host.innerHTML='';currentVerses.forEach(v=>{let row=document.createElement('div');row.className='bible-verse'+(marked.includes(v.n)?' read':'')+(copyMode&&copySel.has(v.n)?' sel':'');row.title=copyMode?'본문을 눌러 복사할 절 선택/해제':'본문을 누르면 읽음 표시가 바뀝니다';let num=document.createElement('span');num.className='num';num.textContent=v.n;let words=document.createElement('span');words.className='words';words.innerHTML=fmtVerse(v.text);let noteButton=document.createElement('button');noteButton.type='button';noteButton.className='verse-note-action';noteButton.textContent='기록';noteButton.setAttribute('aria-label',verseRefLabel(selectedBook,selectedChapter,[v.n])+' 한 줄 기록');noteButton.onclick=event=>{event.preventDefault();event.stopPropagation();openVerseNote(v.n,noteButton)};row.append(num,words,noteButton);row.onclick=()=>copyMode?toggleCopySel(v.n):toggleVerse(v.n);host.appendChild(row)});let chapterDone=activeReadPlanId?planChapterDone(activeReadPlanId,key):!!chapterRead[key];$('chapterProgress').textContent=chLabel(selectedBook,selectedChapter)+' · '+marked.length+'/'+currentVerses.length+'절 읽음'+(chapterDone?' · 완료':'');if(currentVerses.length&&verseTotal[key]!==currentVerses.length){verseTotal[key]=currentVerses.length;saveTotals()}renderChapterGrid();applyTextStyle();dashboard()}
function saveTotals(){try{store.verseTotal_v1=JSON.stringify(verseTotal)}catch(e){}}
function chStatus(b,c){let k=verseKey(b,c),done=activeReadPlanId?planChapterDone(activeReadPlanId,k):chapterRead[k],marks=activeReadPlanId?planVerseMarks(activeReadPlanId,k):(verseRead[k]||[]);return done?'done':(marks.length?'part':'')}
function renderChapterGrid(){let n=books[selectedBook][2];$('chapterGrid').innerHTML=Array.from({length:n},(_,i)=>{let c=i+1;return '<button class="'+chStatus(selectedBook,c)+(c===selectedChapter?' selected':'')+'" onclick="selectChapter('+c+')" aria-label="'+c+unit(selectedBook)+'">'+c+'</button>'}).join('')}
function fmtVerse(t){let h=safe(t),hide=store.hideNotes==='1';return h.replace(/(\d{1,3})\)/g,(m,d,off,str)=>{let p=str[off-1];if(!p||/[\s(\d]/.test(p))return m;return hide?'':'<sup class="fn">'+d+')</sup>'})}
function toggleNotes(){store.hideNotes=$('hideNotes').checked?'1':'0';renderChapter()}
async function prefetchBook(){let bi=selectedBook,b=books[bi],btn=$('prefetchBtn'),fail=0;btn.disabled=true;for(let c=1;c<=b[2];c++){$('chapterStatus').textContent=b[0]+' 내려받는 중… '+c+' / '+b[2]+unit(selectedBook);let key=b[3]+'/'+c;try{let v=await cacheGet(key);if(!v){let r=await fetch('/api/bible?book='+encodeURIComponent(b[3])+'&chapter='+c);if(!r.ok)throw new Error(r.status);v=extractVerses(await r.text(),bi,c);await cachePut(key,v);await new Promise(o=>setTimeout(o,300))}verseTotal[verseKey(bi,c)]=v.length}catch(e){fail++}}saveTotals();btn.disabled=false;$('chapterStatus').textContent=b[0]+' 내려받기 완료'+(fail?' · 실패 '+fail+unit(selectedBook)+' (다시 누르면 이어서 받습니다)':' · 오프라인에서도 읽을 수 있습니다.');renderChapter()}
function toggleVerse(v){const key=verseKey(selectedBook,selectedChapter);if(activeReadPlanId)togglePlanVerse(activeReadPlanId,key,v);else{const arr=verseRead[key]||[];verseRead[key]=arr.includes(v)?arr.filter(x=>x!==v):[...arr,v].sort((a,b)=>a-b);if(currentVerses.length&&verseRead[key].length===currentVerses.length)chapterRead[key]=true;else if(verseRead[key].length<currentVerses.length)chapterRead[key]=false;saveVerseData()}renderChapter()}

function saveQuickReflect(){
  const el=$('quickReflect');
  if(!el) return;
  const v=el.value.trim();
  if(!v){ toast('묵상 내용을 입력해 주세요.'); return; }
  addNote({verse:chLabel(selectedBook,selectedChapter),reflection:v});
  el.value='';
  toast('한 줄 묵상을 저장했습니다.');
}
let verseNoteTrigger=null, verseNotePreviousOverflow='';
function openVerseNote(verseNo,trigger){
  const verse=currentVerses.find(item=>item.n===verseNo);
  if(!verse){toast('먼저 성경 본문을 불러와 주세요.');return}
  const modal=$('verseNoteModal'),input=$('verseNoteInput');
  verseNoteTrigger=trigger||null;
  $('verseNoteRef').textContent=verseRefLabel(selectedBook,selectedChapter,[verseNo]);
  $('verseNoteText').textContent='“'+stripFootnotes(verse.text)+'”';
  input.value='';updateVerseNoteCount();
  verseNotePreviousOverflow=document.body.style.overflow;
  document.body.style.overflow='hidden';
  modal.classList.remove('hidden');modal.setAttribute('aria-hidden','false');
  modal._keyHandler=event=>{
    if(event.key==='Escape'){event.preventDefault();closeVerseNote()}
    else if(event.key==='Enter'&&(event.ctrlKey||event.metaKey)){event.preventDefault();saveVerseNote()}
  };
  document.addEventListener('keydown',modal._keyHandler);
  input.focus();
}
function updateVerseNoteCount(){
  const input=$('verseNoteInput'),counter=$('verseNoteCount');
  if(input&&counter)counter.textContent=input.value.length+'/200';
}
function closeVerseNote(){
  const modal=$('verseNoteModal');
  if(!modal)return;
  modal.classList.add('hidden');modal.setAttribute('aria-hidden','true');
  document.body.style.overflow=verseNotePreviousOverflow;
  if(modal._keyHandler){document.removeEventListener('keydown',modal._keyHandler);delete modal._keyHandler}
  if(verseNoteTrigger&&document.contains(verseNoteTrigger))verseNoteTrigger.focus();
  verseNoteTrigger=null;
}
function saveVerseNote(){
  const text=$('verseNoteInput').value.trim();
  if(!text){toast('기록할 한 줄을 입력해 주세요.');$('verseNoteInput').focus();return}
  const ref=$('verseNoteRef').textContent;
  addNote({verse:ref,reflection:text});
  closeVerseNote();
  toast(ref+'에 한 줄을 기록했습니다.');
}
function updateMarkButtons(){
  const key=verseKey(selectedBook,selectedChapter);
  const done=activeReadPlanId?planChapterDone(activeReadPlanId,key):!!chapterRead[key];
  const label=done?'완료 취소':'이 장 완료';
  const short=done?'취소':'완료';
  if($('btnMarkCh')) $('btnMarkCh').textContent=label;
  if($('btnMarkChDock')) $('btnMarkChDock').textContent=short;
}
function markChapter(){const key=verseKey(selectedBook,selectedChapter);if(activeReadPlanId){const done=!planChapterDone(activeReadPlanId,key);setPlanChapterDone(activeReadPlanId,key,done,done?currentVerses.map(v=>v.n):[]);rememberLastRead(selectedBook,selectedChapter,activeReadPlanId)}else{chapterRead[key]=!chapterRead[key];if(chapterRead[key]&&currentVerses.length)verseRead[key]=currentVerses.map(v=>v.n);rememberLastRead(selectedBook,selectedChapter)}saveVerseData();renderChapter();renderReadPlanPreview();updateMarkButtons();if($("homePlanList"))renderHomePlans()}
function clearCurrentChapter(){let key=verseKey(selectedBook,selectedChapter);if(!confirm(chLabel(selectedBook,selectedChapter)+'의 읽음 기록을 지울까요?'))return;if(activeReadPlanId)setPlanChapterDone(activeReadPlanId,key,false,[]);else{delete verseRead[key];delete chapterRead[key];saveVerseData()}renderChapter()}
function totalChapters(){return planSeq.length}
function flatChapter(index){if(index<0)index=0;if(index>=planSeq.length)index=planSeq.length-1;return planSeq[index]}
function dailyRange(){let elapsed=Math.max(1,Math.floor((Date.now()-new Date(start+'T00:00:00'))/86400000)+1),day=Math.min(days,elapsed),total=totalChapters(),a=Math.floor((day-1)*total/days),z=Math.max(a+1,Math.floor(day*total/days));return{day,a,z}}
function openReading(bi, ch, planId){
  if(planId) setActivePlan(planId);
  view('read',planId||'');
  selectBook(+bi);
  selectChapter(+ch);
}
function renderTodayList(){
  const el=$('todayList');
  if(!el) return;
  if(!savedPlans.length){
    el.innerHTML='<p class="muted small">저장된 통독 계획이 없습니다. 통독 계획 탭에서 이름·범위·시작일·기간을 설정한 뒤 저장해 주세요.</p>';
    return;
  }
  let html='';
  for(const p of savedPlans){
    const items=todayItemsForPlan(p);
    const doneN=items.filter(x=>x.done).length;
    html+='<div style="margin-bottom:14px;padding:12px;border-radius:10px;border:1px solid var(--line);background:var(--soft)">';
    html+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><b>'+safe(p.name)+'</b><span class="small muted">'+doneN+'/'+items.length+' · '+p.days+'일 중 '+dayIndexForPlan(p)+'일차</span></div>';
    if(!items.length){
      html+='<p class="small muted">오늘 배정 분량이 없습니다.</p>';
    } else {
      html+=items.map(it=>{
        const bg=it.done?'#e8f5e9':'#fff';
        const border=it.done?'#a5d6a7':'var(--line)';
        return '<button type="button" data-plan-id="'+safe(it.planId)+'" onclick="openReading('+it.book+','+it.chapter+',this.dataset.planId)" style="text-align:left;width:100%;margin:4px 0;padding:10px 12px;border-radius:8px;border:1px solid '+border+';background:'+bg+';cursor:pointer;display:flex;justify-content:space-between;align-items:center"><span><b>'+it.label+'</b></span><span class="small" style="color:'+(it.done?'var(--ok-text)':'var(--muted)')+'">'+(it.done?'완료':'미완료')+'</span></button>';
      }).join('');
    }
    html+='</div>';
  }
  el.innerHTML=html;
}
function renderHomePlans(){
  const el=$('homePlanList');
  if(!el) return;
  if(!savedPlans.length){
    el.innerHTML='<div class="card"><p class="muted">진행 중인 통독 계획이 없습니다.</p><p class="small muted">통독 계획 탭에서 이름·범위·시작일·기간을 설정한 뒤 저장해 주세요. (최대 5개)</p><button type="button" onclick="view(\'plan\')">통독 계획 만들기</button></div>';
    return;
  }
  el.innerHTML=savedPlans.map((p,idx)=>{
    const pr=planProgress(p);
    const periodText=(p.start||'')+(pr.endStr?' ~ '+pr.endStr:'')+' · '+p.days+'일';
    const active= (getActivePlan()&&getActivePlan().id===p.id);
    return '<div class="card" style="border-color:'+(active?'var(--gold)':'var(--line)')+'">'+
      '<div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start">'+
        '<div><div class="eyebrow">READING PLAN</div><h2 style="margin:4px 0 8px;font:22px Georgia;color:var(--navy)">'+safe(p.name)+'</h2>'+
        '<div class="small muted">기한 '+safe(periodText)+'</div>'+
        '<div class="small" style="margin-top:4px">상태 · <b>'+safe(pr.status)+'</b></div></div>'+
        '<div style="text-align:right"><div class="metric" style="font-size:26px">'+pr.pct+'%</div><div class="small muted">'+pr.done+'/'+pr.total+'</div></div>'+
      '</div>'+
      '<div class="progress" style="margin-top:12px"><span style="width:'+pr.pct+'%"></span></div>'+
      catchUpHtml(p,pr)+
      '<div class="row" style="margin-top:14px;flex-wrap:wrap;gap:8px">'+
        '<button type="button" onclick="openPlanReading(\''+p.id+'\',\'last\')">성경 읽기</button>'+
        '<button type="button" class="alt" onclick="openPlanReading(\''+p.id+'\',\'today\')">오늘 분량 읽기</button>'+
        '<button type="button" class="alt" onclick="completePlanToday(\''+p.id+'\')">오늘 분량 완료</button>'+
        '<button type="button" class="alt" onclick="openCard({type:\'progress\',planId:\''+p.id+'\'})">진도 카드</button>'+
        '<button type="button" class="alt" style="color:#9f3434;border:1px solid #e4b9b9" onclick="deleteSavedPlan('+idx+')" aria-label="'+safe(p.name)+' 계획 삭제">삭제</button>'+
      '</div></div>';
  }).join('');
}
function dashboard(){
  const t=$('today');
  if(t) t.textContent=new Date().toLocaleDateString('ko-KR',{year:'numeric',month:'long',day:'numeric',weekday:'long'});
  renderHomePlans();
  try{ renderOneLine(); }catch(e){}
}
function openPlanReading(planId, mode){
  setActivePlan(planId);
  activeReadPlanId=planId;
  const p=savedPlans.find(x=>x.id===planId);
  if(!p){ view('read'); return; }
  if(mode==='today'){
    const items=todayItemsForPlan(p);
    if(items.length){
      selectBook(items[0].book);
      selectChapter(items[0].chapter);
    } else {
      const lr=lastReadByPlan[planId];
      if(lr){ selectBook(lr.book); selectChapter(lr.chapter); }
    }
  } else {
    const lr=lastReadByPlan[planId];
    if(lr){ selectBook(lr.book); selectChapter(lr.chapter); }
    else {
      const items=todayItemsForPlan(p);
      if(items.length){ selectBook(items[0].book); selectChapter(items[0].chapter); }
      else {
        const seq=buildSeqForPlan(p);
        if(seq.length){ selectBook(seq[0].book); selectChapter(seq[0].chapter); }
      }
    }
  }
  view('read',planId);
  renderReadPlanPreview();
}
function resumeLastRead(){
  const p=getActivePlan();
  if(!p){ view('read'); return; }
  openPlanReading(p.id,'last');
}
function openTodayPortion(){
  const p=getActivePlan();
  if(!p){ alert('진행 중인 통독 계획이 없습니다.'); return; }
  openPlanReading(p.id,'today');
}
function completePlanToday(planId){
  const p=savedPlans.find(x=>x.id===planId)||getActivePlan();
  if(!p){ alert('계획이 없습니다.'); return; }
  const items=todayItemsForPlan(p);
  if(!items.length){ alert('오늘 완료할 분량이 없습니다.'); return; }
  for(const it of items){const count=verseTotal[it.key]||(selectedBook===it.book&&selectedChapter===it.chapter?currentVerses.length:0);const verses=Array.from({length:count},(_,i)=>i+1);setPlanChapterDone(p.id,it.key,true,verses);}
  savePlanReadingState();
  dashboard();
  renderReadPlanPreview();
  alert('「'+p.name+'」 오늘 분량 '+items.length+'개를 완료로 기록했습니다.');
}
function renderReadPlanPreview(){
  const meta=$('readPlanMeta');
  const box=$('readPlanPreview');
  if(!box) return;
  const p=getActivePlan();
  if(!p){
    if(meta) meta.textContent='통독 계획이 없습니다. 오늘의 통독에서 계획을 선택하거나 통독 계획 탭에서 저장해 주세요.';
    box.innerHTML='';
    return;
  }
  const pr=planProgress(p);
  if(meta) meta.innerHTML='<b style="color:var(--navy)">'+safe(p.name)+'</b> · '+pr.done+'/'+pr.total+' ('+pr.pct+'%) · '+safe(pr.status);
  // 일정(일) 기준 미리보기: 완료/미완료 일차 요약 + 책별
  const seq=pr.seq;
  const days=p.days||1;
  let dayHtml='';
  // 요청 범위: 밀린 일정, 오늘, 내일만 표시.
  const cur=dayIndexForPlan(p);
  const from=Math.max(1, cur-1);
  const to=Math.min(days, cur+1);
  if(p.catchUp==='follow'){
    const left=pr.total-pr.done-pr.skipped;
    dayHtml+='<div class="notice" style="margin-bottom:8px">남은 <b>'+Math.max(0,left)+'</b>개를 남은 기간에 자동으로 나눠 읽는 방식입니다. 오늘 분량은 하루 동안 고정됩니다.</div>';
  } else {
  dayHtml+='<details open style="margin-bottom:8px"><summary class="small" style="cursor:pointer;font-weight:600">일정 미리보기 · 밀림/오늘/내일</summary><div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px">';
  for(let d=from;d<=to;d++){
    const a=Math.floor((d-1)*seq.length/days);
    const z=Math.max(a+1, Math.floor(d*seq.length/days));
    let allDone=true, any=false;
    for(let i=a;i<Math.min(z,seq.length);i++){
      any=true;
      if(!planChapterDone(p.id,verseKey(seq[i].book,seq[i].chapter))) allDone=false;
    }
    const isToday=d===cur;
    const bg=allDone&&any?'#e8f5e9':(isToday?'#fff8e7':'#f5f2eb');
    const border=allDone&&any?'#a5d6a7':(isToday?'var(--gold)':'var(--line)');
    dayHtml+='<span style="padding:4px 8px;border-radius:6px;border:1px solid '+border+';background:'+bg+';font-size:12px">'+d+'일'+(allDone&&any?' ✓':'')+(isToday?' ·오늘':'')+'</span>';
  }
  dayHtml+='</div>';
  }
  if(pr.backlog.length){
    dayHtml+='<div class="small" style="margin:12px 0 6px;color:#9a5b00"><b>밀린 분량 '+pr.backlog.length+'개</b></div>'+
      pr.backlog.slice(0,12).map(it=>'<button type="button" class="alt" style="margin:3px 4px 3px 0;border:1px solid #e0b77a" onclick="selectBook('+it.book+');selectChapter('+it.chapter+');renderReadPlanPreview()">'+it.label+'</button>').join('')+
      (pr.backlog.length>12?'<span class="small muted"> 외 '+(pr.backlog.length-12)+'개</span>':'');
  }
  if(p.catchUp!=='follow')dayHtml+='</details>';
  else dayHtml='<details open style="margin-bottom:8px"><summary class="small" style="cursor:pointer;font-weight:600">일정 미리보기 · 밀림/오늘/내일</summary>'+dayHtml+'</details>';
  // 책별 완료/미완료
  const byBook=new Map();
  for(const it of seq){
    if(!byBook.has(it.book)) byBook.set(it.book,{done:0,total:0});
    const o=byBook.get(it.book); o.total++;
    if(planChapterDone(p.id,verseKey(it.book,it.chapter))) o.done++;
  }
  let bookHtml='<details style="margin-top:8px"><summary class="small" style="cursor:pointer;font-weight:600">책별 진도</summary><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:6px;margin-top:8px">';
  for(const [bi,o] of [...byBook.entries()].sort((a,b)=>a[0]-b[0])){
    const done=o.done>=o.total;
    bookHtml+='<div style="padding:8px;border-radius:8px;border:1px solid '+(done?'#a5d6a7':'var(--line)')+';background:'+(done?'#e8f5e9':'#faf8f3')+';font-size:12px"><b>'+safe(books[bi][0])+'</b><div class="muted">'+o.done+'/'+o.total+(done?' · 완료':' · 미완료')+'</div></div>';
  }
  bookHtml+='</div></details>';
  // 오늘 분량
  const today=todayItemsForPlan(p);
  let todayHtml='';
  if(today.length){
    todayHtml='<div class="small" style="margin:12px 0 6px"><b>오늘 분량</b></div>';
    todayHtml+=today.map(it=>'<button type="button" class="alt" style="margin:3px 4px 3px 0" onclick="selectBook('+it.book+');selectChapter('+it.chapter+');renderReadPlanPreview()">'+it.label+(it.done?' ✓':'')+'</button>').join('');
  }
  box.innerHTML=dayHtml+todayHtml+bookHtml;
}
function preview(){days=effectiveDays();start=$('start').value||start;let r=dailyRange(),first=flatChapter(r.a),last=flatChapter(Math.min(totalChapters()-1,r.z-1));
let periodHtml='';
if(planType==='chrono'&&first.period){
  const p=periods[first.period-1];
  periodHtml='<div style="margin:10px 0;padding:10px 12px;border-radius:10px;background:'+p.color+'22;border-left:4px solid '+p.color+'"><b style="color:'+(p.id===12?'#334155':p.color)+'">'+p.name+'</b> <span class="small muted">'+p.desc+'</span></div>';
}
$('preview').innerHTML='<div class="metric">제 '+r.day+'일차 / '+days+'일 · 총 '+totalChapters()+'개 분량</div>'+periodHtml+'<p>오늘 권장 분량: '+chLabel(first.book,first.chapter)+(r.z-r.a>1?' – '+chLabel(last.book,last.chapter):'')+' ('+(r.z-r.a)+'개)</p><div class="progress"><span style="width:'+Math.min(100,r.day/days*100)+'%"></span></div>'}

function onDaysChange(){const c=$('days').value==='customDays';$('customDaysWrap').classList.toggle('hidden',!c);preview()}

function renderRangePreview(){
  const el=$('rangePreview');
  if(!el) return;
  // 개별 선택에서만 범위 미리보기 표시
  if(planType!=='customBooks'){
    el.classList.add('hidden');
    el.innerHTML='';
    return;
  }
  el.classList.remove('hidden');
  rebuildPlanSeq();
  const total=totalChapters();
  if(!total){
    el.innerHTML='<span style="color:#b91c1c">이 범위에 분량이 없습니다. 책을 선택해 주세요.</span>';
    return;
  }
  const bookMap=new Map();
  for(const it of planSeq){
    if(!bookMap.has(it.book)) bookMap.set(it.book,0);
    bookMap.set(it.book, bookMap.get(it.book)+1);
  }
  const booksHtml=[...bookMap.entries()].map(([bi,n])=>safe(books[bi][0])+' <span class="muted">('+n+unit(bi)+')</span>').join(' · ');
  const first=planSeq[0], last=planSeq[planSeq.length-1];
  el.innerHTML='<b>개별 선택 미리보기</b> · 총 <b>'+total+'</b>개 분량<br><span class="muted">'+chLabel(first.book,first.chapter)+' → '+chLabel(last.book,last.chapter)+'</span><div style="margin-top:8px;line-height:1.5">'+booksHtml+'</div>';
}

function renderPlanCardPreview(){
  const box=$('preview');
  if(!box) return;
  rebuildPlanSeq();
  const total=totalChapters();
  const nDays=effectiveDays();
  const startStr=($('start')&&$('start').value)||start||new Date().toISOString().slice(0,10);
  const enteredName=$('planName')?$('planName').value.trim():'';
  const name=enteredName||planTypeLabel(planType);
  const perAvg=total?Math.round(total/nDays*10)/10:0;
  const calendarDays=planSkipSundays?planCalendarDays:nDays;
  let endStr='';
  try{
    const s=new Date(startStr+'T00:00:00');
    const e=new Date(s); e.setDate(e.getDate()+calendarDays-1);
    endStr=e.toLocaleDateString('ko-KR',{year:'numeric',month:'long',day:'numeric'});
  }catch(err){}
  const periodText=startStr+(endStr?' ~ '+endStr:'')+' · 총 '+calendarDays+'일'+(planSkipSundays?' (읽기 '+nDays+'일, 주일 제외)':'');
  const status='시작 가능';
  // 오늘의 통독 홈 카드와 동일한 레이아웃
  box.innerHTML=
    '<p class="small muted" style="margin-bottom:8px">저장 후 오늘의 통독에 표시될 카드 미리보기</p>'+
    '<div class="card" style="margin:0;border-color:var(--gold)">'+
      '<div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start">'+
        '<div><div class="eyebrow">READING PLAN</div><h2 style="margin:4px 0 8px;font:22px Georgia;color:var(--navy)">'+safe(name)+'</h2>'+
        '<div class="small muted">기한 '+safe(periodText)+'</div>'+
        '<div class="small" style="margin-top:4px">상태 · <b>'+status+'</b></div></div>'+
        '<div style="text-align:right"><div class="metric" style="font-size:26px">0%</div><div class="small muted">0/'+total+'</div></div>'+
      '</div>'+
      '<div class="progress" style="margin-top:12px"><span style="width:0%"></span></div>'+
      '<div class="row" style="margin-top:14px;flex-wrap:wrap;gap:8px">'+
        '<button type="button" disabled>성경 읽기</button>'+
        '<button type="button" class="alt" disabled>오늘 분량 읽기</button>'+
        '<button type="button" class="alt" disabled>오늘 분량 완료</button>'+
      '</div></div>';
}

function syncPeriodFromAuto(){
  const mode=($('autoMode')&&$('autoMode').value)||'days';
  rebuildPlanSeq();
  const total=totalChapters();
  const startStr=($('start')&&$('start').value)||start||new Date().toISOString().slice(0,10);
  let nDays;
  let calendarDays;
  if(mode==='perDay'){
    const per=Math.max(1, Math.min(50, +($('autoPerDay')&&$('autoPerDay').value)||3));
    nDays=Math.max(7, Math.ceil((total||1)/per));
    calendarDays=nDays;
  } else if(mode==='endDate'){
    const endStr=$('autoEnd')&&$('autoEnd').value;
    if(endStr){
      const s=new Date(startStr+'T00:00:00'), e=new Date(endStr+'T00:00:00');
      nDays=Math.floor((e-s)/86400000)+1;
      if(nDays<7) nDays=7;
      if(nDays>2000) nDays=2000;
    } else nDays=days||365;
    calendarDays=nDays;
  } else {
    calendarDays=Math.max(7, Math.min(2000, +($('autoDays')&&$('autoDays').value)||365));
    nDays=calendarDays;
  }
  if(planSkipSundays&&mode==='days'){
    if(calendarDays<9){calendarDays=9;if($('autoDays'))$('autoDays').value='9'}
    nDays=countNonSundays(startStr,calendarDays);
  }
  planCalendarDays=calendarDays;
  setPlanDaysUI(nDays);
  if($('autoPlanResult')){
    const perAvg=total?Math.round(total/nDays*10)/10:0;
    const sundays=calendarDays-nDays;
    let detail=planSkipSundays?' · 총 '+calendarDays+'일 중 주일 '+sundays+'일 제외, 읽기 '+nDays+'일':' · 총 '+nDays+'일';
    let endLabel='';
    if(planSkipSundays){const end=new Date(startStr+'T00:00:00');end.setDate(end.getDate()+calendarDays-1);endLabel=' · 예상 종료 '+end.toLocaleDateString('ko-KR',{year:'numeric',month:'long',day:'numeric'})}
    $('autoPlanResult').textContent='배분: 총 '+total+'분량'+detail+' · 하루 평균 '+perAvg+'장'+endLabel;
  }
  const toggle=$('skipSundayBtn');
  if(toggle){toggle.classList.toggle('on',planSkipSundays);toggle.setAttribute('aria-pressed',String(planSkipSundays))}
  const notice=$('sundaySkipNotice');
  if(notice){notice.classList.toggle('hidden',!planSkipSundays);if(planSkipSundays){const end=new Date(startStr+'T00:00:00');end.setDate(end.getDate()+calendarDays-1);notice.textContent='주일을 제외해 총 '+calendarDays+'일 중 실제 읽기 '+nDays+'일로 배분합니다. 예상 종료일은 '+end.toLocaleDateString('ko-KR',{year:'numeric',month:'long',day:'numeric'})+'입니다.'}}
  renderPlanCardPreview();
  preview();
}
function renderSavedPlans(){
  try{ renderIcsOptions(); }catch(e){}
  const el=$('savedPlansList');
  const lab=$('planCountLabel');
  if(lab) lab.textContent='('+savedPlans.length+'/5)';
  if(!el) return;
  if(!savedPlans.length){
    el.innerHTML='<p class="muted small">아직 저장된 계획이 없습니다.</p>';
    return;
  }
  el.innerHTML=savedPlans.map((p,idx)=>{
    const seq=buildSeqForPlan(p);
    let done=0;
    for(const it of seq) if(planChapterDone(p.id,verseKey(it.book,it.chapter))) done++;
    const pct=seq.length?Math.round(done/seq.length*100):0;
    return '<div style="padding:12px;margin:8px 0;border-radius:10px;border:1px solid var(--line);background:var(--soft)"><div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start"><div><b>'+safe(p.name)+'</b><div class="small muted">'+p.start+' 시작 · '+p.days+'일 · '+done+'/'+seq.length+' ('+pct+'%)</div><div class="progress" style="margin-top:6px"><span style="width:'+pct+'%"></span></div></div><div class="row" style="gap:6px"><button type="button" class="alt" style="padding:6px 10px;font-size:12px" data-plan-id="'+safe(p.id)+'" onclick="editSavedPlan(this.dataset.planId)">편집</button><button type="button" class="alt" style="padding:6px 10px;font-size:12px" onclick="deleteSavedPlan('+idx+')">삭제</button></div></div></div>';
  }).join('');
}
function editSavedPlan(planId){
  const p=savedPlans.find(x=>x.id===planId);if(!p)return;
  if(editingPlanId===planId)return;
  if(editingPlanId){if(!confirm('현재 편집 중인 변경 사항을 취소하고 다른 계획을 편집할까요?'))return;cancelPlanEdit()}
  const priorEditingId=editingPlanId;
  const formValues={};
  ['planName','planType','start','autoMode','autoDays','autoPerDay','autoEnd','days','customDays'].forEach(id=>{const el=$(id);if(el)formValues[id]=el.value});
  editingPlanSnapshot={formValues,priorEditingId,activePlanId,planType,customPeriodSet:customPeriodSet.slice(),customBookSet:customBookSet.slice(),planSkipSundays,planCalendarDays,days,start};
  editingPlanId=p.id;
  $('planName').value=p.name||'';
  $('planType').value=p.planType||'all';
  customPeriodSet=(p.customPeriodSet||[1,2,3,4,5,6,7,8,9,10,11,12]).slice();
  customBookSet=Array.isArray(p.customBookSet)?p.customBookSet.slice():[...Array(books.length).keys()];
  onPlanTypeChange();
  $('start').value=p.start||start;
  $('autoMode').value='days';
  planSkipSundays=!!p.skipSundays;
  planCalendarDays=p.skipSundays?(p.calendarDays||p.days):p.days;
  $('autoDays').value=String(planCalendarDays||p.days||365);
  if($('planSaveBtn'))$('planSaveBtn').textContent='수정 저장';
  if($('cancelPlanEditBtn'))$('cancelPlanEditBtn').classList.remove('hidden');
  setActivePlan(p.id);view('plan');syncPeriodFromAuto();renderPlanCardPreview();
}
function cancelPlanEdit(){
  const snap=editingPlanSnapshot;
  editingPlanSnapshot=null;
  editingPlanId=snap?snap.priorEditingId:'';
  if(snap){
    planType=snap.planType;customPeriodSet=snap.customPeriodSet.slice();customBookSet=snap.customBookSet.slice();
    planSkipSundays=snap.planSkipSundays;planCalendarDays=snap.planCalendarDays;days=snap.days;start=snap.start;
    for(const [id,value] of Object.entries(snap.formValues)){const el=$(id);if(el)el.value=value}
    setActivePlan(snap.activePlanId);
    onPlanTypeChange();
    for(const [id,value] of Object.entries(snap.formValues)){const el=$(id);if(el)el.value=value}
    planType=snap.planType;customPeriodSet=snap.customPeriodSet.slice();customBookSet=snap.customBookSet.slice();
    planSkipSundays=snap.planSkipSundays;planCalendarDays=snap.planCalendarDays;days=snap.days;start=snap.start;
  }else if($('planName'))$('planName').value='';
  if($('planSaveBtn'))$('planSaveBtn').textContent=editingPlanId?'수정 저장':'계획 저장';
  if($('cancelPlanEditBtn'))$('cancelPlanEditBtn').classList.toggle('hidden',!editingPlanId);
  syncPeriodFromAuto();renderPlanCardPreview();
}
function deleteSavedPlan(idx){
  if(idx<0||idx>=savedPlans.length) return;
  if(!confirm('「'+savedPlans[idx].name+'」 계획을 삭제할까요?')) return;
  const removed=savedPlans[idx].id;
  if(editingPlanId===removed)cancelPlanEdit();
  savedPlans.splice(idx,1);
  delete planReadingState[removed];savePlanReadingState();
  delete lastReadByPlan[removed];persistLastRead();
  if(activePlanId===removed) setActivePlan(savedPlans[0]?savedPlans[0].id:'');
  if(activeReadPlanId===removed)activeReadPlanId='';
  persistPlans();
  renderSavedPlans();
  dashboard();
  renderReadPlanPreview();
  if(typeof stats==='function') try{stats()}catch(e){}
}
function onPlanTypeChange(){
  planType=$('planType').value;
  if($('customPeriods')) $('customPeriods').classList.toggle('hidden', planType!=='custom');
  if($('customBooksPanel')) $('customBooksPanel').classList.toggle('hidden', planType!=='customBooks');
  if($('chronoInfoCard')) $('chronoInfoCard').classList.toggle('hidden', planType!=='custom');
  if(planType==='custom') renderPeriodChecks();
  if(planType==='customBooks') renderBookChecks();
  rebuildPlanSeq();
  renderRangePreview();
  syncPeriodFromAuto();
}
async function rebuildPlanSeqAsync(){
  if (!_workerMetaReady) await initWorkerMeta();
  const seq = await workerCall('buildPlan', { planType, customPeriodSet, customBookSet });
  planSeq = seq;
  return seq;
}
function renderPeriodChecks(){
  if(!$('periodChecks')) return;
  $('periodChecks').innerHTML=periods.map(p=>{
    const on=customPeriodSet.includes(p.id);
    const booksLabel=(p.desc?p.desc+' · ':'')+(periodBookLabels[p.id]||'');
    return '<label style="display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border-radius:10px;background:var(--soft);border:1px solid var(--line)"><input type="checkbox" style="margin-top:3px" data-pid="'+p.id+'" '+(on?'checked':'')+' onchange="toggleCustomPeriod('+p.id+',this.checked)"><span style="flex:1"><span style="display:inline-flex;align-items:center;gap:6px"><span style="width:10px;height:10px;border-radius:2px;background:'+p.color+';border:'+(p.id===12?'1px solid #cbd5e1':'none')+';flex-shrink:0"></span><b>'+p.name+'</b></span><span class="small muted" style="display:block;margin-top:4px;line-height:1.45">'+booksLabel+'</span></span></label>';
  }).join('');
}
function toggleCustomPeriod(pid, on){
  customPeriodSet = customPeriodSet.filter(x=>x!==pid);
  if(on) customPeriodSet.push(pid);
  customPeriodSet.sort((a,b)=>a-b);
  rebuildPlanSeq();
  renderRangePreview();
  syncPeriodFromAuto();
}
function renderBookChecks(){
  if(!$('bookChecks')) return;
  const set=new Set(customBookSet.map(Number));
  $('bookChecks').innerHTML=books.map((b,bi)=>{
    const on=set.has(bi);
    return '<label style="display:flex;align-items:center;gap:6px;padding:6px 8px;border-radius:8px;background:var(--soft);font-size:13px"><input type="checkbox" '+(on?'checked':'')+' onchange="toggleCustomBook('+bi+',this.checked)"><span>'+b[0]+'</span></label>';
  }).join('');
}
function toggleCustomBook(bi, on){
  customBookSet = customBookSet.filter(x=>x!==bi);
  if(on) customBookSet.push(bi);
  customBookSet.sort((a,b)=>a-b);
  rebuildPlanSeq();
  renderRangePreview();
  syncPeriodFromAuto();
}
function selectAllCustomBooks(mode){
  if(mode===true) customBookSet=[...Array(books.length).keys()];
  else if(mode===false) customBookSet=[];
  else if(mode==='ot') customBookSet=[...Array(46).keys()];
  else if(mode==='nt') customBookSet=[...Array(27).keys()].map(i=>i+46);
  else if(mode==='gospels') customBookSet=[46,47,48,49];
  else if(mode==='psalms') customBookSet=[22];
  renderBookChecks();
  rebuildPlanSeq();
  renderRangePreview();
  syncPeriodFromAuto();
}
function effectiveDays(){
  // 통합 흐름: autoDays / 숨은 days 셀렉트 동기화값 사용
  if($('days') && $('days').value==='customDays') return Math.max(7, Math.min(2000, +($('customDays')&&$('customDays').value)||365));
  if($('days') && $('days').value && $('days').value!=='customDays') return +$('days').value;
  return Math.max(7, Math.min(2000, +($('autoDays')&&$('autoDays').value)||days||365));
}
function onAutoModeChange(){
  const m=$('autoMode')&&$('autoMode').value;
  if(!$('autoDaysWrap')) return;
  if(m!=='days'&&planSkipSundays) planSkipSundays=false;
  $('autoDaysWrap').classList.toggle('hidden', m!=='days');
  $('autoPerDayWrap').classList.toggle('hidden', m!=='perDay');
  $('autoEndWrap').classList.toggle('hidden', m!=='endDate');
  syncPeriodFromAuto();
}
function toggleSundaySkip(){
  if(!$('autoMode')||$('autoMode').value!=='days') return;
  planSkipSundays=!planSkipSundays;
  syncPeriodFromAuto();
}
function autoPlanPreset(kind){
  planSkipSundays=false;
  if(String(kind).startsWith('per:')){
    if($('autoMode')) $('autoMode').value='perDay';
    if($('autoPerDay')) $('autoPerDay').value=String(kind).slice(4);
    onAutoModeChange();
  } else {
    if($('autoMode')) $('autoMode').value='days';
    if($('autoDays')) $('autoDays').value=kind;
    onAutoModeChange();
  }
  syncPeriodFromAuto();
}
function setPlanDaysUI(n){
  n=Math.max(7, Math.min(2000, Math.round(n)||365));
  days=n;
  if([90,180,365,730].includes(n)){
    if($('days')) $('days').value=String(n);
    if($('customDaysWrap')) $('customDaysWrap').classList.add('hidden');
  } else {
    if($('days')) $('days').value='customDays';
    if($('customDays')) $('customDays').value=n;
    if($('customDaysWrap')) $('customDaysWrap').classList.add('hidden');
  }
}
function savePlan(){
  syncPeriodFromAuto();
  days=effectiveDays();
  start=($('start')&&$('start').value)||start||new Date().toISOString().slice(0,10);
  planType=($('planType')&&$('planType').value)||planType;
  rebuildPlanSeq();
  const total=totalChapters();
  if(!total){
    alert('선택한 범위에 분량이 없습니다. 시대 또는 책을 선택해 주세요.');
    return;
  }
  const existing=editingPlanId?savedPlans.find(x=>x.id===editingPlanId):null;
  if(!existing&&savedPlans.length>=5){
    alert('통독 계획은 최대 5개까지 저장할 수 있습니다. 기존 계획을 삭제한 뒤 다시 저장해 주세요.');
    renderSavedPlans();return;
  }
  const enteredName=$('planName')?$('planName').value.trim():'';
  const name=enteredName||planTypeLabel(planType);
  const plan={
    ...(existing||{}),
    id:existing?existing.id:'p'+Date.now(),
    name,planType,days,start,
    skipSundays:!!planSkipSundays,
    calendarDays:planSkipSundays?planCalendarDays:null,
    customPeriodSet:customPeriodSet.slice(),
    customBookSet:customBookSet.slice()
  };
  if(existing){Object.assign(existing,plan);delete existing.snap;}else savedPlans.push(plan);
  editingPlanId='';editingPlanSnapshot=null;
  if($('planSaveBtn'))$('planSaveBtn').textContent='계획 저장';
  if($('cancelPlanEditBtn'))$('cancelPlanEditBtn').classList.add('hidden');
  setActivePlan(plan.id);
  persistPlans();
  store.days=days; store.start=start; store.planType=planType;
  store.customPeriods=JSON.stringify(customPeriodSet);
  store.customBooks=JSON.stringify(customBookSet);
  renderSavedPlans();
  dashboard();
  renderHomePlans();
  preview();
  alert('「'+name+'」 계획을 저장했습니다. ('+savedPlans.length+'/5)');
}
function completeToday(){
  const p=getActivePlan()||savedPlans[0];
  if(!p){ alert('저장된 통독 계획이 없습니다.'); return; }
  completePlanToday(p.id);
}

function quickNote(){let v=$('quick').value.trim();if(!v)return;addNote({verse:chLabel(selectedBook,selectedChapter),reflection:v});$('quick').value='';toast('메모를 저장했습니다.')}
function saveNote(){
  const refl=$('reflection').value.trim(), res=$('resolution').value.trim();
  if(!refl&&!res){ toast('묵상 내용을 입력해 주세요.'); return; }
  addNote({date:$('ndate').value,verse:$('verse').value.trim(),reflection:refl,resolution:res});
  $('verse').value=$('reflection').value=$('resolution').value='';
  renderNotes(); toast('묵상을 저장했습니다.');
}
function safe(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
// (renderNotes / deleteNote 는 [확장 3]에서 정의)

// ========== Web Worker + 메시지 직렬화 최적화 ==========
// 직렬화 전략:
//  1) 정적 메타(init)는 1회만 TypedArray로 전송 후 Worker에 캐시
//  2) progress는 완료 비트맵(Uint8Array)만 전송 — 문자열 키 배열 제거
//  3) encode는 UTF-8 bytes를 ArrayBuffer Transferable로 전달
//  4) structured clone 대신 숫자 버퍼 위주로 복사 비용 최소화
const workerSource = `
var META = null; // { bookChapters: Uint16Array, chrono: Int16Array, nBooks, nRanges }

function ensureMeta(payload) {
  if (payload && payload.bookChapters) {
    META = {
      bookChapters: payload.bookChapters,
      chrono: payload.chrono,
      nBooks: payload.bookChapters.length,
      nRanges: (payload.chrono.length / 4) | 0
    };
  }
  return META;
}

self.onmessage = function(e) {
  var id = e.data.id, type = e.data.type, payload = e.data.payload;
  try {
    if (type === 'init') {
      ensureMeta(payload);
      self.postMessage({ id: id, ok: true, result: true });
      return;
    }
    if (type === 'progress') {
      var meta = ensureMeta(payload);
      if (!meta) throw new Error('meta not initialized');
      var doneMap = payload.doneMap; // Uint8Array flat index
      var periodIds = payload.periodIds;
      var perTotal = {}, perDone = {};
      for (var pi = 0; pi < periodIds.length; pi++) {
        perTotal[periodIds[pi]] = 0;
        perDone[periodIds[pi]] = 0;
      }
      // flat offset per book
      var offset = new Int32Array(meta.nBooks + 1);
      offset[0] = 0;
      for (var bi = 0; bi < meta.nBooks; bi++) offset[bi + 1] = offset[bi] + meta.bookChapters[bi];

      var chrono = meta.chrono;
      for (var r = 0; r < meta.nRanges; r++) {
        var base = r * 4;
        var b = chrono[base], from = chrono[base + 1], to = chrono[base + 2], pid = chrono[base + 3];
        var maxC = meta.bookChapters[b];
        var end = to < maxC ? to : maxC;
        for (var c = from; c <= end; c++) {
          perTotal[pid]++;
          var idx = offset[b] + (c - 1);
          if (doneMap[idx]) perDone[pid]++;
        }
      }
      var otT = 0, otD = 0, ntT = 0, ntD = 0;
      for (bi = 0; bi < meta.nBooks; bi++) {
        var n = meta.bookChapters[bi];
        for (c = 1; c <= n; c++) {
          idx = offset[bi] + (c - 1);
          if (bi < 46) { otT++; if (doneMap[idx]) otD++; }
          else { ntT++; if (doneMap[idx]) ntD++; }
        }
      }
      var bookStats = [];
      for (bi = 0; bi < meta.nBooks; bi++) {
        var done = 0; n = meta.bookChapters[bi];
        for (c = 1; c <= n; c++) if (doneMap[offset[bi] + (c - 1)]) done++;
        if (done > 0) bookStats.push({ bi: bi, done: done, total: n, pct: done / n });
      }
      bookStats.sort(function(a, b) { return b.pct - a.pct || b.done - a.done; });
      self.postMessage({
        id: id, ok: true,
        result: {
          perTotal: perTotal, perDone: perDone,
          otT: otT, otD: otD, ntT: ntT, ntD: ntD,
          bookStats: bookStats.slice(0, 12)
        }
      });
    } else if (type === 'encode') {
      var bytes = payload instanceof ArrayBuffer ? new Uint8Array(payload) : new Uint8Array(payload);
      var raw = new TextDecoder('utf-8').decode(bytes);
      var code = btoa(unescape(encodeURIComponent(raw)));
      self.postMessage({ id: id, ok: true, result: code });
    } else if (type === 'decode') {
      var json = decodeURIComponent(escape(atob(payload)));
      self.postMessage({ id: id, ok: true, result: JSON.parse(json) });
    } else if (type === 'buildPlan') {
      var meta = ensureMeta(payload);
      if (!meta) throw new Error('meta not initialized');
      var planType = payload.planType;
      var customPeriodSet = payload.customPeriodSet || [];
      var customBookSet = payload.customBookSet || [];
      var seq = [];
      var useChrono = (planType === 'chrono' || planType === 'custom');
      if (useChrono) {
        var allow = null;
        if (planType === 'custom') {
          allow = {};
          for (var ci = 0; ci < customPeriodSet.length; ci++) allow[customPeriodSet[ci]] = 1;
        }
        for (r = 0; r < meta.nRanges; r++) {
          base = r * 4;
          b = meta.chrono[base]; from = meta.chrono[base + 1]; to = meta.chrono[base + 2]; pid = meta.chrono[base + 3];
          if (allow && !allow[pid]) continue;
          maxC = meta.bookChapters[b];
          end = to < maxC ? to : maxC;
          for (c = from; c <= end; c++) seq.push({ book: b, chapter: c, period: pid });
        }
      } else {
        var idxs = [];
        if (planType === 'ot') { for (i = 0; i < 46; i++) idxs.push(i); }
        else if (planType === 'nt') { for (i = 0; i < 27; i++) idxs.push(i + 46); }
        else if (planType === 'psalms') idxs = [22];
        else if (planType === 'gospels') idxs = [46, 47, 48, 49];
        else if (planType === 'customBooks') {
          for (i = 0; i < customBookSet.length; i++) {
            var xb = Number(customBookSet[i]);
            if (xb >= 0 && xb < meta.nBooks) idxs.push(xb);
          }
          idxs.sort(function(a,b){ return a - b; });
        } else { for (i = 0; i < meta.nBooks; i++) idxs.push(i); }
        for (var j = 0; j < idxs.length; j++) {
          bi = idxs[j]; n = meta.bookChapters[bi];
          for (c = 1; c <= n; c++) seq.push({ book: bi, chapter: c, period: 0 });
        }
      }
      self.postMessage({ id: id, ok: true, result: seq });
    } else {
      self.postMessage({ id: id, ok: false, error: 'unknown type' });
    }
  } catch (err) {
    self.postMessage({ id: id, ok: false, error: String(err && err.message || err) });
  }
};
`;

const WORKER_IDLE_MS = 30000;
const WORKER_MAX_PENDING = 8;
let _worker = null;
let _workerUrl = null;
let _workerReqId = 0;
let _workerIdleTimer = null;
let _workerMetaReady = false;
let _bookOffsets = null; // Int32Array prefix sums for flat index
const _workerPending = new Map();

function _clearWorkerIdleTimer() {
  if (_workerIdleTimer) { clearTimeout(_workerIdleTimer); _workerIdleTimer = null; }
}
function _scheduleWorkerIdle() {
  _clearWorkerIdleTimer();
  _workerIdleTimer = setTimeout(() => {
    if (_workerPending.size === 0) terminateWorker();
    else _scheduleWorkerIdle();
  }, WORKER_IDLE_MS);
}

function terminateWorker() {
  _clearWorkerIdleTimer();
  _workerPending.forEach((p) => { try { p.reject(new Error('worker terminated')); } catch (_) {} });
  _workerPending.clear();
  _workerMetaReady = false;
  if (_worker) {
    try { _worker.onmessage = null; _worker.onerror = null; _worker.terminate(); } catch (_) {}
    _worker = null;
  }
  if (_workerUrl) {
    try { URL.revokeObjectURL(_workerUrl); } catch (_) {}
    _workerUrl = null;
  }
}

function packBookChapters() {
  const arr = new Uint16Array(books.length);
  for (let i = 0; i < books.length; i++) arr[i] = books[i][2];
  return arr;
}
function packChrono() {
  const arr = new Int16Array(chronoRanges.length * 4);
  for (let i = 0; i < chronoRanges.length; i++) {
    const r = chronoRanges[i];
    arr[i * 4] = r[0]; arr[i * 4 + 1] = r[1]; arr[i * 4 + 2] = r[2]; arr[i * 4 + 3] = r[3];
  }
  return arr;
}
function ensureBookOffsets() {
  if (_bookOffsets && _bookOffsets.length === books.length + 1) return _bookOffsets;
  _bookOffsets = new Int32Array(books.length + 1);
  _bookOffsets[0] = 0;
  for (let i = 0; i < books.length; i++) _bookOffsets[i + 1] = _bookOffsets[i] + books[i][2];
  return _bookOffsets;
}
/** 완료 장 → 평탄 비트맵 (1바이트/장, 전체 ~1.3KB) */
function packDoneMap() {
  const off = ensureBookOffsets();
  const map = new Uint8Array(off[books.length]);
  for (const k of Object.keys(chapterRead)) {
    if (!chapterRead[k]) continue;
    const parts = k.split(':');
    const bi = +parts[0], c = +parts[1];
    if (bi >= 0 && bi < books.length && c >= 1 && c <= books[bi][2]) {
      map[off[bi] + (c - 1)] = 1;
    }
  }
  return map;
}

function getWorker() {
  if (_worker) return _worker;
  try {
    const blob = new Blob([workerSource], { type: 'application/javascript' });
    _workerUrl = URL.createObjectURL(blob);
    _worker = new Worker(_workerUrl);
    _worker.onmessage = (e) => {
      const { id, ok, result, error } = e.data || {};
      const pending = _workerPending.get(id);
      if (!pending) return;
      _workerPending.delete(id);
      if (ok) pending.resolve(result);
      else pending.reject(new Error(error || 'worker error'));
      if (_workerPending.size === 0) _scheduleWorkerIdle();
    };
    _worker.onerror = () => {
      const copy = new Map(_workerPending);
      terminateWorker();
      copy.forEach((p) => { try { p.reject(new Error('worker crashed')); } catch (_) {} });
    };
    _workerMetaReady = false;
  } catch (e) {
    console.warn('Web Worker unavailable', e);
    _worker = null; _workerUrl = null;
  }
  return _worker;
}

function initWorkerMeta() {
  const w = getWorker();
  if (!w || _workerMetaReady) return Promise.resolve();
  const bookChapters = packBookChapters();
  const chrono = packChrono();
  // Transferable: 버퍼 소유권을 Worker로 넘겨 메인 쪽 복사본 제거
  // 단, 재사용을 위해 slice()한 복사본을 transfer
  const bcBuf = bookChapters.buffer.slice(0);
  const chBuf = chrono.buffer.slice(0);
  return workerCall('init', {
    bookChapters: new Uint16Array(bcBuf),
    chrono: new Int16Array(chBuf)
  }, { transfer: [bcBuf, chBuf] }).then(() => { _workerMetaReady = true; });
}

function workerCall(type, payload, opts) {
  opts = opts || {};
  return new Promise((resolve, reject) => {
    if (_workerPending.size >= WORKER_MAX_PENDING) {
      const oldest = _workerPending.keys().next().value;
      const p = _workerPending.get(oldest);
      _workerPending.delete(oldest);
      if (p) try { p.reject(new Error('worker queue overflow')); } catch (_) {}
    }
    const w = getWorker();
    if (!w) {
      try {
        if (type === 'init') resolve(true);
        else if (type === 'progress') resolve(computeProgressDataSync(null));
        else if (type === 'encode') {
          let raw;
          if (typeof payload === 'string') raw = payload;
          else raw = new TextDecoder('utf-8').decode(payload instanceof ArrayBuffer ? new Uint8Array(payload) : payload);
          resolve(btoa(unescape(encodeURIComponent(raw))));
        } else if (type === 'decode') resolve(JSON.parse(decodeURIComponent(escape(atob(payload)))));
        else if (type === 'buildPlan') resolve(buildPlanSeqSync({
          books, chronoRanges, planType: payload.planType, customPeriodSet: payload.customPeriodSet, customBookSet: payload.customBookSet
        }));
        else reject(new Error('unknown'));
      } catch (e) { reject(e); }
      return;
    }
    const id = ++_workerReqId;
    _clearWorkerIdleTimer();
    const timeoutMs = opts.timeoutMs || 20000;
    const timer = setTimeout(() => {
      if (_workerPending.has(id)) {
        _workerPending.delete(id);
        reject(new Error('worker timeout'));
        if (_workerPending.size === 0) _scheduleWorkerIdle();
      }
    }, timeoutMs);
    _workerPending.set(id, {
      resolve: (v) => { clearTimeout(timer); resolve(v); },
      reject: (e) => { clearTimeout(timer); reject(e); }
    });
    const msg = { id, type, payload };
    if (opts.transfer && opts.transfer.length) w.postMessage(msg, opts.transfer);
    else w.postMessage(msg);
  });
}

function computeProgressDataSync() {
  const perTotal = {}, perDone = {};
  periods.forEach(p => { perTotal[p.id] = 0; perDone[p.id] = 0; });
  for (const [bi, from, to, pid] of chronoRanges) {
    const maxC = books[bi][2];
    for (let c = from; c <= Math.min(to, maxC); c++) {
      perTotal[pid] = (perTotal[pid] || 0) + 1;
      if (chapterRead[bi + ':' + c]) perDone[pid] = (perDone[pid] || 0) + 1;
    }
  }
  let otT = 0, otD = 0, ntT = 0, ntD = 0;
  books.forEach((b, bi) => {
    for (let c = 1; c <= b[2]; c++) {
      if (bi < 46) { otT++; if (chapterRead[bi + ':' + c]) otD++; }
      else { ntT++; if (chapterRead[bi + ':' + c]) ntD++; }
    }
  });
  const bookStats = books.map((b, bi) => {
    let done = 0;
    for (let c = 1; c <= b[2]; c++) if (chapterRead[bi + ':' + c]) done++;
    return { name: b[0], bi, done, total: b[2], pct: b[2] ? done / b[2] : 0 };
  }).filter(x => x.done > 0).sort((a, b) => b.pct - a.pct || b.done - a.done).slice(0, 12);
  return { perTotal, perDone, otT, otD, ntT, ntD, bookStats };
}

function buildPlanSeqSync(payload) {
  const planType_ = payload.planType, customPeriodSet_ = payload.customPeriodSet || [];
  const customBookSet_ = payload.customBookSet || customBookSet || [];
  const seq = [];
  const useChrono = (planType_ === 'chrono' || planType_ === 'custom');
  if (useChrono) {
    const allow = planType_ === 'custom' ? new Set(customPeriodSet_.map(Number)) : null;
    for (const [bi, from, to, pid] of chronoRanges) {
      if (allow && !allow.has(pid)) continue;
      const maxC = books[bi][2];
      for (let c = from; c <= Math.min(to, maxC); c++) seq.push({ book: bi, chapter: c, period: pid });
    }
  } else {
    let idxs;
    if (planType_ === 'ot') idxs = [...Array(46).keys()];
    else if (planType_ === 'nt') idxs = [...Array(27).keys()].map(i => i + 46);
    else if (planType_ === 'psalms') idxs = [22];
    else if (planType_ === 'gospels') idxs = [46, 47, 48, 49];
    else if (planType_ === 'customBooks') idxs = customBookSet_.map(Number).filter(bi => bi >= 0 && bi < books.length).sort((a,b)=>a-b);
    else idxs = [...Array(books.length).keys()];
    for (const bi of idxs) {
      for (let c = 1; c <= books[bi][2]; c++) seq.push({ book: bi, chapter: c, period: 0 });
    }
  }
  return seq;
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', terminateWorker);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && _workerPending.size === 0) terminateWorker();
  });
}

// Chart.js instances (실시간 바인딩)
let periodChart=null, testamentChart=null, bookChart=null;


function updateCharts(){
  if(typeof Chart==='undefined') return;
  // init(1회 TypedArray) 후 완료 비트맵만 transfer
  const run = () => {
    const doneMap = packDoneMap();
    const buf = doneMap.buffer.slice(0); // transfer용 복사
    return workerCall('progress', {
      doneMap: new Uint8Array(buf),
      periodIds: periods.map(p => p.id)
    }, { transfer: [buf] });
  };
  const chain = _workerMetaReady ? run() : initWorkerMeta().then(run);
  chain.then(d => applyChartData(d)).catch(err => {
    console.warn('progress worker failed, fallback', err);
    applyChartData(computeProgressDataSync());
  });
}
function applyChartData(d){
  if(typeof Chart==='undefined'||!d) return;
  const labels=periods.map(p=>p.name);
  const data=periods.map(p=>d.perDone[p.id]||0);
  const totals=periods.map(p=>d.perTotal[p.id]||0);
  const colors=periods.map(p=>p.id===12?'#94a3b8':p.color);
  const pcts=periods.map((p,i)=>totals[i]?Math.round(100*data[i]/totals[i]):0);

  // 12시대 가로 막대
  const pCtx=$('periodChart');
  if(pCtx){
    if(periodChart){
      periodChart.data.labels=labels;
      periodChart.data.datasets[0].data=data;
      periodChart.data.datasets[0].backgroundColor=colors;
      periodChart.data.datasets[1].data=totals.map((t,i)=>Math.max(0,t-data[i]));
      periodChart.update('none'); // 실시간: 애니메이션 없이 즉시 반영
    } else {
      periodChart=new Chart(pCtx,{
        type:'bar',
        data:{
          labels,
          datasets:[
            {label:'완료', data, backgroundColor:colors, borderWidth:0, barPercentage:0.7},
            {label:'남음', data:totals.map((t,i)=>Math.max(0,t-data[i])), backgroundColor:'#e9e4d9', borderWidth:0, barPercentage:0.7}
          ]
        },
        options:{
          indexAxis:'y',
          responsive:true,
          maintainAspectRatio:false,
          animation:{duration:400},
          plugins:{
            legend:{display:true, position:'top'},
            tooltip:{callbacks:{
              afterLabel:(ctx)=>{
                if(ctx.datasetIndex!==0) return '';
                const i=ctx.dataIndex, t=totals[i]||0, v=data[i]||0;
                return t?('진행 '+Math.round(100*v/t)+'% ('+v+'/'+t+')'):'';
              }
            }}
          },
          scales:{
            x:{stacked:true, grid:{color:'rgba(128,128,128,0.25)'}, ticks:{precision:0}},
            y:{stacked:true, grid:{display:false}, ticks:{font:{size:11}}}
          }
        }
      });
    }
  }

  // 구약/신약 도넛
  const tCtx=$('testamentChart');
  if(tCtx){
    const tData=[d.otD, Math.max(0,d.otT-d.otD), d.ntD, Math.max(0,d.ntT-d.ntD)];
    if(testamentChart){
      testamentChart.data.datasets[0].data=tData;
      testamentChart.update('none');
    } else {
      testamentChart=new Chart(tCtx,{
        type:'doughnut',
        data:{
          labels:['구약 완료','구약 남음','신약 완료','신약 남음'],
          datasets:[{
            data:tData,
            backgroundColor:['#172b43','#d4d0c8','#b99a61','#e9e4d9'],
            borderWidth:0
          }]
        },
        options:{
          responsive:true,
          maintainAspectRatio:false,
          cutout:'62%',
          plugins:{
            legend:{position:'bottom', labels:{boxWidth:12, font:{size:11}}},
            tooltip:{callbacks:{
              label:(ctx)=>{
                const v=ctx.raw||0;
                const sum=ctx.dataset.data.reduce((a,b)=>a+b,0)||1;
                return ' '+ctx.label+': '+v+' ('+Math.round(100*v/sum)+'%)';
              }
            }}
          }
        }
      });
    }
  }

  // 책별 상위 완료율
  const bCtx=$('bookChart');
  if(bCtx){
    const bs=(d.bookStats||[]).map(x=>({...x, name:x.name||(books[x.bi]?books[x.bi][0]:'?')}));
    const bl=bs.map(x=>x.name.length>8?x.name.slice(0,7)+'…':x.name);
    const bp=bs.map(x=>Math.round(x.pct*100));
    if(bookChart){
      bookChart.data.labels=bl;
      bookChart.data.datasets[0].data=bp;
      bookChart.update('none');
    } else {
      bookChart=new Chart(bCtx,{
        type:'bar',
        data:{
          labels:bl,
          datasets:[{label:'완료율 %', data:bp, backgroundColor:'#172b43', borderWidth:0, borderRadius:4}]
        },
        options:{
          responsive:true,
          maintainAspectRatio:false,
          plugins:{legend:{display:false}, tooltip:{callbacks:{
            label:(ctx)=>{
              const i=ctx.dataIndex, x=bs[i];
              return x?(' '+x.done+'/'+x.total+' · '+Math.round(x.pct*100)+'%'):'';
            }
          }}},
          scales:{
            y:{min:0, max:100, ticks:{callback:v=>v+'%'}, grid:{color:'rgba(128,128,128,0.25)'}},
            x:{ticks:{font:{size:10}}, grid:{display:false}}
          }
        }
      });
    }
  }

  // 텍스트 보조 (막대 아래 요약) — 실시간 동일 데이터
  if($('periodProgress')){
    $('periodProgress').innerHTML=periods.map((p,i)=>{
      const t=totals[i], v=data[i], pct=pcts[i];
      return '<span style="display:inline-block;margin:2px 8px 2px 0"><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:'+colors[i]+';margin-right:4px"></span>'+p.name+' '+pct+'%</span>';
    }).join('');
  }
  if($('testamentProgress')){
    const otP=d.otT?Math.round(d.otD/d.otT*100):0, ntP=d.ntT?Math.round(d.ntD/d.ntT*100):0;
    $('testamentProgress').innerHTML=
      '<div style="margin:8px 0"><div style="display:flex;justify-content:space-between;font-size:13px"><span>구약</span><span class="muted">'+d.otD+' / '+d.otT+' · '+otP+'%</span></div><div class="progress"><span style="width:'+otP+'%;background:var(--navy)"></span></div></div>'+
      '<div style="margin:8px 0"><div style="display:flex;justify-content:space-between;font-size:13px"><span>신약</span><span class="muted">'+d.ntD+' / '+d.ntT+' · '+ntP+'%</span></div><div class="progress"><span style="width:'+ntP+'%;background:var(--gold)"></span></div></div>';
  }
}


function planTypeLabel(t){
  return ({all:'전체통독',ot:'구약',nt:'신약',chrono:'연대기별',psalms:'시편',gospels:'복음서',custom:'연대기별',customBooks:'개별 선택'})[t]||t||'전체통독';
}
function renderPlanItemProgress(){
  const box=$('planItemProgress'),label=$('planProgressLabel');if(!box)return;
  const uniqueKeys=new Set(Object.values(cumulativeReading).filter(r=>r.done).map(r=>r.key));
  const planOptions=savedPlans.map(p=>'<option value="'+safe(p.id)+'">'+safe(p.name)+'</option>').join('');
  const selected=store.statsPlanId||((getActivePlan()||{}).id)||((savedPlans[0]||{}).id)||'';
  let html='<section class="card" style="margin:0 0 12px"><h4 style="margin:0 0 8px">계획별 진행 기록</h4>';
  if(!savedPlans.length){html+='<p class="muted small">저장된 계획이 없습니다.</p>';}
  else {html+='<label class="small">확인할 계획 <select id="statsPlanSelect" onchange="store.statsPlanId=this.value;renderPlanItemProgress()">'+planOptions+'</select></label>';const p=savedPlans.find(x=>x.id===selected)||savedPlans[0];if(p){const pr=planProgress(p);store.statsPlanId=p.id;html+='<div style="margin-top:10px"><b>'+safe(p.name)+'</b> · '+pr.done+'/'+pr.total+'장 · '+pr.pct+'% · '+safe(pr.status)+'<div class="progress"><span style="width:'+pr.pct+'%"></span></div><details style="margin-top:8px"><summary class="small" style="cursor:pointer">책별 진도 · 오늘 분량 ('+todayItemsForPlan(p).length+')</summary><div style="margin-top:8px">';const byBook=new Map();for(const it of pr.seq){if(!byBook.has(it.book))byBook.set(it.book,{done:0,total:0});const row=byBook.get(it.book);row.total++;if(planChapterDone(p.id,verseKey(it.book,it.chapter)))row.done++}html+=[...byBook.entries()].sort((a,b)=>a[0]-b[0]).map(([bi,row])=>'<div class="small">'+safe(books[bi][0])+' · '+row.done+'/'+row.total+'</div>').join('');const today=todayItemsForPlan(p);if(today.length)html+='<div class="small" style="margin-top:8px"><b>오늘</b> · '+today.map(it=>safe(it.label)+(it.done?' ✓':'')).join(' · ')+'</div>';html+='</div></details></div>';}}
  const totalPlanChapters=Object.values(cumulativeReading).filter(r=>r.done).length;
  html+='</section><section class="card" style="margin:0"><h4 style="margin:0 0 8px">전체 누적 통독 기록</h4><p class="small muted">현재·과거 계획의 완료 기록을 합산합니다. 계획을 삭제해도 이 기록은 유지됩니다.</p><div class="grid"><div>계획-장 완료 기록<div class="metric">'+totalPlanChapters+'</div></div><div>고유 완료 장<div class="metric">'+uniqueKeys.size+'</div></div></div></section>';
  box.innerHTML=html;if(label)label.textContent='선택한 계획의 진도와 모든 계획의 누적 기록을 따로 확인합니다.';
}
function stats(){
  if($('chartDetails')&&window.innerWidth<760)$('chartDetails').open=false;
  updateCharts();
  renderPlanItemProgress();
  const doneKeys=Object.keys(chapterRead).filter(k=>chapterRead[k]);
  $('sDone').textContent=doneKeys.length;
  $('sPct').textContent=Math.round(doneKeys.length/Math.max(1,totalChapters())*100)+'%';
  $('sNotes').textContent=notes.length;
  let keys=Object.keys(verseRead);
  $('sVerses').textContent=keys.reduce((n,k)=>n+(verseRead[k]||[]).length,0);
  $('sChapters').textContent=doneKeys.length;
  $('sBooks').textContent=new Set(keys.map(k=>k.split(':')[0])).size;
  if($('history')) $('history').textContent='장·절 통독 기록으로 관리합니다.';
  // (원본에서 정의가 빠져 있던 변수) 기록이 있는 책 목록과 완료한 장 키
  const chKeys=doneKeys;
  const bset=[...new Set([...keys,...doneKeys].map(k=>+k.split(':')[0]))].filter(b=>b>=0&&b<books.length).sort((a,b)=>a-b);
  let rows=bset.map(b=>{
    let d=chKeys.filter(k=>k.startsWith(b+':')).length,t=books[b][2],v=keys.filter(k=>k.startsWith(b+':')).reduce((n,k)=>n+verseRead[k].length,0),known=0,all=true;
    for(let c=1;c<=t;c++){let x=verseTotal[verseKey(b,c)];if(x)known+=x;else all=false}
    return '<div style="margin:10px 0"><b>'+safe(books[b][0])+'</b> · '+d+' / '+t+unit(b)+' · '+v+(all?' / '+known:'')+'절<div class="progress"><span style="width:'+Math.round(d/t*100)+'%"></span></div></div>';
  }).join('');
  let detail=keys.sort((a,b)=>{let [ab,ac]=a.split(':').map(Number),[bb,bc]=b.split(':').map(Number);return ab-bb||ac-bc}).map(k=>{
    let [b,c]=k.split(':').map(Number);
    return '<div>'+safe(books[b][0])+' '+c+unit(b)+': '+(verseRead[k]||[]).slice().sort((a,b)=>a-b).join(', ')+'절'+(chapterRead[k]?' · 완료':'')+'</div>';
  }).join('');
  $('verseHistory').innerHTML=rows?rows+'<details><summary>장별 상세 보기</summary>'+detail+'</details>':'아직 장·절 통독 기록이 없습니다.';
}

function gatherBackup(){
  return {
    v:2,
    exportedAt:new Date().toISOString(),
    days, start, planType, customPeriods:customPeriodSet, customBooks:customBookSet,
    savedPlans, activePlanId, lastReadByPlan, planReadingState, cumulativeReading,
    chapterRead, verseRead, verseTotal, notes,
    hideNotes: store.hideNotes||'0',
    reading:{
      fontFamily: store.fontFamily||'',
      fontSize: store.fontSize||'',
      lineHeight: store.lineHeight||''
    }
  };
}
/** 백업 객체 형태가 복원에 쓸 수 있는지 검사 (v1/v2 모두 허용) */
function isValidBackup(data){
  if(!data||typeof data!=='object'||Array.isArray(data)) return false;
  const hasReading=isPlainObj(data.chapterRead)||isPlainObj(data.verseRead)||isPlainObj(data.planReadingState)||isPlainObj(data.cumulativeReading);
  const hasPlans=Array.isArray(data.savedPlans);
  const hasNotes=Array.isArray(data.notes);
  const hasMeta=data.days!=null||data.start!=null||data.planType!=null||data.v!=null;
  if(!(hasReading||hasPlans||hasNotes||hasMeta)) return false;
  if(data.savedPlans!=null&&!Array.isArray(data.savedPlans)) return false;
  if(data.notes!=null&&!Array.isArray(data.notes)) return false;
  if(data.chapterRead!=null&&!isPlainObj(data.chapterRead)) return false;
  if(data.verseRead!=null&&!isPlainObj(data.verseRead)) return false;
  if(data.planReadingState!=null&&!isPlainObj(data.planReadingState)) return false;
  if(data.cumulativeReading!=null&&!isPlainObj(data.cumulativeReading)) return false;
  return true;
}
/** 가져오기 직전 현재 데이터를 복구용으로 저장 (실패해도 복원은 진행) */
function snapshotCurrentForRecovery(){
  try{
    const snap=gatherBackup();
    snap._recoveryAt=new Date().toISOString();
    store.recoveryBackup_v1=JSON.stringify(snap);
    return true;
  }catch(e){
    return false;
  }
}
function downloadRecoverySnapshot(){
  try{
    const raw=store.recoveryBackup_v1;
    if(!raw) return false;
    const blob=new Blob([raw],{type:'application/json'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download='malssumgil-recovery-'+new Date().toISOString().slice(0,10)+'.json';
    a.click();
    URL.revokeObjectURL(a.href);
    return true;
  }catch(e){ return false; }
}
function exportData(){
  const data=gatherBackup();
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='malssumgil-backup-'+new Date().toISOString().slice(0,10)+'.json';
  a.click();
  URL.revokeObjectURL(a.href);
  if($('syncStatus')) $('syncStatus').textContent='JSON 파일을 다운로드했습니다. 다른 기기에서 JSON 가져오기로 불러오세요.';
}
function importData(ev){
  const f=ev.target.files&&ev.target.files[0];
  if(!f)return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      let data;
      try{ data=JSON.parse(reader.result); }catch(e){ throw new Error('JSON 형식이 아닙니다.'); }
      if(!isValidBackup(data)) throw new Error('말씀의 길 백업 파일이 아니거나 내용이 비어 있습니다.');
      const planCount=Array.isArray(data.savedPlans)?data.savedPlans.length:0;
      const noteCount=Array.isArray(data.notes)?data.notes.length:0;
      const exported=data.exportedAt?('\n내보낸 시각: '+String(data.exportedAt).slice(0,19).replace('T',' ')):'';
      if(!confirm('현재 기기의 진도·노트·계획을 이 백업으로 덮어쓸까요?\n\n· 계획 '+planCount+'개 · 노트 '+noteCount+'개'+exported+'\n\n가져오기 전에 현재 데이터를 자동으로 백업해 둡니다.')){
        if($('syncStatus')) $('syncStatus').textContent='가져오기를 취소했습니다.';
        return;
      }
      const snapped=snapshotCurrentForRecovery();
      applyBackup(data,{skipConfirm:true});
      if($('syncStatus')) $('syncStatus').textContent='가져오기 완료 · '+f.name+(snapped?' · 이전 데이터는 복구 백업으로 보관됨':'');
      try{ toast('가져오기 완료'+(snapped?' (이전 데이터 보관됨)':'')); }catch(e){}
    }catch(e){
      if($('syncStatus')) $('syncStatus').textContent='가져오기 실패: '+(e&&e.message?e.message:'올바른 백업 파일인지 확인해 주세요.');
    }
  };
  reader.readAsText(f);
  ev.target.value='';
}
function applyBackup(data,opts){
  opts=opts||{};
  if(!data||typeof data!=='object') throw new Error('invalid');
  if(!isValidBackup(data)) throw new Error('invalid backup shape');
  if(!opts.skipConfirm){
    const planCount=Array.isArray(data.savedPlans)?data.savedPlans.length:0;
    const noteCount=Array.isArray(data.notes)?data.notes.length:0;
    if(!confirm('현재 기기의 진도·노트·계획을 이 데이터로 덮어쓸까요?\n\n· 계획 '+planCount+'개 · 노트 '+noteCount+'개\n\n적용 전에 현재 데이터를 자동으로 백업해 둡니다.')){
      throw new Error('cancelled');
    }
    snapshotCurrentForRecovery();
  }
  if(data.chapterRead) chapterRead=data.chapterRead;
  if(data.verseRead) verseRead=data.verseRead;
  if(data.verseTotal) verseTotal=data.verseTotal;
  if(data.notes){ notes=data.notes; normalizeNotes(); }
  if(data.days) days=+data.days;
  if(data.start) start=data.start;
  if(data.planType) planType=data.planType;
  if(data.customPeriods) customPeriodSet=data.customPeriods;
  if(data.customBooks) customBookSet=data.customBooks;
  if(data.hideNotes!=null) store.hideNotes=data.hideNotes;
  // v2 백업: 저장된 통독 계획 · 활성 계획 · 계획별 마지막 읽은 위치 · 읽기 설정
  // (v1 백업에는 없으므로, 없을 때는 현재 기기의 값을 그대로 둡니다)
  if(Array.isArray(data.savedPlans)){ savedPlans=data.savedPlans.slice(0,5); persistPlans(); }
  if(data.activePlanId!=null) setActivePlan(data.activePlanId);
  if(data.lastReadByPlan&&typeof data.lastReadByPlan==='object'){ lastReadByPlan=data.lastReadByPlan; persistLastRead(); }
  if(data.cumulativeReading&&typeof data.cumulativeReading==='object'){cumulativeReading=data.cumulativeReading;persistCumulativeReading()}
  if(data.planReadingState&&typeof data.planReadingState==='object'){planReadingState=data.planReadingState;savePlanReadingState();backfillCumulative()}else if(data.chapterRead&&savedPlans.length&&Object.keys(data.chapterRead).length){const legacyPlan=savedPlans.find(p=>p.id===activePlanId)||savedPlans[0];planReadingState[legacyPlan.id]={chapters:{...data.chapterRead},verses:{...(data.verseRead||{})}};savePlanReadingState()}
  store.planReadingMigrated_v1='1';
  if(data.reading&&typeof data.reading==='object'){
    const setSel=(id,v)=>{ const el=$(id); if(!el||!v) return; if([...el.options].some(o=>o.value===String(v))) el.value=String(v); };
    setSel('fontFamily',data.reading.fontFamily);
    setSel('fontSize',data.reading.fontSize);
    setSel('lineHeight',data.reading.lineHeight);
    applyTextStyle();
  }
  store.days=days; store.start=start; store.planType=planType;
  store.customPeriods=JSON.stringify(customPeriodSet);
  store.customBooks=JSON.stringify(customBookSet);
  store.notes=JSON.stringify(notes);
  saveVerseData();
  rebuildPlanSeq();
  if($('planType')) $('planType').value=planType;
  if($('days')){
    if([90,180,365,730].includes(days)) $('days').value=String(days);
    else {$('days').value='customDays'; if($('customDays')) $('customDays').value=days; if($('customDaysWrap')) $('customDaysWrap').classList.remove('hidden');}
  }
  if($('start')) $('start').value=start;
  try{ renderSavedPlans(); }catch(e){}
  try{ renderReadPlanPreview(); }catch(e){}
  dashboard(); stats(); preview();
}
function copySyncCode(){
  if($('syncStatus')) $('syncStatus').textContent='동기화 코드 생성 중… (Web Worker)';
  const data=gatherBackup();
  const json=JSON.stringify(data);
  const bytes=new TextEncoder().encode(json);
  const buf=bytes.buffer.slice(0);
  workerCall('encode', buf, { transfer:[buf] }).then(code=>{
    return navigator.clipboard.writeText(code).then(()=>{
      if($('syncStatus')) $('syncStatus').textContent='동기화 코드를 클립보드에 복사했습니다. ('+Math.round(code.length/1024)+'KB)';
    }).catch(()=>{
      if($('syncCodeIn')) $('syncCodeIn').value=code;
      if($('syncStatus')) $('syncStatus').textContent='자동 복사가 막혀 입력칸에 코드를 넣었습니다. 직접 복사해 주세요.';
    });
  }).catch(e=>{
    if($('syncStatus')) $('syncStatus').textContent='코드 생성 실패: '+e.message;
  });
}
function applySyncCode(){
  const code=($('syncCodeIn')&&$('syncCodeIn').value||'').trim();
  if(!code){if($('syncStatus')) $('syncStatus').textContent='코드를 붙여 넣어 주세요.';return;}
  if($('syncStatus')) $('syncStatus').textContent='복원 중… (Web Worker)';
  workerCall('decode', code).then(data=>{
    if(!isValidBackup(data)) throw new Error('invalid backup shape');
    const planCount=Array.isArray(data.savedPlans)?data.savedPlans.length:0;
    const noteCount=Array.isArray(data.notes)?data.notes.length:0;
    if(!confirm('현재 기기의 진도·노트·계획을 이 동기화 코드로 덮어쓸까요?\n\n· 계획 '+planCount+'개 · 노트 '+noteCount+'개\n\n복원 전에 현재 데이터를 자동으로 백업해 둡니다.')){
      if($('syncStatus')) $('syncStatus').textContent='복원을 취소했습니다.';
      return;
    }
    const snapped=snapshotCurrentForRecovery();
    applyBackup(data,{skipConfirm:true});
    if($('syncStatus')) $('syncStatus').textContent='동기화 코드로 복원했습니다.'+(snapped?' · 이전 데이터는 복구 백업으로 보관됨':'');
    if($('syncCodeIn')) $('syncCodeIn').value='';
    try{ toast('복원 완료'+(snapped?' (이전 데이터 보관됨)':'')); }catch(e){}
  }).catch(e=>{
    if(e&&e.message==='cancelled') return;
    if($('syncStatus')) $('syncStatus').textContent='복원 실패: 코드가 손상되었거나 형식이 다릅니다.';
  });
}


// ===== [확장 1] 밀린 분량 처리 =====
function ymdLocal(d){ const z=n=>String(n).padStart(2,'0'); return d.getFullYear()+'-'+z(d.getMonth()+1)+'-'+z(d.getDate()); }
/** 오늘이 계획의 몇 일차인지 (종료일 이후에는 p.days를 넘을 수 있음) */
function rawDayIndex(p){
  const t=new Date(); t.setHours(0,0,0,0);
  const startStr=p.start||start;
  if(p.skipSundays) return countReadingDaysElapsed(startStr,t,true);
  const s0=new Date(startStr+'T00:00:00');
  return Math.floor((t-s0)/86400000)+1;
}
/** 오늘 이전 일정인데 아직 읽지 않았고, 건너뛰기도 하지 않은 분량 */
function backlogForPlan(p,seq){
  if(p.catchUp==='follow') return [];
  seq=seq||buildSeqForPlan(p);
  const total=seq.length;
  if(!total||!p.days) return [];
  const t=new Date(); t.setHours(0,0,0,0);
  const s0=new Date((p.start||start)+'T00:00:00');
  if(isNaN(s0.getTime())||t<s0) return [];
  const day=dayIndexForPlan(p);
  // 주일 제외 계획의 일요일에는 그 주 토요일 분량까지가 '지난 분량'
  const sunOff=p.skipSundays&&t.getDay()===0;
  const a=sunOff?Math.floor(day*total/p.days):Math.floor((day-1)*total/p.days);
  const sk=p.skipped||{};
  const out=[];
  for(let i=0;i<Math.min(a,total);i++){
    const it=seq[i], key=verseKey(it.book,it.chapter);
    if(!planChapterDone(p.id,key)&&!sk[key]) out.push({planId:p.id,book:it.book,chapter:it.chapter,key,label:chLabel(it.book,it.chapter)});
  }
  return out;
}
/** '다시 배분' 방식의 오늘 분량: 안 읽은 장을 남은 일수로 나누고, 그날 하루는 고정 */
function followItemsForPlan(p,seq){
  const today=ymdLocal(new Date());
  if(!p.snap||p.snap.d!==today){
    const sk=p.skipped||{};
    const remaining=seq.filter(it=>{const k=verseKey(it.book,it.chapter);return !planChapterDone(p.id,k)&&!sk[k];});
    const raw=rawDayIndex(p), pastEnd=raw>p.days;
    const day=Math.min(Math.max(raw,1),p.days);
    const per=pastEnd
      ? Math.max(1,Math.ceil(seq.length/p.days))               // 기간이 지났으면 원래 하루 평균 속도로
      : Math.max(1,Math.ceil(remaining.length/Math.max(1,p.days-day+1)));
    p.snap={d:today,keys:remaining.slice(0,per).map(it=>verseKey(it.book,it.chapter))};
    persistPlans();
  }
  const byKey=new Map(seq.map(it=>[verseKey(it.book,it.chapter),it]));
  return p.snap.keys.map(k=>byKey.get(k)).filter(Boolean);
}
function catchUpHtml(p,pr){
  let h='';
  const follow=p.catchUp==='follow';
  if(!follow&&pr.backlog.length){
    h+='<div class="notice" style="margin-top:12px;border-left-color:#e0a050;background:var(--card)6e8">'+
      '<b>밀린 분량 '+pr.backlog.length+'개</b> · '+safe(pr.backlog[0].label)+(pr.backlog.length>1?' 외':'')+
      '<div class="row" style="margin-top:8px;gap:6px;flex-wrap:wrap">'+
      '<button type="button" style="padding:7px 10px;font-size:13px" onclick="readBacklog(\''+p.id+'\')">밀린 분량 읽기</button>'+
      '<button type="button" class="alt" style="padding:7px 10px;font-size:13px" onclick="setCatchUp(\''+p.id+'\',\'follow\')">남은 기간에 다시 배분</button>'+
      '<button type="button" class="alt" style="padding:7px 10px;font-size:13px" onclick="skipBacklog(\''+p.id+'\')">건너뛰기</button>'+
      '</div></div>';
  }
  if(follow){
    h+='<div class="small" style="margin-top:10px;color:#2d7650">자동 재배분 중 · 못 읽은 장은 남은 기간에 나눠 담깁니다.</div>';
  }
  const tools=[];
  tools.push('<button type="button" class="alt" style="padding:5px 9px;font-size:12px" onclick="setCatchUp(\''+p.id+'\',\''+(follow?'date':'follow')+'\')">'+(follow?'날짜대로 읽기로 돌아가기':'밀리면 자동 재배분 켜기')+'</button>');
  if(pr.skipped>0) tools.push('<button type="button" class="alt" style="padding:5px 9px;font-size:12px" onclick="unskipPlan(\''+p.id+'\')">건너뛴 '+pr.skipped+'개 되돌리기</button>');
  h+='<div class="row" style="margin-top:10px;gap:6px;flex-wrap:wrap">'+tools.join('')+'</div>';
  return h;
}
function readBacklog(planId){
  const p=savedPlans.find(x=>x.id===planId); if(!p) return;
  const items=backlogForPlan(p);
  if(!items.length){ dashboard(); return; }
  setActivePlan(planId);
  openReading(items[0].book,items[0].chapter,planId);
  renderReadPlanPreview();
}
function skipBacklog(planId){
  const p=savedPlans.find(x=>x.id===planId); if(!p) return;
  const items=backlogForPlan(p);
  if(!items.length) return;
  if(!confirm('밀린 '+items.length+'개를 건너뛸까요?\n읽음으로 기록되지는 않으며, 밀린 분량 안내에서만 빠집니다. 언제든 되돌릴 수 있습니다.')) return;
  p.skipped=p.skipped||{};
  for(const it of items) p.skipped[it.key]=true;
  p.snap=null; persistPlans(); dashboard(); renderReadPlanPreview();
}
function unskipPlan(planId){
  const p=savedPlans.find(x=>x.id===planId); if(!p) return;
  p.skipped={}; p.snap=null; persistPlans(); dashboard(); renderReadPlanPreview();
}
function setCatchUp(planId,mode){
  const p=savedPlans.find(x=>x.id===planId); if(!p) return;
  p.catchUp=(mode==='follow')?'follow':'date';
  p.snap=null; persistPlans(); dashboard(); renderReadPlanPreview();
}


// ===== [확장 2] 구절 복사 =====
let copyMode=false; const copySel=new Set();
function toast(msg,ms){
  let el=$('toast');
  if(!el){ el=document.createElement('div'); el.id='toast'; el.className='toast'; document.body.appendChild(el); }
  el.textContent=msg; el.classList.add('show');
  clearTimeout(toast._t); toast._t=setTimeout(()=>el.classList.remove('show'),ms||2200);
}
function toggleCopyMode(force){
  copyMode=(typeof force==='boolean')?force:!copyMode;
  copySel.clear();
  document.body.classList.toggle('copy-mode',copyMode);
  if($('copyModeBtn')){ $('copyModeBtn').classList.toggle('on',copyMode); $('copyModeBtn').textContent=copyMode?'복사 모드 끄기':'구절 복사'; }
  if($('copyHint')) $('copyHint').classList.toggle('hidden',!copyMode);
  if($('copyBar')) $('copyBar').classList.toggle('hidden',!copyMode);
  if($('copyNums')) $('copyNums').checked=store.copyNums!=='0';
  updateCopyBar(); renderChapter();
}
function toggleCopySel(n){
  if(copySel.has(n)) copySel.delete(n); else copySel.add(n);
  updateCopyBar(); renderChapter();
}
function selectAllVerses(){
  if(copySel.size===currentVerses.length) copySel.clear();
  else currentVerses.forEach(v=>copySel.add(v.n));
  updateCopyBar(); renderChapter();
}
function updateCopyBar(){
  const el=$('copyCount'); if(!el) return;
  el.textContent=copySel.size?(copySel.size+'절 선택'):'절을 눌러 선택';
}
/** [1,2,3,5] -> "1-3.5" */
function verseRuns(nums){
  const a=[...nums].sort((x,y)=>x-y), out=[];
  let s0=a[0], p0=a[0];
  for(let i=1;i<=a.length;i++){
    if(a[i]===p0+1){ p0=a[i]; continue; }
    out.push(s0===p0?String(s0):s0+'-'+p0);
    s0=a[i]; p0=a[i];
  }
  return out.join('.');
}
function verseRefLabel(bi,ch,nums){
  return books[bi][0]+' '+ch+(nums&&nums.length?','+verseRuns(nums):'');
}
function stripFootnotes(t){
  return String(t||'').replace(/(\d{1,3})\)/g,(m,d,off,str)=>{
    const p=str[off-1];
    if(!p||/[\s(\d]/.test(p)) return m;
    return '';
  }).replace(/\s{2,}/g,' ').trim();
}
function selectedVerseList(){
  return currentVerses.filter(v=>copySel.has(v.n));
}
function buildVerseCopyText(withNums){
  const list=selectedVerseList();
  if(!list.length) return '';
  const nums=list.map(v=>v.n);
  const lines=list.map(v=>(withNums?v.n+' ':'')+stripFootnotes(v.text));
  return verseRefLabel(selectedBook,selectedChapter,nums)+'\n'+
    (withNums?lines.join('\n'):lines.join(' '))+'\n(한국천주교주교회의 성경)';
}
async function copyText(text){
  try{
    if(navigator.clipboard&&window.isSecureContext){ await navigator.clipboard.writeText(text); return true; }
  }catch(e){}
  try{
    const ta=document.createElement('textarea');
    ta.value=text; ta.style.cssText='position:fixed;left:-9999px;top:0';
    document.body.appendChild(ta); ta.select();
    const ok=document.execCommand('copy'); ta.remove(); return ok;
  }catch(e){ return false; }
}
async function doCopyVerses(){
  if(!copySel.size){ toast('복사할 절을 먼저 선택해 주세요.'); return; }
  const withNums=!$('copyNums')||$('copyNums').checked;
  const text=buildVerseCopyText(withNums);
  const ok=await copyText(text);
  toast(ok?(copySel.size+'절을 복사했습니다.'):'복사에 실패했습니다. 브라우저 설정을 확인해 주세요.');
}


// ===== [확장 3] 한 줄 기록 · 묵상 노트 편집/검색/정렬 =====
function newNoteId(){ return 'n'+Date.now().toString(36)+Math.random().toString(36).slice(2,6); }
function persistNotes(){ store.notes=JSON.stringify(notes); }
function normalizeNotes(){
  let changed=false;
  const used=new Set();
  notes.forEach((n,i)=>{
    if(!n||typeof n!=='object') return;
    if(!n.id||used.has(n.id)){ n.id=newNoteId()+i.toString(36); changed=true; }
    used.add(n.id);
    if(!n.created){ n.created=(n.date||ymdLocal(new Date()))+'T00:00:00'; changed=true; }
    if(!n.updated){ n.updated=n.created; changed=true; }
  });
  if(changed) persistNotes();
}
function addNote(o){
  const nowIso=new Date().toISOString();
  const n={
    id:newNoteId(), date:o.date||ymdLocal(new Date()), verse:o.verse||'',
    reflection:o.reflection||'', resolution:o.resolution||'', created:nowIso, updated:nowIso
  };
  notes.unshift(n); persistNotes();
  try{ renderOneLine(); }catch(e){}
  return n;
}
function isLineNote(n){ return !n.resolution && String(n.reflection||'').length<=140 && !/\n/.test(n.reflection||''); }
function fmtDay(ds){
  const d=new Date((ds||'')+'T00:00:00');
  if(isNaN(d.getTime())) return '날짜 없음';
  return d.getFullYear()+'.'+(d.getMonth()+1)+'.'+d.getDate()+' ('+'일월화수목금토'[d.getDay()]+')';
}
function lastReadLabel(){
  const p=getActivePlan();
  const lr=p&&lastReadByPlan[p.id];
  return lr?chLabel(lr.book,lr.chapter):'';
}
/** 오늘(또는 어제)까지 이어진 기록 일수 */
function noteStreak(){
  const days=new Set(notes.map(n=>n.date).filter(Boolean));
  const d=new Date(); d.setHours(0,0,0,0);
  if(!days.has(ymdLocal(d))) d.setDate(d.getDate()-1);
  let n=0;
  while(days.has(ymdLocal(d))){ n++; d.setDate(d.getDate()-1); }
  return n;
}
function renderOneLine(){
  const box=$('oneLineRecent'); if(!box) return;
  const v=$('oneLineVerse');
  if(v&&!v.dataset.touched&&!v.value) v.value=lastReadLabel();
  const st=noteStreak();
  const today=ymdLocal(new Date());
  const hasToday=notes.some(n=>n.date===today);
  if($('oneLineStreak')) $('oneLineStreak').textContent=st>0?('연속 '+st+'일 기록'+(hasToday?'':' · 오늘 아직')):'오늘 첫 기록을 남겨 보세요';
  const recent=notes.slice().sort((a,b)=>String(b.created).localeCompare(String(a.created))).slice(0,3);
  if(!recent.length){ box.innerHTML=''; return; }
  box.innerHTML=recent.map(n=>
    '<div class="small" style="padding:6px 0;border-top:1px solid var(--line)"><span style="color:var(--gold)">'+safe((n.date||'').slice(5).replace('-','/'))+'</span>'+
    (n.verse?' · <b>'+safe(n.verse)+'</b>':'')+' — '+safe(String(n.reflection||n.resolution||'').slice(0,80))+'</div>'
  ).join('')+'<div style="margin-top:6px"><button type="button" class="alt" style="padding:5px 10px;font-size:12px" onclick="view(\'notes\')">전체 보기</button></div>';
}
function saveOneLine(){
  const el=$('oneLine'); if(!el) return;
  const t=el.value.trim();
  if(!t){ toast('한 줄을 입력해 주세요.'); el.focus(); return; }
  addNote({verse:($('oneLineVerse').value||'').trim(),reflection:t});
  el.value='';
  toast('기록했습니다. 연속 '+noteStreak()+'일째입니다.');
  renderOneLine();
}
let noteFilter='all', noteEditId=null;
function setNoteFilter(f){
  noteFilter=f;
  document.querySelectorAll('#noteChips .chip').forEach(b=>b.classList.toggle('on',b.dataset.f===f));
  renderNotes();
}
function noteViewHtml(n){
  return '<div class="card" style="margin:0 0 8px"><div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start"><div style="flex:1;min-width:0">'+
    (n.verse?'<b>'+safe(n.verse)+'</b>':'<span class="muted small">구절 없음</span>')+
    '<p style="white-space:pre-wrap;margin:6px 0">'+safe(n.reflection)+'</p>'+
    (n.resolution?'<div class="small" style="white-space:pre-wrap;color:#5b6570">다짐 · '+safe(n.resolution)+'</div>':'')+
    '</div><div style="display:flex;flex-direction:column;gap:6px;flex-shrink:0">'+
    '<button type="button" class="alt" style="padding:6px 10px;font-size:12px" onclick="startEditNote(\''+n.id+'\')">수정</button>'+
    '<button type="button" class="alt" style="padding:6px 10px;font-size:12px" onclick="openCard({type:\'note\',id:\''+n.id+'\'})">카드</button>'+
    '<button type="button" class="alt" style="padding:6px 10px;font-size:12px" onclick="deleteNote(\''+n.id+'\')">삭제</button>'+
    '</div></div></div>';
}
function noteEditHtml(n){
  return '<div class="card" style="margin:0 0 8px;border-color:var(--gold)">'+
    '<label class="small">날짜 <input type="date" id="ne_date" value="'+safe(n.date)+'"></label>'+
    '<p style="margin:8px 0"><input id="ne_verse" value="'+safe(n.verse)+'" placeholder="성경 구절" style="width:100%"></p>'+
    '<textarea id="ne_ref" placeholder="말씀과 묵상">'+safe(n.reflection)+'</textarea>'+
    '<textarea id="ne_res" placeholder="실천 다짐" style="margin-top:8px">'+safe(n.resolution)+'</textarea>'+
    '<div class="row" style="margin-top:8px"><button type="button" onclick="saveEditNote(\''+n.id+'\')">저장</button><button type="button" class="alt" onclick="cancelEditNote()">취소</button></div></div>';
}
function renderNotes(){
  const host=$('noteList'); if(!host) return;
  const q=(($('noteSearch')&&$('noteSearch').value)||'').trim().toLowerCase();
  const sort=$('noteSort')?$('noteSort').value:'new';
  let list=notes.filter(n=>{
    if(noteFilter==='line'&&!isLineNote(n)) return false;
    if(noteFilter==='note'&&isLineNote(n)) return false;
    if(!q) return true;
    return [n.verse,n.reflection,n.resolution,n.date].join(' ').toLowerCase().includes(q);
  });
  const byDate=(a,b)=>String(b.date||'').localeCompare(String(a.date||''))||String(b.created||'').localeCompare(String(a.created||''));
  if(sort==='upd') list.sort((a,b)=>String(b.updated||'').localeCompare(String(a.updated||'')));
  else if(sort==='old') list.sort((a,b)=>-byDate(a,b));
  else list.sort(byDate);
  if($('noteCount')) $('noteCount').textContent='('+list.length+(list.length!==notes.length?'/'+notes.length:'')+')';
  if(!notes.length){ host.innerHTML='<p class="muted">저장한 묵상이 없습니다.</p>'; return; }
  if(!list.length){ host.innerHTML='<p class="muted">조건에 맞는 묵상이 없습니다.</p>'; return; }
  let html='', lastDay=null;
  for(const n of list){
    if(sort!=='upd'&&n.date!==lastDay){ html+='<div class="noteday">'+safe(fmtDay(n.date))+'</div>'; lastDay=n.date; }
    html+=(noteEditId===n.id)?noteEditHtml(n):noteViewHtml(n);
  }
  host.innerHTML=html;
}
function startEditNote(id){ noteEditId=id; renderNotes(); }
function cancelEditNote(){ noteEditId=null; renderNotes(); }
function saveEditNote(id){
  const n=notes.find(x=>x.id===id); if(!n) return;
  const refl=$('ne_ref').value.trim(), res=$('ne_res').value.trim();
  if(!refl&&!res){ toast('내용을 입력해 주세요.'); return; }
  n.date=$('ne_date').value||n.date; n.verse=$('ne_verse').value.trim();
  n.reflection=refl; n.resolution=res; n.updated=new Date().toISOString();
  noteEditId=null; persistNotes(); renderNotes(); renderOneLine();
  toast('수정했습니다.');
}
function deleteNote(id){
  const i=notes.findIndex(x=>x.id===id);
  if(i<0) return;
  const n=notes[i];
  if(!confirm((n.date||'')+' 묵상을 삭제할까요?')) return;
  notes.splice(i,1);
  persistNotes(); renderNotes(); renderOneLine();
  if(typeof stats==='function') try{stats()}catch(e){}
}
normalizeNotes();


// ===== [확장 4] 말씀 알림: 캘린더(.ics) 내보내기 =====
function isMobileLike(){
  return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)||(navigator.maxTouchPoints>1&&/Mac/.test(navigator.platform));
}
/** 모바일에서는 공유 시트(캘린더·사진 앱 등)로, 그 외에는 파일 다운로드로 저장 */
async function saveBlobFile(blob,filename,title){
  try{
    const file=new File([blob],filename,{type:blob.type});
    if(isMobileLike()&&navigator.canShare&&navigator.canShare({files:[file]})){
      try{ await navigator.share({files:[file],title:title||filename}); return 'shared'; }
      catch(e){ if(e&&e.name==='AbortError') return 'cancel'; }
    }
  }catch(e){}
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob); a.download=filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),5000);
  return 'downloaded';
}
/** 같은 책의 연속 장은 묶어서 표기: 창세기 1–3장 · 탈출기 1장 */
function portionLabel(items){
  const groups=[];
  for(const it of items){
    const g=groups[groups.length-1];
    if(g&&g.book===it.book) g.chs.push(it.chapter); else groups.push({book:it.book,chs:[it.chapter]});
  }
  return groups.map(g=>{
    const runs=[]; let s0=g.chs[0], p0=s0;
    for(let i=1;i<=g.chs.length;i++){
      if(g.chs[i]===p0+1){ p0=g.chs[i]; continue; }
      runs.push(s0===p0?String(s0):s0+'–'+p0);
      s0=g.chs[i]; p0=s0;
    }
    return books[g.book][0]+' '+runs.join(', ')+unit(g.book);
  }).join(' · ');
}
/** 계획의 날짜별 분량 전체 (원래 일정 기준) */
function planSchedule(p){
  const seq=buildSeqForPlan(p), total=seq.length, out=[];
  if(!total||!p.days) return out;
  const d=new Date((p.start||start)+'T00:00:00');
  if(isNaN(d.getTime())) return out;
  let idx=0, guard=0;
  while(idx<p.days&&guard++<5000){
    if(!(p.skipSundays&&d.getDay()===0)){
      idx++;
      const a=Math.floor((idx-1)*total/p.days), z=Math.max(a+1,Math.floor(idx*total/p.days));
      if(a<total) out.push({date:ymdLocal(d),day:idx,items:seq.slice(a,Math.min(z,total))});
    }
    d.setDate(d.getDate()+1);
  }
  return out;
}
function icsEsc(t){
  return String(t).replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\r?\n/g,'\\n');
}
/** RFC 5545: 75바이트 넘으면 줄바꿈 (한글 3바이트를 고려해 글자 단위로 자름) */
function icsFold(line){
  const enc=new TextEncoder();
  if(enc.encode(line).length<=73) return line;
  const out=[]; let cur='', bytes=0;
  for(const ch of line){
    const b=enc.encode(ch).length;
    if(bytes+b>73){ out.push(cur); cur=' '+ch; bytes=1+b; }
    else { cur+=ch; bytes+=b; }
  }
  out.push(cur);
  return out.join('\r\n');
}
function icsStamp(d){
  const z=n=>String(n).padStart(2,'0');
  return d.getUTCFullYear()+z(d.getUTCMonth()+1)+z(d.getUTCDate())+'T'+z(d.getUTCHours())+z(d.getUTCMinutes())+z(d.getUTCSeconds())+'Z';
}
function icsLocal(dateStr,h,m){
  const z=n=>String(n).padStart(2,'0');
  return dateStr.replace(/-/g,'')+'T'+z(h)+z(m)+'00';
}
function buildPlanIcs(p,entries,hh,mm,alarmMin){
  const L=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Malssumgil//Bible Reading//KO','CALSCALE:GREGORIAN','METHOD:PUBLISH',
           'X-WR-CALNAME:'+icsEsc('말씀의 길 · '+p.name)];
  const stamp=icsStamp(new Date());
  const origin=/^https?:/.test(location.protocol)?location.origin+'/':'';
  for(const e of entries){
    const endTotal=hh*60+mm+30, eh=Math.floor(endTotal/60)%24, em=endTotal%60;
    const label=portionLabel(e.items);
    L.push('BEGIN:VEVENT',
      'UID:'+p.id+'-'+e.date+'@malssumgil',
      'DTSTAMP:'+stamp,
      'DTSTART:'+icsLocal(e.date,hh,mm),
      'DTEND:'+icsLocal(e.date,eh,em),
      'SUMMARY:'+icsEsc('말씀의 길 · '+label),
      'DESCRIPTION:'+icsEsc(p.name+' '+e.day+'/'+p.days+'일차\n오늘의 통독: '+label+(origin?'\n'+origin:'')));
    if(origin) L.push('URL:'+origin);
    L.push('BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+icsEsc('오늘의 통독: '+label),'TRIGGER:-PT'+alarmMin+'M','END:VALARM','END:VEVENT');
  }
  L.push('END:VCALENDAR');
  return L.map(icsFold).join('\r\n')+'\r\n';
}
function renderIcsOptions(){
  const sel=$('icsPlan'); if(!sel) return;
  const cur=sel.value||(getActivePlan()&&getActivePlan().id)||'';
  sel.innerHTML=savedPlans.length
    ? savedPlans.map(p=>'<option value="'+safe(p.id)+'">'+safe(p.name)+'</option>').join('')
    : '<option value="">저장된 계획 없음</option>';
  if(savedPlans.some(p=>p.id===cur)) sel.value=cur;
  if($('icsTime')) $('icsTime').value=store.icsTime||'07:00';
  if($('icsAlarm')&&store.icsAlarm) $('icsAlarm').value=store.icsAlarm;
  if($('icsRange')&&store.icsRange) $('icsRange').value=store.icsRange;
}
async function exportPlanIcs(){
  const p=savedPlans.find(x=>x.id===$('icsPlan').value);
  if(!p){ toast('통독 계획을 먼저 저장해 주세요.'); return; }
  const t=($('icsTime').value||'07:00').split(':').map(Number);
  const alarm=+$('icsAlarm').value, range=$('icsRange').value;
  store.icsTime=$('icsTime').value||'07:00'; store.icsAlarm=String(alarm); store.icsRange=range;
  const today=ymdLocal(new Date());
  let entries=planSchedule(p).filter(e=>e.date>=today);
  if(range!=='all') entries=entries.slice(0,+range);
  if(!entries.length){ toast('내보낼 일정이 없습니다. 계획 기간이 이미 끝났는지 확인해 주세요.'); return; }
  const ics=buildPlanIcs(p,entries,t[0]||0,t[1]||0,alarm);
  const blob=new Blob([ics],{type:'text/calendar;charset=utf-8'});
  const r=await saveBlobFile(blob,'malssumgil-'+p.name.replace(/[^\w가-힣]+/g,'_')+'.ics','말씀의 길 알림');
  if(r!=='cancel') toast(entries.length+'일 분량의 알림 일정을 만들었습니다.');
}


// ===== [확장 6] 공유 카드 (말씀 · 묵상 · 진도) =====
const CARD_W=1080, CARD_H=1350;
const CARD_FONT='"Noto Serif KR","Nanum Myeongjo","AppleMyungjo","Apple SD Gothic Neo","Malgun Gothic",serif';
const CARD_THEMES={
  navy:{name:'남색',bg:'#172b43',fg:'#f4efe3',accent:'#e6d3a7',sub:'#aebbc8'},
  ivory:{name:'아이보리',bg:'#f7f4ed',fg:'#283342',accent:'#a98543',sub:'#78818a'},
  sage:{name:'초록',bg:'#2f4a3c',fg:'#f3f1e6',accent:'#dcc78c',sub:'#b5c4b8'}
};
let cardSpec=null, cardTheme=(store.cardTheme&&CARD_THEMES[store.cardTheme])?store.cardTheme:'navy';

function openCard(spec){
  if(spec.type==='verse'){
    const list=selectedVerseList();
    if(!list.length){ toast('카드에 넣을 절을 먼저 선택해 주세요.'); return; }
    spec={type:'verse',book:selectedBook,chapter:selectedChapter,nums:list.map(v=>v.n),
          text:list.map(v=>stripFootnotes(v.text)).join(' ')};
  } else if(spec.type==='note'){
    const n=notes.find(x=>x.id===spec.id); if(!n) return;
    spec={type:'note',note:Object.assign({},n)};
  } else if(spec.type==='progress'){
    const p=savedPlans.find(x=>x.id===spec.planId); if(!p) return;
    spec={type:'progress',planId:p.id};
  }
  cardSpec=spec;
  const box=$('cardThemes');
  box.innerHTML=Object.keys(CARD_THEMES).map(k=>'<button type="button" class="alt chip'+(k===cardTheme?' on':'')+'" onclick="setCardTheme(\''+k+'\')">'+CARD_THEMES[k].name+'</button>').join('');
  $('cardHint').textContent=spec.type==='verse'?'본문이 길면 줄여서 표시됩니다. 출처가 카드에 함께 들어갑니다.':'';
  $('cardModal').classList.remove('hidden');
  drawCard();
}
function closeCard(){ $('cardModal').classList.add('hidden'); }
function setCardTheme(k){
  cardTheme=k; store.cardTheme=k;
  document.querySelectorAll('#cardThemes .chip').forEach(b=>b.classList.toggle('on',b.textContent===CARD_THEMES[k].name));
  drawCard();
}
document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&$('cardModal')&&!$('cardModal').classList.contains('hidden')) closeCard(); });

/** 단어 단위로 줄바꿈, 너무 긴 단어는 글자 단위로 */
function wrapLines(ctx,text,maxW){
  const lines=[];
  for(const para of String(text).split('\n')){
    let cur='';
    for(const word of para.split(' ')){
      const trial=cur?cur+' '+word:word;
      if(ctx.measureText(trial).width<=maxW){ cur=trial; continue; }
      if(cur){ lines.push(cur); cur=''; }
      if(ctx.measureText(word).width<=maxW){ cur=word; continue; }
      for(const ch of word){
        if(ctx.measureText(cur+ch).width>maxW&&cur){ lines.push(cur); cur=ch; } else cur+=ch;
      }
    }
    lines.push(cur);
  }
  return lines;
}
function fitText(ctx,text,maxW,maxH,o){
  o=o||{}; const max=o.max||60, min=o.min||32, lh=o.lh||1.6, wt=o.weight||'400';
  for(let size=max;size>=min;size-=2){
    ctx.font=wt+' '+size+'px '+CARD_FONT;
    const lines=wrapLines(ctx,text,maxW);
    if(lines.length*size*lh<=maxH) return {size,lines,lh};
  }
  ctx.font=wt+' '+min+'px '+CARD_FONT;
  let lines=wrapLines(ctx,text,maxW);
  const maxLines=Math.max(1,Math.floor(maxH/(min*lh)));
  if(lines.length>maxLines){
    lines=lines.slice(0,maxLines);
    let last=lines[maxLines-1];
    while(last.length&&ctx.measureText(last+'…').width>maxW) last=last.slice(0,-1);
    lines[maxLines-1]=last+'…';
  }
  return {size:min,lines,lh};
}
function drawLines(ctx,fit,x,y,align){
  ctx.textAlign=align||'left'; ctx.textBaseline='top';
  fit.lines.forEach((ln,i)=>ctx.fillText(ln,x,y+i*fit.size*fit.lh));
}
function drawCross(ctx,cx,cy,h,th,color){
  ctx.strokeStyle=color; ctx.lineWidth=h*0.16; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(cx,cy-h/2); ctx.lineTo(cx,cy+h/2); ctx.moveTo(cx-h*0.28,cy-h*0.2); ctx.lineTo(cx+h*0.28,cy-h*0.2); ctx.stroke();
}
function drawCardBase(ctx,th,footerNote){
  ctx.fillStyle=th.bg; ctx.fillRect(0,0,CARD_W,CARD_H);
  ctx.strokeStyle=th.accent; ctx.globalAlpha=.5; ctx.lineWidth=3;
  ctx.strokeRect(40,40,CARD_W-80,CARD_H-80); ctx.globalAlpha=1;
  drawCross(ctx,CARD_W/2,150,92,th,th.accent);
  ctx.textBaseline='alphabetic'; ctx.textAlign='center';
  ctx.fillStyle=th.accent; ctx.font='600 40px '+CARD_FONT;
  ctx.fillText('말씀의 길',CARD_W/2,CARD_H-110);
  if(footerNote){ ctx.fillStyle=th.sub; ctx.font='400 26px '+CARD_FONT; ctx.fillText(footerNote,CARD_W/2,CARD_H-66); }
}
function drawCard(){
  if(!cardSpec) return;
  const cv=$('cardCanvas'), ctx=cv.getContext('2d'), th=CARD_THEMES[cardTheme];
  const padX=120, textW=CARD_W-padX*2;
  if(cardSpec.type==='verse'){
    drawCardBase(ctx,th,'한국천주교주교회의 성경');
    ctx.fillStyle=th.accent; ctx.font='600 46px '+CARD_FONT; ctx.textAlign='center'; ctx.textBaseline='alphabetic';
    ctx.fillText(verseRefLabel(cardSpec.book,cardSpec.chapter,cardSpec.nums),CARD_W/2,330);
    const fit=fitText(ctx,cardSpec.text,textW,640,{max:58,min:32,lh:1.7});
    const h=fit.lines.length*fit.size*fit.lh;
    ctx.fillStyle=th.fg; ctx.font='400 '+fit.size+'px '+CARD_FONT;
    drawLines(ctx,fit,CARD_W/2,400+(640-h)/2,'center');
  } else if(cardSpec.type==='note'){
    const n=cardSpec.note;
    drawCardBase(ctx,th,fmtDay(n.date));
    let y=300;
    if(n.verse){
      ctx.fillStyle=th.accent; ctx.font='600 44px '+CARD_FONT; ctx.textAlign='center'; ctx.textBaseline='alphabetic';
      ctx.fillText(n.verse,CARD_W/2,y+40); y+=100;
    }
    const hasRes=!!n.resolution;
    const bodyH=(hasRes?600:760)-(n.verse?60:0);
    const fit=fitText(ctx,n.reflection||'',textW,bodyH,{max:56,min:32,lh:1.7});
    const h=fit.lines.length*fit.size*fit.lh;
    ctx.fillStyle=th.fg; ctx.font='400 '+fit.size+'px '+CARD_FONT;
    drawLines(ctx,fit,CARD_W/2,y+Math.max(0,(bodyH-h)/2)*(hasRes?0:1)+20,'center');
    if(hasRes){
      const ry=y+bodyH+40;
      ctx.strokeStyle=th.accent; ctx.globalAlpha=.5; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(CARD_W/2-90,ry-24); ctx.lineTo(CARD_W/2+90,ry-24); ctx.stroke(); ctx.globalAlpha=1;
      const f2=fitText(ctx,'다짐 · '+n.resolution,textW,150,{max:36,min:26,lh:1.5});
      ctx.fillStyle=th.sub; ctx.font='400 '+f2.size+'px '+CARD_FONT; drawLines(ctx,f2,CARD_W/2,ry,'center');
    }
  } else if(cardSpec.type==='progress'){
    const p=savedPlans.find(x=>x.id===cardSpec.planId); if(!p) return;
    const pr=planProgress(p);
    const today=todayItemsForPlan(p);
    drawCardBase(ctx,th,ymdLocal(new Date()).replace(/-/g,'.'));
    ctx.textAlign='center'; ctx.textBaseline='alphabetic';
    const nf=fitText(ctx,p.name,textW,130,{max:56,min:34,lh:1.3,weight:'600'});
    ctx.fillStyle=th.fg; ctx.font='600 '+nf.size+'px '+CARD_FONT; drawLines(ctx,nf,CARD_W/2,270,'center');
    // 진도 링
    const cx=CARD_W/2, cy=620, r=215;
    ctx.lineWidth=36; ctx.lineCap='round';
    ctx.strokeStyle=th.sub; ctx.globalAlpha=.3; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.stroke(); ctx.globalAlpha=1;
    if(pr.pct>0){
      ctx.strokeStyle=th.accent; ctx.beginPath(); ctx.arc(cx,cy,r,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.min(1,pr.pct/100)); ctx.stroke();
    }
    ctx.fillStyle=th.fg; ctx.font='700 150px '+CARD_FONT; ctx.textBaseline='middle'; ctx.fillText(pr.pct+'%',cx,cy-16);
    ctx.fillStyle=th.sub; ctx.font='400 38px '+CARD_FONT; ctx.fillText(pr.done+' / '+pr.total+' 완료',cx,cy+100);
    // 하단 정보
    ctx.textBaseline='alphabetic';
    const lines=[];
    lines.push(Math.min(pr.day,p.days)+'일차 / 총 '+p.days+'일');
    if(today.length) lines.push('오늘의 통독 · '+portionLabel(today));
    const st=noteStreak(); if(st>0) lines.push('연속 '+st+'일 기록');
    let y=930;
    lines.forEach((t,i)=>{
      const f=fitText(ctx,t,textW,60,{max:i===0?42:36,min:26,lh:1.3});
      ctx.fillStyle=i===0?th.fg:th.sub; ctx.font='400 '+f.size+'px '+CARD_FONT; drawLines(ctx,f,CARD_W/2,y,'center'); y+=f.lines.length*f.size*f.lh+22;
    });
  }
}
function saveCard(){
  const cv=$('cardCanvas');
  cv.toBlob(async blob=>{
    if(!blob){ toast('이미지를 만들지 못했습니다.'); return; }
    const r=await saveBlobFile(blob,'malssumgil-card-'+ymdLocal(new Date())+'.png','말씀의 길');
    if(r==='downloaded') toast('이미지를 저장했습니다.');
  },'image/png');
}

/*__EXT_END__*/
$('hideNotes').checked=store.hideNotes==='1';
if($('planType'))$('planType').value=planType;
if([90,180,365,730].includes(days)){if($('days'))$('days').value=String(days)}
else if($('days')){$('days').value='customDays';if($('customDays'))$('customDays').value=days;if($('customDaysWrap'))$('customDaysWrap').classList.add('hidden')}
if(planType==='custom'){if($('customPeriods'))$('customPeriods').classList.remove('hidden');renderPeriodChecks()}
if(planType==='customBooks'){if($('customBooksPanel'))$('customBooksPanel').classList.remove('hidden');renderBookChecks()}
selectBook(0);renderSavedPlans();renderRangePreview();dashboard();preview();

try{ applyTheme(store.themePref||'system'); }catch(e){}
try{
  if(window.matchMedia){
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{
      if((store.themePref||'system')==='system') applyTheme('system');
    });
  }
}catch(e){}

// PWA: 서비스 워커 등록 (https 또는 localhost에서만)
if('serviceWorker' in navigator && (location.protocol==='https:'||location.hostname==='localhost')){
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register('/sw.js').catch(e=>console.warn('SW 등록 실패',e));
  });
}
