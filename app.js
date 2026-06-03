// ── Rust Playground API ──
const PLAYGROUND_URL = 'https://play.rust-lang.org/execute';

async function runRustCode(code) {
  try {
    const resp = await fetch(PLAYGROUND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channel: 'stable',
        mode: 'debug',
        edition: '2021',
        crateType: 'bin',
        tests: false,
        code: code,
      }),
    });
    const data = await resp.json();
    return data;
  } catch (e) {
    return { success: false, stderr: 'Network error: ' + e.message };
  }
}

// ── Tutorial Data ──
const sections = [
  {
    title: '变量与不可变性',
    subtitle: 'let, mut, const, Shadowing',
    concepts: [
      { title: '默认不可变', html: '在 Rust 中，变量默认是<span class="keyword">不可变 (immutable)</span>的。一旦绑定值就不能修改——编译器帮你捕获意外的修改。' },
      { title: 'mut 关键字', html: '使用 <span class="keyword">mut</span> 显式声明可变变量。这是 Rust 的设计哲学：<span class="keyword">默认安全，显式选择灵活</span>。' },
      { title: 'Shadowing（变量遮蔽）', html: '用 <span class="keyword">let</span> 重新声明同名变量称为 Shadowing。与 mut 不同：Shadowing 可以<span class="keyword">改变类型</span>，旧变量被"遮蔽"而非修改。' },
      { title: '常量 const', html: '<span class="keyword">const</span> 定义编译期常量，<span class="keyword">必须标注类型</span>，不能使用运行时计算的值。命名惯例：全大写+下划线。' },
    ],
    defaultCode: `fn main() {
    // 1. 默认不可变
    let x = 5;
    println!("x = {}", x);
    // x = 6;  // ❌ 编译错误！

    // 2. mut 让变量可变
    let mut y = 10;
    println!("y 初始 = {}", y);
    y = 20;
    println!("y 修改后 = {}", y);

    // 3. Shadowing — 可以改变类型！
    let z = "hello";
    println!("z = {}", z);
    let z = z.len();  // 同名，类型变了
    println!("z.len() = {}", z);

    // 4. const 常量
    const MAX: u32 = 100_000;
    println!("MAX = {}", MAX);
}
`,
    quiz: {
      question: '以下哪段代码会编译失败？',
      options: [
        'let x = 1; let x = "hello";',
        'let mut x = 1; x = 2;',
        'let x = 1; x = 2;',
        'const X: i32 = 42;',
      ],
      answer: 2,
      explanation: 'x 默认不可变，不能重新赋值。要用 mut 声明或 let 做 shadowing。',
    },
  },
  {
    title: '所有权 (Ownership)',
    subtitle: 'Rust 最核心的概念',
    concepts: [
      { title: '所有权三大规则', html: '① 每个值有且只有一个<span class="keyword">所有者 (owner)</span><br>② 所有者离开作用域 → 值被<span class="keyword">自动释放 (drop)</span><br>③ 赋值/传参会触发<span class="keyword">所有权转移 (move)</span>' },
      { title: 'Move 语义', html: '对于堆上数据（如 String），赋值 = <span class="keyword">move</span>，原变量失效！这是 Rust 避免 double-free 的关键设计。' },
      { title: 'Copy vs Clone', html: '栈上数据（i32, bool 等）默认 <span class="keyword">Copy</span>，赋值自动复制。<span class="keyword">.clone()</span> 是昂贵的深拷贝，Rust 让你明确知道成本。' },
    ],
    defaultCode: `fn main() {
    // Copy — 栈数据自动复制
    let a = 42;
    let b = a;
    println!("a={}, b={}", a, b);  // a 仍可用

    // Move — String 在堆上
    let s1 = String::from("hello");
    let s2 = s1;          // s1 所有权移动
    // println!("{s1}");  // ❌ s1 已失效
    println!("s2 = {s2}");

    // Clone — 显式深拷贝
    let s3 = String::from("world");
    let s4 = s3.clone();
    println!("s3={s3}, s4={s4}");

    // 函数传参 = 所有权转移
    take_ownership(s2);
    // println!("{s2}");  // ❌

    // 返回所有权
    let s5 = give_ownership();
    println!("得到: {s5}");
}

fn take_ownership(s: String) {
    println!("获得: {s}");
}
fn give_ownership() -> String {
    String::from("给你的")
}
`,
    quiz: {
      question: 'let s2 = s1;（s1 是 String）之后，s1 还能用吗？',
      options: [
        '可以，两者指向同一数据',
        '可以，String 自动 Copy',
        '不可以，所有权已转移到 s2',
        '不可以，除非用 unsafe',
      ],
      answer: 2,
      explanation: 'String 不实现 Copy，赋值时发生 move，s1 所有权转给 s2。这是 Rust 杜绝悬垂指针和 double-free 的机制。',
    },
  },
  {
    title: '借用与引用',
    subtitle: '不转移所有权地访问数据',
    concepts: [
      { title: '引用 &', html: '<span class="keyword">&T</span> 是不可变引用，<span class="keyword">&mut T</span> 是可变引用。引用<span class="keyword">不转移所有权</span>，只是"借用"。' },
      { title: '借用规则', html: '🔒 同一时刻：要么<span class="keyword">多个不可变引用</span>，要么<span class="keyword">恰好一个可变引用</span>，两者不可并存。<br>🔒 引用必须始终有效（编译器保证）。' },
      { title: '为什么？', html: '这从根本上杜绝了<span class="keyword">数据竞争 (data race)</span> 和<span class="keyword">悬垂指针</span>。多线程安全在编译期就得到保证。' },
    ],
    defaultCode: `fn main() {
    let mut s = String::from("hello");

    // 不可变引用 — 可以有多个
    let r1 = &s;
    let r2 = &s;
    println!("{r1} {r2}");

    // 可变引用
    let r3 = &mut s;
    r3.push_str(" world");
    println!("{r3}");

    // 借用规则示例
    let mut x = 10;
    let y = &x;
    let z = &x;
    println!("{y} {z}");  // y,z 不再使用

    let w = &mut x;       // ✅ y,z 已过期
    *w += 1;
    println!("w = {w}");
}
`,
    quiz: {
      question: '以下哪段代码违反借用规则？',
      options: [
        'let r1 = &x; let r2 = &x; println!("{r1}{r2}"); let r3 = &mut x;',
        'let r1 = &mut x; *r1 = 5; println!("{r1}");',
        'let r1 = &x; let r2 = &mut x;',
        'let r1 = &x; println!("{r1}"); let r2 = &mut x;',
      ],
      answer: 2,
      explanation: '不能同时持有不可变引用和可变引用。A 和 D 中 r1/r2 在可变引用创建前已 last use，NLL 允许。C 同时存在，编译失败。',
    },
  },
  {
    title: '结构体与 impl',
    subtitle: '自定义数据类型和方法',
    concepts: [
      { title: 'struct 定义', html: '<span class="keyword">struct</span> 定义自定义类型。三种形式：具名字段、元组结构体、单元结构体。' },
      { title: 'impl 块', html: '<span class="keyword">impl</span> 为类型添加方法。第一个参数：<span class="keyword">&self</span>（读）、<span class="keyword">&mut self</span>（写）、<span class="keyword">self</span>（消耗）。' },
      { title: '关联函数 & derive', html: '不带 self 的是<span class="keyword">关联函数</span>（如 String::from()）。<span class="keyword">#[derive(Debug)]</span> 自动实现 trait。' },
    ],
    defaultCode: `#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    fn new(w: u32, h: u32) -> Self {
        Self { width: w, height: h }
    }

    fn area(&self) -> u32 {
        self.width * self.height
    }

    fn can_hold(&self, other: &Rectangle) -> bool {
        self.width > other.width
         && self.height > other.height
    }

    fn scale(&mut self, factor: u32) {
        self.width *= factor;
        self.height *= factor;
    }
}

fn main() {
    let r1 = Rectangle::new(30, 50);
    let r2 = Rectangle { width: 10, height: 20 };

    println!("r1 = {r1:?}");
    println!("面积 = {}", r1.area());
    println!("能容纳r2？{}", r1.can_hold(&r2));

    let mut r3 = Rectangle::new(5, 5);
    r3.scale(3);
    println!("缩放后 = {r3:?}");
}
`,
  },
  {
    title: '枚举与模式匹配',
    subtitle: 'enum, match, if let',
    concepts: [
      { title: '强大的 enum', html: 'Rust 的 <span class="keyword">enum</span> 是代数数据类型。每个变体可以<span class="keyword">携带不同类型的数据</span>——比 C 的 enum 强大得多。' },
      { title: 'match 穷尽性', html: '<span class="keyword">match</span> 是 Rust 最强大的控制流。编译器<span class="keyword">强制处理所有可能的变体</span>，少一个 = 编译错误。' },
      { title: 'if let 语法糖', html: '<span class="keyword">if let</span> 只关心一种模式时更简洁。let-else（Rust 1.65+）也能在不可能匹配时提前返回。' },
    ],
    defaultCode: `#[derive(Debug)]
enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
    ChangeColor(i32, i32, i32),
}

impl Message {
    fn call(&self) {
        match self {
            Message::Quit => println!("退出"),
            Message::Move { x, y } =>
                println!("→ ({x}, {y})"),
            Message::Write(t) =>
                println!("写: {t}"),
            Message::ChangeColor(r, g, b) =>
                println!("颜色({r},{g},{b})"),
        }
    }
}

fn main() {
    let msgs = vec![
        Message::Write("hello".into()),
        Message::Move { x: 10, y: 20 },
        Message::ChangeColor(255, 0, 128),
        Message::Quit,
    ];
    for msg in &msgs { msg.call(); }

    // if let 语法糖
    if let Message::Write(t) = &msgs[0] {
        println!("捕获: {t}");
    }
}
`,
    quiz: {
      question: 'match 最重要的安全特性是什么？',
      options: [
        '自动排序分支提高性能',
        '编译器强制穷尽所有可能的变体',
        '支持正则表达式匹配',
        '自动转换数据类型',
      ],
      answer: 1,
      explanation: 'match 的穷尽性检查让重构和扩展枚举时非常安全——忘记处理某个变体直接报编译错误。',
    },
  },
  {
    title: 'Option & Result',
    subtitle: 'Rust 没有 null，没有异常',
    concepts: [
      { title: 'Option&lt;T&gt;', html: '<span class="keyword">Option&lt;T&gt;</span> 替代 null：<span class="keyword">Some(T)</span> 有值，<span class="keyword">None</span> 无值。编译器强制处理 None 情况。' },
      { title: 'Result&lt;T,E&gt;', html: '<span class="keyword">Result&lt;T,E&gt;</span> 替代异常：<span class="keyword">Ok(T)</span> 成功，<span class="keyword">Err(E)</span> 失败。错误处理是显式的。' },
      { title: '? 运算符', html: '<span class="keyword">?</span> 是最优雅的错误传播方式：Ok → 取出值，Err → 提前返回。只能在返回 Result/Option 的函数中用。' },
    ],
    defaultCode: `fn main() {
    let nums = vec![10, 20, 30];
    let r = get(&nums, 1);
    let m = get(&nums, 5);

    // match 处理 Option
    match r { Some(v) => println!("{v}"), None => {} }
    println!("默认: {}", m.unwrap_or(0));

    // Result
    println!("10/2 = {:?}", divide(10., 2.));
    println!("10/0 = {:?}", divide(10., 0.));

    // ? 运算符
    match calc() {
        Ok(v) => println!("结果: {v}"),
        Err(e) => println!("出错: {e}"),
    }
}

fn get(v: &[i32], i: usize) -> Option<i32> {
    if i < v.len() { Some(v[i]) } else { None }
}

fn divide(a: f64, b: f64) -> Result<f64, String> {
    if b == 0.0 { Err("除零".into()) }
    else { Ok(a / b) }
}

fn calc() -> Result<f64, String> {
    let x = divide(100., 5.)?; // Ok?取出值
    let y = divide(x, 2.)?;
    Ok(y + 1.)
}
`,
    quiz: {
      question: '? 运算符的作用是什么？',
      options: [
        '打印错误信息',
        'Ok 时取出值，Err 时提前返回错误',
        '将 Result 转换为 Option',
        '忽略错误继续执行',
      ],
      answer: 1,
      explanation: '? 是 Rust 错误传播的核心：Ok(v)→v，Err(e)→return Err(e.into())。让错误处理既简洁又安全。',
    },
  },
  {
    title: '泛型与 Trait',
    subtitle: '多态与代码复用',
    concepts: [
      { title: '泛型 Generics', html: '<span class="keyword">泛型</span> 让你编写适用于多种类型的代码。编译时<span class="keyword">单态化 (monomorphization)</span>，零运行时开销。' },
      { title: 'Trait', html: '<span class="keyword">trait</span> 定义共享行为接口。类似 interface 但更强大——可以<span class="keyword">为外部类型实现 trait</span>（孤儿规则除外）。' },
      { title: 'Trait Bound', html: '<span class="keyword">&lt;T: Trait&gt;</span> 约束泛型参数。<span class="keyword">impl Trait</span> 是语法糖。标准库核心 trait：Debug, Clone, PartialEq, Iterator...' },
    ],
    defaultCode: `trait Summary {
    fn summarize(&self) -> String;
}

struct Article { title: String, body: String }
struct Tweet { user: String, text: String }

impl Summary for Article {
    fn summarize(&self) -> String {
        format!("{} ...", &self.body[..30.min(self.body.len())])
    }
}
impl Summary for Tweet {
    fn summarize(&self) -> String {
        format!("@{}: {}", self.user, self.text)
    }
}

// trait bound
fn notify<T: Summary>(item: &T) {
    println!("📢 {}", item.summarize());
}
// 语法糖
fn notify2(item: &impl Summary) {
    println!("📢 {}", item.summarize());
}

fn main() {
    let a = Article {
        title: "Rust入门".into(),
        body: "Rust是系统编程语言...".into(),
    };
    let t = Tweet {
        user: "rustlang".into(),
        text: "Rust 1.85!".into(),
    };
    println!("{}", a.summarize());
    notify(&t);
}
`,
  },
  {
    title: '生命周期基础',
    subtitle: '引用的有效期',
    concepts: [
      { title: '生命周期标注', html: '<span class="keyword">\'a</span> 告诉编译器多个引用之间的关系。大多数时候编译器能自动推断（省略规则）。' },
      { title: '何时需要', html: '函数返回引用，且编译器无法判断返回引用与哪个输入关联时——需要标注来保证<span class="keyword">返回引用不会比被引用数据活得长</span>。' },
    ],
    defaultCode: `// 需要标注：返回引用，两者都可能
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}

// 结构体持有引用时需要
#[derive(Debug)]
struct Excerpt<'a> {
    part: &'a str,
}

fn main() {
    let s1 = "短";
    let s2 = "长字符串";
    println!("较长: {}", longest(s1, s2));

    let novel = "从前有座山。山上有座庙。";
    let e = Excerpt { part: &novel[..15] };
    println!("{e:?}");

    // 编译器在编译期保证：
    // 如果 novel 被 drop，e 不能再用
    println!("✅ 生命周期检查通过！");
}
`,
    quiz: {
      question: '什么时候需要手动标注生命周期？',
      options: [
        '所有函数都需要',
        '用了引用的就需要',
        '编译器无法推断返回引用与输入的关系时',
        '只有结构体定义需要',
      ],
      answer: 2,
      explanation: '省略规则覆盖了大多数情况。只有返回引用且编译器无法确定与哪个输入关联时才需要手动标注。',
    },
  },
  {
    title: '综合练习',
    subtitle: '把学到的概念组合起来',
    concepts: [
      { title: '综合运用', html: '下面是一个任务管理器。综合使用了<span class="keyword">struct、enum、impl、Vec、Option、Result、match、借用</span>。试着读代码、运行、修改——添加新功能试试。' },
    ],
    defaultCode: `#[derive(Debug, Clone)]
struct Task { id: u32, title: String, done: bool }

struct TodoApp { tasks: Vec<Task>, next: u32 }

impl TodoApp {
    fn new() -> Self { Self { tasks: vec![], next: 1 } }

    fn add(&mut self, title: String) {
        self.tasks.push(Task {
            id: self.next, title, done: false,
        });
        self.next += 1;
    }

    fn list(&self) {
        if self.tasks.is_empty() {
            println!("📭 列表为空");
            return;
        }
        for t in &self.tasks {
            let s = if t.done { "✅" } else { "⏳" };
            println!("  {} [#{}] {}", s, t.id, t.title);
        }
    }

    fn complete(&mut self, id: u32) -> Result<(), String> {
        match self.tasks.iter_mut().find(|t| t.id == id) {
            Some(t) => { t.done = true; Ok(()) }
            None => Err(format!("未找到 #{id}")),
        }
    }

    fn remove(&mut self, id: u32) -> Result<(), String> {
        match self.tasks.iter().position(|t| t.id == id) {
            Some(i) => {
                let t = self.tasks.remove(i);
                println!("🗑️ 删除 #{id}: {}", t.title);
                Ok(())
            }
            None => Err(format!("未找到 #{id}")),
        }
    }
}

fn main() {
    let mut app = TodoApp::new();
    app.add("学 Rust 所有权".into());
    app.add("理解借用与引用".into());
    app.add("掌握枚举与匹配".into());
    app.list();

    let _ = app.complete(1);
    let _ = app.remove(3);
    app.list();

    match app.complete(99) {
        Err(e) => println!("{e}"),
        _ => {}
    }
    println!("🎉 综合练习完成！");
}
`,
  },
];

