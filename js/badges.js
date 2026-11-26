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
  plans:'<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="29" fill="none" stroke="currentColor" stroke-width="2"/><path d="M20 40l8-16 8 10 6-14 6 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="32" cy="22" r="3" fill="currentColor"/></svg>',
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
    sentence:'보라, 내가 모든 것을 새롭게 만든다', ref:'묵시 21,5', range:[72,72]},
  {id:'plans', name:'통독 계획 완료', icon:'🏔', accent:'#8B6914',
    sentence:'주님께서 나에게 하신 말씀은 기쁨이 되고 내 마음 즐거움이 되었습니다', ref:'예레 15,16', planComplete:true}
];


const BOOK_CENTRAL_VERSES={
  '창세기': {sentence:'한처음에 하느님께서 하늘과 땅을 창조하셨다', ref:'창세기 1,1'},
  '탈출기': {sentence:'나는 너희를 이집트 땅 종살이하던 집에서 이끌어 낸 주 너희 하느님이다', ref:'탈출 20,2'},
  '레위기': {sentence:'너희는 거룩한 사람이 되어야 한다. 나 주 너희 하느님이 거룩하기 때문이다', ref:'레위 19,2'},
  '민수기': {sentence:'주님께서는 당신 백성을 복 주시며 지켜 주소서', ref:'민수 6,24'},
  '신명기': {sentence:'너 이스라엘아, 들어라! 주 우리 하느님은 한 분이신 주님이시다', ref:'신명 6,4'},
  '여호수아기': {sentence:'나와 내 집안은 주님을 섬기겠습니다', ref:'여호수아 24,15'},
  '판관기': {sentence:'그 무렵에는 이스라엘에 임금이 없어서 저마다 제 눈에 옳은 대로 하였다', ref:'판관 21,25'},
  '룻기': {sentence:'당신의 백성이 저의 백성이 되고 당신의 하느님이 저의 하느님이 되겠습니다', ref:'룻 1,16'},
  '사무엘기 상권': {sentence:'말씀하십시오. 당신 종이 듣고 있습니다', ref:'1사무 3,10'},
  '사무엘기 하권': {sentence:'주님은 나의 반석, 나의 요새, 나를 구해 주시는 분', ref:'2사무 22,2'},
  '열왕기 상권': {sentence:'지혜로운 마음을 주시어 당신의 백성을 통치하게 해 주십시오', ref:'1열왕 3,9'},
  '열왕기 하권': {sentence:'주님께 돌아가 그분의 계명을 지키십시오', ref:'2열왕 23,25'},
  '역대기 상권': {sentence:'주님을 찾아라. 그러면 그분을 만날 것이다', ref:'1역대 16,11'},
  '역대기 하권': {sentence:'내 이름으로 불리는 이 백성이 겸손히 기도하며 나를 찾으면', ref:'2역대 7,14'},
  '에즈라기': {sentence:'우리는 우리 하느님의 도움을 받으며 다시 일어설 것입니다', ref:'에즈라 8,22'},
  '느헤미야기': {sentence:'너희 하느님의 기쁨이 곧 너희의 힘이다', ref:'느헤 8,10'},
  '토빗기': {sentence:'모든 날에 주님을 기억하고 그분을 거스르지 마라', ref:'토빗 4,19'},
  '유딧기': {sentence:'전능하신 주님께서 이스라엘을 보호하신다', ref:'유딧 13,11'},
  '에스테르기': {sentence:'이러한 때를 위하여 당신이 왕후에 이르렀을지 누가 압니까?', ref:'에스테르 4,14'},
  '마카베오기 상권': {sentence:'하느님의 손에 달린 일은 사람 힘으로 막을 수 없다', ref:'1마카 3,19'},
  '마카베오기 하권': {sentence:'율법을 위하여 목숨 바친 이들은 큰 영광을 받았다', ref:'2마카 6,31'},
  '욥기': {sentence:'저는 알고 있습니다. 저의 구원자께서 살아 계시고', ref:'욥 19,25'},
  '시편': {sentence:'주님은 나의 목자시니 아쉬울 것 없네', ref:'시편 23,1'},
  '잠언': {sentence:'주님을 경외하는 것이 지식의 근원이다', ref:'잠언 1,7'},
  '코헬렛': {sentence:'때아닌 때에 모든 것이 다 때가 있다', ref:'코헬렛 3,1'},
  '아가': {sentence:'사랑은 죽음처럼 강하고', ref:'아가 8,6'},
  '지혜서': {sentence:'지혜는 그를 사랑하는 이들에게 스스로를 드러낸다', ref:'지혜 6,12'},
  '집회서': {sentence:'모든 지혜는 주님에게서 온다', ref:'집회 1,1'},
  '이사야서': {sentence:'우리에게 한 아기가 태어났고 우리에게 한 아들이 주어졌습니다', ref:'이사 9,5'},
  '예레미야서': {sentence:'나는 너를 잘 알고 있고 모태에서 너를 거룩히 구별하였다', ref:'예레 1,5'},
  '애가': {sentence:'주님의 자애는 끝없이 이어지고 그분의 자비는 끊이지 않네', ref:'애가 3,22'},
  '바룩서': {sentence:'지혜를 버리는 자는 불행하다', ref:'바룩 3,12'},
  '에제키엘서': {sentence:'새 마음을 너희에게 주고 너희 안에 새 영을 넣겠다', ref:'에제 36,26'},
  '다니엘서': {sentence:'그분께서는 영원한 나라를 세우시어 그 나라는 멸망하지 않을 것이다', ref:'다니 2,44'},
  '호세아서': {sentence:'나는 사랑과 정의와 공정을 세상에 행하는 이다', ref:'호세 2,21'},
  '요엘서': {sentence:'이제라도 단식하며 울고 슬퍼하며 나에게 돌아오너라', ref:'요엘 2,12'},
  '아모스서': {sentence:'정의가 물처럼 흐르고 공정이 마르지 않는 개울처럼 흐르게 하여라', ref:'아모스 5,24'},
  '오바드야서': {sentence:'구원은 주님께 있습니다', ref:'오바 1,21'},
  '요나서': {sentence:'구원은 주님께로부터 옵니다', ref:'요나 2,10'},
  '미카서': {sentence:'사람아, 무엇이 선한 것인지 주님께서 너에게 알려 주셨다', ref:'미카 6,8'},
  '나훔서': {sentence:'주님은 좋으신 분, 재난의 때에 피난처이시다', ref:'나훔 1,7'},
  '하바쿡서': {sentence:'의인은 믿음으로 산다', ref:'하바 2,4'},
  '스바니야서': {sentence:'주 너희 하느님은 너희 가운데 계신다', ref:'스바 3,17'},
  '하까이서': {sentence:'뜻을 단단히 다지고 일을 하여라', ref:'하까 2,4'},
  '즈카르야서': {sentence:'이는 힘이 아니고 능력도 아니다. 나의 영으로 되는 것이다', ref:'즈카 4,6'},
  '말라키서': {sentence:'내 이름을 두려워하는 이들에게는 의로운 태양이 떠올라', ref:'말라 3,20'},
  '마태오 복음서': {sentence:'나를 따라오너라. 내가 너희를 사람 낚는 어부로 만들겠다', ref:'마태 4,19'},
  '마르코 복음서': {sentence:'회개하여라. 하늘 나라가 가까이 왔다', ref:'마르 1,15'},
  '루카 복음서': {sentence:'사람의 아들은 잃은 이를 찾아 구원하러 왔다', ref:'루카 19,10'},
  '요한 복음서': {sentence:'말씀이 사람이 되시어 우리 가운데 사셨다', ref:'요한 1,14'},
  '사도행전': {sentence:'성령께서 여러분에게 내리시면 여러분은 힘을 받아 나의 증인이 될 것입니다', ref:'사도 1,8'},
  '로마 신자들에게 보낸 서간': {sentence:'복음은 믿는 모든 이에게 구원을 주시는 하느님의 힘입니다', ref:'로마 1,16'},
  '코린토 신자들에게 보낸 첫째 서간': {sentence:'사랑은 기다리며 사랑을 베풉니다', ref:'1코린 13,4'},
  '코린토 신자들에게 보낸 둘째 서간': {sentence:'내 은총은 너에게 충분하다', ref:'2코린 12,9'},
  '갈라티아 신자들에게 보낸 서간': {sentence:'그리스도께서 우리를 자유롭게 하시려고 해방시켜 주셨습니다', ref:'갈라 5,1'},
  '에페소 신자들에게 보낸 서간': {sentence:'한 분이신 주님, 한 믿음, 한 세례', ref:'에페 4,5'},
  '필리피 신자들에게 보낸 서간': {sentence:'나에게 능력 주시는 분 안에서 나는 모든 것을 할 수 있습니다', ref:'필리 4,13'},
  '콜로새 신자들에게 보낸 서간': {sentence:'위에 있는 것을 추구하십시오', ref:'콜로 3,1'},
  '테살로니카 신자들에게 보낸 첫째 서간': {sentence:'언제나 기뻐하십시오. 끊임없이 기도하십시오', ref:'1테살 5,16-17'},
  '테살로니카 신자들에게 보낸 둘째 서간': {sentence:'선을 행하다 지쳐 버리지 맙시다', ref:'2테살 3,13'},
  '티모테오에게 보낸 첫째 서간': {sentence:'믿음의 선한 싸움을 싸우십시오', ref:'1티모 6,12'},
  '티모테오에게 보낸 둘째 서간': {sentence:'선한 싸움을 싸우고 달음을 마쳤습니다', ref:'2티모 4,7'},
  '티토에게 보낸 서간': {sentence:'하느님의 은총이 모든 사람에게 구원을 가져다주었습니다', ref:'티토 2,11'},
  '필레몬에게 보낸 서간': {sentence:'믿음으로 이루어지는 친교가 효과가 있게 하십시오', ref:'필레 1,6'},
  '히브리인들에게 보낸 서간': {sentence:'믿음은 바라는 것의 보증이며 보이지 않는 것의 확증입니다', ref:'히브 11,1'},
  '야고보 서간': {sentence:'행동은 없고 믿음만 있다고 누가 말할 수 있겠습니까', ref:'야고 2,18'},
  '베드로의 첫째 서간': {sentence:'여러분의 희망을 설명하라는 요구를 받으면 답할 준비를 해 두십시오', ref:'1베드 3,15'},
  '베드로의 둘째 서간': {sentence:'주님의 날은 도둑처럼 올 것입니다', ref:'2베드 3,10'},
  '요한의 첫째 서간': {sentence:'하느님은 사랑이십니다', ref:'1요한 4,8'},
  '요한의 둘째 서간': {sentence:'진리 안에서 걷는 것보다 더 큰 기쁨은 없습니다', ref:'2요한 1,4'},
  '요한의 셋째 서간': {sentence:'사랑하는 이여, 영혼이 잘되기를 빕니다', ref:'3요한 1,2'},
  '유다 서간': {sentence:'거룩한 믿음 위에 여러분의 삶을 세우십시오', ref:'유다 1,20'},
  '요한 묵시록': {sentence:'보라, 내가 모든 것을 새롭게 만든다', ref:'묵시 21,5'}
};

