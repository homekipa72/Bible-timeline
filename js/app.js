/* storage: /js/storage.js */
/* 정적 데이터: /js/data.js */
// Remove legacy reading memo widget keys once; shared notes are kept.
['quick','quickReflect','quickNotes_v1','readingMemo_v1'].forEach(k=>store.removeItem(k));
let planType=store.planType||'all';
let customPeriodSet=jget('customPeriods',[1,2,3,4,5,6,7,8,9,10,11,12],Array.isArray);
let customBookSet=jget('customBooks',null);
if(!Array.isArray(customBookSet)) customBookSet=[...Array(books.length).keys()];
// 저장된 통독 계획 (최대 4개)
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
if(savedPlans.length>4){ savedPlans=savedPlans.slice(0,4); store.savedPlans=JSON.stringify(savedPlans); }
let planSkipSundays=false; // 기간 설정: 주일 제외 배분
let planCalendarDays=365; // 주일 제외 전 전체 달력 일수
function persistPlans(){ store.savedPlans=JSON.stringify(savedPlans); }
let completedPlans=jget('completedPlans_v1',[],Array.isArray);
function persistCompletedPlans(){store.completedPlans_v1=JSON.stringify(completedPlans)}
let verseShelf=jget('verseShelf_v1',[],Array.isArray);
function persistVerseShelf(){store.verseShelf_v1=JSON.stringify(verseShelf)}
function archiveIfComplete(id){const p=savedPlans.find(x=>x.id===id);if(!p)return;const pr=planProgress(p);if(pr.total&&pr.done===pr.total){if(!completedPlans.some(x=>x.id===id)){completedPlans.push({...p,completedAt:new Date().toISOString()});persistCompletedPlans()}savedPlans=savedPlans.filter(x=>x.id!==id);persistPlans();if(activePlanId===id)setActivePlan(savedPlans[0]?.id||'')}}
function recoverCompletedPlans(){savedPlans.slice().forEach(p=>archiveIfComplete(p.id))}

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
function setPlanChapterDone(id,key,done,verseNumbers){if(!id)return;const st=planState(id);if(done)st.chapters[key]=true;else delete st.chapters[key];if(Array.isArray(verseNumbers)){if(verseNumbers.length)st.verses[key]=verseNumbers;else delete st.verses[key]}else if(!done)delete st.verses[key];savePlanReadingState();recordCumulative(id,key,st.verses[key]||[]);if(done)setTimeout(()=>{archiveIfComplete(id);dashboard();renderSavedPlans()},0)}
function togglePlanVerse(id,key,verseNo){const st=planState(id);let arr=Array.isArray(st.verses[key])?st.verses[key]:[];if(st.chapters[key]&&currentVerses.length)arr=currentVerses.map(v=>v.n);st.verses[key]=arr.includes(verseNo)?arr.filter(n=>n!==verseNo):[...arr,verseNo].sort((a,b)=>a-b);if(currentVerses.length&&st.verses[key].length===currentVerses.length)st.chapters[key]=true;else delete st.chapters[key];if(!st.verses[key].length)delete st.verses[key];savePlanReadingState();recordCumulative(id,key,st.verses[key]||[]);if(st.chapters[key])setTimeout(()=>{archiveIfComplete(id);dashboard();renderSavedPlans();renderCompletedPlans()},0)}

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

function planPaceMode(p){ return (p && p.paceMode)==='flexible'?'flexible':'fixed'; }
function adjustFlexiblePlan(p){
  if(!p || planPaceMode(p)!=='flexible') return null;
  return flexibleScheduleState(p);
}


function planOtNtProgress(p){
  const seq=buildSeqForPlan(p);
  let otT=0,otD=0,ntT=0,ntD=0;
  for(const it of seq){
    const bi=+it.book;
    const key=verseKey(it.book,it.chapter);
    const done=planChapterDone(p.id,key);
    if(bi<46){ otT++; if(done) otD++; }
    else { ntT++; if(done) ntD++; }
  }
  return {
    otT,otD,ntT,ntD,
    otP: otT?Math.round(otD/otT*100):0,
    ntP: ntT?Math.round(ntD/ntT*100):0
  };
}

function planProgress(p){
  const seq=buildSeqForPlan(p);
  let done=0;
  for(const it of seq) if(planChapterDone(p.id,verseKey(it.book,it.chapter))) done++;
  const pct=seq.length?Math.round(done/seq.length*100):0;
  const day=dayIndexForPlan(p);
  const start=new Date((p.start||'')+'T00:00:00');
  const flex=planPaceMode(p)==='flexible'?flexibleScheduleState(p,seq):{extension:0};
  const spanDays=p.skipSundays ? (p.calendarDays||365) : (p.days||1);
  const baseEnd=new Date(start); baseEnd.setDate(baseEnd.getDate()+spanDays-1);
  const baseEndStr=isNaN(baseEnd.getTime())?'':baseEnd.toISOString().slice(0,10);
  const end=new Date(baseEnd);
  let extension=flex.extension||0;
  while(extension>0){end.setDate(end.getDate()+1);if(!p.skipSundays||end.getDay()!==0)extension--;}
  const endStr=isNaN(end.getTime())?'':end.toISOString().slice(0,10);
  const today=new Date(); today.setHours(0,0,0,0);
  let status='진행 중';
  const elapsedCalendarDays=isNaN(start.getTime())?0:Math.floor((today-start)/86400000)+1;
  const expired=!isNaN(end.getTime())&&today>end;
  if(!isNaN(start.getTime()) && today<start) status='시작 전';
  else if(seq.length>0 && done>=seq.length) status='완료';
  else if(expired) status='기간 종료 · 미완료';
  else if(pct===0) status='시작 가능';
  else status='진행 중 · '+day+'일차';
  const backlog=backlogForPlan(p,seq);
  const skk=p.skipped||{};
  let skipped=0;
  for(const it of seq){ const k=verseKey(it.book,it.chapter); if(skk[k]&&!planChapterDone(p.id,k)) skipped++; }
  return {seq, done, total:seq.length, pct, day, endStr, baseEndStr, extensionDays:flex.extension||0, status, backlog, skipped};
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
function rawPlanReadingDay(p,atDate){
  const t=new Date(atDate||Date.now());t.setHours(0,0,0,0);
  const startStr=p.start||start;
  if(p.skipSundays)return countReadingDaysElapsed(startStr,t,true);
  const s=new Date(startStr+'T00:00:00');
  return isNaN(s.getTime())?0:Math.floor((t-s)/86400000)+1;
}
function flexibleScheduleState(p,seq){
  const totalDays=Math.max(1,+p.days||1),seqItems=seq||buildSeqForPlan(p),raw=Math.max(1,rawPlanReadingDay(p));
  if(planPaceMode(p)!=='flexible'||!seqItems.length)return {day:Math.min(raw,totalDays),extension:0,baseDays:totalDays};
  const upto=Math.min(raw,totalDays),sk=p.skipped||{};let firstIncomplete=0;
  for(let d=1;d<=upto&&!firstIncomplete;d++){
    const {a,z}=chapterRangeForDay(d,seqItems.length,totalDays);
    for(let i=a;i<z;i++){
      const it=seqItems[i],key=verseKey(it.book,it.chapter);
      if(!planChapterDone(p.id,key)&&!sk[key]){firstIncomplete=d;break;}
    }
  }
  const day=firstIncomplete||Math.min(raw,totalDays);
  return {day,extension:Math.max(0,raw-day),baseDays:totalDays};
}
function dayIndexForPlan(p){
  const t=new Date();t.setHours(0,0,0,0);
  if(planPaceMode(p)==='flexible')return flexibleScheduleState(p).day;
  let d=rawPlanReadingDay(p);
  if(d<1)d=1;
  if(d>p.days)d=p.days;
  return d;
}
function chapterRangeForDay(day,total,days){
  const count=Math.max(0,Number(total)||0), span=Math.max(1,Number(days)||1), d=Math.max(1,Math.min(span,Number(day)||1));
  return {a:Math.floor((d-1)*count/span),z:Math.floor(d*count/span)};
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
  const {a,z}=chapterRangeForDay(day,total,p.days);
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
// 새로고침 직전에 통독 완료 처리가 발생해 setTimeout이 실행되지 못한 경우,
// 저장된 진도를 기준으로 완료 계획을 복구합니다. archiveIfComplete는 중복 이력도 방지합니다.
recoverCompletedPlans();
$('today').textContent=new Date().toLocaleDateString('ko-KR',{year:'numeric',month:'long',day:'numeric',weekday:'long'});
$('days').value=days;$('start').value=start;$('ndate').value=new Date().toISOString().slice(0,10);
try{ refreshReadBookSelect(); }catch(e){ $('verseBook').innerHTML=books.map((b,n)=>'<option value="'+n+'">'+b[0]+'</option>').join(''); }
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

/* 배지: /js/badges.js */


function appDialog({title, message, confirmLabel, cancelLabel, danger}){
  return new Promise(resolve=>{
    const m=$('appDialog'); if(!m){ resolve(window.confirm(message)); return; }
    $('appDialogTitle').textContent=title||'알림';
    $('appDialogMessage').textContent=message||'';
    const ok=$('appDialogOk'), cancel=$('appDialogCancel');
    ok.textContent=confirmLabel||'확인';
    if(cancelLabel){ cancel.classList.remove('hidden'); cancel.textContent=cancelLabel; }
    else cancel.classList.add('hidden');
    m.classList.remove('hidden');
    const done=(v)=>{ m.classList.add('hidden'); ok.onclick=null; cancel.onclick=null; resolve(v); };
    ok.onclick=()=>done(true);
    cancel.onclick=()=>done(false);
    m.onclick=(e)=>{ if(e.target===m && cancelLabel) done(false); };
  });
}
function appAlert(message, title){ return appDialog({title:title||'알림', message, confirmLabel:'확인'}); }
function appConfirm(message, title){ return appDialog({title:title||'확인', message, confirmLabel:'확인', cancelLabel:'취소'}); }


function maybeShowOnboard(){
  if(store.onboardDone_v1==='1') return;
  const m=$('onboardModal'); if(m) m.classList.remove('hidden');
}
function finishOnboard(target){
  store.onboardDone_v1='1';
  const m=$('onboardModal'); if(m) m.classList.add('hidden');
  if(target&&target!=='home') view(target);
}

function view(id,planId){
  if(id==='verseShelf') id='notes';
  if(id!=='read'&&noteVerseTarget==='today') noteVerseTarget='';
  if(id==='read') activeReadPlanId=planId||'';
  document.querySelectorAll('main section').forEach(s=>s.classList.add('hidden'));
  $(id).classList.remove('hidden');
  document.querySelectorAll('.nav button, .bottom-nav button').forEach(b=>{
    const on=b.dataset.v===id;
    b.classList.toggle('active',on);
    if(on) b.setAttribute('aria-current','page'); else b.removeAttribute('aria-current');
  });
  document.body.classList.toggle('read-mode', id==='read');
  if(id==='home')dashboard();
  if(id==='missa'&&!missaLoaded)loadMissa();
  if(id==='plan'){onAutoModeChange();if($('autoEnd')&&!$('autoEnd').value){const d=new Date();d.setDate(d.getDate()+364);$('autoEnd').value=d.toISOString().slice(0,10)}renderRangePreview();renderSavedPlans();renderCompletedPlans();syncPeriodFromAuto();preview();}
  if(id==='notes'){renderNotes();try{renderVerseMeditations();}catch(e){}}
  if(id==='stats')stats();
  if(id==='badges'){checkBadgeAwards();renderBadges();}
  if(id==='settings'){ try{ applyTextStyle(); }catch(e){} }
  if(id==='read'){refreshReadBookSelect(true);refreshReadChapterSelect(selectedChapter);loadChapter(false);renderReadPlanPreview();updateMarkButtons();}
  window.scrollTo(0,0);
}
document.querySelectorAll('.nav button').forEach(b=>b.onclick=()=>view(b.dataset.v));
function db(){return new Promise((ok,no)=>{let r=indexedDB.open('malssumgil-bible',1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('chapters'))r.result.createObjectStore('chapters')};r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)})}
async function cacheGet(key){try{let d=await db();return await new Promise((ok,no)=>{let r=d.transaction('chapters').objectStore('chapters').get(key);r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)})}catch(e){return null}}
async function cachePut(key,value){try{let d=await db();return await new Promise((ok,no)=>{let t=d.transaction('chapters','readwrite');t.objectStore('chapters').put(value,key);t.oncomplete=ok;t.onerror=()=>no(t.error);t.onabort=()=>no(t.error)})}catch(e){return null}}
function applyTextStyle(){
  const el=$('bibleText'); if(!el) return;
  const ff=$('fontFamily');
  const fs=$('fontSize');
  const lh=$('lineHeight');
  // 설정 셀렉트가 없으면 store 값 사용
  const family=(ff&&ff.value)||store.fontFamily||'Georgia, "Noto Serif KR", serif';
  const size=(fs&&fs.value)||store.fontSize||'18';
  const height=(lh&&lh.value)||store.lineHeight||'1.7';
  el.style.fontFamily=family;
  el.style.fontSize=size+'px';
  el.style.lineHeight=height;
  if(ff) store.fontFamily=ff.value;
  if(fs) store.fontSize=fs.value;
  if(lh) store.lineHeight=lh.value;
  // 툴바 표시 동기화
  const tip=$('readTypeBar');
  if(tip) tip.setAttribute('data-font', size+'px');
}
(function initReadingStyle(){
  const setSel=(id,v,def)=>{const el=$(id);el.value=v;if(el.value!==String(v))el.value=def;};
  setSel('fontFamily',store.fontFamily||"'Noto Serif KR',serif","'Noto Serif KR',serif");
  setSel('fontSize',store.fontSize||'18','18');
  setSel('lineHeight',store.lineHeight||'2.05','2.05');
  applyTextStyle();
})();

