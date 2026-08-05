const tips = [
  '先抓概念，再做题，避免只背公式。',
  '每次学习后，用一句话总结你刚才学会了什么。',
  '把错题按“知识点”分类，复习会更高效。',
  '把复杂问题拆成小步骤，数学会变得更清晰。'
];

const tipButton = document.getElementById('tipButton');
const tipText = document.getElementById('tipText');
const quizFeedback = document.getElementById('quizFeedback');
const quizTitle = document.getElementById('quizTitle');
const quizPrompt = document.getElementById('quizPrompt');
const quizOptionsContainer = document.getElementById('quizOptions');
const nextQuizBtn = document.getElementById('nextQuizBtn');
const uploadInput = document.getElementById('questionImage');
const analyzeImageBtn = document.getElementById('analyzeImageBtn');
const uploadPreview = document.getElementById('uploadPreview');
const analysisStatus = document.getElementById('analysisStatus');
const ocrText = document.getElementById('ocrText');
const analysisAnswer = document.getElementById('analysisAnswer');
const analysisExplanation = document.getElementById('analysisExplanation');
const themeToggle = document.getElementById('themeToggle');
const questionTitle = document.getElementById('questionTitle');
const questionList = document.getElementById('questionList');
const topicPills = document.querySelectorAll('.topic-pill');
const difficultyPills = document.querySelectorAll('.difficulty-pill');
const progressSummary = document.getElementById('progressSummary');
const clearProgressBtn = document.getElementById('clearProgressBtn');
const showMistakesBtn = document.getElementById('showMistakesBtn');
const mistakeList = document.getElementById('mistakeList');
const resourceButtons = document.querySelectorAll('.resource-item');
const resourceDetail = document.getElementById('resourceDetail');
const plannerChecks = document.querySelectorAll('.planner-check');
const plannerSummary = document.getElementById('plannerSummary');
const STORAGE_KEY = 'math-practice-progress';
const PLANNER_STORAGE_KEY = 'math-planner-state';
let currentTopic = '高等数学';
let currentDifficulty = 'easy';
let currentQuestions = [];
let progressState = {};

function loadProgress() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progressState));
}

