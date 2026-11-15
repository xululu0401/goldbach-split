/* 草稿纸上拆偶数 · 核心测试：node --test tests/core.test.cjs
 * 锚点来源：tests/ref.json（独立 Python 试除实现）、OEIS A065577 / A025018 / A025019（evidence/外部来源/ 落盘原文）、手算。 */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const A = require(path.join(__dirname, '..', 'core.js'));
const REF = JSON.parse(fs.readFileSync(path.join(__dirname, 'ref.json'), 'utf8'));
const S = (n, k) => ({ n: String(n), k: String(k == null ? 10 : k) });

test('默认 98：手算锚点', () => {
  const o = A.compute(A.defaultState());
  assert.equal(o.ok, true);
  assert.equal(o.N, 98);
  assert.deepEqual(o.pairs, [[19, 79], [31, 67], [37, 61]]); /* 手查：98−p，p=3..49 */
  assert.equal(o.r, 3); assert.equal(o.R, 6); assert.equal(o.halfPrime, false);
  assert.deepEqual(o.first, [19, 79]); assert.deepEqual(o.balanced, [37, 61]);
  assert.deepEqual(o.trials.map((t) => t.p), [2, 3, 5, 7, 11, 13, 17, 19]);
  assert.deepEqual(o.trials.map((t) => t.f), ['2⁵ × 3', '5 × 19', '3 × 31', '7 × 13', '3 × 29', '5 × 17', '3⁴', null]);
  assert.equal(o.fails, 7);
  assert.deepEqual(o.smallestFactors, { 2: 1, 3: 3, 5: 2, 7: 1 }); /* 96→2；95,85→5；93,87,81→3；91→7 */
  assert.deepEqual(o.hardest, { n: 98, p: 19 });
  assert.equal(o.headline, '98 有 3 种拆成两个素数的办法；最小的是 19 + 79（从 2 往上试到第 8 个素数才成），最均衡的是 37 + 61。');
});

test('与独立 Python 实现逐项对拍（' + REF.cases.length + ' 个偶数）', () => {
  for (const c of REF.cases) {
    const o = A.compute(S(c.N, 1));
    assert.equal(o.r, c.r, 'r ' + c.N); assert.equal(o.R, c.R, 'R ' + c.N);
    assert.equal(o.first[0], c.first, 'first ' + c.N); assert.equal(o.balanced[0], c.balanced, 'bal ' + c.N);
    assert.equal(o.trials.length, c.trials, 'trials ' + c.N);
    assert.ok(Math.abs(o.est.simple - c.hlSimple) <= 1e-9 * Math.abs(c.hlSimple), 'hl ' + c.N);
    assert.equal(o.est.applicable, c.N >= 30);
    assert.equal(A.countPairs(c.N), c.r); assert.equal(A.minPrime(c.N), c.first);
  }
});

test('OEIS A065577：10^1 … 10^7 的拆法数', () => {
  const want = [2, 6, 28, 127, 810, 5402, 38807];
  want.forEach((w, i) => assert.equal(A.countPairs(Math.pow(10, i + 1)), w, '10^' + (i + 1)));
});

test('OEIS A025018 / A025019：一千万以内最难拆纪录逐项一致', () => {
  const n = [4, 6, 12, 30, 98, 220, 308, 556, 992, 2642, 5372, 7426, 43532, 54244, 63274, 113672, 128168, 194428, 194470, 413572, 503222, 1077422, 3526958, 3807404];
  const p = [2, 3, 5, 7, 19, 23, 31, 47, 73, 103, 139, 173, 211, 233, 293, 313, 331, 359, 383, 389, 523, 601, 727, 751];
  const r = A.records(10000000);
  assert.deepEqual(r.map((x) => x.n), n); assert.deepEqual(r.map((x) => x.p), p);
  assert.deepEqual(A.records(20000).map((x) => [x.n, x.p]), REF.records_to_20000);
});

test('每一行草稿纸都对：失败行的分解乘回去等于 N−p 且确实有因子，成功行确实是素数', () => {
  for (const N of [98, 3807404, 1000004, 9999998]) {
    const o = A.compute(S(N, 1));
    o.trials.forEach((t, i) => {
      assert.equal(t.p + t.q, N);
      assert.equal(A.isPrime(t.p), true);
      const f = A.factor(t.q);
      assert.equal(f.reduce((m, [b, e]) => m * Math.pow(b, e), 1), t.q);
      f.forEach(([b]) => assert.equal(A.isPrime(b), true));
      assert.equal(t.ok, i === o.trials.length - 1);
      if (!t.ok) assert.ok(f.length > 1 || f[0][1] > 1, '失败行必须是合数 ' + t.q);
    });
  }
  assert.equal(A.compute(S(3807404, 1)).trials.length, 133); /* 751 是第 133 个素数 */
});

