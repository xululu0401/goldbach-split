#!/usr/bin/env python3
"""独立参考实现（不读 core.js）：用 6k±1 试除判素数（不用筛），逐个 p 检查 N−p。
   生成 tests/ref.json：每个 N 的 r、R、最小拆分、最均衡拆分、草稿纸行数；以及 4..20000 的「最难拆」纪录。
   HL 估计用 fractions 无关（是浮点公式），这里只按定义独立重算简单式，用于交叉检查 core.js 的 hlSimple。"""
import json, math, random
from pathlib import Path

def is_prime(x):
    if x < 2: return False
    if x % 2 == 0: return x == 2
    if x % 3 == 0: return x == 3
    i = 5
    while i * i <= x:
        if x % i == 0 or x % (i + 2) == 0: return False
        i += 6
    return True

def split(N):
    ps = [p for p in range(2, N // 2 + 1) if is_prime(p) and is_prime(N - p)]
    return ps

def hl_simple(N):
    C2 = 0.66016181584686957392
    f, x, d = 1.0, N, 3
    while x % 2 == 0: x //= 2
    while d * d <= x:
        if x % d == 0:
            f *= (d - 1) / (d - 2)
            while x % d == 0: x //= d
        d += 2
    if x > 1: f *= (x - 1) / (x - 2)
    l = math.log(N)
    return 2 * C2 * N / (l * (l - 2)) * f

random.seed(20261115)
Ns = sorted(set(list(range(4, 402, 2)) + [1000, 2310, 7426, 10000, 30030, 43532, 54244, 63274, 99998, 100000] +
                [random.randrange(2, 100000) * 2 for _ in range(60)]))
cases = []
for N in Ns:
    ps = split(N)
    trials = sum(1 for p in range(2, ps[0] + 1) if is_prime(p))
    cases.append({'N': N, 'r': len(ps), 'R': 2 * len(ps) - (1 if is_prime(N // 2) else 0), 'first': ps[0], 'balanced': ps[-1],
                  'trials': trials, 'hlSimple': hl_simple(N)})
rec, best = [], 0
for N in range(4, 20001, 2):
    p = next(p for p in range(2, N) if is_prime(p) and is_prime(N - p))
    if p > best: best = p; rec.append([N, p])
Path(__file__).with_name('ref.json').write_text(json.dumps({'cases': cases, 'records_to_20000': rec}))
print(len(cases), 'cases;', len(rec), 'records')