function loadPlannerState() {
  try {
    const saved = localStorage.getItem(PLANNER_STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function savePlannerState(plannerState) {
  localStorage.setItem(PLANNER_STORAGE_KEY, JSON.stringify(plannerState));
}

function getProgressKey(topic, difficulty) {
  return `${topic}::${difficulty}`;
}

function updateProgressSummary() {
  if (!progressSummary) return;
  const completed = currentQuestions.filter((q) => q.status !== 'pending').length;
  const mastered = currentQuestions.filter((q) => q.status === 'mastered').length;
  const review = currentQuestions.filter((q) => q.status === 'review').length;
  progressSummary.textContent = `已做 ${completed} 题 · 已掌握 ${mastered} · 待复习 ${review}`;
}

function updatePlannerSummary(plannerState) {
  if (!plannerSummary) return;
  const total = plannerChecks.length;
  const completed = Object.values(plannerState).filter(Boolean).length;
  plannerSummary.textContent = `已完成 ${completed} / ${total} 项`;
}

function renderMistakes() {
  if (!mistakeList) return;
  const mistakes = [];
  Object.entries(progressState).forEach(([key, statuses]) => {
    Object.entries(statuses).forEach(([index, status]) => {
      if (status === 'review') {
        const [topic, difficulty] = key.split('::');
        mistakes.push({ topic, difficulty, index: Number(index) });
      }
    });
  });

  if (mistakes.length === 0) {
    mistakeList.innerHTML = '<div class="mistake-item">暂时没有错题，继续做题后会显示在这里。</div>';
    return;
  }

  mistakeList.innerHTML = mistakes.map((item) => `
    <div class="mistake-item">
      <strong>${item.topic}</strong> · ${item.difficulty === 'hard' ? '进阶' : item.difficulty === 'medium' ? '中等' : '基础'}
      <div>第 ${Number(item.index) + 1} 题：需要重点复习。</div>
    </div>
  `).join('');
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function renderKnowledgeContent(topic) {
  const knowledgeMap = {
    高等数学: {
      definition: '极限是描述函数在靠近某点时变化趋势的概念；连续则要求函数值与极限值一致。',
      theorem: '微积分基本定理把导数和积分联系起来，说明求导与积分互为逆运算。',
      formula: 'f\'(x)=lim(h→0) [f(x+h)-f(x)]/h，且 ∫ f(x)dx = F(x)+C。',
      imageCaption: '图像说明：曲线在某点附近的切线斜率反映导数，下面的面积表示积分。',
      proofIdea: '先用极限理解局部变化，再用导数刻画变化率，最后通过积分建立整体累计关系。'
    },
    线性代数: {
      definition: '向量是有方向和大小的量，矩阵则是描述线性变换的结构化工具。',
      theorem: '若矩阵 A 可逆，则方程 Ax=b 总有唯一解；这等价于 det(A) ≠ 0。',
      formula: 'Ax=b，且 det(A) ≠ 0 时，解唯一存在。',
      imageCaption: '图像说明：向量在坐标平面中表示方向和长度，矩阵则可看作对空间的变换。',
      proofIdea: '从线性变换的角度出发，先理解矩阵如何作用于向量，再用行列式判断是否可逆。'
    },
    微分方程: {
      definition: '微分方程是包含未知函数及其导数的方程，用来刻画变化过程。',
      theorem: '一阶线性微分方程可通过积分因子或分离变量的方法求解。',
      formula: 'y\' = ky，解为 y = Ce^(kx)。',
      imageCaption: '图像说明：斜率场展示了不同点处解曲线的变化方向。',
      proofIdea: '先识别方程类型，再选择合适的方法求解，并用初值条件确定特解。',
    },
    概率统计: {
      definition: '随机变量是把随机现象映射为数值变量的工具。',
      theorem: '期望与方差刻画随机变量的集中趋势和波动程度。',
      formula: 'E(X)=Σ xP(X=x)，Var(X)=E[(X-μ)^2]。',
      imageCaption: '图像说明：柱状图展示概率分布，曲线越集中说明波动越小。',
      proofIdea: '从概率分布出发，先定义期望，再用方差刻画离散程度，最后建立统计推断。'
    }
  };

  const content = knowledgeMap[topic] || knowledgeMap.高等数学;
  const definitionEl = document.getElementById('definitionContent');
  const theoremEl = document.getElementById('theoremContent');
  const formulaEl = document.getElementById('formulaContent');
  const imageEl = document.getElementById('knowledgeImage');
  const imageCaptionEl = document.getElementById('imageCaption');
  const proofEl = document.getElementById('proofContent');

  if (definitionEl) definitionEl.textContent = content.definition;
  if (theoremEl) theoremEl.textContent = content.theorem;
  if (formulaEl) formulaEl.textContent = content.formula;
  if (imageCaptionEl) imageCaptionEl.textContent = content.imageCaption;
  if (proofEl) proofEl.textContent = content.proofIdea;

  if (imageEl) {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="320" viewBox="0 0 600 320">
        <rect x="0" y="0" width="600" height="320" rx="24" fill="#eef4ff" />
        <path d="M80 240 C150 170, 220 140, 300 160 S450 220, 520 100" stroke="#4f6df5" stroke-width="4" fill="none" />
        <circle cx="300" cy="160" r="8" fill="#4f6df5" />
        <line x1="300" y1="160" x2="420" y2="120" stroke="#162033" stroke-width="2" stroke-dasharray="6 6" />
        <text x="80" y="70" font-size="28" fill="#162033">${topic}</text>
        <text x="80" y="105" font-size="19" fill="#5f6b82">核心结构示意</text>
      </svg>`;
    imageEl.src = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
    imageEl.alt = `${topic}专题图像`;
  }
}

function cleanOcrText(text) {
  return (text || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function generateAnalysis(ocrTextValue) {
  const text = cleanOcrText(ocrTextValue).toLowerCase();

  if (text.includes('导数') || text.includes('求导')) {
    return {
      answerHtml: `
        <div class="answer-sheet">
          <div class="answer-line"><span class="answer-label">解：</span>先对函数逐项求导，再把题目给定的点代入导函数。</div>
          <div class="answer-line">若函数为 <span class="formula">f(x)=ax²+bx+c</span>，则 <span class="formula">f'(x)=2ax+b</span>。</div>
          <div class="answer-line">在 <span class="formula">x=x₀</span> 处，所求导数为 <span class="formula">f'(x₀)=2ax₀+b</span>。</div>
          <div class="answer-line"><span class="answer-label">结论：</span>将题中具体数值代入后即可得到最终答案。</div>
        </div>
      `,
      explanationHtml: `
        <div class="answer-sheet">
          <div class="step">① 先判断题目是求导还是求某点处导数；若是“某点处导数”，需要先求出导函数，再代入该点。</div>
          <div class="step">② 对多项式函数逐项求导：幂函数 <span class="formula">axⁿ</span> 的导数为 <span class="formula">anxⁿ⁻¹</span>。</div>
          <div class="step">③ 将取值点代入导函数，得到最终结果。</div>
          <div class="step">④ 最后整理成最简形式，并写出结论。</div>
        </div>
      `
    };
  }

  if (text.includes('积分') || text.includes('不定积分')) {
    return {
      answerHtml: `
        <div class="answer-sheet">
          <div class="answer-line"><span class="answer-label">解：</span>把积分式拆开，分别求原函数。</div>
          <div class="answer-line">对多项式项 <span class="formula">∫ axⁿ dx = a/(n+1) xⁿ⁺¹ + C</span>。</div>
          <div class="answer-line">最后把各项结果合并，并在结尾加上常数 <span class="formula">C</span>。</div>
          <div class="answer-line"><span class="answer-label">结论：</span>所得结果即为原函数的一般表达式。</div>
        </div>
      `,
      explanationHtml: `
        <div class="answer-sheet">
          <div class="step">① 先观察积分式中有哪些项；每一项都要分别求原函数。</div>
          <div class="step">② 记住基本积分公式：<span class="formula">∫ xⁿ dx = xⁿ⁺¹/(n+1)+C</span>。</div>
          <div class="step">③ 系数和幂次都会影响最后结果，计算时不要漏掉。</div>
          <div class="step">④ 结果要写成完整表达式，并保留常数项 <span class="formula">C</span>。</div>
        </div>
      `
    };
  }

  if (text.includes('矩阵') || text.includes('点积') || text.includes('特征值')) {
    return {
      answerHtml: `
        <div class="answer-sheet">
          <div class="answer-line"><span class="answer-label">解：</span>先判断题目属于向量运算、矩阵运算还是特征值问题。</div>
          <div class="answer-line">若为点积，则按对应分量相乘后求和，例如 <span class="formula">(x₁,y₁)·(x₂,y₂)=x₁x₂+y₁y₂</span>。</div>
          <div class="answer-line">若为特征值，则写出 <span class="formula">det(A-λI)=0</span>，再解出 <span class="formula">λ</span>。</div>
          <div class="answer-line"><span class="answer-label">结论：</span>按题目所求给出最终结果。</div>
        </div>
      `,
      explanationHtml: `
        <div class="answer-sheet">
          <div class="step">① 先识别题型，避免把点积、秩和特征值混为一谈。</div>
          <div class="step">② 点积只需要对应分量相乘后求和；矩阵题要看是否考查秩或可逆性。</div>
          <div class="step">③ 特征值题要建立特征方程，并求出特征根。</div>
          <div class="step">④ 最后写出结论，语句尽量规范，符合考试答题要求。</div>
        </div>
      `
    };
  }

  if (text.includes('概率') || text.includes('方差') || text.includes('期望') || text.includes('标准差')) {
    return {
      answerHtml: `
        <div class="answer-sheet">
          <div class="answer-line"><span class="answer-label">解：</span>先判断题目所求是期望、方差还是标准差。</div>
          <div class="answer-line">若已知方差，则标准差为 <span class="formula">σ = √Var(X)</span>。</div>
          <div class="answer-line">若题目给出期望与方差，则按定义逐步计算，最终写出结果。</div>
          <div class="answer-line"><span class="answer-label">结论：</span>答案要写成规范统计量形式。</div>
        </div>
      `,
      explanationHtml: `
        <div class="answer-sheet">
          <div class="step">① 先把题干中的已知量和所求量对应起来。</div>
          <div class="step">② 期望、方差、标准差的定义不能混淆。</div>
          <div class="step">③ 若已知方差，标准差通常是其平方根。</div>
          <div class="step">④ 最后给出规范书写的结果。</div>
        </div>
      `
    };
  }

  if (text.includes('连续') || text.includes('极限')) {
    return {
      answerHtml: `
        <div class="answer-sheet">
          <div class="answer-line"><span class="answer-label">解：</span>判断连续性时，需同时检查三点。</div>
          <div class="answer-line">① 函数在该点有定义；② 极限存在；③ 极限值等于函数值。</div>
          <div class="answer-line">若三个条件都满足，则该点连续；否则不连续。</div>
          <div class="answer-line"><span class="answer-label">结论：</span>写出“在该点连续/不连续”的结论。</div>
        </div>
      `,
      explanationHtml: `
        <div class="answer-sheet">
          <div class="step">① 先看函数在该点是否有定义。</div>
          <div class="step">② 再判断极限是否存在。</div>
          <div class="step">③ 最后比对极限值与函数值是否相等。</div>
          <div class="step">④ 对多项式函数，通常在定义域内处处连续。</div>
        </div>
      `
    };
  }

  return {
    answerHtml: `
      <div class="answer-sheet">
        <div class="answer-line"><span class="answer-label">解：</span>根据题干内容，先判断题型，再按对应的数学步骤书写答案。</div>
        <div class="answer-line">若题面较清晰，建议把题干中的关键条件重新输入，系统将给出更准确的标准答案。</div>
        <div class="answer-line"><span class="answer-label">结论：</span>请把关键步骤写成规范答题格式。</div>
      </div>
    `,
    explanationHtml: `
      <div class="answer-sheet">
        <div class="step">① 先确认题目所求是什么。</div>
        <div class="step">② 依据相关定义或公式进行推导。</div>
        <div class="step">③ 最后整理成考试式书写格式。</div>
      </div>
    `
  };
}

function renderUploadedAnalysis(file) {
  if (!analysisStatus || !ocrText || !analysisAnswer || !analysisExplanation) return;
  analysisStatus.textContent = '正在识别题目内容...';
  analysisAnswer.textContent = '正在生成答案...';
  analysisExplanation.textContent = '正在生成解析...';

  const fallbackResult = generateAnalysis(file.name || '');

  if (!window.Tesseract || typeof window.Tesseract.recognize !== 'function') {
    analysisStatus.textContent = '未检测到 OCR 识别库，已切换为完整解析模板。';
    ocrText.textContent = `上传文件：${file.name || '未知题目图片'}`;
    analysisAnswer.textContent = fallbackResult.answer;
    analysisExplanation.textContent = fallbackResult.explanation;
    return;
  }

  window.Tesseract.recognize(file, 'chi_sim')
    .then(({ data }) => {
      const detectedText = cleanOcrText(data.text || '');
      const result = generateAnalysis(detectedText || file.name || '');
      ocrText.textContent = detectedText || '未能从图片中识别出文字，但已根据题型生成完整解析。';
      analysisAnswer.innerHTML = result.answerHtml;
      analysisExplanation.innerHTML = result.explanationHtml;
      analysisStatus.textContent = '识别完成，下面是根据题干类型生成的完整答案与解析。';
    })
    .catch(() => {
      ocrText.textContent = `上传文件：${file.name || '未知题目图片'}`;
      analysisAnswer.innerHTML = fallbackResult.answerHtml;
      analysisExplanation.innerHTML = fallbackResult.explanationHtml;
      analysisStatus.textContent = '识别过程中出现问题，已切换为完整解析模板。';
    });
}

function createQuizItem() {
  const quizBank = [
    {
      title: '快速判断题',
      prompt: '若函数在某点可导，那么它在该点一定连续。你认为这个说法是否正确？',
      options: ['正确', '错误'],
      answer: '正确'
    },
    {
      title: '选择题',
      prompt: '下面哪个表达式表示导数的定义？',
      options: ['f\'(x)=lim(h→0) (f(x+h)-f(x))/h', 'f\'(x)=∫f(x)dx', 'f\'(x)=f(x+1)-f(x)'],
      answer: 'f\'(x)=lim(h→0) (f(x+h)-f(x))/h'
    },
    {
      title: '简答题',
      prompt: '简述为什么多项式函数在定义域内处处连续。',
      options: ['因为它们是由有限次幂函数构成', '因为它们没有极限', '因为它们只在某些点有定义'],
      answer: '因为它们是由有限次幂函数构成'
    }
  ];

  return quizBank[Math.floor(Math.random() * quizBank.length)];
}

function renderQuiz() {
  const item = createQuizItem();
  if (!quizTitle || !quizPrompt || !quizOptionsContainer || !quizFeedback) return;
  quizTitle.textContent = item.title;
  quizPrompt.textContent = item.prompt;
  quizOptionsContainer.innerHTML = '';
  quizFeedback.textContent = '选择一个选项后查看解释。';

  item.options.forEach((option) => {
    const button = document.createElement('button');
    button.className = 'quiz-option';
    button.textContent = option;
    button.addEventListener('click', () => {
      const isCorrect = option === item.answer;
      quizFeedback.textContent = isCorrect
        ? `正确！${item.title}中，${item.answer}是最合适的答案。`
        : `再想一想。正确答案应为 ${item.answer}。`;
      quizOptionsContainer.querySelectorAll('.quiz-option').forEach((btn) => {
        btn.classList.remove('correct', 'wrong');
        if (btn.textContent === item.answer) {
          btn.classList.add('correct');
        } else if (btn === button) {
          btn.classList.add('wrong');
        }
      });
    });
    quizOptionsContainer.appendChild(button);
  });
}

function createQuestions(topic, difficulty) {
  const questions = [];
  const level = difficulty === 'hard' ? 2 : difficulty === 'medium' ? 1 : 0;

  if (topic === '高等数学') {
    const a = randomInt(1 + level, 4 + level);
    const b = randomInt(-3 - level, 3 + level);
    const c = randomInt(1, 6 + level);
    const x0 = randomInt(1, 4 + level);
    questions.push({
      type: '计算题',
      question: `求函数 f(x) = ${a}x^2 + ${b}x + ${c} 在 x = ${x0} 处的导数。`,
      answer: `f'(x) = ${2 * a}x + ${b}，所以 f'(${x0}) = ${2 * a * x0 + b}。`,
      explanation: '先对多项式逐项求导，二次项导数是 2ax，一次项导数是 b，常数项导数为 0。然后把取值点代入即可。',
      status: 'pending'
    });

    const m = randomInt(2 + level, 5 + level);
    const n = randomInt(1 + level, 4 + level);
    questions.push({
      type: '计算题',
      question: `计算不定积分 ∫(${m}x^2 + ${n}x)dx。`,
      answer: `∫(${m}x^2 + ${n}x)dx = ${m / 3}x^3 + ${n / 2}x^2 + C。`,
      explanation: '积分时分别对每一项求原函数，x^2 的原函数是 x^3/3，x 的原函数是 x^2/2，最后加上常数 C。',
      status: 'pending'
    });

    const p = randomInt(1, 3 + level);
    questions.push({
      type: '判断题',
      question: `判断函数 f(x) = x^2 - ${p}x + 1 在 x = ${p} 处是否连续。`,
      answer: '连续。',
      explanation: '多项式函数在定义域内处处连续，所以在任何点都连续。',
      status: 'pending'
    });

    questions.push({
      type: '证明题',
      question: '证明多项式函数在其定义域内处处连续。',
      answer: '因为多项式函数由有限个幂函数与常数项构成，而幂函数和常数函数都连续，连续函数的有限和仍连续。',
      explanation: '此题考查连续函数的运算性质，关键是把多项式分解为有限个连续函数的和与积。',
      status: 'pending'
    });
  }

  if (topic === '线性代数') {
    const a = randomInt(1 + level, 4 + level);
    const b = randomInt(1 + level, 4 + level);
    const c = randomInt(-3 - level, 3 + level);
    const d = randomInt(-2 - level, 2 + level);
    questions.push({
      type: '计算题',
      question: `求向量 (${a}, ${b}) 和 (${c}, ${d}) 的点积。`,
      answer: `点积为 ${a * c + b * d}。`,
      explanation: '点积是对应分量相乘后求和，公式为 x1x2 + y1y2。',
      status: 'pending'
    });

    questions.push({
      type: '判断题',
      question: '判断矩阵 [[1, 2], [0, 1]] 的秩。',
      answer: '秩为 2。',
      explanation: '该矩阵有两行且两列都线性无关，因此秩等于 2。',
      status: 'pending'
    });

    const e = randomInt(1 + level, 3 + level);
    questions.push({
      type: '计算题',
      question: `求矩阵 [[${e}, 1], [0, ${e}]] 的特征值。`,
      answer: `特征值为 ${e}（重根）。`,
      explanation: '对角矩阵的特征值就是对角线元素，因此两个特征值都等于 e。',
      status: 'pending'
    });

    questions.push({
      type: '小题',
      question: '写出一个 2×2 的可逆矩阵，并说明它为什么可逆。',
      answer: '例如矩阵 [[1, 2], [0, 1]] 可逆，因为其行列式为 1，不等于 0。',
      explanation: '若行列式不为 0，则矩阵可逆。',
      status: 'pending'
    });
  }

  if (topic === '微分方程') {
    const k = randomInt(1 + level, 4 + level);
    questions.push({
      type: '计算题',
      question: `解一阶微分方程 y' = ${k}y。`,
      answer: `y = Ce^{${k}x}。`,
      explanation: '把变量分离后积分即可，得到通解 y = Ce^{kx}。',
      status: 'pending'
    });

    questions.push({
      type: '判断题',
      question: '判断方程 y" + 4y = 0 的通解形式。',
      answer: 'y = C1 cos 2x + C2 sin 2x。',
      explanation: '对应特征方程 r^2 + 4 = 0，解得 r = ±2i，因此通解是三角函数形式。',
      status: 'pending'
    });

    const r = randomInt(1 + level, 3 + level);
    questions.push({
      type: '综合题',
      question: `建立一个描述增长过程的简单微分方程模型：y' = ${r}y。`,
      answer: '模型表示增长率与当前数量成正比。',
      explanation: '当 y 的变化率与 y 本身成正比时，就可以用 y\' = ky 来表示，常用于人口增长和细胞分裂模型。',
      status: 'pending'
    });
  }

  if (topic === '概率统计') {
    const mu = randomInt(2 + level, 6 + level);
    const variance = randomInt(1 + level, 5 + level);
    questions.push({
      type: '计算题',
      question: `若随机变量 X 的期望为 ${mu}，方差为 ${variance}，求其标准差。`,
      answer: `标准差为 √${variance} ≈ ${Math.sqrt(variance).toFixed(2)}。`,
      explanation: '标准差是方差的平方根，记为 σ = √Var(X)。',
      status: 'pending'
    });

    questions.push({
      type: '小题',
      question: '判断离散分布与连续分布的主要区别。',
      answer: '离散分布的取值是离散的，连续分布的取值可以在某区间内连续变化。',
      explanation: '离散分布通常对应计数变量，而连续分布对应测量变量。',
      status: 'pending'
    });

    const n = randomInt(3 + level, 7 + level);
    const p = (randomInt(1 + level, 5 + level) / 10).toFixed(1);
    questions.push({
      type: '综合题',
      question: `给出一个包含 ${n} 次试验、成功概率为 ${p} 的二项分布情境。`,
      answer: `可设 X ~ B(${n}, ${p})，表示 ${n} 次独立试验中成功次数。`,
      explanation: '二项分布适合描述固定次数的重复试验，其中每次成功概率相同。',
      status: 'pending'
    });
  }

  return questions;
}

function applySavedStatus(questions, key) {
  const saved = progressState[key] || {};
  return questions.map((item, index) => ({
    ...item,
    status: saved[index] || 'pending'
  }));
}

function renderQuestions(topic, difficulty) {
  if (!questionTitle || !questionList) return;
  currentTopic = topic;
  currentDifficulty = difficulty;
  const key = getProgressKey(topic, difficulty);
  const questions = applySavedStatus(createQuestions(topic, difficulty), key);
  currentQuestions = questions;
  questionTitle.textContent = `${topic} · ${difficulty === 'hard' ? '进阶' : difficulty === 'medium' ? '中等' : '基础'}练习题`;
  questionList.innerHTML = '';

  questions.forEach((item, index) => {
    const li = document.createElement('li');
    li.className = 'question-item';
    li.innerHTML = `
      <div class="question-card">
        <p><strong>${index + 1}. [${item.type}] ${item.question}</strong></p>
        <div class="status-actions">
          <button class="status-btn ${item.status === 'mastered' ? 'active' : ''}" data-action="mastered">✅ 已掌握</button>
          <button class="status-btn ${item.status === 'review' ? 'active' : ''}" data-action="review">🔁 还需复习</button>
        </div>
        <button class="answer-toggle">查看完整答案</button>
        <div class="answer-box">
          <p><strong>答案：</strong>${item.answer}</p>
          <p><strong>解析：</strong>${item.explanation}</p>
        </div>
      </div>
    `;

    const toggleButton = li.querySelector('.answer-toggle');
    const answerBox = li.querySelector('.answer-box');
    const statusButtons = li.querySelectorAll('.status-btn');

    toggleButton.addEventListener('click', () => {
      const isVisible = answerBox.classList.toggle('is-visible');
      toggleButton.textContent = isVisible ? '收起答案' : '查看完整答案';
    });

    statusButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const newStatus = button.dataset.action;
        const targetKey = getProgressKey(currentTopic, currentDifficulty);
        const savedStatuses = progressState[targetKey] || {};
        savedStatuses[index] = newStatus;
        progressState[targetKey] = savedStatuses;
        item.status = newStatus;
        saveProgress();
        updateProgressSummary();
        renderQuestions(currentTopic, currentDifficulty);
      });
    });

    questionList.appendChild(li);
  });

  updateProgressSummary();
  renderMistakes();
}