function exitReading(target){
  activeReadPlanId='';
  view(target==='plan'?'plan':'home');
}
function getActiveReadPlan(){
  if(!activeReadPlanId) return null;
  return savedPlans.find(x=>x.id===activeReadPlanId)||null;
}
function getActiveReadSeq(){
  const p=getActiveReadPlan();
  if(!p) return null;
  try{ return buildSeqForPlan(p); }catch(e){ return null; }
}
function booksInReadScope(){
  const seq=getActiveReadSeq();
  if(!seq||!seq.length) return books.map((_,i)=>i);
  return [...new Set(seq.map(it=>+it.book))].filter(bi=>bi>=0&&bi<books.length).sort((a,b)=>a-b);
}
function chaptersInReadScope(bi){
  const seq=getActiveReadSeq();
  if(!seq||!seq.length) return Array.from({length:books[bi][2]},(_,i)=>i+1);
  const ch=[...new Set(seq.filter(it=>+it.book===+bi).map(it=>+it.chapter))].filter(c=>c>=1).sort((a,b)=>a-b);
  return ch.length?ch:Array.from({length:books[bi][2]},(_,i)=>i+1);
}
function refreshReadBookSelect(keepSelection){
  const el=$('verseBook'); if(!el) return;
  const scope=booksInReadScope();
  const prev=keepSelection?selectedBook:+el.value;
  el.innerHTML=scope.map(n=>'<option value="'+n+'">'+books[n][0]+'</option>').join('');
  let next=scope.includes(prev)?prev:(scope[0]??0);
  selectedBook=next;
  el.value=String(next);
  const hint=$('readScopeHint');
  if(hint){
    const p=getActiveReadPlan();
    hint.textContent=p
      ?('「'+p.name+'」 계획 범위의 책·장만 선택할 수 있습니다.')
      :'통독 계획에서 성경 읽기를 시작하면 해당 계획 범위만 표시됩니다.';
  }
}
function refreshReadChapterSelect(preferCh){
  const countList=chaptersInReadScope(selectedBook);
  const u=unit(selectedBook);
  if($('chapterUnitLabel')) $('chapterUnitLabel').childNodes[0].textContent=u+' ';
  $('verseChapter').innerHTML=countList.map(c=>'<option value="'+c+'">'+c+u+'</option>').join('');
  let ch=preferCh!=null?+preferCh:selectedChapter;
  if(!countList.includes(ch)) ch=countList[0]||1;
  selectedChapter=ch;
  $('verseChapter').value=String(ch);
  if($('btnPrevCh')){$('btnPrevCh').textContent='이전 '+u;$('btnNextCh').textContent='다음 '+u;$('btnMarkCh').textContent='이 '+u+' 완료'}
}

function selectBook(index){
  const scope=booksInReadScope();
  let bi=+index;
  if(!scope.includes(bi)) bi=scope[0]??0;
  selectedBook=bi;
  if($('verseBook')) $('verseBook').value=String(bi);
  refreshReadChapterSelect(chaptersInReadScope(bi)[0]);
  loadChapter(false);
}

function selectChapter(ch){
  let c=+ch;
  if(!Number.isFinite(c)||c<1) c=1;
  const max=books[selectedBook]?books[selectedBook][2]:1;
  if(c>max) c=max;
  try{
    const scope=chaptersInReadScope(selectedBook);
    if(scope&&scope.length && scope.indexOf(c)<0){
      let best=scope[0], dist=Math.abs(best-c);
      for(const x of scope){ const d=Math.abs(x-c); if(d<dist){ best=x; dist=d; } }
      c=best;
    }
  }catch(e){}
  try{ saveReadScrollPos(); }catch(e){}
  selectedChapter=c;
  if($('verseChapter')) $('verseChapter').value=String(c);
  rememberLastRead(selectedBook,selectedChapter);
  const p=loadChapter(false);
  if(p&&p.then) p.then(function(){ try{ restoreReadScrollPos(); }catch(e){} }).catch(function(){});
  try{ updateChapterGridFoldMeta(); }catch(e){}
}
function moveChapter(delta){
  const seq=getActiveReadSeq();
  if(seq&&seq.length){
    let idx=seq.findIndex(it=>+it.book===+selectedBook&&+it.chapter===+selectedChapter);
    if(idx<0){
      // nearest
      idx=seq.findIndex(it=>+it.book===+selectedBook);
      if(idx<0) idx=0;
    }
    const next=idx+delta;
    if(next<0||next>=seq.length) return;
    const it=seq[next];
    selectedBook=+it.book; selectedChapter=+it.chapter;
    refreshReadBookSelect(true);
    refreshReadChapterSelect(selectedChapter);
    rememberLastRead(selectedBook,selectedChapter);
    loadChapter(false);
    return;
  }
  let c=selectedChapter+delta,b=selectedBook;
  if(c<1){if(b===0)return;b--;c=books[b][2]}
  else if(c>books[b][2]){if(b===books.length-1)return;b++;c=1}
  selectedBook=b;selectedChapter=c;
  refreshReadBookSelect(true);
  refreshReadChapterSelect(c);
  rememberLastRead(b,c);loadChapter(false);
}
function verseKey(b,c){return b+':'+c}
function saveVerseData(){store.verseRead_v1=JSON.stringify(verseRead);store.chapterRead_v1=JSON.stringify(chapterRead);if(periodChart||otChart||ntChart||bookChart)updateCharts();if($('todayList'))renderTodayList()}
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
async function loadChapter(force){copySel.clear();selectSel.clear();updateSelectBar();const b=books[selectedBook],key=b[3]+'/'+selectedChapter;$('verseBook').value=String(selectedBook);$('verseChapter').value=String(selectedChapter);$('chapterHeading').textContent=chLabel(selectedBook,selectedChapter);$('readerTitle').textContent=chLabel(selectedBook,selectedChapter);$('chapterStatus').textContent='본문 확인 중…';renderChapterGrid();try{let verses=!force?await cacheGet(key):null;if(!verses){const r=await fetch('/api/bible?book='+encodeURIComponent(b[3])+'&chapter='+selectedChapter);if(!r.ok)throw new Error('성경 본문 서버 응답 오류 ('+r.status+')');const html=await r.text();verses=extractVerses(html);await cachePut(key,verses)}currentVerses=verses;renderChapter();$('chapterStatus').textContent='본문 '+verses.length+'절 · '+(force?'공식 사이트에서 새로 가져와 저장했습니다.':'기기 저장본을 사용했습니다.')}catch(e){$('chapterStatus').textContent='본문을 불러오지 못했습니다: '+e.message;let cached=await cacheGet(key).catch(()=>null);if(cached){currentVerses=cached;renderChapter();$('chapterStatus').textContent='온라인 연결 실패 · 기기에 저장된 본문 '+cached.length+'절을 표시합니다.'}}}
function renderChapter(){ try{updateMarkButtons()}catch(e){} let key=verseKey(selectedBook,selectedChapter),marked=activeReadPlanId?(planChapterDone(activeReadPlanId,key)?currentVerses.map(v=>v.n):planVerseMarks(activeReadPlanId,key)):(verseRead[key]||[]);let host=$('bibleText');host.innerHTML='';currentVerses.forEach(v=>{let row=document.createElement('div');row.className='bible-verse'+(marked.includes(v.n)?' read':'')+(selectMode&&selectSel.has(v.n)?' sel':'');row.title=selectMode?'본문을 눌러 구절을 선택/해제':'본문을 누르면 읽음 표시가 바뀝니다';let num=document.createElement('span');num.className='num';num.textContent=v.n;let words=document.createElement('span');words.className='words';words.innerHTML=fmtVerse(v.text);row.append(num,words);row.onclick=()=>selectMode?toggleSelectVerse(v.n):toggleVerse(v.n);host.appendChild(row)});let chapterDone=activeReadPlanId?planChapterDone(activeReadPlanId,key):!!chapterRead[key];$('chapterProgress').textContent=chLabel(selectedBook,selectedChapter)+' · '+marked.length+'/'+currentVerses.length+'절 읽음'+(chapterDone?' · 완료':'');if(currentVerses.length&&verseTotal[key]!==currentVerses.length){verseTotal[key]=currentVerses.length;saveTotals()}renderChapterGrid();applyTextStyle();dashboard();
  try{
    const pct=currentVerses.length?Math.round(100*marked.length/currentVerses.length):0;
    const bar=$('readChProgressBar');
    if(bar){
      bar.setAttribute('aria-valuenow',String(pct));
      bar.setAttribute('aria-label','이 장 읽음 '+pct+'%');
      const span=bar.querySelector('span'); if(span) span.style.width=pct+'%';
      bar.classList.toggle('is-done', !!chapterDone);
    }
    const meta=$('readSelectSummaryMeta');
    if(meta) meta.textContent=chLabel(selectedBook,selectedChapter)+(chapterDone?' · 완료':' · '+marked.length+'/'+currentVerses.length+'절');
  }catch(e){}
}
function saveTotals(){try{store.verseTotal_v1=JSON.stringify(verseTotal)}catch(e){}}
function chStatus(b,c){let k=verseKey(b,c),done=activeReadPlanId?planChapterDone(activeReadPlanId,k):chapterRead[k],marks=activeReadPlanId?planVerseMarks(activeReadPlanId,k):(verseRead[k]||[]);return done?'done':(marks.length?'part':'todo')}
function renderChapterGrid(){
  const el=$('chapterGrid'); if(!el) return;
  let list=[];
  try{ list=chaptersInReadScope(selectedBook)||[]; }catch(e){ list=[]; }
  if(!list.length){
    const n=books[selectedBook]?books[selectedBook][2]:0;
    list=Array.from({length:n},(_,i)=>i+1);
  }
  el.innerHTML=list.map(c=>{
    const st=chStatus(selectedBook,c);
    const state=st==='done'?'완료':(st==='part'?'일부 읽음':'미완료');
    const sel=(+c===+selectedChapter)?' selected':'';
    return '<button type="button" class="ch-btn '+st+sel+'" data-ch="'+c+'"'+
      ' onclick="event.preventDefault();event.stopPropagation();openChapterDetail('+c+')"'+
      ' aria-label="'+c+unit(selectedBook)+' · '+state+(+c===+selectedChapter?' · 선택됨':'')+'"'+
      ' title="'+c+unit(selectedBook)+' · '+state+' · 클릭하여 본문 보기">'+c+'</button>';
  }).join('');
  try{ updateChapterGridFoldMeta(); }catch(e){}
}
function jumpToFirstUnread(){
  const n=books[selectedBook][2];
  let target=null;
  for(let c=1;c<=n;c++){
    if(chStatus(selectedBook,c)!=='done'){ target=c; break; }
  }
  if(target==null){
    if(typeof toast==='function') toast('이 책은 모두 완료했습니다.');
    return;
  }
  openChapterDetail(target);
  if(typeof toast==='function') toast(chLabel(selectedBook,target)+'로 이동합니다.');
}

