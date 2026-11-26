/* badges.js 스프라이트(<symbol>/<use>) 구조 검사 — 브라우저 없이 vm으로 실행 */
'use strict';
const fs=require('fs'), vm=require('vm'), assert=require('assert');
const src=fs.readFileSync(__dirname+'/../js/badges.js','utf8');

let injected='';
const doc={
  body:{ insertAdjacentHTML(pos,html){ assert.strictEqual(pos,'afterbegin'); injected+=html; } },
  getElementById(id){ return id==='badgeSprite'&&injected?{}:null; }
};
const ctx={ document:doc, store:{}, jget:()=>({}), isPlainObj:()=>true,
  books:Array.from({length:73},(_,i)=>['책'+i,'',3]) };
vm.createContext(ctx);
vm.runInContext(src+'\n;this.__t={BADGE_ICON_PATHS,BADGE_DEFS,BOOK_BADGE_DEFS,badgeIconHtml};',ctx);
const {BADGE_ICON_PATHS,BADGE_DEFS,BOOK_BADGE_DEFS,badgeIconHtml}=ctx.__t;

// 1) 범위 증표 12종 + 공통 book 아이콘이 모두 있다
for(const d of BADGE_DEFS) assert(BADGE_ICON_PATHS[d.id], '아이콘 없음: '+d.id);
assert(BADGE_ICON_PATHS.book,'book 아이콘 없음');

// 2) 아이콘을 여러 번 만들어도 스프라이트는 한 번만 들어간다
const htmls=[...BADGE_DEFS, ...BOOK_BADGE_DEFS].map(d=>badgeIconHtml(d,true));
badgeIconHtml(BADGE_DEFS[0],false);
assert.strictEqual((injected.match(/<svg id="badgeSprite"/g)||[]).length,1);

// 3) symbol id 중복 없음, 모든 <use>가 존재하는 symbol을 가리킨다
const ids=[...injected.matchAll(/<symbol id="([^"]+)"/g)].map(m=>m[1]);
assert.strictEqual(new Set(ids).size,ids.length,'symbol id 중복');
const refs=[...injected.matchAll(/<use href="#([^"]+)"/g)].map(m=>m[1])
  .concat(htmls.flatMap(h=>[...h.matchAll(/<use href="#([^"]+)"/g)].map(m=>m[1])));
for(const r of refs) assert(ids.includes(r),'끊어진 <use> 참조: '+r);

// 4) 카드 마크업은 가볍고(<use> 하나), 장식용이라 aria-hidden, 책 배지는 공통 #bi-book
assert(htmls.every(h=>h.includes('aria-hidden="true"')&&(h.match(/<use /g)||[]).length===1));
assert(htmls[BADGE_DEFS.length].includes('#bi-book'));
// 5) 획득 색은 인라인 color(currentColor로 전달), 미획득은 비어 있음
assert(badgeIconHtml(BADGE_DEFS[0],true).includes('color:'+BADGE_DEFS[0].accent));
assert(!badgeIconHtml(BADGE_DEFS[0],false).includes('color:'));
console.log('badges sprite tests: OK ('+ids.length+' symbols, '+htmls.length+' icons)');