progressState = loadProgress();

if (clearProgressBtn) {
  clearProgressBtn.addEventListener('click', () => {
    progressState = {};
    saveProgress();
    renderQuestions(currentTopic, currentDifficulty);
    renderMistakes();
  });
}

if (nextQuizBtn) {
  nextQuizBtn.addEventListener('click', renderQuiz);
}

if (uploadInput && analyzeImageBtn && uploadPreview) {
  uploadInput.addEventListener('change', (event) => {
    const [file] = event.target.files || [];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      uploadPreview.src = e.target.result;
      uploadPreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  });

  analyzeImageBtn.addEventListener('click', () => {
    const [file] = uploadInput.files || [];
    if (!file) {
      if (analysisStatus) {
        analysisStatus.textContent = '请先选择一张题目图片。';
      }
      return;
    }
    renderUploadedAnalysis(file);
  });
}

renderQuiz();

if (showMistakesBtn) {
  showMistakesBtn.addEventListener('click', () => {
    if (mistakeList) {
      mistakeList.style.display = mistakeList.style.display === 'block' ? 'none' : 'block';
      renderMistakes();
    }
  });
}

let plannerState = loadPlannerState();

plannerChecks.forEach((checkbox) => {
  checkbox.checked = Boolean(plannerState[checkbox.dataset.goal]);
  checkbox.addEventListener('change', () => {
    plannerState[checkbox.dataset.goal] = checkbox.checked;
    savePlannerState(plannerState);
    updatePlannerSummary(plannerState);
  });
});

