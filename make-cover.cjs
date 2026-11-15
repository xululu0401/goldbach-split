/* 封面 cover.svg（1200×1200），读数来自 core.js 同一次 compute；再用浏览器截成 cover.png。 */
const fs = require('node:fs');
const A = require('./core.js');
const o = A.compute(A.defaultState());
if (!o.ok) throw new Error('默认场景算不出来');
const F = "-apple-system,'PingFang SC','Microsoft YaHei',sans-serif", M = "'SF Mono',Menlo,Consolas,monospace";
let grid = '';
for (let x = 0; x <= 1200; x += 40) grid += `<line x1="${x}" y1="0" x2="${x}" y2="1200" stroke="#e3e8f0"/>`;
for (let y = 0; y <= 1200; y += 40) grid += `<line x1="0" y1="${y}" x2="1200" y2="${y}" stroke="#e3e8f0"/>`;
let rows = '';
o.trials.forEach((t, i) => {
  const y = 600 + i * 56;
  if (t.ok) rows += `<rect x="110" y="${y - 40}" width="980" height="54" fill="#fff2b3"/>`;
  rows += `<text x="130" y="${y}" font-family="${M}" font-size="38" font-weight="${t.ok ? 800 : 400}" fill="${t.ok ? '#2b7a4b' : '#4b5566'}">98 − ${t.p} = ${t.q}${t.ok ? '  素数 ✓' : '  = ' + t.f + '  ✗'}</text>`;
});
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200">
  <rect width="1200" height="1200" fill="#fbfaf4"/>${grid}
  <rect x="90" y="0" width="4" height="1200" fill="#e8a7a0"/>
  <text x="130" y="200" font-family="${F}" font-size="108" font-weight="800" fill="#1f2a3a">草稿纸上拆偶数</text>
  <text x="130" y="275" font-family="${F}" font-size="38" fill="#4b5566">随手一个偶数，拆成两个素数有几种办法</text>
  <text x="130" y="440" font-family="${F}" font-size="128" font-weight="800" fill="#1f2a3a">98 = ${o.first[0]} + ${o.first[1]}</text>
  <text x="130" y="520" font-family="${F}" font-size="36" fill="#2d5f9a" font-weight="700">共 ${o.r} 种 · 从 2 试到第 ${o.trials.length} 个素数才成</text>
  ${rows}
  <text x="130" y="1130" font-family="${F}" font-size="26" fill="#858c98">哥德巴赫猜想尚未被证明；本页只对一个数验算</text>
</svg>`;
fs.writeFileSync('cover.svg', svg);
fs.writeFileSync('/tmp/gs-cover.html', '<!DOCTYPE html><html><head><meta charset="utf-8"><style>html,body{margin:0}</style></head><body>' + svg + '</body></html>');
console.log('cover.svg', svg.length);