test('边界：4、6、8、上限 10,000,000；R 在 N/2 是素数时减一', () => {
  let o = A.compute(S(4, 1)); assert.deepEqual(o.pairs, [[2, 2]]); assert.equal(o.r, 1); assert.equal(o.R, 1); assert.equal(o.trials.length, 1);
  o = A.compute(S(6, 1)); assert.deepEqual(o.pairs, [[3, 3]]); assert.equal(o.R, 1); assert.deepEqual(o.trials.map((t) => t.p), [2, 3]);
  o = A.compute(S(10, 1)); assert.equal(o.r, 2); assert.equal(o.R, 3); /* 3+7,7+3,5+5 */
  o = A.compute(S(8, 1)); assert.equal(o.R, 2);
  o = A.compute(S(10000000, 30)); assert.equal(o.ok, true); assert.equal(o.r, 38807);
  assert.equal(o.neighbors[o.neighbors.length - 1].n, 10000000); /* 超上限的邻居不列 */
  assert.equal(A.compute(S(4, 30)).neighbors[0].n, 4);           /* 小于 4 的邻居不列 */
});

test('非法输入：奇数、2、负数、超上限、空、非数字、k 越界；逗号与空格可以', () => {
  const e = (s) => A.compute(s).errors.map((x) => x.field + ':' + x.message);
  assert.match(e(S(99))[0], /^n:.*奇数/);
  assert.match(e(S(2))[0], /^n:最小从 4/);
  assert.match(e(S(-8))[0], /^n:最小从 4/);
  assert.match(e(S(10000002))[0], /^n:本页最多算到 10,000,000/);
  assert.match(e(S('123456789012345678901'))[0], /^n:本页最多/);
  assert.match(e(S(''))[0], /^n:要填一个整数/);
  assert.match(e(S('9.8'))[0], /^n:要填一个整数/);
  assert.match(e(S(98, 0))[0], /^k:/); assert.match(e(S(98, 31))[0], /^k:/); assert.match(e(S(98, 'x'))[0], /^k:/);
  assert.equal(e({ n: 'abc', k: '0' }).length, 2);
  assert.equal(A.compute(S('1,000,000')).N, 1000000);
  assert.equal(A.compute(S(' 98 ')).N, 98);
  assert.equal(A.compute(S('１００')).ok, false); /* 全角数字不认，报错而不是误算 */
});

test('邻居与 3 的倍数：98 ± 20 手算', () => {
  const o = A.compute(S(98, 10));
  assert.deepEqual(o.neighbors.map((x) => x.n), [78, 80, 82, 84, 86, 88, 90, 92, 94, 96, 98, 100, 102, 104, 106, 108, 110, 112, 114, 116, 118]);
  const m = Object.fromEntries(o.neighbors.map((x) => [x.n, x.r]));
  assert.equal(m[78], 7); assert.equal(m[90], 9); assert.equal(m[100], 6); assert.equal(m[114], 10); assert.equal(m[98], 3);
  assert.deepEqual([o.nbMax.n, o.nbMax.r, o.nbMin.n, o.nbMin.r], [114, 10, 98, 3]);
  const m3 = o.neighbors.filter((x) => x.n % 3 === 0), n3 = o.neighbors.filter((x) => x.n % 3);
  assert.equal(o.m3avg, m3.reduce((t, x) => t + x.r, 0) / m3.length);
  assert.equal(o.n3avg, n3.reduce((t, x) => t + x.r, 0) / n3.length);
  assert.equal(o.m3avg.toFixed(1), '8.1'); assert.equal(o.n3avg.toFixed(1), '5.1');
  assert.ok(o.neighbors.every((x) => x.cur === (x.n === 98)));
});