// ── Build UI ──
let currentIdx = 0;

function buildAll() {
  const main = document.getElementById('main');
  main.innerHTML = '';

  sections.forEach((sec, idx) => {
    const div = document.createElement('div');
    div.className = 'section' + (idx === 0 ? ' active' : '');
    div.id = 'sec-' + idx;

    let html = `<h2>${sec.title}</h2><p class="subtitle">${sec.subtitle}</p>`;

    // Concept cards
    if (sec.concepts) {
      sec.concepts.forEach(c => {
        html += `<div class="concept-card"><h4>${c.title}</h4><p>${c.html}</p></div>`;
      });
    }

    // Code block
    const escapedCode = sec.defaultCode.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    html += `
      <div class="code-block">
        <div class="code-header">
          <span>📝 可编辑 &amp; 运行</span>
          <button class="run-btn" data-idx="${idx}">▶ 运行</button>
        </div>
        <textarea class="code" id="code-${idx}" spellcheck="false">${escapedCode}</textarea>
        <div class="output-block" id="out-${idx}"></div>
      </div>`;

    // Quiz
    if (sec.quiz) {
      html += `
        <div class="quiz" id="quiz-${idx}">
          <h4>🧠 ${sec.quiz.question}</h4>
          ${sec.quiz.options.map((opt, oi) => `
            <button class="quiz-option" onclick="checkAnswer(${idx},${oi})">${String.fromCharCode(65+oi)}. ${opt}</button>
          `).join('')}
          <div class="quiz-feedback" id="fb-${idx}"></div>
        </div>`;
    }

    div.innerHTML = html;
    main.appendChild(div);
  });
}

