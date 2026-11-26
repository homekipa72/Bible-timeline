const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const PLAN_ID = 'pw-plan-completion-resilience';
const PLAN_NAME = 'PW 완료 복구 검사';
const JUDE_BOOK_INDEX = 71; // data.js의 성경 책 목록에서 유다서
const JUDE_CHAPTER_KEY = `${JUDE_BOOK_INDEX}:1`;

function todayLocal() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

async function startWithOneChapterPlan(page) {
  const plan = {
    id: PLAN_ID,
    name: PLAN_NAME,
    planType: 'customBooks',
    customBookSet: [JUDE_BOOK_INDEX],
    customPeriodSet: [],
    start: todayLocal(),
    days: 1,
    skipSundays: false,
    paceMode: 'fixed',
    catchUp: 'fixed',
  };

  // 새 격리 페이지의 저장소에 테스트용 1장 계획을 심습니다.
  await page.addInitScript(({ plan, planId }) => {
    localStorage.clear();
    localStorage.setItem('savedPlans', JSON.stringify([plan]));
    localStorage.setItem('activePlanId', planId);
    localStorage.setItem('planReadingState_v1', JSON.stringify({}));
    localStorage.setItem('cumulativeReading_v1', JSON.stringify({}));
    localStorage.setItem('completedPlans_v1', JSON.stringify([]));
    localStorage.setItem('verseShelf_v1', JSON.stringify([]));
    localStorage.setItem('planReadingMigrated_v1', '1');
  }, { plan, planId: PLAN_ID });

  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await expect.poll(() => page.evaluate(() => {
    const raw = localStorage.getItem('savedPlans');
    return raw ? JSON.parse(raw).some((p) => p.id === 'pw-plan-completion-resilience') : false;
  })).toBe(true);
}

async function storedState(page) {
  return page.evaluate(({ planId }) => {
    const read = (key, fallback) => {
      try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
      catch { return fallback; }
    };
    return {
      plans: read('savedPlans', []),
      archives: read('completedPlans_v1', []),
      planState: read('planReadingState_v1', {})[planId] || null,
    };
  }, { planId: PLAN_ID });
}

test.describe('통독 완료 상태의 빠른 입력 및 새로고침 복원', () => {
  test('완료 입력이 연속으로 들어와도 완료 이력은 한 건만 남는다', async ({ page }) => {
    await startWithOneChapterPlan(page);

    // 실제 앱의 완료 저장 함수를 빠르게 반복 호출해 더블 탭/중복 이벤트를 재현합니다.
    // 같은 장의 완료 상태를 반복 설정하는 것이므로 토글 취소가 아니라 중복 제출 검증입니다.
    await page.evaluate(({ planId, chapterKey }) => {
      for (let i = 0; i < 20; i += 1) {
        window.setPlanChapterDone(planId, chapterKey, true, [1]);
      }
    }, { planId: PLAN_ID, chapterKey: JUDE_CHAPTER_KEY });

    await expect.poll(async () => (await storedState(page)).archives.length).toBe(1);
    const state = await storedState(page);
    expect(state.archives.filter((p) => p.id === PLAN_ID)).toHaveLength(1);
    expect(state.plans.some((p) => p.id === PLAN_ID)).toBe(false);
    expect(state.planState.chapters[JUDE_CHAPTER_KEY]).toBe(true);
    expect(state.archives[0].completedAt).toBeTruthy();
  });

  test('완료 처리 직후 새로고침해도 활성 목록이나 완료 이력에서 계획이 유실되지 않는다', async ({ page }) => {
    await startWithOneChapterPlan(page);

    // 완료 저장 직후 바로 새로고침합니다. 완료 이력에 있거나, 저장된 진도를 바탕으로
    // 앱이 복구 후 완료로 정리해야 합니다. 결과적으로 활성 계획에 남아 있는 완료 계획은 허용하지 않습니다.
    const navigation = page.waitForNavigation({ waitUntil: 'domcontentloaded' });
    const completionAndReload = page.evaluate(({ planId, chapterKey }) => {
      window.setPlanChapterDone(planId, chapterKey, true, [1]);
      // 같은 JS 작업 안에서 즉시 reload를 시작해 지연 아카이브 타이머의 종료 경계를 검증합니다.
      window.location.reload();
    }, { planId: PLAN_ID, chapterKey: JUDE_CHAPTER_KEY });
    await Promise.all([navigation, completionAndReload.catch(() => {})]);

    await expect.poll(async () => {
      const state = await storedState(page);
      const archived = state.archives.some((p) => p.id === PLAN_ID);
      const active = state.plans.some((p) => p.id === PLAN_ID);
      return { archived, active };
    }).toEqual({ archived: true, active: false });

    const state = await storedState(page);
    expect(state.archives.filter((p) => p.id === PLAN_ID)).toHaveLength(1);
    expect(state.archives[0].completedAt).toBeTruthy();
  });
});