updatePlannerSummary(plannerState);

const resourceContent = {
  notes: {
    title: '课堂笔记模板',
    text: '建议把每节课的关键定义、例题和易错点分成“概念 / 例子 / 易错点”三栏，复习时会更高效。',
    link: 'high-math.html',
    linkText: '前往高等数学专题'
  },
  formula: {
    title: '公式速查表',
    text: '重点整理导数公式、积分公式、矩阵运算规则和概率分布公式，方便快速回忆。',
    link: 'linear-algebra.html',
    linkText: '前往线性代数专题'
  },
  quiz: {
    title: '章节自测题',
    text: '建议每学完一个章节就做 3~5 道题，重点检测是否真正掌握概念与方法。',
    link: 'differential-equations.html',
    linkText: '前往微分方程专题'
  },
  plan: {
    title: '复习节奏建议',
    text: '按“基础理解 → 例题训练 → 错题复盘 → 周末总结”的顺序推进，复习效率会明显提升。',
    link: 'probability-statistics.html',
    linkText: '前往概率统计专题'
  }
};

resourceButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const resource = button.dataset.resource;
    const content = resourceContent[resource];
    if (!resourceDetail || !content) return;
    resourceDetail.innerHTML = `
      <h3>${content.title}</h3>
      <p>${content.text}</p>
      <a href="${content.link}">${content.linkText} →</a>
    `;
  });
});