/* read-scroll-pos */
function readScrollKey(){
  return 'readScroll:'+selectedBook+':'+selectedChapter+(activeReadPlanId?':'+activeReadPlanId:'');
}
function saveReadScrollPos(){
  try{
    const host=$('bibleText');
    if(!host) return;
    const y=window.scrollY||document.documentElement.scrollTop||0;
    const map=JSON.parse(store.readScrollMap_v1||'{}');
    map[readScrollKey()]=y;
    // keep map small
    const keys=Object.keys(map);
    if(keys.length>40){
      keys.slice(0, keys.length-40).forEach(k=>delete map[k]);
    }
    store.readScrollMap_v1=JSON.stringify(map);
  }catch(e){}
}
function restoreReadScrollPos(){
  try{
    const map=JSON.parse(store.readScrollMap_v1||'{}');
    const y=map[readScrollKey()];
    if(typeof y==='number'&&y>=0){
      requestAnimationFrame(()=>{ window.scrollTo(0, y); });
    }
  }catch(e){}
}

function openChapterDetail(c, opts){
  opts=opts||{};
  c=+c;
  if(!Number.isFinite(c)||c<1) return;
  const max=books[selectedBook]?books[selectedBook][2]:0;
  if(c>max) return;
  try{ saveReadScrollPos(); }catch(e){}
  selectedChapter=c;
  if($('verseChapter')){
    const sel=$('verseChapter');
    const has=[...sel.options].some(o=>+o.value===c);
    if(has) sel.value=String(c);
  }
  rememberLastRead(selectedBook, selectedChapter);
  loadChapter(false).then(function(){
    const host=$('chapterHeading')||$('bibleText');
    if(opts.restoreScroll){
      restoreReadScrollPos();
    } else if(host&&host.scrollIntoView){
      try{ host.scrollIntoView({behavior:'smooth', block:'start'}); }catch(e){ try{host.scrollIntoView(true);}catch(_){}}
    }
  }).catch(function(){});
  if($('chapterStatus')){
    const st=chStatus(selectedBook,c);
    const state=st==='done'?'완료':(st==='part'?'일부 읽음':'미완료');
    $('chapterStatus').textContent=chLabel(selectedBook,c)+' · '+state+' · 본문을 표시합니다.';
  }
  const meta=$('readSelectSummaryMeta');
  if(meta) meta.textContent=chLabel(selectedBook,c);
  // 장 선택 후 목록은 접어 본문에 집중
  const fold=$('chapterGridFold');
  if(fold) fold.open=false;
  updateChapterGridFoldMeta();
}
function updateChapterGridFoldMeta(){
  const meta=$('chapterGridFoldMeta');
  if(!meta) return;
  try{
    let list=[];
    try{ list=chaptersInReadScope(selectedBook)||[]; }catch(e){ list=[]; }
    if(!list.length){
      const n=books[selectedBook]?books[selectedBook][2]:0;
      list=Array.from({length:n},(_,i)=>i+1);
    }
    let done=0;
    for(const c of list){ if(chStatus(selectedBook,c)==='done') done++; }
    meta.textContent=done+'/'+list.length+' 완료 · 현재 '+selectedChapter+unit(selectedBook);
  }catch(e){ meta.textContent='펼쳐서 선택'; }
}
function fmtVerse(t){let h=safe(t),hide=store.hideNotes==='1';return h.replace(/(\d{1,3})\)/g,(m,d,off,str)=>{let p=str[off-1];if(!p||/[\s(\d]/.test(p))return m;return hide?'':'<sup class="fn">'+d+')</sup>'})}
function toggleNotes(){store.hideNotes=$('hideNotes').checked?'1':'0';renderChapter()}
async function prefetchBook(){let bi=selectedBook,b=books[bi],btn=$('prefetchBtn'),fail=0;btn.disabled=true;for(let c=1;c<=b[2];c++){$('chapterStatus').textContent=b[0]+' 내려받는 중… '+c+' / '+b[2]+unit(selectedBook);let key=b[3]+'/'+c;try{let v=await cacheGet(key);if(!v){let r=await fetch('/api/bible?book='+encodeURIComponent(b[3])+'&chapter='+c);if(!r.ok)throw new Error(r.status);v=extractVerses(await r.text(),bi,c);await cachePut(key,v);await new Promise(o=>setTimeout(o,300))}verseTotal[verseKey(bi,c)]=v.length}catch(e){fail++}}saveTotals();btn.disabled=false;$('chapterStatus').textContent=b[0]+' 내려받기 완료'+(fail?' · 실패 '+fail+unit(selectedBook)+' (다시 누르면 이어서 받습니다)':' · 오프라인에서도 읽을 수 있습니다.');renderChapter()}
function addVerseShelf(type,nums,text=''){const now=new Date().toISOString(),ref=verseRefLabel(selectedBook,selectedChapter,nums);const existing=verseShelf.find(x=>x.type===type&&x.book===books[selectedBook][3]&&x.chapter===selectedChapter&&JSON.stringify(x.verses)===JSON.stringify(nums));if(existing){existing.updatedAt=now;if(text)existing.text=text}else verseShelf.unshift({id:'v'+Date.now()+Math.random().toString(36).slice(2,7),type,book:books[selectedBook][3],bookIndex:selectedBook,chapter:selectedChapter,verses:[...nums],reference:ref,text,createdAt:now,updatedAt:now});persistVerseShelf();renderVerseShelf();toast(type==='bookmark'?'책갈피를 저장했습니다.':type==='highlight'?'밑줄을 저장했습니다.':'메모를 저장했습니다.')}
function saveSelectedShelf(type){const nums=[...selectSel].sort((a,b)=>a-b);if(!nums.length){toast('먼저 절을 선택해 주세요.');return}let text='';if(type==='note'){text=prompt('이 구절에 남길 메모를 입력하세요.')||'';if(!text)return}addVerseShelf(type,nums,text);clearSelectMode()}
function renderVerseShelf(){const host=$('verseShelfList');if(!host)return;const q=($('verseShelfSearch')?.value||'').trim().toLowerCase(),type=$('verseShelfFilter')?.value||'all';const rows=verseShelf.filter(x=>(type==='all'||x.type===type)&&(!q||[x.reference,x.text,x.book].join(' ').toLowerCase().includes(q)));host.innerHTML=rows.length?rows.map(x=>'<article class="card"><b>'+safe(x.reference)+'</b><span class="small muted"> · '+({bookmark:'책갈피',highlight:'밑줄',note:'메모'}[x.type]||'기록')+'</span><p class="small">'+safe(x.text||'')+'</p><div class="row"><button type="button" class="alt" onclick="openReading('+x.bookIndex+','+x.chapter+')">본문 열기</button><button type="button" class="alt" onclick="deleteShelfRecord(&quot;'+safe(x.id)+'&quot;)">삭제</button></div></article>').join(''):'<p class="small muted">검색 결과가 없습니다. 구절을 선택해 책갈피·밑줄·메모를 남겨 보세요.</p>'}
function deleteShelfRecord(id){verseShelf=verseShelf.filter(x=>x.id!==id);persistVerseShelf();renderVerseShelf()}
function clearSelectMode(){selectSel.clear();selectMode=false;if($('selectBar'))$('selectBar').classList.add('hidden');if($('selectHint'))$('selectHint').classList.add('hidden');document.body.classList.remove('verse-select-mode');if($('selectModeBtn'))$('selectModeBtn').classList.remove('on');renderChapter()}
function toggleSelectMode(force){
  selectMode=typeof force==='boolean'?force:!selectMode;selectSel.clear();
  copySel.clear();
  document.body.classList.toggle('verse-select-mode',selectMode);
  $('selectModeBtn')?.classList.toggle('on',selectMode);
  $('selectBar')?.classList.toggle('hidden',!selectMode);
  $('selectHint')?.classList.toggle('hidden',!selectMode);
  updateSelectBar();renderChapter();
}
function toggleSelectVerse(n){if(selectSel.has(n))selectSel.delete(n);else selectSel.add(n);updateSelectBar();renderChapter()}
function updateSelectBar(){if($('selectCount'))$('selectCount').textContent=selectSel.size+'절 선택';}
function archivePlan(planId){const p=savedPlans.find(x=>x.id===planId);if(!p)return;const pr=planProgress(p);if(pr.total&&pr.done>=pr.total){if(!completedPlans.some(x=>x.id===p.id)){completedPlans.push({...p,completedAt:new Date().toISOString()});persistCompletedPlans()}savedPlans=savedPlans.filter(x=>x.id!==p.id);persistPlans();dashboard();renderCompletedPlans()}}
async function deleteCompletedPlan(id){if(!(await appConfirm('완료 기록을 영구 삭제할까요?','완료 기록 삭제')))return;completedPlans=completedPlans.filter(x=>x.id!==id);persistCompletedPlans();renderCompletedPlans()}
function renderCompletedPlans(){const el=$('completedPlansList');if(!el)return;el.innerHTML=completedPlans.length?completedPlans.slice().reverse().map(p=>{const pr=planProgress({...p,id:p.id});return '<article class="card"><b>'+safe(p.name)+'</b><div class="small muted">완료 '+new Date(p.completedAt).toLocaleDateString('ko-KR')+' · '+(p.start||'')+' · '+pr.done+'/'+pr.total+' ('+pr.pct+'%)</div><div class="row"><button class="alt" onclick="deleteCompletedPlan(&quot;'+safe(p.id)+'&quot;)">기록 삭제</button></div></article>'}).join(''):'<p class="small muted">완료한 통독 계획이 여기에 보관됩니다.</p>'}
function toggleVerse(v){const key=verseKey(selectedBook,selectedChapter);if(activeReadPlanId)togglePlanVerse(activeReadPlanId,key,v);else{const arr=verseRead[key]||[];verseRead[key]=arr.includes(v)?arr.filter(x=>x!==v):[...arr,v].sort((a,b)=>a-b);if(currentVerses.length&&verseRead[key].length===currentVerses.length)chapterRead[key]=true;else if(verseRead[key].length<currentVerses.length)chapterRead[key]=false;saveVerseData()}renderChapter()}

let verseNoteTrigger=null, verseNotePreviousOverflow='', verseNoteText='';
function openVerseNote(verseNo,trigger){
  const nums=Array.isArray(verseNo)?verseNo:[verseNo];
  const verses=currentVerses.filter(item=>nums.includes(item.n));
  if(!verses.length){toast('먼저 성경 본문을 불러와 주세요.');return}
  const modal=$('verseNoteModal'),input=$('verseNoteInput');
  verseNoteTrigger=trigger||null;
  $('verseNoteRef').textContent=verseRefLabel(selectedBook,selectedChapter,verses.map(v=>v.n));
  $('verseNoteText').textContent=verses.map(v=>v.n+'. '+stripFootnotes(v.text)).join('\n');
  input.value='';updateVerseNoteCount();
  verseNotePreviousOverflow=document.body.style.overflow;
  document.body.style.overflow='hidden';
  modal.classList.remove('hidden');modal.setAttribute('aria-hidden','false');
  modal._keyHandler=event=>{if(event.key==='Escape'){event.preventDefault();closeVerseNote()}else if(event.key==='Enter'&&(event.ctrlKey||event.metaKey)){event.preventDefault();saveVerseNote()}};
  document.addEventListener('keydown',modal._keyHandler);input.focus();
}
function openSelectedVerseNote(){const nums=[...selectSel].sort((a,b)=>a-b);if(!nums.length){toast('구절을 먼저 선택해 주세요.');return}if(noteVerseTarget==='today'){const chosen=currentVerses.filter(v=>nums.includes(v.n));const ref=verseRefLabel(selectedBook,selectedChapter,nums);const body=chosen.map(v=>v.n+'. '+stripFootnotes(v.text)).join('\n');$('verse').value=ref;noteVerseText=body;if($('noteVersePreview'))$('noteVersePreview').textContent=ref+'\n'+body;noteVerseTarget='';clearSelectMode();view('notes');toast('오늘의 묵상에 성경 구절과 본문을 연결했습니다.');return}noteVerseTarget='verse';openVerseNote(nums);}
function openSelectedVerseCard(){const nums=[...selectSel].sort((a,b)=>a-b);if(!nums.length){toast('구절을 먼저 선택해 주세요.');return}copySel.clear();nums.forEach(n=>copySel.add(n));openCard({type:'verse'});}
function chooseVerseForNote(){noteVerseTarget='today';view('read');}
let noteVerseTarget='', noteVerseText='';
function chooseVerseForVerseMeditation(){noteVerseTarget='verse';view('read');}
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
  if(!text){toast('마음에 남은 한 줄을 입력해 주세요.');$('verseNoteInput').focus();return}
  const ref=$('verseNoteRef').textContent;
  const body=($('verseNoteText')&&$('verseNoteText').textContent||'').replace(/^[“"]|[”"]$/g,'').trim();
  addNote({verse:ref, verseText:body, reflection:text, kind:'verse'});
  closeVerseNote();
  if(noteVerseTarget==='today'){ $('verse').value=ref; noteVerseText=body; if($('noteVersePreview'))$('noteVersePreview').textContent=ref+'\n'+body; noteVerseTarget=''; }
  else if(noteVerseTarget==='verse'){ noteVerseTarget=''; }
  clearSelectMode();
  try{ renderVerseMeditations(); renderNotes(); }catch(e){}
  toast('구절 묵상을 저장했습니다.');
}
function updateMarkButtons(){
  const key=verseKey(selectedBook,selectedChapter);
  const done=activeReadPlanId?planChapterDone(activeReadPlanId,key):!!chapterRead[key];
  const label=done?'완료 취소':'이 장 완료';
  const short=done?'취소':'완료';
  if($('btnMarkCh')) $('btnMarkCh').textContent=label;
  if($('btnMarkChDock')) $('btnMarkChDock').textContent=short;
}

