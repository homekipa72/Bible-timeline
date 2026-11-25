/* badges.js — 순례의 증표 */
'use strict';
/* ===== 통독 인증 배지 ===== */

const BADGE_SVG={
  all:'<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="29" fill="none" stroke="currentColor" stroke-width="2"/><path d="M20 28h24v16H20z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M24 28v-4c0-4 16-4 16 0v4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M32 22v6M29 18h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  ot:'<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="29" fill="none" stroke="currentColor" stroke-width="2"/><path d="M14 42c8-14 28-14 36 0" fill="none" stroke="currentColor" stroke-width="2"/><path d="M32 18v8M28 22h8" stroke="currentColor" stroke-width="2"/><circle cx="40" cy="20" r="2" fill="currentColor"/></svg>',
  nt:'<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="29" fill="none" stroke="currentColor" stroke-width="2"/><path d="M32 20c6 0 10 5 10 10-2 8-10 14-10 14s-8-6-10-14c0-5 4-10 10-10z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M26 30h12" stroke="currentColor" stroke-width="1.5"/></svg>',
  chrono:'<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="29" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="32" cy="32" r="14" fill="none" stroke="currentColor" stroke-width="2"/><path d="M32 24v8l6 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  pentateuch:'<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="29" fill="none" stroke="currentColor" stroke-width="2"/><rect x="18" y="22" width="12" height="22" rx="1" fill="none" stroke="currentColor" stroke-width="2"/><rect x="34" y="22" width="12" height="22" rx="1" fill="none" stroke="currentColor" stroke-width="2"/><path d="M22 30h4M22 36h4M38 30h4M38 36h4" stroke="currentColor" stroke-width="1.5"/></svg>',
  history:'<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="29" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16 40h32M20 40V28l12-8 12 8v12" fill="none" stroke="currentColor" stroke-width="2"/><path d="M28 40v-8h8v8" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  wisdom:'<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="29" fill="none" stroke="currentColor" stroke-width="2"/><path d="M22 36c0-8 6-14 10-14s10 6 10 14c-4 0-7 2-10 2s-6-2-10-2z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M32 22v4M26 40h12" stroke="currentColor" stroke-width="2"/></svg>',
  prophets:'<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="29" fill="none" stroke="currentColor" stroke-width="2"/><path d="M32 42c0-6 4-8 4-14a4 4 0 10-8 0c0 6 4 8 4 14z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M28 42h8" stroke="currentColor" stroke-width="2"/></svg>',
  gospels:'<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="29" fill="none" stroke="currentColor" stroke-width="2"/><path d="M32 16v32M20 28h24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>',
  acts:'<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="29" fill="none" stroke="currentColor" stroke-width="2"/><path d="M32 18c8 6 12 12 12 20a12 12 0 11-24 0c0-8 4-14 12-20z" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  epistles:'<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="29" fill="none" stroke="currentColor" stroke-width="2"/><rect x="16" y="24" width="32" height="20" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16 28l16 10 16-10" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  revelation:'<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="29" fill="none" stroke="currentColor" stroke-width="2"/><path d="M32 18l2.5 7.5H42l-6 5 2.5 8L32 33l-6.5 5.5 2.5-8-6-5h7.5z" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  book:'<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="29" fill="none" stroke="currentColor" stroke-width="2"/><path d="M20 20h10c4 0 6 2 6 6v18c-2-2-4-3-6-3H20V20zm24 0H34c-4 0-6 2-6 6v18c2-2 4-3 6-3h10V20z" fill="none" stroke="currentColor" stroke-width="2"/></svg>'
};
function badgeIconHtml(def, unlocked){
  const key = def.bookIndex!=null ? 'book' : def.id;
  const svg = BADGE_SVG[key] || BADGE_SVG.book;
  const cls = unlocked ? 'badge-svg on' : 'badge-svg';
  return '<span class="'+cls+'" style="'+(def.accent&&unlocked?'color:'+def.accent:'')+'">'+svg+'</span>';
}

