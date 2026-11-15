# 草稿纸上拆偶数

哥德巴赫猜想说大于 2 的偶数都能拆成两个素数相加。填一个偶数（4 到 10,000,000），看它在草稿纸上从 2 开始一个个素数往上试、怎么被试出来；一共有几种拆法；和左右邻居比谁多；和 Hardy–Littlewood 猜想公式估的差多少；4 到 N 里谁最难拆。

- 打开 `index.html` 即可使用，纯本地计算，不联网。
- 计算核心 `core.js`，界面 `ui.js`，`node build.cjs` 由 `template.html` 产出 `index.html`。
- 测试：`node --test tests/core.test.cjs`；`tests/ref.py` 是不用筛、只用试除的独立参考实现，生成 `tests/ref.json`；拆法数与最难拆纪录另与 OEIS A065577、A025018、A025019 对过。
- 哥德巴赫猜想至今没有被证明。本页只对一个数做验算；猜想公式本身也是猜想下的近似。