test('猜想公式：常数、奇素因子加倍、积分式与独立数值积分一致', () => {
  assert.equal(A.C2, 0.66016181584686957392);
  assert.equal(A.hlBoost(1024), 1); assert.equal(A.hlBoost(6), 2); assert.equal(A.hlBoost(18), 2); /* 3 只算一次 */
  assert.ok(Math.abs(A.hlBoost(210) - 2 * 4 / 3 * 6 / 5) < 1e-15);
  const N = 98, l = Math.log(N);
  assert.ok(Math.abs(A.hlSimple(N) - 2 * A.C2 * N / (l * (l - 2)) * (6 / 5)) < 1e-12); /* 98 = 2·7² */
  /* 独立：直接在 x 上用梯形法 200 万段积分 ∫₂^{N−2} */
  for (const n of [98, 1000, 100000]) {
    const a = 2, b = n - 2, m = 2000000, h = (b - a) / m; let s = 0;
    for (let i = 0; i <= m; i++) { const x = a + i * h; s += (i === 0 || i === m ? 0.5 : 1) / (Math.log(x) * Math.log(n - x)); }
    s *= h;
    assert.ok(Math.abs(A.cpIntegral(n) - s) / s < 1e-6, n + ' ' + A.cpIntegral(n) + ' vs ' + s);
  }
  const o = A.compute(S(10000000));
  assert.equal(o.R, 77614);
  assert.ok(Math.abs(o.est.integralRatio - 1) < 0.01); /* 一千万处积分式偏差应在 1% 内 */
  assert.ok(o.est.simpleRatio === o.R / o.est.simple);
});

test('只改一项：每个按钮写的读数 = 改完真实算出来的；上下限不出界', () => {
  const s = A.defaultState(), o = A.compute(s);
  assert.deepEqual(o.actions.map((a) => a.kind), ['next', 'prev', 'nbMax', 'x3', 'x10']); /* 98 自己就是最难拆，不出 hard */
  for (const a of o.actions) {
    const t = A.applyAction(s, a), o2 = A.compute(t);
    assert.equal(o2.N, a.to); assert.equal(o2.r, a.r); assert.equal(o2.first[0], a.p);
  }
  const o3 = A.compute(S(1000)); assert.ok(o3.actions.some((a) => a.kind === 'hard' && a.to === 992 && a.p === 73));
  assert.ok(A.compute(S(4)).actions.every((a) => a.to >= 4 && a.kind !== 'prev'));
  const top = A.compute(S(10000000)); assert.ok(top.actions.every((a) => a.to <= 10000000 && a.kind !== 'next' && a.kind !== 'x3'));
  assert.equal(A.compute(S(3333334)).actions.some((a) => a.kind === 'x3'), false); /* 3×3333334 > 上限 */
  assert.equal(A.compute(S(3333332)).actions.some((a) => a.kind === 'x3'), true);
});

test('导出：CSV 与 MD 的数字来自同一次 compute', () => {
  const o = A.compute(S(98));
  const csv = A.toCSV(o, 'T'), md = A.toMD(o, 'T');
  assert.ok(csv.includes('不计顺序的拆法数 r,3\n') && csv.includes('最小拆分,19+79') && csv.includes('1,19,79\n2,31,67\n3,37,61\n'));
  assert.ok(csv.includes('HL 估计 R（简单式）,' + o.est.simple.toFixed(1)));
  assert.ok(csv.includes('114,10,5,是'));
  assert.ok(md.includes('98 − 17 = 81 = 3⁴ ✗') && md.includes('98 − 19 = 79 是素数 ✓') && md.includes('| 98（本数） | 3 | 19 | 否 |'));
  const small = A.compute(S(28));
  assert.ok(A.toCSV(small, 'T').includes('HL 估计 R（简单式）,数太小，不适用') && A.toMD(small, 'T').includes('不适用（N < 30'));
  const big = A.toMD(A.compute(S(1000000)), 'T');
  assert.ok(big.includes('共 5,402 种'));
  assert.equal(A.toCSV(A.compute(S(1000000)), 'T').split('\n').filter((l) => /^\d+,\d+,\d+$/.test(l)).length >= 5402, true);
});

test('格式化：千分位与因子上标', () => {
  assert.equal(A.fmt(10000000), '10,000,000'); assert.equal(A.fmt(98), '98'); assert.equal(A.fmt(1000), '1,000');
  assert.equal(A.factorText(A.factor(96)), '2⁵ × 3');
  assert.equal(A.factorText(A.factor(1024)), '2¹⁰');
  assert.equal(A.factorText(A.factor(12)), '2² × 3'); assert.equal(A.factorText(A.factor(45)), '3² × 5');
  assert.equal(A.factorText(A.factor(9999991)), '9,999,991');
  assert.equal(A.factorText(A.factor(3807402)), '2 × 3 × 634,567'); /* 375 目检发现：因子不加千分位与左边算式不一致 */
});