const BADGE_DEFS=[
  {id:'all', name:'전체 통독', icon:'✝', accent:'#8B1E3F',
    sentence:'당신의 말씀은 제 발에 등불, 제 길에 빛입니다', ref:'시편 119,105', books:'all'},
  {id:'ot', name:'구약', icon:'🕯', accent:'#4A5D23',
    sentence:'나는 너를 큰 민족이 되게 하고, 너에게 복을 내리며, 네 이름을 위대하게 하겠다', ref:'창세기 12,2', range:[0,45]},
  {id:'nt', name:'신약', icon:'🕊', accent:'#1E4D7B',
    sentence:'말씀이 사람이 되시어 우리 가운데 사셨다', ref:'요한 1,14', range:[46,72]},
  {id:'chrono', name:'연대기', icon:'🕰', accent:'#C9A227',
    sentence:'과거에 하느님께서는 여러 번 여러 가지 모양으로 조상들에게 말씀하셨지만', ref:'히브리 1,1', chrono:true},
  {id:'pentateuch', name:'오경', icon:'📜', accent:'#6B4F2A',
    sentence:'너 이스라엘아, 들어라! 주 우리 하느님은 한 분이신 주님이시다', ref:'신명 6,4', range:[0,4]},
  {id:'history', name:'역사서', icon:'🏛', accent:'#5C4B3A',
    sentence:'나와 내 집안은 주님을 섬기겠습니다', ref:'여호수아 24,15', range:[5,20]},
  {id:'wisdom', name:'시서·지혜서', icon:'🎶', accent:'#7A5C1E',
    sentence:'주님은 나의 목자시니 아쉬울 것 없네', ref:'시편 23,1', range:[21,27]},
  {id:'prophets', name:'예언서', icon:'🔥', accent:'#B33A1A',
    sentence:'정의롭게 행동하고 신의를 사랑하며 겸손히 네 하느님과 함께 걸어라', ref:'미카 6,8', range:[28,45]},
  {id:'gospels', name:'복음서', icon:'✝', accent:'#172b43',
    sentence:'나를 따라오너라. 내가 너희를 사람 낚는 어부로 만들겠다', ref:'마태 4,19', range:[46,49]},
  {id:'acts', name:'사도행전', icon:'🔥', accent:'#2E5A88',
    sentence:'성령께서 여러분에게 내리시면 여러분은 힘을 받아, 땅끝에 이르기까지 나의 증인이 될 것입니다', ref:'사도 1,8', range:[50,50]},
  {id:'epistles', name:'서간', icon:'✉', accent:'#3D4F6F',
    sentence:'사랑은 기다리며 사랑을 베풀고, 시기하지 않으며 자랑하지 않습니다', ref:'1코린 13,4', range:[51,71]},
  {id:'revelation', name:'묵시록', icon:'⭐', accent:'#5B2C6F',
    sentence:'보라, 내가 모든 것을 새롭게 만든다', ref:'묵시 21,5', range:[72,72]}
];


const BOOK_BADGE_DEFS=(function(){
  const icons=['📖','📜','🕯','✝','🕊','⭐','🔥','✉','🏛','🎶'];
  return books.map((b,i)=>({
    id:'book_'+i,
    name:b[0],
    icon:icons[i%icons.length],
    accent: i<46 ? '#4A5D23' : '#1E4D7B',
    sentence:b[0]+' 전권을 읽으며 말씀을 마음에 새겼다',
    ref:b[0],
    bookIndex:i,
    group:'book'
  }));
})();
function allBadgeDefs(){ return BADGE_DEFS.concat(BOOK_BADGE_DEFS); }
function badgesForTab(tab){
  if(tab==='book') return BOOK_BADGE_DEFS;
  return BADGE_DEFS;
}
let badgeTab='range';
let badgeAwards={};
let badgeCompleteSnap={};
let currentBadgeShare=null;
let badgesStateReady=false;
function ensureBadgeState(){
  if(badgesStateReady) return;
  try{ badgeTab=store.badgeTab||'range'; }catch(e){ badgeTab='range'; }
  try{ badgeAwards=jget('badgeAwards_v1',{},isPlainObj); }catch(e){ badgeAwards={}; }
  try{ badgeCompleteSnap=jget('badgeCompleteSnap_v1',{},isPlainObj); }catch(e){ badgeCompleteSnap={}; }
  badgesStateReady=true;
}


