'use strict';
/* 注入测试：对 core.js 做一处小改动，看核心测试能不能抓到。跑完自动还原。 */
const fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');
const F=path.join(__dirname,'../core.js'),src=fs.readFileSync(F,'utf8');
/* 已删除的等价变异（改了也不改变任何输出，写明原因）：
 *  i*i<=top → i*i<top：只在筛的上界恰为素数平方时有差别，本实现上界由 1024 倍增或取 N+2k，测试中不出现；
 *  hard / x3 的条件放宽：push() 自己会过滤 to===N 与 to>MAX_N；
 *  试除步长 2→1：只是变慢，结果相同；
 *  csvCell 不加引号：CSV 里没有任何字段含逗号/引号/换行。 */
const M=[
['for (var j = i * i; j <= top; j += i)','for (var j = i * 2 + i; j <= top; j += i)'],
['for (var p = 3; p <= N / 2; p += 2) if (!comp[p] && !comp[N - p]) L.push','for (var p = 3; p < N / 2; p += 2) if (!comp[p] && !comp[N - p]) L.push'],
['if (N === 4) return 1;','if (N === 4) return 0;'],
['if (!comp[N - 2]) return 2;',''],
["var rN = P.length, RN = 2 * rN - (halfPrime ? 1 : 0);","var rN = P.length, RN = 2 * rN;"],
['if (p > best) { best = p; L.push','if (p >= best) { best = p; L.push'],
['return t * (p - 1) / (p - 2);','return t * p / (p - 1);'],
['.filter(function (p) { return p > 2; })','.filter(function (p) { return p > 1; })'],
['return 2 * C2 * N / (l * (l - 2)) * hlBoost(N);','return C2 * N / (l * (l - 2)) * hlBoost(N);'],
['return 2 * s * h / 3;','return s * h / 3;'],
['s += w * x / (u * Math.log(N - x));','s += w / (u * Math.log(N - x));'],
['else if (N % 2) errors.push','else if (false) errors.push'],
['else if (N < 4) errors.push','else if (N < 2) errors.push'],
['k < 1 || k > MAX_K','k < 0 || k > MAX_K'],
['var s = String(x == null ? \'\' : x).replace(/[,，\\s_]/g, \'\');','var s = String(x == null ? \'\' : x);'],
['if (m < 4 || m > MAX_N) continue;','if (m < 4) continue;'],
["var m3 = nb.filter(function (x) { return x.m3; })","var m3 = nb.filter(function (x) { return x.cur || x.m3; })"],
["(x[1] > 1 ? String(x[1])","(x[1] > 2 ? String(x[1])"],
["var HL_MIN = 30;","var HL_MIN = 4;"],
["if (okq) break;",""],
];
let L=[],caught=0,valid=0;
try{
for(const [a,b] of M){ if(src.indexOf(a)<0){L.push('✗ 没找到注入点：'+a.slice(0,60));continue;} valid++;
 fs.writeFileSync(F,src.replace(a,b));
 let r='';try{execFileSync('node',['--test',path.join(__dirname,'core.test.cjs')],{stdio:'pipe',timeout:120000});r='漏掉';}catch(e){r='抓到';caught++;}
 L.push(r+'：'+a.slice(0,70)+' → '+b.slice(0,70));}
} finally { fs.writeFileSync(F,src); }
L.push('合计 '+caught+'/'+valid+' 抓到');console.log(L.join('\n'));
