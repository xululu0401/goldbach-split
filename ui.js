/* 草稿纸上拆偶数 · 界面（ui.js）
 * 读 state → AppCore.compute → 把同一次输出画出来。页面自己不判断素数。 */
(function () {
  'use strict';
  var A = window.AppCore;
  var KEY = 'goldbach-split:v1';
  var $ = function (id) { return document.getElementById(id); };
  var F = A.fmt;
  var PRESETS = [
    { key: 'd98', name: '98（默认）', note: '4 到 98 之间最难拆的偶数：要从 2 一直试到 19。', n: '98' },
    { key: 'd100', name: '100', note: '100 = 3 + 97，第 2 个素数就成了；一共 6 种拆法。', n: '100' },
    { key: 'd210', name: '210 = 2·3·5·7', note: '有 3、5、7 三个奇素因子，拆法比邻居多出一大截。', n: '210' },
    { key: 'd1e6', name: '1,000,000', note: '一百万，看看拆法有几千种。', n: '1000000' },
    { key: 'd3807404', name: '3,807,404', note: '一千万以内最难拆的偶数之一：最小那个素数要试到 751（OEIS A025018）。', n: '3807404' }
  ];
  function presetState(k) { var s = A.defaultState(); s.n = PRESETS.filter(function (p) { return p.key === k; })[0].n; return s; }
  function presetKey(s) { var j = JSON.stringify(s); for (var i = 0; i < PRESETS.length; i++) if (JSON.stringify(presetState(PRESETS[i].key)) === j) return PRESETS[i].key; return null; }
  var FIELDS = ['n', 'k'];

  function sanitize(s) {
    if (!s || typeof s !== 'object') return null;
    var d = A.defaultState(), any = false;
    FIELDS.forEach(function (k) { if (s[k] != null && typeof s[k] !== 'object') { d[k] = String(s[k]).slice(0, 20); any = true; } });
    return any ? d : null;
  }
  function load() { try { var t = localStorage.getItem(KEY); if (!t) return null; var j = JSON.parse(t); return sanitize(j && j.state); } catch (e) { return null; } }
  var state = load() || A.defaultState();
  var out = null;
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify({ state: state })); $('saveTag').textContent = '· 已存到本机'; }
    catch (e) { $('saveTag').textContent = '· 没能存到本机'; }
  }
  function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function renderPresets() {
    var key = presetKey(state);
    $('presets').innerHTML = PRESETS.map(function (p) { return '<button type="button" class="chip" id="preset_' + p.key + '" data-p="' + p.key + '" aria-pressed="' + (key === p.key) + '">' + esc(p.name) + '</button>'; }).join('');
    var cur = PRESETS.filter(function (p) { return p.key === key; })[0];
    $('presetNote').textContent = cur ? cur.note : '你自己填的数。';
  }
  $('presets').addEventListener('click', function (e) { var b = e.target.closest('[data-p]'); if (!b) return; state = presetState(b.getAttribute('data-p')); fill(); update(); });
  function fill() { FIELDS.forEach(function (k) { if ($(k).value !== String(state[k])) $(k).value = state[k]; }); }
  FIELDS.forEach(function (k) { $(k).addEventListener('input', function () { state[k] = this.value; update(); }); });
  function bump(d) {
    var x = parseInt(String(state.n).replace(/[,，\s_]/g, ''), 10); if (isNaN(x)) x = 98;
    if (x % 2) x += d > 0 ? -1 : 1;
    x = Math.max(4, Math.min(A.MAX_N, x + d)); state.n = String(x); fill(); update();
  }
  $('nPlus').addEventListener('click', function () { bump(2); });
  $('nMinus').addEventListener('click', function () { bump(-2); });

  function markErrors() {
    FIELDS.forEach(function (k) { $(k).classList.remove('bad'); });
    (out.errors || []).forEach(function (e) { var el = $(e.field); if (el) el.classList.add('bad'); });
  }

  var MAX_ROWS = 40; /* 草稿纸最多直接写 40 行，多的折起来 */
  function render() {
    var bad = !out.ok;
    $('errBox').classList.toggle('hide', !bad);
    $('res').classList.toggle('hide', bad);
    if (bad) { $('errBox').innerHTML = '<b>还算不了</b>：<ul>' + out.errors.map(function (e) { return '<li>' + esc(e.message) + '</li>'; }).join('') + '</ul>'; return; }
    var N = out.N;
    $('eq').innerHTML = esc(F(N)) + '<span class="pl"> = </span>' + esc(F(out.first[0])) + '<span class="pl"> + </span>' + esc(F(out.first[1]));
    $('cnt').textContent = '共 ' + F(out.r) + ' 种拆法';
    $('cntNote').textContent = '（不计顺序；计顺序是 ' + F(out.R) + ' 种' + (out.halfPrime ? '，' + F(N / 2) + ' + ' + F(N / 2) + ' 只算一次' : '') + '）';
    $('headline').textContent = out.headline;

    /* 草稿纸 */
    var T = out.trials, rows = T.length > MAX_ROWS ? T.slice(0, MAX_ROWS - 6).concat([null]).concat(T.slice(-5)) : T;
    $('work').innerHTML = rows.map(function (t) {
      if (!t) return '<li class="skip"><span class="rhs">⋯ 中间还有 ' + (T.length - (MAX_ROWS - 1)) + ' 行都没成，导出 Markdown 能看到每一行 ⋯</span></li>';
      return '<li class="' + (t.ok ? 'win' : '') + '"><span class="lhs">' + esc(F(N)) + ' − ' + t.p + ' = ' + esc(F(t.q)) + '</span>' +
        (t.ok ? '<span class="v">是素数 ✓</span>' : '<span class="rhs">= ' + esc(t.f) + ' <span class="x">✗</span></span>') + '</li>';
    }).join('');
    var sf = Object.keys(out.smallestFactors).map(Number).sort(function (a, b) { return a - b; });
    $('tally').textContent = out.fails === 0 ? '第一行就成了。' :
      '前 ' + out.fails + ' 行都没成：' + sf.map(function (d) { return out.smallestFactors[d] + ' 行能被 ' + d + ' 整除'; }).join('，') + '。第 ' + T.length + ' 个素数 ' + out.first[0] + ' 才配上。';

    /* 分布 */
    var B = Math.min(40, Math.max(1, Math.floor(N / 4))), lo = 2, hi = N / 2, bins = new Array(B).fill(0);
    out.pairs.forEach(function (p) { var i = Math.min(B - 1, Math.floor((p[0] - lo) / (hi - lo + 1) * B)); bins[i]++; });
    var mx = Math.max.apply(null, bins) || 1;
    $('dist').innerHTML = bins.map(function (c, i) { return '<span style="height:' + (c / mx * 100) + '%" title="' + c + ' 种"></span>'; }).join('');
    $('axis').innerHTML = hi <= 6 ? '<span>2</span><span>' + esc(F(hi)) + '</span>' : '<span>2</span><span>' + esc(F(Math.round((lo + hi) / 2))) + '</span><span>' + esc(F(hi)) + '</span>'; /* N=4 时中点会写成 1（目检发现） */
    $('allNote').textContent = '· ' + F(out.r) + ' 种';
    var P = out.pairs, show = P.length > 60 ? P.slice(0, 30).concat([null]).concat(P.slice(-29)) : P;
    $('plist').innerHTML = show.map(function (p) {
      if (!p) return '<span>⋯ 还有 ' + F(P.length - 59) + ' 种，完整列表在 CSV 里 ⋯</span>';
      var c = p === out.first ? 'first' : p === out.balanced ? 'bal' : '';
      return '<span class="' + c + '">' + esc(F(p[0])) + ' + ' + esc(F(p[1])) + '</span>';
    }).join('');

    /* 邻居 */
    var nmx = Math.max.apply(null, out.neighbors.map(function (x) { return x.r; })) || 1;
    $('nb').innerHTML = out.neighbors.map(function (x) {
      var c = x.cur ? ' cur' : '';
      return '<span class="lab' + c + '" id="nb_' + x.n + '">' + esc(F(x.n)) + (x.cur ? ' ◀' : '') + '</span><div><div class="bar' + (x.m3 ? ' m3' : '') + '" style="width:' + (x.r / nmx * 100) + '%"></div></div><span class="val' + c + '">' + esc(F(x.r)) + ' · ' + x.p + '</span>';
    }).join('');
    $('nbLine').textContent = '这 ' + out.neighbors.length + ' 个偶数里，拆法最多的是 ' + F(out.nbMax.n) + '（' + F(out.nbMax.r) + ' 种），最少的是 ' + F(out.nbMin.n) + '（' + F(out.nbMin.r) + ' 种）' +
      (out.m3avg != null && out.n3avg != null ? '；3 的倍数平均 ' + out.m3avg.toFixed(1) + ' 种，其余平均 ' + out.n3avg.toFixed(1) + ' 种。' : '。');

    /* 估计 */
    var E = out.est;
    if (!E.applicable) {
      $('estBox').innerHTML = '<div class="kv" id="estReal"><div class="k">真实数出来（计顺序 R）</div><div class="v">' + esc(F(out.R)) + '</div></div><div class="kv" id="estHL"><div class="k">猜想公式估</div><div class="v">不适用</div></div>';
      $('estLine').textContent = 'N 小于 ' + A.HL_MIN + ' 时公式里的 ln N − 2 接近 0 甚至是负数，估出来没有意义。换个大一点的数再看。';
    } else {
    $('estBox').innerHTML = '<div class="kv" id="estReal"><div class="k">真实数出来（计顺序 R）</div><div class="v">' + esc(F(out.R)) + '</div></div>' +
      '<div class="kv" id="estHL"><div class="k">猜想公式估（简单式 / 积分式）</div><div class="v">' + esc(F(Math.round(E.simple))) + ' / ' + esc(F(Math.round(E.integral))) + '</div></div>';
    $('estLine').textContent = '真实 ÷ 估计 = ' + E.simpleRatio.toFixed(3) + '（简单式）/ ' + E.integralRatio.toFixed(3) + '（积分式）。' +
      (E.factors.length ? F(N) + ' 的奇素因子 ' + E.factors.map(function (f) { return F(f.p); }).join('、') + (E.boost < 1.0005 ? ' 都很大，估计几乎不用加倍（只乘了 ' + E.boost.toFixed(6) + '）。' : ' 让估计乘了 ' + E.boost.toFixed(3) + '。') : F(N) + ' 是 2 的幂，没有奇素因子，估计不加倍。') +
      ' 数越大，两者通常越接近；小数字上偏差大是正常的。';
    }

    /* 纪录 */
    var R = out.records;
    $('recTable').innerHTML = '<tr><th>偶数</th><th>最小拆分</th><th>要试到第几个素数</th></tr>' + R.slice().reverse().slice(0, 12).map(function (x) {
      return '<tr class="' + (x.n === N ? 'cur' : '') + '"><td class="n">' + esc(F(x.n)) + '</td><td class="n">' + x.p + ' + ' + esc(F(x.n - x.p)) + '</td><td class="n">' + primeIndex(x.p) + '</td></tr>';
    }).join('') + (R.length > 12 ? '<tr><td colspan="3" class="muted">更小的 ' + (R.length - 12) + ' 个纪录省略（从 4 = 2 + 2 开始）</td></tr>' : '');

    $('acts').innerHTML = out.actions.map(function (a, i) {
      return '<button type="button" class="act" id="act_' + a.kind + '" data-a="' + i + '">→ ' + esc(a.text) + '<small>改完：' + esc(F(a.r)) + ' 种拆法（现在 ' + esc(F(out.r)) + '），最小用到 ' + a.p + '</small></button>';
    }).join('');
  }
  function primeIndex(p) { var c = 0; for (var i = 2; i <= p; i++) if (A.isPrime(i)) c++; return c; }
  $('acts').addEventListener('click', function (e) { var b = e.target.closest('[data-a]'); if (!b) return; state = A.applyAction(state, out.actions[+b.getAttribute('data-a')]); fill(); update(); });

  function update() { out = A.compute(state); render(); markErrors(); renderPresets(); save(); }

  /* ---------- 导出 ---------- */
  function stamp() { var d = new Date(), p = function (x) { return (x < 10 ? '0' : '') + x; }; return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()); }
  function download(name, blob) { var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500); }
  $('dlCsv').addEventListener('click', function () { if (out.ok) download('草稿纸上拆偶数-' + out.N + '.csv', new Blob(['\ufeff' + A.toCSV(out, stamp())], { type: 'text/csv;charset=utf-8' })); });
  $('dlMd').addEventListener('click', function () { if (out.ok) download('草稿纸上拆偶数-' + out.N + '.md', new Blob([A.toMD(out, stamp())], { type: 'text/markdown;charset=utf-8' })); });
  $('dlJson').addEventListener('click', function () { download('草稿纸上拆偶数-备份.json', new Blob([JSON.stringify({ app: '草稿纸上拆偶数', slug: 'goldbach-split', version: 1, exported_at: stamp(), state: state }, null, 2)], { type: 'application/json' })); });
  $('impJson').addEventListener('click', function () { $('impFile').click(); });
  $('impFile').addEventListener('change', function () { var f = this.files && this.files[0]; if (!f) return; var rd = new FileReader(); rd.onload = function () { importText(String(rd.result)); }; rd.readAsText(f); this.value = ''; });
  function importText(t) {
    var s = null;
    try { var j = JSON.parse(t); s = sanitize(j && j.state ? j.state : j); } catch (e) { s = null; }
    if (!s) { $('saveTag').textContent = '· 这个文件读不出来，没改动'; return false; }
    state = s; fill(); update(); return true;
  }
  $('reset').addEventListener('click', function () { state = A.defaultState(); fill(); update(); });

  /* 结果卡 PNG 1080×1350：文字取自同一次 out */
  function drawCard() {
    var W = 1080, H = 1350, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var g = cv.getContext('2d'), FF = '-apple-system,"PingFang SC","Microsoft YaHei",sans-serif', MONO = '"SF Mono",Menlo,Consolas,monospace';
    g.fillStyle = '#fbfaf4'; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#e3e8f0'; g.lineWidth = 1;
    for (var gx = 0; gx <= W; gx += 30) { g.beginPath(); g.moveTo(gx + 0.5, 0); g.lineTo(gx + 0.5, H); g.stroke(); }
    for (var gy = 0; gy <= H; gy += 30) { g.beginPath(); g.moveTo(0, gy + 0.5); g.lineTo(W, gy + 0.5); g.stroke(); }
    g.fillStyle = '#e8a7a0'; g.fillRect(70, 0, 3, H);
    var L = 100, R = W - 70, maxW = R - L, y = 130;
    function clip(t, w) { t = String(t); if (g.measureText(t).width <= w) return t; while (t.length > 1 && g.measureText(t + '…').width > w) t = t.slice(0, -1); return t + '…'; }
    function text(t, size, color, bold, font, x) { g.font = (bold ? '700 ' : '') + size + 'px ' + (font || FF); g.fillStyle = color; g.fillText(clip(t, maxW - ((x || L) - L)), x || L, y); }
    text('草稿纸上拆偶数', 50, '#1f2a3a', true); y += 44;
    text('导出 ' + stamp() + ' · 只是对这一个数的验算，猜想仍未被证明', 22, '#858c98'); y += 110; /* 大算式字高约 90px，留够距离，否则压到这一行（结果卡目检发现） */
    function wrap(t, size, color) {
      g.font = size + 'px ' + FF; g.fillStyle = color; var cur = '';
      Array.from(String(t)).forEach(function (ch) { if (g.measureText(cur + ch).width > maxW) { g.fillText(cur, L, y); y += size * 1.5; cur = ch; } else cur += ch; });
      if (cur) { g.fillText(cur, L, y); y += size * 1.5; }
    }
    if (!out.ok) { y -= 20; text('还算不了', 44, '#b1452f', true); y += 64; out.errors.forEach(function (e) { wrap('· ' + e.message, 26, '#4b5566'); y += 10; }); return cv; }
    var N = out.N, eqs = F(N) + ' = ' + out.first[0] + ' + ' + F(out.first[1]);
    var sz = 92; g.font = '800 ' + sz + 'px ' + FF; while (sz > 40 && g.measureText(eqs).width > maxW) { sz -= 4; g.font = '800 ' + sz + 'px ' + FF; }
    g.fillStyle = '#1f2a3a'; g.fillText(eqs, L, y); y += 66;
    text('共 ' + F(out.r) + ' 种拆法 · 最均衡 ' + F(out.balanced[0]) + ' + ' + F(out.balanced[1]), 32, '#2d5f9a', true); y += 70;
    text('草稿纸', 28, '#1f2a3a', true); y += 46;
    var T = out.trials, rows = T.length > 14 ? T.slice(0, 9).concat([null]).concat(T.slice(-4)) : T;
    rows.forEach(function (t) {
      if (!t) { text('⋯ 中间 ' + (T.length - 13) + ' 行都没成 ⋯', 22, '#858c98', false, MONO); y += 38; return; }
      if (t.ok) { g.fillStyle = '#fff2b3'; g.fillRect(L - 8, y - 28, maxW + 8, 38); }
      text(F(N) + ' − ' + t.p + ' = ' + F(t.q) + (t.ok ? '  素数 ✓' : '  = ' + t.f + '  ✗'), 25, t.ok ? '#2b7a4b' : '#4b5566', t.ok, MONO); y += 38;
    });
    y += 30;
    text(out.est.applicable ? 'Hardy–Littlewood 估计 ' + F(Math.round(out.est.integral)) + '，真实 ' + F(out.R) + '（计顺序）' : '真实 ' + F(out.R) + '（计顺序）；数太小，猜想公式不适用', 25, '#4b5566'); y += 42;
    text('4 到 ' + F(N) + ' 最难拆：' + F(out.hardest.n) + ' 要用到 ' + out.hardest.p, 25, '#4b5566'); y += 42;
    text('邻居里拆法最多 ' + F(out.nbMax.n) + '（' + F(out.nbMax.r) + ' 种），最少 ' + F(out.nbMin.n) + '（' + F(out.nbMin.r) + ' 种）', 25, '#4b5566'); y += 64;
    /* 全部拆法：剩下多少空间就列多少行，列不下写「还有几种」 */
    var room = Math.floor((H - 120 - y) / 36);
    if (room >= 2) {
      text('全部拆法', 28, '#1f2a3a', true); y += 44; room--;
      var PL = out.pairs, perRow = N >= 100000 ? 2 : 3, need = Math.ceil(PL.length / perRow), rowsN = Math.min(room, need), cut = need > rowsN;
      for (var ri = 0; ri < rowsN; ri++) {
        var seg = PL.slice(ri * perRow, ri * perRow + perRow).map(function (p) { return F(p[0]) + ' + ' + F(p[1]); }).join('    ');
        if (cut && ri === rowsN - 1) seg = '⋯ 还有 ' + F(PL.length - ri * perRow) + ' 种，完整列表在 CSV 里';
        text(seg, 23, cut && ri === rowsN - 1 ? '#858c98' : '#2d5f9a', false, MONO); y += 36;
      }
    }
    g.font = '21px ' + FF; g.fillStyle = '#858c98';
    g.fillText(clip('哥德巴赫猜想尚未被证明；前人已用机器验到 4×10¹⁸', maxW), L, H - 70);
    return cv;
  }
  $('dlPng').addEventListener('click', function () { drawCard().toBlob(function (b) { if (b) download('草稿纸上拆偶数-' + (out.ok ? out.N : '出错') + '-1080x1350.png', b); }, 'image/png'); });

  window.__gsUi = { state: function () { return JSON.parse(JSON.stringify(state)); }, out: function () { return out; }, importText: importText, drawCard: drawCard, storageKey: KEY };
  fill(); update();
})();