let focusMode=false;
function toggleFocusMode(force){
  focusMode=typeof force==='boolean'?force:!focusMode;
  document.body.classList.toggle('focus-read', focusMode);
  const read=$('read');
  if(read) read.classList.toggle('is-focus', focusMode);
  const btn=$('focusModeBtn'), btn2=$('focusModeBtnDock');
  if(btn) btn.textContent=focusMode?'선택 보이기':'본문 집중';
  if(btn2) btn2.textContent=focusMode?'전체':'집중';
  if(focusMode){
    const host=$('bibleText');
    if(host&&host.scrollIntoView){ try{ host.scrollIntoView({block:'start'}); }catch(e){} }
  }
}
function nudgeFont(dir){
  const sel=$('fontSize'); if(!sel) return;
  const opts=[...sel.options].map(o=>+o.value);
  let i=opts.indexOf(+sel.value);
  if(i<0) i=opts.indexOf(18);
  i=Math.max(0, Math.min(opts.length-1, i+dir));
  sel.value=String(opts[i]);
  applyTextStyle();
  if(typeof toast==='function') toast('글자 '+opts[i]+'px');
}
function cycleLineHeight(){
  const sel=$('lineHeight'); if(!sel) return;
  const opts=[...sel.options].map(o=>o.value);
  let i=opts.indexOf(sel.value);
  i=(i+1)%opts.length;
  sel.value=opts[i];
  applyTextStyle();
  if(typeof toast==='function') toast('줄 간격: '+sel.selectedOptions[0].textContent);
}
function afterChapterMarked(done){
  const bar=$('chapterCompleteBar');
  if(!bar) return;
  if(!done){
    bar.classList.add('hidden');
    bar.hidden=true;
    bar.innerHTML='';
    return;
  }
  const seq=getActiveReadSeq&&getActiveReadSeq();
  let nextLabel='', nextBook=null, nextCh=null;
  if(seq&&seq.length){
    const idx=seq.findIndex(it=>+it.book===+selectedBook&&+it.chapter===+selectedChapter);
    if(idx>=0&&idx<seq.length-1){
      const n=seq[idx+1];
      nextLabel=chLabel(n.book,n.chapter);
      nextBook=+n.book; nextCh=+n.chapter;
    }
  } else {
    const max=books[selectedBook]?books[selectedBook][2]:0;
    if(selectedChapter<max){
      nextCh=selectedChapter+1;
      nextBook=selectedBook;
      nextLabel=chLabel(selectedBook, nextCh);
    }
  }
  const msg='이 '+unit(selectedBook)+'을 완료했습니다.';
  if(typeof toast==='function') toast(msg+(nextLabel?' 다음: '+nextLabel:''));
  bar.hidden=false;
  bar.classList.remove('hidden');
  bar.innerHTML=
    '<div class="ccb-msg"><b>장 완료</b> · '+safe(chLabel(selectedBook,selectedChapter))+'</div>'+
    '<div class="ccb-actions">'+
      (nextLabel
        ? '<button type="button" class="ccb-primary" data-b="'+nextBook+'" data-c="'+nextCh+'" onclick="selectedBook=+this.dataset.b;refreshReadBookSelect(true);openChapterDetail(+this.dataset.c)">다음 장 · '+safe(nextLabel)+'</button>'
        : '')+
      '<button type="button" class="alt" onclick="view(\'notes\')">구절 묵상</button>'+
      '<button type="button" class="alt" onclick="exitReading(\'home\')">오늘의 통독</button>'+
      '<button type="button" class="alt" onclick="hideChapterCompleteBar()">닫기</button>'+
    '</div>';
}
function hideChapterCompleteBar(){
  const bar=$('chapterCompleteBar');
  if(!bar) return;
  bar.classList.add('hidden');
  bar.hidden=true;
  bar.innerHTML='';
}

function markChapter(){
  const key=verseKey(selectedBook,selectedChapter);
  if(activeReadPlanId){
    const done=!planChapterDone(activeReadPlanId,key);
    setPlanChapterDone(activeReadPlanId,key,done,done?currentVerses.map(v=>v.n):[]);if(done)setTimeout(()=>archivePlan(activeReadPlanId),0);
    rememberLastRead(selectedBook,selectedChapter,activeReadPlanId);
    // 누적·배지용 전역 장 기록도 함께 갱신
    if(done){ chapterRead[key]=true; if(currentVerses.length) verseRead[key]=currentVerses.map(v=>v.n); }
  } else {
    chapterRead[key]=!chapterRead[key];
    if(chapterRead[key]&&currentVerses.length) verseRead[key]=currentVerses.map(v=>v.n);
    rememberLastRead(selectedBook,selectedChapter);
  }
  saveVerseData();
  renderChapter();
  renderReadPlanPreview();
  updateMarkButtons();
  if($("homePlanList")) renderHomePlans();
  try{ checkBadgeAwards(); if($("badgeGrid")) renderBadges(); }catch(e){}
  try{
    const key=verseKey(selectedBook,selectedChapter);
    const nowDone=activeReadPlanId?planChapterDone(activeReadPlanId,key):!!chapterRead[key];
    afterChapterMarked(nowDone);
    if(activeReadPlanId){ const p=savedPlans.find(x=>x.id===activeReadPlanId); if(p&&planPaceMode(p)==='flexible'){ /* backlog checked on dashboard */ } }
  }catch(e){}
}

async function clearCurrentChapter(){let key=verseKey(selectedBook,selectedChapter);if(!(await appConfirm(chLabel(selectedBook,selectedChapter)+'의 읽음 기록을 지울까요?','읽음 기록 삭제')))return;if(activeReadPlanId)setPlanChapterDone(activeReadPlanId,key,false,[]);else{delete verseRead[key];delete chapterRead[key];saveVerseData()}renderChapter()}
function totalChapters(){return planSeq.length}
function flatChapter(index){if(index<0)index=0;if(index>=planSeq.length)index=planSeq.length-1;return planSeq[index]}
function dailyRange(){let elapsed=Math.max(1,Math.floor((Date.now()-new Date(start+'T00:00:00'))/86400000)+1),day=Math.min(days,elapsed),total=totalChapters(),{a,z}=chapterRangeForDay(day,total,days);return{day,a,z}}
function openReading(bi, ch, planId){
  if(planId){ setActivePlan(planId); activeReadPlanId=planId; }
  view('read',planId||'');
  refreshReadBookSelect(false);
  selectedBook=+bi;
  refreshReadBookSelect(true);
  refreshReadChapterSelect(+ch);
  rememberLastRead(selectedBook,selectedChapter);
  loadChapter(false);
  try{ renderReadPlanPreview(); }catch(e){}
}
function startItemsForPlan(p){
  const backlog=backlogForPlan(p).map(it=>({...it,done:false,planName:p.name||'',period:0}));
  const today=todayItemsForPlan(p);
  const mode=p.readOrder||'backlogFirst';
  if(mode==='todayFirst')return [...today,...backlog.filter(b=>!today.some(t=>t.key===b.key))];
  if(mode==='mix'){
    const old=backlog.filter(b=>!today.some(t=>t.key===b.key)),out=[];
    for(let i=0;i<Math.max(old.length,today.length);i++){if(old[i])out.push(old[i]);if(today[i])out.push(today[i]);}
    return out;
  }
  return [...backlog,...today.filter(t=>!backlog.some(b=>b.key===t.key))];
}
function renderTodayList(){
  const el=$('todayList');
  if(!el) return;
  if(!savedPlans.length){
    el.innerHTML='<p class="muted small">저장된 통독 계획이 없습니다. 아래에서 「계획 작성·편집」으로 이름·범위·시작일·기간을 설정한 뒤 저장해 주세요.</p>';
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
        const bg=it.done?'var(--ok-bg)':'var(--card)';
        const border=it.done?'var(--ok-border)':'var(--line)';
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
    el.innerHTML=
      '<div class="card home-plan-empty">'+
        '<p class="muted" style="margin:0 0 6px">진행 중인 통독 계획이 없습니다.</p>'+
        '<p class="small muted" style="margin:0 0 12px">통독 계획 만들기로 범위·기간을 정해 보세요. (최대 4개)</p>'+
        '<button type="button" onclick="view(\'plan\')">통독 계획 만들기</button>'+
      '</div>';
    return;
  }
  el.innerHTML=savedPlans.map((p,idx)=>{
    const pr=planProgress(p);
    const otnt=planOtNtProgress(p);
    const periodText=(p.start||'')+(pr.endStr?' ~ '+pr.endStr:'')+' · '+p.days+'일'+(planPaceMode(p)==='flexible'?' · 여유 모드: 기본 종료 '+(pr.baseEndStr||'미정')+' → 예상 '+(pr.endStr||'미정')+(pr.extensionDays?' (+'+pr.extensionDays+'일 지연)':' (일정 정상)'):'');
    const active=getActivePlan()&&getActivePlan().id===p.id;
    return '<article class="card home-plan-card'+(active?' is-active':'')+'">'+
      '<div class="home-plan-head">'+
        '<div>'+
          '<div class="eyebrow">READING PLAN</div>'+
          '<h2 class="home-plan-title">'+safe(p.name)+'</h2>'+
          '<div class="small muted">기한 '+safe(periodText)+'</div>'+
          '<div class="small" style="margin-top:4px">상태 · <b>'+safe(pr.status)+'</b></div>'+
        '</div>'+
        '<div class="home-plan-pct">'+
          '<div class="metric">'+pr.pct+'%</div>'+
          '<div class="small muted">'+pr.done+'/'+pr.total+'</div>'+
        '</div>'+
      '</div>'+
      '<div class="progress" style="margin-top:12px" role="progressbar" aria-valuenow="'+pr.pct+'" aria-valuemin="0" aria-valuemax="100" aria-label="'+safe(p.name)+' 진행률 '+pr.pct+'%"><span style="width:'+pr.pct+'%"></span></div>'+
      '<div class="small muted" style="margin-top:8px">구약 '+otnt.otD+'/'+otnt.otT+' ('+otnt.otP+'%) · 신약 '+otnt.ntD+'/'+otnt.ntT+' ('+otnt.ntP+'%)</div>'+
      catchUpHtml(p,pr)+
      '<div class="row home-plan-actions">'+
        '<button type="button" onclick="openPlanReading(\''+p.id+'\',\'today\')" aria-label="'+safe(p.name)+' 성경 읽기">성경 읽기</button>'+
        '<button type="button" class="alt" onclick="completePlanToday(\''+p.id+'\')">오늘 분량 완료</button>'+
        '<button type="button" class="alt" onclick="openCard({type:\'progress\',planId:\''+p.id+'\'})">진도 카드</button>'+
        '<button type="button" class="alt home-plan-delete" onclick="deleteSavedPlan('+idx+')" aria-label="'+safe(p.name)+' 계획 삭제">삭제</button>'+
      '</div>'+
    '</article>';
  }).join('');
}