const BOOK_BADGE_DEFS=(function(){
  const icons=['📖','📜','🕯','✝','🕊','⭐','🔥','✉','🏛','🎶'];
  return books.map((b,i)=>{
    const v=BOOK_CENTRAL_VERSES[b[0]]||{sentence:b[0]+'의 말씀을 마음에 새겼다', ref:b[0]};
    return {
      id:'book_'+i,
      name:b[0],
      icon:icons[i%icons.length],
      accent: i<46 ? '#4A5D23' : '#1E4D7B',
      sentence:v.sentence,
      ref:v.ref,
      bookIndex:i,
      group:'book'
    };
  });
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
  if(def.planComplete){
    if(typeof savedPlans==='undefined'||!savedPlans||!savedPlans.length) return !!(badgeAwards.plans&&badgeAwards.plans.count);
    try{
      return savedPlans.some(p=>{
        if(typeof planProgress!=='function') return false;
        const pr=planProgress(p);
        return pr&&pr.total>0&&pr.done>=pr.total;
      }) || !!(badgeAwards.plans&&badgeAwards.plans.count);
    }catch(e){ return !!(badgeAwards.plans&&badgeAwards.plans.count); }
  }
  if(def.books==='all') return booksFullyRead(0,books.length-1);
  if(def.chrono) return chronoFullyRead();
  if(typeof def.bookIndex==='number') return booksFullyRead(def.bookIndex, def.bookIndex);
  if(def.range) return booksFullyRead(def.range[0],def.range[1]);
  return false;
}
function badgeProgress(def){
  if(def.planComplete){
    let done=0, total=0;
    try{
      if(typeof savedPlans!=='undefined'&&savedPlans&&savedPlans.length&&typeof planProgress==='function'){
        total=savedPlans.length;
        for(const p of savedPlans){
          const pr=planProgress(p);
          if(pr&&pr.total>0&&pr.done>=pr.total) done++;
        }
      }
    }catch(e){}
    const awardCount=(badgeAwards.plans&&badgeAwards.plans.count)||0;
    // 표시: 현재 완료 계획 수 / 보유 계획 수, 누적 수여는 awardCount
    if(!total){ return {done:awardCount, total:Math.max(1,awardCount), pct:awardCount?100:0}; }
    return {done:done, total:total, pct:Math.round(100*done/total)};
  }
  if(def.books==='all'){
    let d=0,t=0;
    for(let bi=0;bi<books.length;bi++){ const n=books[bi][2]; t+=n; for(let c=1;c<=n;c++) if(isChapterDoneForBadge(bi,c)) d++; }
    return {done:d,total:t,pct:t?Math.round(100*d/t):0};
  }
  if(def.chrono){
    if(typeof chronoRanges==='undefined'||!chronoRanges) return {done:0,total:1,pct:0};
    let d=0,t=0;
    for(const r of chronoRanges){ for(let c=r[1];c<=r[2];c++){ t++; if(isChapterDoneForBadge(r[0],c)) d++; } }
    return {done:d,total:t,pct:t?Math.round(100*d/t):0};
  }
  if(typeof def.bookIndex==='number'){
    const bi=def.bookIndex, n=books[bi][2]; let d=0;
    for(let c=1;c<=n;c++) if(isChapterDoneForBadge(bi,c)) d++;
    return {done:d,total:n,pct:n?Math.round(100*d/n):0};
  }
  if(def.range){
    let d=0,t=0;
    for(let bi=def.range[0];bi<=def.range[1];bi++){ const n=books[bi][2]; t+=n; for(let c=1;c<=n;c++) if(isChapterDoneForBadge(bi,c)) d++; }
    return {done:d,total:t,pct:t?Math.round(100*d/t):0};
  }
  return {done:0,total:1,pct:0};
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
function checkBadgeAwards(){
  ensureBadgeState();
  const newly=[];
  // 계획 완료: 계획별로 처음 100%가 될 때 plans 배지 수여 횟수 증가
  try{
    if(typeof savedPlans!=='undefined'&&savedPlans&&typeof planProgress==='function'){
      for(const p of savedPlans){
        const pr=planProgress(p);
        const complete=pr&&pr.total>0&&pr.done>=pr.total;
        const key='planDone_'+p.id;
        const was=!!badgeCompleteSnap[key];
        if(complete&&!was){
          badgeCompleteSnap[key]=true;
          const def=BADGE_DEFS.find(b=>b.id==='plans');
          if(def){ awardBadge(def); newly.push('plans'); }
        } else if(!complete){
          badgeCompleteSnap[key]=false;
        }
      }
    }
  }catch(e){}
  for(const def of allBadgeDefs()){
    if(def.planComplete) continue; // 위에서 처리
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
function buildBadgeShareText(def, count){
  const pil=pilgrimageLabel(count);
  const nl=String.fromCharCode(10);
  let t='말씀의 길 · 순례의 증표'+nl+def.name+(pil?' ('+pil+')':'');
  t+=nl+'「'+def.sentence+'」';
  if(def.ref) t+=nl+'— '+def.ref;
  t+=nl+nl+'#말씀의길 #성경통독';
  return t;
}
/** 증표 카드 이미지 생성 (문장 + 증표 이름) */
function renderBadgeShareCanvas(def, count){
  const W=900, H=1200;
  const cv=document.createElement('canvas');
  cv.width=W; cv.height=H;
  const ctx=cv.getContext('2d');
  // 배경
  const g=ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,'#f7f1e4');
  g.addColorStop(1,'#ebe3d2');
  ctx.fillStyle=g;
  ctx.fillRect(0,0,W,H);
  // 테두리
  ctx.strokeStyle=def.accent||'#C9A227';
  ctx.lineWidth=8;
  ctx.strokeRect(36,36,W-72,H-72);
  ctx.strokeStyle='rgba(23,43,67,0.12)';
  ctx.lineWidth=2;
  ctx.strokeRect(52,52,W-104,H-104);
  // 상단
  ctx.fillStyle='#172b43';
  ctx.font='600 28px Georgia, "Noto Serif KR", serif';
  ctx.textAlign='center';
  ctx.fillText('말씀의 길 · 순례의 증표', W/2, 120);
  // 인장 원
  const cx=W/2, cy=320, R=110;
  ctx.beginPath();
  ctx.arc(cx,cy,R,0,Math.PI*2);
  ctx.fillStyle='#fffdf8';
  ctx.fill();
  ctx.lineWidth=6;
  ctx.strokeStyle=def.accent||'#C9A227';
  ctx.stroke();
  // 아이콘 글자 (이모지/심볼)
  ctx.fillStyle=def.accent||'#172b43';
  ctx.font='72px serif';
  ctx.textBaseline='middle';
  const icon=(def.icon||'✦');
  ctx.fillText(icon, cx, cy);
  ctx.textBaseline='alphabetic';
  // 이름
  ctx.fillStyle='#172b43';
  ctx.font='700 48px Georgia, "Noto Serif KR", serif';
  ctx.fillText(def.name, W/2, 480);
  // 순례 횟수
  const pil=pilgrimageLabel(count);
  if(pil){
    ctx.fillStyle='#6b5b3e';
    ctx.font='500 28px "Noto Sans KR", sans-serif';
    ctx.fillText(pil+(count>1?' · ×'+count:''), W/2, 530);
  }
  // 문장
  const sentence='「'+(def.sentence||'')+'」';
  ctx.fillStyle='#1a1a1a';
  ctx.font='500 34px Georgia, "Noto Serif KR", serif';
  const maxW=W-160;
  const words=sentence.split('');
  let line='', lines=[], y=620;
  for(const ch of words){
    const test=line+ch;
    if(ctx.measureText(test).width>maxW && line){
      lines.push(line); line=ch;
    } else line=test;
  }
  if(line) lines.push(line);
  lines=lines.slice(0,6);
  for(const ln of lines){
    ctx.fillText(ln, W/2, y);
    y+=48;
  }
  if(def.ref){
    y+=12;
    ctx.fillStyle='#6b5b3e';
    ctx.font='400 26px "Noto Sans KR", sans-serif';
    ctx.fillText('— '+def.ref, W/2, y);
  }
  // 하단
  ctx.fillStyle='#8a7a5c';
  ctx.font='400 22px "Noto Sans KR", sans-serif';
  ctx.fillText('가톨릭 성경 통독', W/2, H-80);
  return cv;
}
async function shareBadge(){
  if(!currentBadgeShare) return;
  const {def,count}=currentBadgeShare;
  const text=buildBadgeShareText(def, count);
  let blob=null;
  try{
    const cv=renderBadgeShareCanvas(def, count||1);
    blob=await new Promise(res=>cv.toBlob(res,'image/png'));
  }catch(e){ console.warn('badge image', e); }
  // 이미지 + 문장 공유
  if(blob){
    try{
      const file=new File([blob],'malssumgil-badge-'+(def.id||'share')+'.png',{type:'image/png'});
      if(navigator.canShare && navigator.canShare({files:[file]})){
        await navigator.share({
          files:[file],
          title:def.name+' · 순례의 증표',
          text:text
        });
        return;
      }
    }catch(e){ if(e&&e.name==='AbortError') return; }
    // 파일 공유 불가 시 이미지 저장 + 문장 복사
    try{
      if(typeof saveBlobFile==='function'){
        const r=await saveBlobFile(blob,'malssumgil-badge-'+(def.id||'share')+'.png','말씀의 길 증표');
        if(r==='downloaded'||r==='shared'){
          try{ await navigator.clipboard.writeText(text); }catch(_){}
          if(typeof toast==='function') toast('증표 이미지를 저장하고 문장을 복사했습니다');
          else alert('증표 이미지를 저장했습니다. 문장도 클립보드에 복사했습니다.');
          return;
        }
      }
    }catch(e){}
  }
  // 폴백: 텍스트만
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
      (def.bookIndex!=null&&def.sentence?'<span class="badge-verse small muted">「'+safe(def.sentence.length>28?def.sentence.slice(0,28)+'…':def.sentence)+'」</span>':'')+
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

