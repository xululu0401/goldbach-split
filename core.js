/* 草稿纸上拆偶数 · 计算核心（core.js）
 * 输入：一个偶数 N（4 到 10,000,000）、邻居半径 k（看 N−2k 到 N+2k 的偶数）。
 * 全部是确定的整数算术：埃氏筛 → 逐对检查 p + (N−p) → 从 2 起逐个素数试出最小拆分。
 * 唯一的「估计」是 Hardy–Littlewood 猜想公式（以及 Crandall–Pomerance 积分形式），它本身是猜想，不是定理。
 * 记号（与 Oliveira e Silva 验算页一致）：r(N) = 不计顺序的拆法数；R(N) = 计顺序，= 2r − [N/2 是素数]。 */
(function (root) {
  'use strict';
  var MAX_N = 10000000, MAX_K = 30;
  var C2 = 0.66016181584686957392;
  var HL_MIN = 30; /* N 太小时 ln N − 2 接近 0 甚至为负，公式没有意义；30 以下不给比值 */ /* 孪生素数常数，取自 Oliveira e Silva 页 */

  function defaultState() { return { n: '98', k: '10' }; }

  /* ---------- 筛 ---------- */
  var sieveTop = 0, comp = null; /* comp[i] = 1 表示 i 不是素数（i<2 也记为 1） */
  function ensure(m) {
    if (m <= sieveTop) return;
    var top = Math.max(m, Math.min(MAX_N + 2 * MAX_K + 2, sieveTop * 2 || 1024));
    var c = new Uint8Array(top + 1);
    c[0] = 1; c[1] = 1;
    for (var i = 2; i * i <= top; i++) if (!c[i]) for (var j = i * i; j <= top; j += i) c[j] = 1;
    comp = c; sieveTop = top;
  }
  function isPrime(x) { if (x < 2) return false; ensure(x); return !comp[x]; }

  /* 小于等于 x 的最小因子分解（试除，x ≤ 1e7 时最多试到 3163） */
  function factor(x) {
    var f = [], d = 2;
    while (d * d <= x) { if (x % d === 0) { var e = 0; while (x % d === 0) { x /= d; e++; } f.push([d, e]); } d += d === 2 ? 1 : 2; }
    if (x > 1) f.push([x, 1]);
    return f;
  }
  var SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
  function factorText(f) { return f.map(function (x) { return fmt(x[0]) + (x[1] > 1 ? String(x[1]).replace(/\d/g, function (c) { return SUP[c]; }) : ''); }).join(' × '); }

  /* N 的所有拆法（p ≤ q） */
  function pairs(N) {
    ensure(N);
    var L = [];
    if (N === 4) return [[2, 2]];
    for (var p = 3; p <= N / 2; p += 2) if (!comp[p] && !comp[N - p]) L.push([p, N - p]);
    return L;
  }
  function countPairs(N) {
    ensure(N);
    if (N === 4) return 1;
    var c = 0;
    for (var p = 3; p <= N / 2; p += 2) if (!comp[p] && !comp[N - p]) c++;
    return c;
  }
  function minPrime(N) {
    ensure(N);
    if (!comp[N - 2]) return 2;
    for (var p = 3; p <= N / 2; p += 2) if (!comp[p] && !comp[N - p]) return p;
    return 0; /* 在本页范围内不会发生；发生就是反例 */
  }

  /* 4..N 里「最小拆分素数」创纪录的偶数（OEIS A025018 / A025019 的口径） */
  function records(N) {
    ensure(N);
    var L = [], best = 0;
    for (var m = 4; m <= N; m += 2) {
      var p;
      if (!comp[m - 2]) p = 2;
      else { p = 3; while (comp[p] || comp[m - p]) p += 2; }
      if (p > best) { best = p; L.push({ n: m, p: p }); }
    }
    return L;
  }

  /* Hardy–Littlewood 估计（估的是有序计数 R） */
  function oddPrimeFactors(N) { return factor(N).map(function (x) { return x[0]; }).filter(function (p) { return p > 2; }); }
  function hlBoost(N) { return oddPrimeFactors(N).reduce(function (t, p) { return t * (p - 1) / (p - 2); }, 1); }
  function hlSimple(N) { var l = Math.log(N); return 2 * C2 * N / (l * (l - 2)) * hlBoost(N); }
  /* ∫₂^{N−2} dx / (ln x · ln(N−x))：关于 N/2 对称，取 2 × ∫₂^{N/2}；换元 x = e^u 后用 Simpson（4000 段） */
  function cpIntegral(N) {
    var a = Math.log(2), b = Math.log(N / 2), m = 4000, h = (b - a) / m, s = 0;
    for (var i = 0; i <= m; i++) {
      var u = a + i * h, x = Math.exp(u), w = (i === 0 || i === m) ? 1 : (i % 2 ? 4 : 2);
      s += w * x / (u * Math.log(N - x));
    }
    return 2 * s * h / 3;
  }
  function hlIntegral(N) { return 2 * C2 * cpIntegral(N) * hlBoost(N); }

  function parseIntLoose(x) {
    var s = String(x == null ? '' : x).replace(/[,，\s_]/g, '');
    if (!/^-?\d+$/.test(s)) return NaN;
    return s.length > 12 ? Infinity : parseInt(s, 10);
  }
  function fmt(x) { return String(x).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function pct(x) { return (x * 100).toFixed(1) + '%'; }

  function validate(s) {
    var errors = [];
    var N = parseIntLoose(s && s.n), k = parseIntLoose(s && s.k);
    if (isNaN(N)) errors.push({ field: 'n', message: '要填一个整数（可以带逗号）。' });
    else if (N < 4) errors.push({ field: 'n', message: '最小从 4 开始（4 = 2 + 2）。2 本身拆不成两个素数，所以猜想说的是大于 2 的偶数。' });
    else if (N > MAX_N) errors.push({ field: 'n', message: '本页最多算到 ' + fmt(MAX_N) + '（在浏览器里筛素数）。更大的数前人已用机器验到 4×10¹⁸，那不是网页能做的。' });
    else if (N % 2) errors.push({ field: 'n', message: fmt(N) + ' 是奇数。拆成两个素数说的是偶数；奇数拆成三个素数是另一个问题（弱哥德巴赫）。' });
    if (isNaN(k) || k < 1 || k > MAX_K) errors.push({ field: 'k', message: '邻居范围要是 1 到 ' + MAX_K + ' 的整数（左右各看几个偶数）。' });
    return { errors: errors, v: errors.length ? null : { N: N, k: k } };
  }

  function compute(s) {
    var r = validate(s);
    if (r.errors.length) return { ok: false, errors: r.errors };
    var N = r.v.N, k = r.v.k;
    ensure(N + 2 * k);
    var P = pairs(N), half = N / 2, halfPrime = isPrime(half);
    var rN = P.length, RN = 2 * rN - (halfPrime ? 1 : 0);
    var first = P[0], bal = P[P.length - 1];

    /* 草稿纸：从 2 起逐个素数试，直到第一次成功 */
    var trials = [];
    for (var p = 2; p <= half; p = p === 2 ? 3 : p + 2) {
      if (!isPrime(p)) continue;
      var q = N - p, okq = isPrime(q);
      trials.push({ p: p, q: q, ok: okq, f: okq ? null : factorText(factor(q)) });
      if (okq) break;
    }
    var fails = trials.length - 1;
    var smallestFactors = {};
    trials.forEach(function (t) { if (!t.ok) { var d = factor(t.q)[0][0]; smallestFactors[d] = (smallestFactors[d] || 0) + 1; } });

    /* 邻居 */
    var nb = [];
    for (var m = N - 2 * k; m <= N + 2 * k; m += 2) {
      if (m < 4 || m > MAX_N) continue;
      nb.push({ n: m, r: countPairs(m), p: minPrime(m), m3: m % 3 === 0, cur: m === N });
    }
    var nbMax = nb.reduce(function (a, b) { return b.r > a.r ? b : a; });
    var nbMin = nb.reduce(function (a, b) { return b.r < a.r ? b : a; });
    var m3 = nb.filter(function (x) { return x.m3; }), n3 = nb.filter(function (x) { return !x.m3; });
    var avg = function (L) { return L.length ? L.reduce(function (t, x) { return t + x.r; }, 0) / L.length : null; };
    var m3avg = avg(m3), n3avg = avg(n3);

    /* 猜想公式 */
    var boost = hlBoost(N), opf = oddPrimeFactors(N);
    var est = { applicable: N >= HL_MIN, simple: hlSimple(N), integral: hlIntegral(N), boost: boost, factors: opf.map(function (p) { return { p: p, f: (p - 1) / (p - 2) }; }) };
    est.simpleRatio = RN / est.simple; est.integralRatio = RN / est.integral;

    /* 区间最难拆 */
    var rec = records(N), hard = rec[rec.length - 1];

    /* 只改一项 */
    var acts = [];
    var push = function (kind, text, to) { if (to >= 4 && to <= MAX_N && to !== N) acts.push({ kind: kind, text: text, to: to, r: countPairs(to), p: minPrime(to) }); };
    push('next', '换成下一个偶数 ' + fmt(N + 2), N + 2);
    push('prev', '换成上一个偶数 ' + fmt(N - 2), N - 2);
    if (nbMax.n !== N) push('nbMax', '换成邻居里拆法最多的 ' + fmt(nbMax.n), nbMax.n);
    if (hard.n !== N) push('hard', '换成 4 到 ' + fmt(N) + ' 里最难拆的 ' + fmt(hard.n) + '（最小要用到 ' + hard.p + '）', hard.n);
    if (N * 3 <= MAX_N) push('x3', '乘 3 变成 ' + fmt(N * 3), N * 3);
    if (N * 10 <= MAX_N) push('x10', '乘 10 变成 ' + fmt(N * 10), N * 10);

    var headline = fmt(N) + ' 有 ' + fmt(rN) + ' 种拆成两个素数的办法；最小的是 ' + fmt(first[0]) + ' + ' + fmt(first[1]) + '（从 2 往上试到第 ' + trials.length + ' 个素数才成），最均衡的是 ' + fmt(bal[0]) + ' + ' + fmt(bal[1]) + '。';

    return {
      ok: true, errors: [], v: r.v, N: N, r: rN, R: RN, halfPrime: halfPrime, pairs: P, first: first, balanced: bal,
      trials: trials, fails: fails, smallestFactors: smallestFactors, neighbors: nb, nbMax: nbMax, nbMin: nbMin,
      m3avg: m3avg, n3avg: n3avg, est: est, records: rec, hardest: hard, actions: acts, headline: headline
    };
  }

  function applyAction(s, a) { var t = JSON.parse(JSON.stringify(s)); t.n = String(a.to); return t; }

  function csvCell(x) { var t = String(x); return /[",\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t; }
  function toCSV(o, stamp) {
    var L = [];
    L.push(['草稿纸上拆偶数', '导出 ' + stamp].map(csvCell).join(','));
    L.push(['偶数', o.N].join(','));
    L.push(['不计顺序的拆法数 r', o.r].join(','));
    L.push(['计顺序的拆法数 R', o.R].join(','));
    L.push(['最小拆分', o.first[0] + '+' + o.first[1]].join(','));
    L.push(['最均衡拆分', o.balanced[0] + '+' + o.balanced[1]].join(','));
    L.push(['HL 估计 R（简单式）', o.est.applicable ? o.est.simple.toFixed(1) : '数太小，不适用'].join(','));
    L.push(['HL 估计 R（积分式）', o.est.applicable ? o.est.integral.toFixed(1) : '数太小，不适用'].join(','));
    L.push('');
    L.push('序号,小的素数,大的素数');
    o.pairs.forEach(function (p, i) { L.push([i + 1, p[0], p[1]].join(',')); });
    L.push('');
    L.push('邻居偶数,拆法数 r,最小素数,是 3 的倍数');
    o.neighbors.forEach(function (x) { L.push([x.n, x.r, x.p, x.m3 ? '是' : '否'].join(',')); });
    L.push('');
    L.push(csvCell('哥德巴赫猜想至今没有被证明；本表只是对这一个数的验算'));
    return L.join('\n') + '\n';
  }
  function toMD(o, stamp) {
    var L = [];
    L.push('# 草稿纸上拆偶数：' + fmt(o.N), '', '导出 ' + stamp, '');
    L.push('- **' + o.headline + '**');
    L.push('- 计顺序的拆法数 R = ' + fmt(o.R) + '；Hardy–Littlewood 估计 ' + (o.est.applicable ? o.est.simple.toFixed(1) + '（简单式）/ ' + o.est.integral.toFixed(1) + '（积分式）' : '不适用（N < ' + HL_MIN + '，公式在太小的数上没有意义）'));
    L.push('- 4 到 ' + fmt(o.N) + ' 里最难拆的是 ' + fmt(o.hardest.n) + '，最小要用到 ' + o.hardest.p, '');
    L.push('## 草稿纸', '');
    o.trials.forEach(function (t) { L.push('- ' + fmt(o.N) + ' − ' + t.p + ' = ' + fmt(t.q) + (t.ok ? ' 是素数 ✓' : ' = ' + t.f + ' ✗')); });
    L.push('', '## 全部拆法（前 200 种）', '');
    o.pairs.slice(0, 200).forEach(function (p) { L.push('- ' + fmt(p[0]) + ' + ' + fmt(p[1])); });
    if (o.pairs.length > 200) L.push('- ……共 ' + fmt(o.pairs.length) + ' 种，完整列表见 CSV');
    L.push('', '| 邻居偶数 | 拆法数 | 最小素数 | 3 的倍数 |', '|---|---|---|---|');
    o.neighbors.forEach(function (x) { L.push('| ' + fmt(x.n) + (x.cur ? '（本数）' : '') + ' | ' + fmt(x.r) + ' | ' + x.p + ' | ' + (x.m3 ? '是' : '否') + ' |'); });
    L.push('', '> 哥德巴赫猜想至今没有被证明。本页只对你填的这一个数做验算；Hardy–Littlewood 公式本身也是猜想下的近似。');
    return L.join('\n') + '\n';
  }

  var api = { MAX_N: MAX_N, HL_MIN: HL_MIN, MAX_K: MAX_K, C2: C2, defaultState: defaultState, validate: validate, compute: compute, applyAction: applyAction,
    isPrime: isPrime, factor: factor, factorText: factorText, pairs: pairs, countPairs: countPairs, minPrime: minPrime, records: records,
    hlBoost: hlBoost, hlSimple: hlSimple, hlIntegral: hlIntegral, cpIntegral: cpIntegral, fmt: fmt, pct: pct, toCSV: toCSV, toMD: toMD };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.AppCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