function renderHomeTodayCta(){
  const el=$('homeTodayCta'); if(!el) return;
  if(!savedPlans.length){
    el.innerHTML=
      '<div class="row home-cta-row">'+
        '<div class="home-cta-copy">'+
          '<div class="home-cta-label">오늘 시작할 통독</div>'+
          '<p class="small muted" style="margin:6px 0 0">아직 저장된 계획이 없습니다. 범위와 기간을 정해 통독을 시작해 보세요.</p>'+
        '</div>'+
        '<div class="row" style="gap:8px;flex-wrap:wrap"><button type="button" class="alt" onclick="view(\'notes\')">오늘의 묵상 작성</button><button type="button" class="home-cta-btn" onclick="view(\'plan\')" aria-label="통독 계획 만들기">통독 계획 만들기</button></div>'+
      '</div>';
    return;
  }
  let pick=null, items=[];
  const active=getActivePlan&&getActivePlan();
  const order=active?[active,...savedPlans.filter(p=>p.id!==active.id)]:savedPlans.slice();
  for(const p of order){
    const its=todayItemsForPlan(p).filter(x=>!x.done);
    if(its.length){ pick=p; items=its; break; }
  }
  if(!pick){
    pick=active||savedPlans[0];
    items=todayItemsForPlan(pick);
    const allDone=items.length && items.every(x=>x.done);
    el.innerHTML=
      '<div class="row home-cta-row">'+
        '<div class="home-cta-copy">'+
          '<div class="home-cta-label">오늘의 통독</div>'+
          '<p class="small" style="margin:6px 0 0"><b>'+safe(pick.name)+'</b>'+
          (allDone?' <span class="muted">· 오늘 분량을 모두 읽었습니다</span>':' <span class="muted">· 오늘 배정 없음</span>')+
          '</p>'+
        '</div>'+
        '<div class="row" style="gap:8px;flex-wrap:wrap"><button type="button" class="alt" onclick="view(\'notes\')">오늘의 묵상 작성</button><button type="button" class="home-cta-btn" onclick="openPlanReading(\''+safe(pick.id)+'\',\'today\')" aria-label="성경 읽기">성경 읽기</button></div>'+
      '</div>';
    return;
  }
  const first=items[0];
  el.innerHTML=
    '<div class="row home-cta-row">'+
      '<div class="home-cta-copy">'+
        '<div class="home-cta-label">오늘 할 일</div>'+
        '<p class="small muted" style="margin:4px 0 0">오늘의 통독을 마친 뒤 「오늘의 묵상 작성」에서 성경 구절과 묵상, 실천 다짐을 기록해 보세요.</p>'+
        '<p class="small" style="margin:6px 0 0"><b>'+safe(first.label)+'</b>'+
        ' <span class="muted">· '+safe(pick.name)+
        (items.length>1?' · 외 '+(items.length-1)+'개':'')+
        '</span></p>'+
      '</div>'+
      '<div class="row" style="gap:8px;flex-wrap:wrap"><button type="button" class="alt" onclick="view(\'notes\')">오늘의 묵상 작성</button><button type="button" class="home-cta-btn" data-plan-id="'+safe(pick.id)+'" onclick="openPlanReading(this.dataset.planId,\'today\')" aria-label="지금 읽기">지금 읽기</button></div>'+
    '</div>';
}


function dashboard(){
  const t=$('today');
  if(t) t.textContent=new Date().toLocaleDateString('ko-KR',{year:'numeric',month:'long',day:'numeric',weekday:'long'});
  try{ renderHomeTodayCta(); }catch(e){}
  const picker=$('homeActivePlan');if(picker){picker.innerHTML=savedPlans.map(p=>'<option value="'+safe(p.id)+'">'+safe(p.name)+'</option>').join('');picker.value=(getActivePlan()?.id||'');picker.disabled=!savedPlans.length}
  const resume=$('homeResumeRead');if(resume)resume.disabled=!getActivePlan()||!lastReadByPlan[getActivePlan().id];
  const mass=$('homeMassSummary');if(mass){mass.innerHTML='<div class="row" style="justify-content:space-between;gap:10px"><div><b>오늘의 매일미사</b><p class="small muted" style="margin:4px 0">온라인에서 매일미사 본문을 확인합니다. 성경 통독 계획과 별도로 제공됩니다.</p></div><button type="button" class="alt" onclick="view(\'missa\')">매일미사 열기</button></div><p class="small muted" id="homeMassStatus">'+(missaLoaded?'매일미사 정보를 불러왔습니다.':'열기를 누르면 온라인에서 불러옵니다.')+'</p>'}
  renderHomePlans();
  // 와이어: 계획 0개면 ②·목록 안내는 숨기고 Primary CTA만
  const has=!!(savedPlans&&savedPlans.length);
  const sc=$('homePlanShortcut'); if(sc) sc.classList.toggle('hidden', !has);
  const hi=$('homeHint'); if(hi) hi.classList.toggle('hidden', !has);
  try{ renderVerseMeditations(); }catch(e){}
  try{renderCompletedPlans()}catch(e){}
}
function openPlanReading(planId, mode){
  setActivePlan(planId);
  activeReadPlanId=planId;
  const p=savedPlans.find(x=>x.id===planId);
  view('read',planId);
  refreshReadBookSelect(false);
  if(!p){ renderReadPlanPreview(); return; }
  let bi=null, ch=null;
  if(mode==='today'){
    const items=startItemsForPlan(p);
    if(items.length){ bi=items[0].book; ch=items[0].chapter; }
    else {
      const lr=lastReadByPlan[planId];
      if(lr){ bi=lr.book; ch=lr.chapter; }
    }
  } else {
    const lr=lastReadByPlan[planId];
    if(lr){ bi=lr.book; ch=lr.chapter; }
    else {
      const items=todayItemsForPlan(p);
      if(items.length){ bi=items[0].book; ch=items[0].chapter; }
      else {
        const seq=buildSeqForPlan(p);
        if(seq.length){ bi=seq[0].book; ch=seq[0].chapter; }
      }
    }
  }
  if(bi==null){ const scope=booksInReadScope(); bi=scope[0]??0; ch=chaptersInReadScope(bi)[0]||1; }
  selectedBook=+bi;
  refreshReadBookSelect(true);
  refreshReadChapterSelect(+ch);
  rememberLastRead(selectedBook,selectedChapter);
  loadChapter(false);
  renderReadPlanPreview();
}
function resumeLastRead(){
  const p=getActivePlan();
  if(!p){ view('read'); return; }
  openPlanReading(p.id,'last');
}
function openTodayPortion(){
  const p=getActivePlan();
  if(!p){ appAlert('진행 중인 통독 계획이 없습니다.'); return; }
  openPlanReading(p.id,'today');
}
function completePlanToday(planId){
  const p=savedPlans.find(x=>x.id===planId)||getActivePlan();
  if(!p){ appAlert('계획이 없습니다.'); return; }
  const items=todayItemsForPlan(p);
  if(!items.length){ appAlert('오늘 완료할 분량이 없습니다.'); return; }
  for(const it of items){const count=verseTotal[it.key]||(selectedBook===it.book&&selectedChapter===it.chapter?currentVerses.length:0);const verses=Array.from({length:count},(_,i)=>i+1);setPlanChapterDone(p.id,it.key,true,verses);}
  savePlanReadingState();
  dashboard();
  renderReadPlanPreview();
  try{ checkBadgeAwards(); if($('badgeGrid')) renderBadges(); }catch(e){}
  appAlert('「'+p.name+'」 오늘 분량 '+items.length+'개를 완료로 기록했습니다.');
}
function renderReadPlanPreview(){
  const meta=$('readPlanMeta');
  const box=$('readPlanPreview');
  if(!box) return;
  const p=getActivePlan();
  if(!p){
    if(meta) meta.textContent='통독 계획이 없습니다. 오늘의 통독에서 「통독 계획 만들기」로 저장해 주세요.';
    box.innerHTML='';
    return;
  }
  const pr=planProgress(p);
  if(meta) meta.innerHTML='<b style="color:var(--navy)">'+safe(p.name)+'</b> · '+pr.done+'/'+pr.total+' ('+pr.pct+'%) · '+safe(pr.status);

  let html='';

  // 여유 모드 안내 (일정 미리보기 없음)
  if(p.catchUp==='follow'){
    const left=pr.total-pr.done-pr.skipped;
    html+='<div class="notice" style="margin-bottom:10px">남은 <b>'+Math.max(0,left)+'</b>개를 남은 기간에 자동으로 나눕니다. 오늘 분량은 하루 동안 고정됩니다.</div>';
  }

  // 오늘 분량 — 예전 일정 미리보기 자리
  const today=todayItemsForPlan(p);
  html+='<div class="read-today-block">';
  html+='<div class="small" style="margin:0 0 6px;font-weight:600;color:var(--navy)">오늘 분량'+(today.length?' · '+today.filter(x=>x.done).length+'/'+today.length:'')+'</div>';
  if(today.length){
    html+='<div class="read-today-list">'+today.map(it=>
      '<button type="button" class="alt'+(it.done?' is-done':'')+'" style="margin:3px 4px 3px 0" onclick="selectBook('+it.book+');selectChapter('+it.chapter+');renderReadPlanPreview()">'+
      safe(it.label)+(it.done?' ✓':'')+'</button>'
    ).join('')+'</div>';
  } else {
    html+='<p class="small muted" style="margin:0">오늘 배정된 분량이 없습니다.</p>';
  }
  html+='</div>';

  // 밀린 분량 — 클릭(접기/펼치기)으로 상세
  if(pr.backlog && pr.backlog.length){
    html+='<details class="read-backlog-details" style="margin-top:12px">';
    html+='<summary class="small" style="cursor:pointer;font-weight:600;color:#9a5b00">밀린 분량 '+pr.backlog.length+'개 · 자세히</summary>';
    html+='<div class="read-backlog-list" style="margin-top:8px">';
    html+=pr.backlog.map(it=>
      '<button type="button" class="alt" style="margin:3px 4px 3px 0;border:1px solid #e0b77a" onclick="selectBook('+it.book+');selectChapter('+it.chapter+');renderReadPlanPreview()">'+
      safe(it.label)+'</button>'
    ).join('');
    html+='</div>';
    html+='<div class="row" style="margin-top:8px;gap:6px;flex-wrap:wrap">';
    html+='<button type="button" class="alt" style="padding:7px 10px;font-size:13px" onclick="readBacklog(\''+p.id+'\')">밀린 분량부터 읽기</button>';
    html+='<button type="button" class="alt" style="padding:7px 10px;font-size:13px" onclick="setCatchUp(\''+p.id+'\',\'follow\')">남은 기간에 다시 배분</button>';
    html+='<button type="button" class="alt" style="padding:7px 10px;font-size:13px" onclick="skipBacklog(\''+p.id+'\')">건너뛰기</button>';
    html+='</div></details>';
  }

  // 책별 진도
  const seq=pr.seq||[];
  const byBook=new Map();
  for(const it of seq){
    if(!byBook.has(it.book)) byBook.set(it.book,{done:0,total:0});
    const o=byBook.get(it.book); o.total++;
    if(planChapterDone(p.id,verseKey(it.book,it.chapter))) o.done++;
  }
  if(byBook.size){
    html+='<details style="margin-top:10px"><summary class="small" style="cursor:pointer;font-weight:600">책별 진도</summary>';
    html+='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:6px;margin-top:8px">';
    for(const [bi,o] of [...byBook.entries()].sort((a,b)=>a[0]-b[0])){
      const done=o.done>=o.total;
      html+='<div style="padding:8px;border-radius:8px;border:1px solid '+(done?'var(--ok-border)':'var(--line)')+';background:'+(done?'var(--ok-bg)':'var(--soft)')+';font-size:12px"><b>'+safe(books[bi][0])+'</b><div class="muted">'+o.done+'/'+o.total+(done?' · 완료':' · 미완료')+'</div></div>';
    }
    html+='</div></details>';
  }

  box.innerHTML=html;
}
function preview(){days=effectiveDays();start=$('start').value||start;let r=dailyRange();if(r.z<=r.a){$('preview').innerHTML='<div class="metric">제 '+r.day+'일차 / '+days+'일 · 총 '+totalChapters()+'개 분량</div><p>오늘 배정된 분량이 없습니다. 이 기간에는 읽기 일정이 없는 날이 포함됩니다.</p><div class="progress"><span style="width:'+Math.min(100,r.day/days*100)+'%"></span></div>';return}let first=flatChapter(r.a),last=flatChapter(Math.min(totalChapters()-1,r.z-1));
let periodHtml='';
if(planType==='chrono'&&first.period){
  const p=periods[first.period-1];
  periodHtml='<div style="margin:10px 0;padding:10px 12px;border-radius:10px;background:'+p.color+'22;border-left:4px solid '+p.color+'"><b style="color:'+(p.id===12?'#334155':p.color)+'">'+p.name+'</b> <span class="small muted">'+p.desc+'</span></div>';
}
$('preview').innerHTML='<div class="metric">제 '+r.day+'일차 / '+days+'일 · 총 '+totalChapters()+'개 분량</div>'+periodHtml+'<p>오늘 권장 분량: '+chLabel(first.book,first.chapter)+(r.z-r.a>1?' – '+chLabel(last.book,last.chapter):'')+' ('+(r.z-r.a)+'개)</p><div class="progress"><span style="width:'+Math.min(100,r.day/days*100)+'%"></span></div>';renderPlanSchedulePreview()}