if (tipButton && tipText) {
  tipButton.addEventListener('click', () => {
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    tipText.textContent = randomTip;
  });
}

if (themeToggle) {
  const savedTheme = localStorage.getItem('math-theme') || 'light';
  document.body.setAttribute('data-theme', savedTheme);
  themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

  themeToggle.addEventListener('click', () => {
    const nextTheme = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', nextTheme);
    localStorage.setItem('math-theme', nextTheme);
    themeToggle.textContent = nextTheme === 'dark' ? '☀️' : '🌙';
  });
}

const revealItems = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.12 });

revealItems.forEach((item) => observer.observe(item));

topicPills.forEach((pill) => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('.topic-pill').forEach((item) => item.classList.remove('active'));
    pill.classList.add('active');
    renderQuestions(pill.dataset.topic, currentDifficulty);
  });
});

difficultyPills.forEach((pill) => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('.difficulty-pill').forEach((item) => item.classList.remove('active'));
    pill.classList.add('active');
    currentDifficulty = pill.dataset.difficulty;
    renderQuestions(currentTopic, currentDifficulty);
  });
});

renderKnowledgeContent(document.body.dataset.topic || '高等数学');

if (questionList && questionTitle) {
  const firstTopic = topicPills[0]?.dataset.topic || '高等数学';
  renderQuestions(firstTopic, currentDifficulty);
}