// ── Switch Section ──
function switchSection(idx, pushState = true) {
  if (idx === currentIdx && document.getElementById('sec-' + idx).classList.contains('active')) return;

  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  const sec = document.getElementById('sec-' + idx);
  if (sec) sec.classList.add('active');

  currentIdx = idx;
  document.getElementById('chapterSelect').value = idx;
  document.getElementById('prevBtn').disabled = (idx === 0);
  document.getElementById('nextBtn').disabled = (idx === sections.length - 1);

  if (pushState && window.history) {
    history.pushState({ idx }, '', '#c' + (idx + 1));
  }

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Select change ──
document.getElementById('chapterSelect').addEventListener('change', function() {
  switchSection(parseInt(this.value));
});

// ── Prev / Next ──
document.getElementById('prevBtn').addEventListener('click', () => {
  if (currentIdx > 0) switchSection(currentIdx - 1);
});
document.getElementById('nextBtn').addEventListener('click', () => {
  if (currentIdx < sections.length - 1) switchSection(currentIdx + 1);
});

// ── Run Code ──
async function executeCode(idx) {
  const btn = document.querySelector(`.run-btn[data-idx="${idx}"]`);
  const out = document.getElementById('out-' + idx);
  const code = document.getElementById('code-' + idx).value;

  btn.classList.add('running');
  btn.textContent = '⏳ 编译中';
  out.textContent = '正在编译运行...';
  out.className = 'output-block info';

  const result = await runRustCode(code);

  btn.classList.remove('running');
  btn.textContent = '▶ 运行';

  if (result.success) {
    let text = result.stdout || '';
    const stderr = (result.stderr || '').replace(/^\s+|\s+$/g, '');
    // Only include stderr if it's not just the normal compile/run lines
    if (stderr && !stderr.match(/^\s*(Compiling|Finished|Running)\s/)) {
      text += (text ? '\n' : '') + stderr;
    }
    if (!text.trim()) text = '(无输出)';
    out.textContent = text;
    out.className = 'output-block success';
  } else {
    const stderr = result.stderr || '编译失败';
    out.textContent = stderr;
    out.className = 'output-block error';
  }

  // Scroll output into view
  out.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Bind run buttons via event delegation
document.getElementById('main').addEventListener('click', function(e) {
  const btn = e.target.closest('.run-btn');
  if (!btn) return;
  executeCode(parseInt(btn.dataset.idx));
});

// ── Quiz ──
function checkAnswer(sectionIdx, optionIdx) {
  const quiz = document.getElementById('quiz-' + sectionIdx);
  const options = quiz.querySelectorAll('.quiz-option');
  const feedback = document.getElementById('fb-' + sectionIdx);
  const sec = sections[sectionIdx];

  options.forEach(o => o.classList.add('done'));

  if (optionIdx === sec.quiz.answer) {
    options[optionIdx].classList.add('correct');
    feedback.innerHTML = '✅ 正确！' + sec.quiz.explanation;
    feedback.style.color = '#a6e3a1';
  } else {
    options[optionIdx].classList.add('wrong');
    options[sec.quiz.answer].classList.add('correct');
    feedback.innerHTML = '❌ 不对。答案是 ' + String.fromCharCode(65+sec.quiz.answer) + '。' + sec.quiz.explanation;
    feedback.style.color = '#f38ba8';
  }

  // Scroll quiz into view
  feedback.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ── FAB: scroll to top ──
const fab = document.getElementById('fabTop');
fab.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

let scrollTicking = false;
window.addEventListener('scroll', () => {
  if (!scrollTicking) {
    requestAnimationFrame(() => {
      fab.classList.toggle('show', window.scrollY > 400);
      scrollTicking = false;
    });
    scrollTicking = true;
  }
}, { passive: true });

// ── Keyboard navigation (desktop) ──
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft' && currentIdx > 0) {
    e.preventDefault();
    switchSection(currentIdx - 1);
  } else if (e.key === 'ArrowRight' && currentIdx < sections.length - 1) {
    e.preventDefault();
    switchSection(currentIdx + 1);
  }
});

// ── Touch: swipe left/right ──
let touchStartX = 0;
document.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
}, { passive: true });
document.addEventListener('touchend', (e) => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) < 60) return;
  if (dx < 0 && currentIdx < sections.length - 1) {
    switchSection(currentIdx + 1);
  } else if (dx > 0 && currentIdx > 0) {
    switchSection(currentIdx - 1);
  }
}, { passive: true });

// ── Handle history popstate ──
window.addEventListener('popstate', (e) => {
  if (e.state && typeof e.state.idx === 'number') {
    switchSection(e.state.idx, false);
  }
});

// ── Init ──
buildAll();

// Check URL hash on init
const hash = window.location.hash;
const hashMatch = hash.match(/^#c(\d+)$/);
if (hashMatch) {
  const idx = parseInt(hashMatch[1]) - 1;
  if (idx >= 0 && idx < sections.length) {
    switchSection(idx, false);
  }
}