function renderPlanSchedulePreview(){
  const el=$('planSchedulePreview');if(!el)return;
  const seq=planSeq.slice(),total=seq.length,duration=Math.max(1,days||effectiveDays()),begin=new Date((start||$('start').value||new Date().toISOString().slice(0,10))+'T00:00:00');
  if(!total||isNaN(begin.getTime())){el.textContent='범위와 시작일을 선택하면 일정이 여기에 표시됩니다.';return;}
  let date=new Date(begin),readingDay=1,shown=0,guard=0,html='';
  const today=new Date();today.setHours(0,0,0,0);
  while(date<today&&readingDay<duration&&guard++<4000){if(!planSkipSundays||date.getDay()!==0)readingDay++;date.setDate(date.getDate()+1);}
  while(shown<7&&readingDay<=duration&&guard++<5000){
    if(!planSkipSundays||date.getDay()!==0){
      const {a,z}=chapterRangeForDay(readingDay,total,duration);
      const label=z>a?seq.slice(a,Math.min(z,total)).map(it=>chLabel(it.book,it.chapter)).join(' · '):'배정 분량 없음';
      html+='<div style="display:flex;gap:10px;padding:5px 0;border-bottom:1px solid var(--line)"><b style="min-width:92px">'+date.toLocaleDateString('ko-KR',{month:'numeric',day:'numeric',weekday:'short'})+'</b><span>'+safe(label)+'</span></div>';
      shown++;readingDay++;
    }
    date.setDate(date.getDate()+1);
  }
  el.innerHTML='<div class="muted" style="margin-bottom:6px">총 '+total+'장 · '+duration+' 읽기일'+(planSkipSundays?' · 주일 제외':'')+'</div>'+(html||'<div class="muted">기간이 끝났거나 미리 볼 날짜가 없습니다.</div>');
}
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
  if(lab) lab.textContent='('+savedPlans.length+'/4)';
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
async function editSavedPlan(planId){
  const p=savedPlans.find(x=>x.id===planId);if(!p)return;
  if(editingPlanId===planId)return;
  if(editingPlanId){if(!(await appConfirm('현재 편집 중인 변경 사항을 취소하고 다른 계획을 편집할까요?','편집 취소')))return;cancelPlanEdit()}
  const priorEditingId=editingPlanId;
  const formValues={};
  ['planName','planType','planReadOrder','planPaceMode','start','autoMode','autoDays','autoPerDay','autoEnd','days','customDays'].forEach(id=>{const el=$(id);if(el)formValues[id]=el.value});
  editingPlanSnapshot={formValues,priorEditingId,activePlanId,planType,customPeriodSet:customPeriodSet.slice(),customBookSet:customBookSet.slice(),planSkipSundays,planCalendarDays,days,start};
  editingPlanId=p.id;
  $('planName').value=p.name||'';
  $('planType').value=p.planType||'all';
  if($('planReadOrder'))$('planReadOrder').value=p.readOrder||'backlogFirst';
  if($('planPaceMode'))$('planPaceMode').value=p.paceMode||'fixed';
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
async function deleteSavedPlan(idx){
  if(idx<0||idx>=savedPlans.length) return;
  if(!(await appConfirm('「'+savedPlans[idx].name+'」 계획을 삭제할까요?','계획 삭제'))) return;
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
    appAlert('선택한 범위에 분량이 없습니다. 시대 또는 책을 선택해 주세요.');
    return;
  }
  const existing=editingPlanId?savedPlans.find(x=>x.id===editingPlanId):null;
  if(!existing&&savedPlans.length>=4){
    appAlert('통독 계획은 최대 4개까지 저장할 수 있습니다. 기존 계획을 삭제한 뒤 다시 저장해 주세요.');
    renderSavedPlans();return;
  }
  const enteredName=$('planName')?$('planName').value.trim():'';
  const name=enteredName||planTypeLabel(planType);
  const plan={
    ...(existing||{}),
    id:existing?existing.id:'p'+Date.now(),
    name,planType,days,start,
    skipSundays:!!planSkipSundays,
      paceMode:(($('planPaceMode')||{}).value||'fixed'),
      readOrder:(($('planReadOrder')||{}).value||'backlogFirst'),
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
  appAlert('「'+name+'」 계획을 저장했습니다. ('+savedPlans.length+'/4)');
}
function completeToday(){
  const p=getActivePlan()||savedPlans[0];
  if(!p){ appAlert('저장된 통독 계획이 없습니다.'); return; }
  completePlanToday(p.id);
}

function saveNote(){
  const refl=$('reflection').value.trim(), res=$('resolution').value.trim();
  if(!refl&&!res){ toast('묵상 내용을 입력해 주세요.'); return; }
  addNote({kind:'note',date:$('ndate').value,verse:$('verse').value.trim(),verseText:noteVerseText||'',reflection:refl,resolution:res});
  noteVerseText=''; if($('noteVersePreview'))$('noteVersePreview').textContent='아직 선택한 성경 구절이 없습니다.';
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
let periodChart=null, testamentChart=null, otChart=null, ntChart=null, bookChart=null;


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

  // 구약 / 신약 각각 도넛
  const otDone=d.otD||0, otTot=d.otT||1, ntDone=d.ntD||0, ntTot=d.ntT||1;
  const mkDonut=(canvasId, done, tot, label, color, storeKey)=>{
    const ctx=$(canvasId); if(!ctx) return null;
    const remain=Math.max(0,tot-done);
    const existing = storeKey==='ot'?otChart:ntChart;
    if(existing){
      existing.data.datasets[0].data=[done, remain];
      existing.update('none');
      return existing;
    }
    return new Chart(ctx,{
      type:'doughnut',
      data:{
        labels:[label+' 완료', label+' 남음'],
        datasets:[{ data:[done, remain], backgroundColor:[color, '#e9e4d9'], borderWidth:0 }]
      },
      options:{
        responsive:true, maintainAspectRatio:false, cutout:'68%',
        plugins:{
          legend:{position:'bottom', labels:{boxWidth:12, font:{size:11}}},
          tooltip:{callbacks:{label:(c)=>{
            const v=c.raw||0; const p=tot?Math.round(100*v/tot):0;
            return ' '+c.label+': '+v+'장 ('+p+'%)';
          }}}
        }
      }
    });
  };
  otChart = mkDonut('otChart', otDone, otTot, '구약', '#172b43', 'ot') || otChart;
  ntChart = mkDonut('ntChart', ntDone, ntTot, '신약', '#C9A227', 'nt') || ntChart;
  // also text bars
  if($('testamentProgress')){
    const otP=otTot?Math.round(100*otDone/otTot):0;
    const ntP=ntTot?Math.round(100*ntDone/ntTot):0;
    $('testamentProgress').innerHTML=
      '<div style="margin:8px 0"><div style="display:flex;justify-content:space-between;font-size:13px"><span>구약</span><span class="muted">'+otDone+' / '+otTot+' · '+otP+'%</span></div><div class="progress"><span style="width:'+otP+'%;background:var(--navy)"></span></div></div>'+
      '<div style="margin:8px 0"><div style="display:flex;justify-content:space-between;font-size:13px"><span>신약</span><span class="muted">'+ntDone+' / '+ntTot+' · '+ntP+'%</span></div><div class="progress"><span style="width:'+ntP+'%;background:var(--gold)"></span></div></div>';
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
  const box=$('planItemProgress');
  const label=$('planProgressLabel');
  if(!box) return;
  if(label) label.textContent='진행 중인 계획별 통계와, 지금까지의 전체 누적 통독 통계를 확인합니다.';

  if(!savedPlans.length){
    box.innerHTML=
      '<div class="stats-empty">'+
        '<p class="muted" style="margin:0 0 8px">저장된 통독 계획이 없습니다.</p>'+
        '<p class="small muted" style="margin:0 0 12px">오늘의 통독에서 계획을 만들면 여기에 계획별 진도가 표시됩니다.</p>'+
        '<button type="button" onclick="view(\'home\')">오늘의 통독으로</button>'+
      '</div>';
    return;
  }

  box.innerHTML=savedPlans.map(p=>{
    const pr=planProgress(p);
    const otnt=planOtNtProgress(p);
    const today=todayItemsForPlan(p);
    const todayDone=today.filter(x=>x.done).length;
    const stClass=pr.status.indexOf('완료')>=0?'done':(pr.backlog&&pr.backlog.length?'warn':'');

    const byBook=new Map();
    for(const it of (pr.seq||[])){
      if(!byBook.has(it.book)) byBook.set(it.book,{done:0,total:0});
      const row=byBook.get(it.book);
      row.total++;
      if(planChapterDone(p.id, verseKey(it.book,it.chapter))) row.done++;
    }
    const bookRows=[...byBook.entries()].sort((a,b)=>a[0]-b[0]).map(([bi,row])=>{
      const bp=row.total?Math.round(row.done/row.total*100):0;
      return '<div class="stats-book-row">'+
        '<div class="row" style="justify-content:space-between"><span>'+safe(books[bi][0])+'</span>'+
        '<span class="muted">'+row.done+'/'+row.total+' · '+bp+'%</span></div>'+
        '<div class="progress"><span style="width:'+bp+'%"></span></div></div>';
    }).join('');

    return '<article class="stats-plan-card">'+
      '<div class="row" style="justify-content:space-between;gap:8px;align-items:flex-start">'+
        '<div>'+
          '<b style="color:var(--navy)">'+safe(p.name)+'</b>'+
          '<div class="small muted" style="margin-top:3px">'+
            safe(planTypeLabel(p.planType))+' · '+safe(p.start||'')+' 시작'+
            (pr.endStr?' · '+pr.endStr+'까지':'')+(planPaceMode(p)==='flexible'?' · 여유 모드 · 기본 '+safe(pr.baseEndStr)+' → 예상 '+safe(pr.endStr)+(pr.extensionDays?' (+'+pr.extensionDays+'일)':' (일정 정상)'):'')+
            (p.skipSundays?' · 주일 제외':'')+
          '</div>'+
        '</div>'+
        '<span class="status '+stClass+'">'+safe(pr.status)+'</span>'+
      '</div>'+
      '<div class="row" style="margin-top:10px;justify-content:space-between">'+
        '<span><b>'+pr.done+'</b><span class="muted"> / '+pr.total+'장</span></span>'+
        '<span class="muted">'+pr.pct+'%</span>'+
      '</div>'+
      '<div class="progress" style="margin-top:6px" role="progressbar" aria-valuenow="'+pr.pct+'" aria-valuemin="0" aria-valuemax="100" aria-label="'+safe(p.name)+' '+pr.pct+'%"><span style="width:'+pr.pct+'%"></span></div>'+
      '<div class="stats-otnt-mini">'+
        '<div><span class="small">구약</span> <span class="muted">'+otnt.otD+'/'+otnt.otT+' · '+otnt.otP+'%</span>'+
        '<div class="progress"><span style="width:'+otnt.otP+'%;background:var(--navy)"></span></div></div>'+
        '<div><span class="small">신약</span> <span class="muted">'+otnt.ntD+'/'+otnt.ntT+' · '+otnt.ntP+'%</span>'+
        '<div class="progress"><span style="width:'+otnt.ntP+'%;background:var(--gold)"></span></div></div>'+
      '</div>'+
      '<div class="row small" style="margin-top:10px;gap:12px;flex-wrap:wrap">'+
        '<span>오늘 <b>'+todayDone+'/'+today.length+'</b></span>'+
        '<span>밀림 <b>'+(pr.backlog?pr.backlog.length:0)+'</b></span>'+
        (pr.skipped?'<span>건너뜀 <b>'+pr.skipped+'</b></span>':'')+
      '</div>'+
      '<div class="row" style="margin-top:10px;gap:8px;flex-wrap:wrap">'+
        '<button type="button" data-plan-id="'+safe(p.id)+'" onclick="openPlanReading(this.dataset.planId,\'today\')" aria-label="'+safe(p.name)+' 성경 읽기">성경 읽기</button>'+
      '</div>'+
      (bookRows
        ? '<details style="margin-top:10px"><summary class="small" style="cursor:pointer">책별 진도 · 오늘 목록</summary>'+
          '<div style="margin-top:8px">'+bookRows+
          (today.length?'<div class="small" style="margin-top:10px"><b>오늘</b> · '+today.map(it=>safe(it.label)+(it.done?' ✓':'')).join(' · ')+'</div>':'')+
          '</div></details>'
        : '')+
    '</article>';
  }).join('');
}
function renderWeeklySummary(){
  const el=$('weeklySummary');if(!el)return;
  if(!savedPlans.length){el.textContent='저장된 통독 계획이 없습니다.';return;}
  const selected=store.weeklyPlanId||activePlanId||savedPlans[0].id;
  const p=savedPlans.find(x=>x.id===selected)||savedPlans[0];store.weeklyPlanId=p.id;
  const map=new Map(planSchedule(p).map(row=>[row.date,row.items]));
  const today=new Date();today.setHours(0,0,0,0);const monday=new Date(today);monday.setDate(monday.getDate()-(monday.getDay()+6)%7);const sunday=new Date(monday);sunday.setDate(sunday.getDate()+6);
  let weekTotal=0,weekDone=0;for(let d=new Date(monday);d<=sunday;d.setDate(d.getDate()+1)){const items=map.get(ymdLocal(d))||[];weekTotal+=items.length;weekDone+=items.filter(it=>planChapterDone(p.id,verseKey(it.book,it.chapter))).length;}
  let streak=0;const byDate=new Map(map);for(let i=0;i<366;i++){const d=new Date(today);d.setDate(today.getDate()-i);const items=byDate.get(ymdLocal(d))||[];if(!items.length)continue;if(items.every(it=>planChapterDone(p.id,verseKey(it.book,it.chapter))))streak++;else break;}
  const needs=weekTotal>weekDone;
  el.innerHTML='<label>계획 <select onchange="store.weeklyPlanId=this.value;renderWeeklySummary()">'+savedPlans.map(x=>'<option value="'+safe(x.id)+'" '+(x.id===p.id?'selected':'')+'>'+safe(x.name)+'</option>').join('')+'</select></label><div class="grid" style="margin-top:10px"><div class="card soft-card">이번 주 완료<div class="metric">'+weekDone+' / '+weekTotal+'</div></div><div class="card soft-card">연속 달성 읽기일<div class="metric">'+streak+'일</div></div></div><div class="progress"><span style="width:'+(weekTotal?Math.round(weekDone/weekTotal*100):0)+'%"></span></div><p class="small muted">이번 주 일정 기준으로 계산합니다. '+(planPaceMode(p)==='flexible'?'여유 모드 종료일 조정과는 별도 표기입니다.':'')+'</p>'+(needs&&p.catchUp!=='follow'?'<button type="button" class="alt" data-plan-id="'+safe(p.id)+'" onclick="rebalanceRemainingPlan(this.dataset.planId)">남은 기간에 부족분 자동 재배분</button>':p.catchUp==='follow'?'<div class="small" style="color:var(--ok-text)">남은 분량을 자동 재배분 중입니다.</div>':'');
}
function rebalanceRemainingPlan(planId){const p=savedPlans.find(x=>x.id===planId);if(!p)return;p.catchUp='follow';p.snap=null;persistPlans();dashboard();stats();}
function renderBackupReminder(){
  const el=$('backupReminder');if(!el)return;
  const last=store.lastBackupAt?new Date(store.lastBackupAt):null;
  if(!last||isNaN(last.getTime())){el.innerHTML='JSON 백업을 아직 내보내지 않았습니다. 기기 변경이나 브라우저 데이터 삭제 전에 통독 기록 화면에서 백업해 주세요.';return;}
  const age=Math.max(0,Math.floor((Date.now()-last.getTime())/86400000));
  el.innerHTML='마지막 JSON 백업: '+safe(last.toLocaleDateString('ko-KR'))+' ('+age+'일 전)'+(age>=30?' · <b>한 달 이상 지났습니다. 최신 백업을 권장합니다.</b>':'');
}
function stats(){
  if($('chartDetails')) $('chartDetails').open = window.innerWidth >= 760;
  updateCharts();
  renderPlanItemProgress();

  const total = Math.max(1, books.reduce((n,b)=>n+(Number(b[2])||0),0));
  const doneKeys = Object.keys(chapterRead).filter(k => {
    if(!chapterRead[k]) return false;
    const parts=k.split(':').map(Number), bi=parts[0], ch=parts[1];
    return Number.isInteger(bi)&&Number.isInteger(ch)&&bi>=0&&bi<books.length&&ch>=1&&ch<=books[bi][2];
  });
  const pct = Math.min(100, Math.round(doneKeys.length / total * 100));
  const verseKeys = Object.keys(verseRead);
  const verseCount = verseKeys.reduce((n,k)=>n+(verseRead[k]||[]).length, 0);
  const bookSet = new Set([...verseKeys, ...doneKeys].map(k => k.split(':')[0]));

  if($('sDone')) $('sDone').textContent = doneKeys.length;
  if($('sPct')) $('sPct').textContent = pct + '%';
  if($('sNotes')) $('sNotes').textContent = (typeof notes!=='undefined'&&notes)?notes.length:0;
  if($('sVerses')) $('sVerses').textContent = verseCount;
  if($('sChapters')) $('sChapters').textContent = doneKeys.length;
  if($('sBooks')) $('sBooks').textContent = bookSet.size;

  let cumDone = [];
  try{ cumDone = Object.values(cumulativeReading||{}).filter(r=>r&&r.done); }catch(e){ cumDone=[]; }
  const uniqueKeys = new Set(cumDone.map(r=>r.key));
  if($('sCumPlanCh')) $('sCumPlanCh').textContent = cumDone.length;
  if($('sCumUnique')) $('sCumUnique').textContent = uniqueKeys.size;

  if($('overallRing')) $('overallRing').style.setProperty('--pct', String(pct));
  if($('overallRingCaption')) $('overallRingCaption').textContent = doneKeys.length + ' / ' + total + '장';

  // 구약·신약 텍스트 바 (차트와 병행)
  let otD=0, otT=0, ntD=0, ntT=0;
  for(let bi=0; bi<books.length; bi++){
    const n=books[bi][2];
    if(bi<46) otT+=n; else ntT+=n;
    for(let c=1;c<=n;c++){
      if(chapterRead[verseKey(bi,c)]){
        if(bi<46) otD++; else ntD++;
      }
    }
  }
  const otP = otT?Math.round(100*otD/otT):0;
  const ntP = ntT?Math.round(100*ntD/ntT):0;
  if($('testamentProgress')){
    $('testamentProgress').innerHTML =
      '<div class="stats-bar-block">'+
        '<div class="row" style="justify-content:space-between"><span><b>구약</b></span><span class="muted">'+otD+' / '+otT+'장 · '+otP+'%</span></div>'+
        '<div class="progress" role="progressbar" aria-valuenow="'+otP+'" aria-valuemin="0" aria-valuemax="100" aria-label="구약 '+otP+'%"><span style="width:'+otP+'%;background:var(--navy)"></span></div>'+
      '</div>'+
      '<div class="stats-bar-block">'+
        '<div class="row" style="justify-content:space-between"><span><b>신약</b></span><span class="muted">'+ntD+' / '+ntT+'장 · '+ntP+'%</span></div>'+
        '<div class="progress" role="progressbar" aria-valuenow="'+ntP+'" aria-valuemin="0" aria-valuemax="100" aria-label="신약 '+ntP+'%"><span style="width:'+ntP+'%;background:var(--gold)"></span></div>'+
      '</div>';
  }

  // 책별 장·절 상세
  const chKeys = doneKeys;
  const bset = [...new Set([...verseKeys, ...doneKeys].map(k=>+k.split(':')[0]))]
    .filter(b=>b>=0&&b<books.length).sort((a,b)=>a-b);
  const rows = bset.map(b=>{
    const d = chKeys.filter(k=>k.startsWith(b+':')).length;
    const t = books[b][2];
    const v = verseKeys.filter(k=>k.startsWith(b+':')).reduce((n,k)=>n+(verseRead[k]||[]).length,0);
    let known=0, all=true;
    for(let c=1;c<=t;c++){ const x=verseTotal[verseKey(b,c)]; if(x) known+=x; else all=false; }
    return '<div style="margin:10px 0"><b>'+safe(books[b][0])+'</b> · '+d+' / '+t+unit(b)+' · '+v+(all?' / '+known:'')+'절'+
      '<div class="progress"><span style="width:'+Math.round(d/t*100)+'%"></span></div></div>';
  }).join('');
  const detail = verseKeys.sort((a,b)=>{
    const [ab,ac]=a.split(':').map(Number), [bb,bc]=b.split(':').map(Number);
    return ab-bb||ac-bc;
  }).map(k=>{
    const [b,c]=k.split(':').map(Number);
    return '<div>'+safe(books[b][0])+' '+c+unit(b)+': '+(verseRead[k]||[]).slice().sort((a,b)=>a-b).join(', ')+'절'+(chapterRead[k]?' · 완료':'')+'</div>';
  }).join('');
  if($('verseHistory')){
    $('verseHistory').innerHTML = rows
      ? rows+'<details style="margin-top:8px"><summary>장별 상세 보기</summary>'+detail+'</details>'
      : '아직 장·절 통독 기록이 없습니다.';
  }
}

function pushRecoveryBackup(snapshot){
  let list=[];
  try{ list=JSON.parse(store.recoveryBackupList_v1||'[]'); if(!Array.isArray(list)) list=[]; }catch(e){ list=[]; }
  list.unshift({ at:new Date().toISOString(), data:snapshot });
  list=list.slice(0,3);
  store.recoveryBackupList_v1=JSON.stringify(list);
  // keep legacy single key for old UI
  store.recoveryBackup_v1=JSON.stringify(snapshot);
  return list.length;
}
function listRecoveryBackups(){
  try{ const list=JSON.parse(store.recoveryBackupList_v1||'[]'); return Array.isArray(list)?list:[]; }catch(e){ return []; }
}
function downloadRecoverySnapshot(){
  const list=listRecoveryBackups();
  let data=null;
  if(list.length) data=list[0].data;
  else {
    try{ data=JSON.parse(store.recoveryBackup_v1||'null'); }catch(e){ data=null; }
  }
  if(!data) return false;
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='malssumgil-recovery-'+new Date().toISOString().slice(0,10)+'.json';
  a.click();
  URL.revokeObjectURL(a.href);
  return true;
}

function gatherBackup(){
  return {
    v:2,
    exportedAt:new Date().toISOString(),
    lastBackupAt:store.lastBackupAt||'',
    days, start, planType, customPeriods:customPeriodSet, customBooks:customBookSet,
    savedPlans, completedPlans, verseShelf, activePlanId, lastReadByPlan, planReadingState, cumulativeReading,
    chapterRead, verseRead, verseTotal, notes, badgeAwards, badgeCompleteSnap,
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
  const hasReading=isPlainObj(data.chapterRead)||isPlainObj(data.verseRead)||isPlainObj(data.planReadingState)||isPlainObj(data.cumulativeReading)||Array.isArray(data.verseShelf)||Array.isArray(data.completedPlans);
  const hasPlans=Array.isArray(data.savedPlans);
  const hasNotes=Array.isArray(data.notes);
  const hasMeta=data.days!=null||data.start!=null||data.planType!=null||data.v!=null;
  if(!(hasReading||hasPlans||hasNotes||hasMeta)) return false;
  if(data.savedPlans!=null&&!Array.isArray(data.savedPlans)) return false;
  if(data.notes!=null&&!Array.isArray(data.notes)) return false;
  if(data.verseShelf!=null&&!Array.isArray(data.verseShelf)) return false;
  if(data.completedPlans!=null&&!Array.isArray(data.completedPlans)) return false;
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

function exportData(){
  const data=gatherBackup();
  data.completedPlans=completedPlans; data.verseShelf=verseShelf;
  data.lastBackupAt=new Date().toISOString();
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='malssumgil-backup-'+new Date().toISOString().slice(0,10)+'.json';
  a.click();
  URL.revokeObjectURL(a.href);
  store.lastBackupAt=new Date().toISOString();
  renderBackupReminder();
  if($('syncStatus')) $('syncStatus').textContent='JSON 파일을 다운로드했습니다. 다른 기기에서 JSON 가져오기로 불러오세요.';
}
async function importData(ev){
  const f=ev.target.files&&ev.target.files[0];
  if(!f)return;
  const reader=new FileReader();
  reader.onload=async ()=>{
    try{
      let data;
      try{ data=JSON.parse(reader.result); }catch(e){ throw new Error('JSON 형식이 아닙니다.'); }
      if(!isValidBackup(data)) throw new Error('말씀의 길 백업 파일이 아니거나 내용이 비어 있습니다.');
      const planCount=Array.isArray(data.savedPlans)?data.savedPlans.length:0;
      const noteCount=Array.isArray(data.notes)?data.notes.length:0;
      const exported=data.exportedAt?('\n내보낸 시각: '+String(data.exportedAt).slice(0,19).replace('T',' ')):'';
      if(!(await appConfirm('현재 기기의 진도·노트·계획을 이 백업으로 덮어쓸까요?\n\n· 계획 '+planCount+'개 · 노트 '+noteCount+'개'+exported+'\n\n가져오기 전에 현재 데이터를 자동으로 백업해 둡니다.','백업 가져오기'))){
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
async function applyBackup(data,opts){
  try{ if(!opts||!opts.skipRecovery){ pushRecoveryBackup(gatherBackup()); } }catch(e){}

  opts=opts||{};
  if(!data||typeof data!=='object') throw new Error('invalid');
  if(!isValidBackup(data)) throw new Error('invalid backup shape');
  if(!opts.skipConfirm){
    const planCount=Array.isArray(data.savedPlans)?data.savedPlans.length:0;
    const noteCount=Array.isArray(data.notes)?data.notes.length:0;
    if(!(await appConfirm('현재 기기의 진도·노트·계획을 이 데이터로 덮어쓸까요?\n\n· 계획 '+planCount+'개 · 노트 '+noteCount+'개\n\n적용 전에 현재 데이터를 자동으로 백업해 둡니다.','데이터 적용'))){
      throw new Error('cancelled');
    }
    snapshotCurrentForRecovery();
  }
  if(data.chapterRead) chapterRead=data.chapterRead;
  if(data.verseRead) verseRead=data.verseRead;
  if(data.verseTotal) verseTotal=data.verseTotal;
  if(Array.isArray(data.notes)){ notes=data.notes; normalizeNotes(); }
  if(data.badgeAwards&&typeof data.badgeAwards==="object") badgeAwards=data.badgeAwards;
  if(data.badgeCompleteSnap&&typeof data.badgeCompleteSnap==="object") badgeCompleteSnap=data.badgeCompleteSnap;
  if(data.badgeAwards||data.badgeCompleteSnap){ try{saveBadgeState()}catch(e){} }
  if(data.days) days=+data.days;
  if(data.start) start=data.start;
  if(data.planType) planType=data.planType;
  if(data.customPeriods) customPeriodSet=data.customPeriods;
  if(data.customBooks) customBookSet=data.customBooks;
  if(data.hideNotes!=null) store.hideNotes=data.hideNotes;
  if(typeof data.lastBackupAt==='string'&&data.lastBackupAt)store.lastBackupAt=data.lastBackupAt;
  // v2 백업: 저장된 통독 계획 · 활성 계획 · 계획별 마지막 읽은 위치 · 읽기 설정
  // (v1 백업에는 없으므로, 없을 때는 현재 기기의 값을 그대로 둡니다)
  if(Array.isArray(data.savedPlans)){ savedPlans=data.savedPlans.slice(0,4); persistPlans(); }
  completedPlans=Array.isArray(data.completedPlans)?data.completedPlans:[];persistCompletedPlans();
  verseShelf=Array.isArray(data.verseShelf)?data.verseShelf:[];persistVerseShelf();
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
async function applySyncCode(){
  const code=($('syncCodeIn')&&$('syncCodeIn').value||'').trim();
  if(!code){if($('syncStatus')) $('syncStatus').textContent='코드를 붙여 넣어 주세요.';return;}
  if($('syncStatus')) $('syncStatus').textContent='복원 중… (Web Worker)';
  workerCall('decode', code).then(async data=>{
    if(!isValidBackup(data)) throw new Error('invalid backup shape');
    const planCount=Array.isArray(data.savedPlans)?data.savedPlans.length:0;
    const noteCount=Array.isArray(data.notes)?data.notes.length:0;
    if(!(await appConfirm('현재 기기의 진도·노트·계획을 이 동기화 코드로 덮어쓸까요?\n\n· 계획 '+planCount+'개 · 노트 '+noteCount+'개\n\n복원 전에 현재 데이터를 자동으로 백업해 둡니다.','동기화 복원'))){
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
async function skipBacklog(planId){
  const p=savedPlans.find(x=>x.id===planId); if(!p) return;
  const items=backlogForPlan(p);
  if(!items.length) return;
  if(!(await appConfirm('밀린 '+items.length+'개를 건너뛸까요?\n읽음으로 기록되지는 않으며, 밀린 분량 안내에서만 빠집니다. 언제든 되돌릴 수 있습니다.','밀린 분량'))) return;
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


// ===== 구절 선택 및 복사 =====
const copySel=new Set();
let selectMode=false;const selectSel=new Set();
function toast(msg,ms){
  let el=$('toast');
  if(!el){ el=document.createElement('div'); el.id='toast'; el.className='toast'; document.body.appendChild(el); }
  el.textContent=msg; el.classList.add('show');
  clearTimeout(toast._t); toast._t=setTimeout(()=>el.classList.remove('show'),ms||2200);
}
function selectAllVerses(){
  if(selectSel.size===currentVerses.length) selectSel.clear();
  else currentVerses.forEach(v=>selectSel.add(v.n));
  copySel.clear();selectSel.forEach(n=>copySel.add(n));updateSelectBar();renderChapter();
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
  const chosen=selectMode?selectSel:copySel;return currentVerses.filter(v=>chosen.has(v.n));
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
  copySel.clear();selectSel.forEach(n=>copySel.add(n));
  if(!selectSel.size){ toast('복사할 절을 먼저 선택해 주세요.'); return; }
  const withNums=!$('copyNums')||$('copyNums').checked;
  const text=buildVerseCopyText(withNums);
  const ok=await copyText(text);
  toast(ok?(selectSel.size+'절을 복사했습니다.'):'복사에 실패했습니다. 브라우저 설정을 확인해 주세요.');
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
  const kind=(o.kind==='line'?'verse':(o.kind || (o.resolution ? 'note' : 'verse')));
  const n={
    id:newNoteId(), date:o.date||ymdLocal(new Date()), verse:o.verse||'',
    verseText:o.verseText||'',
    reflection:o.reflection||'', resolution:o.resolution||'',
    kind:kind,
    created:nowIso, updated:nowIso
  };
  notes.unshift(n); persistNotes();
  try{ renderVerseMeditations(); }catch(e){}
  try{renderCompletedPlans()}catch(e){}
  return n;
}
function isVerseMeditation(n){
  if(n&&(n.kind==='line'||n.kind==='verse')) return true; // 기존 line 기록도 구절 묵상으로 표시
  if(n&&n.kind==='note') return false;
  return !n.resolution && String(n.reflection||'').length<=140 && !/\n/.test(n.reflection||'');
}
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
function noteStreak(){
  const days=new Set(notes.map(n=>n.date).filter(Boolean));
  const d=new Date(); d.setHours(0,0,0,0);
  if(!days.has(ymdLocal(d))) d.setDate(d.getDate()-1);
  let count=0;
  while(days.has(ymdLocal(d))){ count++; d.setDate(d.getDate()-1); }
  return count;
}
function renderVerseMeditations(){
  const box=$('verseMeditationList'); if(!box) return;
  const entries=notes.filter(isVerseMeditation).slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))||String(b.created||'').localeCompare(String(a.created||''))).slice(0,8);
  if(!entries.length){
    box.innerHTML='<p class="small muted" style="margin:0">아직 구절 묵상이 없습니다. 성경 읽기에서 구절을 선택하고 「구절 묵상」을 남겨 보세요.</p>';
    return;
  }
  box.innerHTML=entries.map(n=>'<article class="one-line-item" style="padding:10px 0;border-top:1px solid var(--line)">'+
    (n.verse?'<b class="one-line-ref">'+safe(n.verse)+'</b>':'')+
    (n.verseText&&n.verseText!==n.verse?'<div class="small" style="white-space:pre-wrap;margin-top:5px">'+safe(n.verseText)+'</div>':'')+
    '<div class="small muted" style="margin-top:7px">메모</div><div class="one-line-body" style="white-space:pre-wrap">'+safe(n.reflection||'')+'</div>'+
    '<div class="small muted" style="margin-top:5px">'+safe(n.date||'')+'</div></article>').join('');
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
    (n.verseText&&n.verseText!==n.verse?'<div class="notice small" style="white-space:pre-wrap;margin-top:6px"><b>성경 본문</b><div style="margin-top:4px">'+safe(n.verseText)+'</div></div>':'')+
    '<div class="small muted" style="margin-top:7px">'+(isVerseMeditation(n)?'메모 · 구절 묵상':'묵상')+'</div><p style="white-space:pre-wrap;margin:4px 0 6px">'+safe(n.reflection)+'</p>'+
    (n.resolution?'<div class="small" style="white-space:pre-wrap;color:#5b6570"><b>실천 다짐</b><div style="margin-top:3px">'+safe(n.resolution)+'</div></div>':'')+
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
    if(noteFilter==='verse'&&!isVerseMeditation(n)) return false;
    if(noteFilter==='note'&&isVerseMeditation(n)) return false;
    if(!q) return true;
    return [n.verse,n.verseText,n.reflection,n.resolution,n.date].join(' ').toLowerCase().includes(q);
  });
  const byDate=(a,b)=>String(b.date||'').localeCompare(String(a.date||''))||String(b.created||'').localeCompare(String(a.created||''));
  if(sort==='upd') list.sort((a,b)=>String(b.updated||'').localeCompare(String(a.updated||'')));
  else if(sort==='old') list.sort((a,b)=>-byDate(a,b));
  else list.sort(byDate);
  const shelfMatches=noteFilter==='all'?verseShelf.filter(x=>!q||[x.reference,x.text,x.book].join(' ').toLowerCase().includes(q)):[];
  if($('noteCount')) $('noteCount').textContent='('+(list.length+shelfMatches.length)+')';
  if(!notes.length&&!shelfMatches.length){ host.innerHTML='<p class="muted">저장된 기록이 없습니다.</p>'; return; }
  if(!list.length&&!shelfMatches.length){ host.innerHTML='<p class="muted">조건에 맞는 기록이 없습니다.</p>'; return; }
  let html='', lastDay=null;
  for(const n of list){
    if(sort!=='upd'&&n.date!==lastDay){ html+='<div class="noteday">'+safe(fmtDay(n.date))+'</div>'; lastDay=n.date; }
    html+=(noteEditId===n.id)?noteEditHtml(n):noteViewHtml(n);
  }
  if(noteFilter==='all'&&shelfMatches.length){
    html+='<div class="noteday">이전 구절 보관함에서 가져온 기록</div>';
    html+=shelfMatches.map(x=>'<article class="card" style="margin:0 0 8px"><b>'+safe(x.reference)+'</b><span class="small muted"> · '+safe(({bookmark:'책갈피',highlight:'밑줄',note:'메모'}[x.type]||'구절 기록'))+'</span>'+(x.text?'<p style="white-space:pre-wrap;margin:6px 0">'+safe(x.text)+'</p>':'')+'<div class="row"><button type="button" class="alt" onclick="openReading('+Number(x.bookIndex)+','+Number(x.chapter)+')">본문 열기</button><button type="button" class="alt" onclick="deleteShelfRecord(&quot;'+safe(x.id)+'&quot;)">삭제</button></div></article>').join('');
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
  noteEditId=null; persistNotes(); renderNotes(); renderVerseMeditations();
  toast('수정했습니다.');
}
async function deleteNote(id){
  const i=notes.findIndex(x=>x.id===id);
  if(i<0) return;
  const n=notes[i];
  if(!(await appConfirm((n.date||'')+' 묵상을 삭제할까요?','묵상 삭제'))) return;
  notes.splice(i,1);
  persistNotes(); renderNotes(); renderVerseMeditations();
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
      const {a,z}=chapterRangeForDay(idx,total,p.days);
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

document.addEventListener('click',function(e){ const m=$('badgeModal'); if(m&&!m.classList.contains('hidden')&&e.target===m) closeBadgeModal(); });

document.addEventListener('DOMContentLoaded',function(){ try{ maybeShowOnboard(); }catch(e){} });

try{ applyTheme(); }catch(e){}

/* keydown-read-nav */
document.addEventListener('keydown',function(e){
  const read=$('read');
  if(!read||read.classList.contains('hidden')) return;
  if(e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
  if(e.key==='ArrowLeft'){ e.preventDefault(); moveChapter(-1); }
  else if(e.key==='ArrowRight'){ e.preventDefault(); moveChapter(1); }
  else if(e.key==='c'||e.key==='C'){
    if(!e.metaKey&&!e.ctrlKey){ e.preventDefault(); markChapter(); }
  }
});

/* read-scroll-listener */
(function(){
  let t=null;
  window.addEventListener('scroll', function(){
    const read=$('read');
    if(!read||read.classList.contains('hidden')) return;
    if(t) clearTimeout(t);
    t=setTimeout(function(){ try{ saveReadScrollPos(); }catch(e){} }, 200);
  }, {passive:true});
})();