function isChapterDoneForBadge(bi,ch){
  return !!chapterRead[bi+':'+ch];
}
function booksFullyRead(from,to){
  for(let bi=from;bi<=to;bi++){
    const total=books[bi][2];
    for(let c=1;c<=total;c++) if(!isChapterDoneForBadge(bi,c)) return false;
  }
  return true;
}
function chronoFullyRead(){
  if(typeof chronoRanges==='undefined'||!chronoRanges||!chronoRanges.length) return false;
  for(const r of chronoRanges){
    const bi=r[0], from=r[1], to=r[2];
    for(let c=from;c<=to;c++) if(!isChapterDoneForBadge(bi,c)) return false;
  }
  return true;
}
function isBadgeComplete(def){
  if(def.books==='all') return booksFullyRead(0,books.length-1);
  if(def.chrono) return chronoFullyRead();
  if(typeof def.bookIndex==='number') return booksFullyRead(def.bookIndex, def.bookIndex);
  if(def.range) return booksFullyRead(def.range[0],def.range[1]);
  return false;
}
function badgeProgress(def){
  let done=0,total=0;
  const addBook=(bi,from,to)=>{
    const end=to!=null?to:books[bi][2];
    const start=from!=null?from:1;
    for(let c=start;c<=end;c++){ total++; if(isChapterDoneForBadge(bi,c)) done++; }
  };
  if(def.books==='all'){ for(let bi=0;bi<books.length;bi++) addBook(bi); }
  else if(def.chrono && chronoRanges){ for(const r of chronoRanges) addBook(r[0],r[1],r[2]); }
  else if(typeof def.bookIndex==='number'){ addBook(def.bookIndex); }
  else if(def.range){ for(let bi=def.range[0];bi<=def.range[1];bi++) addBook(bi); }
  const pct=total?Math.round(done/total*100):0;
  return {done,total,pct};
}
function saveBadgeState(){ ensureBadgeState();
  store.badgeAwards_v1=JSON.stringify(badgeAwards);
  store.badgeCompleteSnap_v1=JSON.stringify(badgeCompleteSnap);
}
function pilgrimageLabel(count){
  if(!count||count<1) return '';
  if(count===1) return '첫 순례';
  if(count===2) return '두 번째 순례';
  if(count===3) return '세 번째 순례';
  return count+'번째 순례';
}
function awardBadge(def){ ensureBadgeState();
  const prev=badgeAwards[def.id]||{count:0};
  const count=(prev.count||0)+1;
  const now=new Date().toISOString();
  badgeAwards[def.id]={count, lastAt:now, firstAt:prev.firstAt||now};
  saveBadgeState();
  showBadgeModal(def,count,{fresh:true});
}
function checkBadgeAwards(){ ensureBadgeState();
  const newly=[];
  for(const def of allBadgeDefs()){
    const complete=isBadgeComplete(def);
    const was=!!badgeCompleteSnap[def.id];
    if(complete && !was){
      awardBadge(def);
      newly.push(def.id);
    }
    badgeCompleteSnap[def.id]=complete;
  }
  if(newly.length) saveBadgeState();
  return newly;
}
function showBadgeModal(def,count,opts){ ensureBadgeState();
  const m=$('badgeModal'); if(!m) return;
  opts=opts||{};
  currentBadgeShare={def:def, count:count||0};
  if($('badgeModalIcon')){ const el=$('badgeModalIcon'); el.innerHTML=badgeIconHtml(def,true); el.style.color=def.accent||''; }
  if($('badgeModalTitle')) $('badgeModalTitle').textContent=def.name;
  if($('badgeModalSentence')) $('badgeModalSentence').innerHTML='「'+safe(def.sentence)+'」'+(def.ref?'<br><span class="small muted" style="font-style:normal">— '+safe(def.ref)+'</span>':'');
  const prog=badgeProgress(def);
  const pil=pilgrimageLabel(count);
  const parts=[];
  if(opts.fresh) parts.push('증표를 받았습니다');
  if(pil) parts.push(pil);
  parts.push('진행 '+prog.pct+'%');
  if($('badgeModalMeta')) $('badgeModalMeta').textContent=parts.join(' · ');
  if($('badgeModalBar')) $('badgeModalBar').style.width=Math.min(100,prog.pct)+'%';
  const seal=$('badgeModalSeal');
  if(seal){ seal.style.borderColor=def.accent||''; seal.style.boxShadow='0 0 0 6px '+(def.accent||'#C9A227')+'33, 0 8px 28px '+(def.accent||'#C9A227')+'55'; }
  m.classList.remove('hidden');
}
function closeBadgeModal(){ const m=$('badgeModal'); if(m) m.classList.add('hidden'); currentBadgeShare=null; }
async function shareBadge(){
  if(!currentBadgeShare) return;
  const {def,count}=currentBadgeShare;
  const pil=pilgrimageLabel(count);
  const text='말씀의 길 · 순례의 증표\n'+def.name+(pil?' ('+pil+')':'')+'\n「'+def.sentence+'」'+(def.ref?'\n— '+def.ref:'');
  try{
    if(navigator.share){ await navigator.share({title:def.name, text:text}); return; }
  }catch(e){ if(e&&e.name==='AbortError') return; }
  try{
    await navigator.clipboard.writeText(text);
    if(typeof toast==='function') toast('증표 문장을 복사했습니다');
    else alert('증표 문장을 복사했습니다');
  }catch(e){
    prompt('아래 문장을 복사하세요', text);
  }
}
function setBadgeTab(tab){ ensureBadgeState();
  badgeTab=tab==='book'?'book':'range';
  store.badgeTab=badgeTab;
  renderBadges();
}
function renderBadges(){ ensureBadgeState();
  const grid=$('badgeGrid'); if(!grid) return;
  const list=badgesForTab(badgeTab);
  let unlocked=0, total=list.length;
  const near=[];
  // tab UI state
  document.querySelectorAll('[data-badge-tab]').forEach(btn=>{
    const on=btn.getAttribute('data-badge-tab')===(badgeTab==='book'?'book':'range');
    btn.classList.toggle('on', on);
  });
  const html=list.map(def=>{
    const prog=badgeProgress(def);
    const award=badgeAwards[def.id];
    const has=award&&award.count>0;
    if(has) unlocked++;
    const complete=isBadgeComplete(def);
    const isNear=!has && prog.pct>=80 && prog.pct<100;
    if(isNear) near.push({def,prog});
    const countLabel=has?('×'+award.count):'';
    const line=has
      ? (complete?pilgrimageLabel(award.count)+' · 유지':'이전 완주 · 다시 걷는 중')
      : (isNear?'곧 받을 수 있습니다':'아직 걸어보지 않은 길');
    const cls='badge-card '+(has?'unlocked':'locked')+(isNear?' near':'')+(def.bookIndex!=null?' badge-book':'');
    return '<button type="button" class="'+cls+'" data-badge="'+def.id+'" onclick="openBadgeDetail(\''+def.id+'\')" style="'+(has&&def.accent?'border-color:'+def.accent+'88':'')+'">'+
      (has?'<span class="badge-count">'+countLabel+'</span>':'')+
      '<span class="badge-ico" aria-hidden="true">'+(has?badgeIconHtml(def,true):badgeIconHtml(def,false))+'</span>'+
      '<span class="badge-name">'+safe(def.name)+'</span>'+
      '<span class="badge-line">'+line+'</span>'+
      '<span class="badge-mini-bar" aria-hidden="true"><span style="width:'+prog.pct+'%"></span></span>'+
      '<span class="small muted">'+prog.pct+'%</span>'+
      '</button>';
  }).join('');
  grid.innerHTML=html||'<p class="muted small">표시할 증표가 없습니다.</p>';
  if($('badgeSummary')) $('badgeSummary').textContent='획득 '+unlocked+' · 전체 '+total+(badgeTab==='book'?' (권별)':' (범위)');
  const nearBox=$('badgeNear');
  if(nearBox){
    if(near.length){
      nearBox.classList.remove('hidden');
      const show=near.slice(0,5).map(n=>safe(n.def.name)+' '+n.prog.pct+'%').join(' · ');
      nearBox.innerHTML='<b>거의 다 왔습니다</b> · '+show+(near.length>5?' 외 '+(near.length-5)+'개':'');
    } else {
      nearBox.classList.add('hidden');
      nearBox.innerHTML='';
    }
  }
}
function openBadgeDetail(id){ ensureBadgeState();
  const def=allBadgeDefs().find(b=>b.id===id); if(!def) return;
  const award=badgeAwards[id];
  const prog=badgeProgress(def);
  const complete=isBadgeComplete(def);
  if(award&&award.count){
    showBadgeModal(def, award.count, {fresh:false});
    if($('badgeModalMeta')){
      const d=award.lastAt?new Date(award.lastAt).toLocaleDateString('ko-KR'):'';
      const parts=[];
      if(d) parts.push(d+' 기록');
      parts.push(pilgrimageLabel(award.count));
      parts.push('진행 '+prog.pct+'%'+(complete?' · 유지 중':''));
      $('badgeModalMeta').textContent=parts.join(' · ');
    }
  } else {
    showBadgeModal(def, 0, {fresh:false});
    if($('badgeModalMeta')) $('badgeModalMeta').textContent='진행 '+prog.done+' / '+prog.total+' ('+prog.pct+'%) · 아직 증표 없음';
    if($('badgeModalSentence')) $('badgeModalSentence').innerHTML='「'+safe(def.sentence)+'」'+(def.ref?'<br><span class="small muted" style="font-style:normal">— '+safe(def.ref)+'</span>':'');
  }
}

