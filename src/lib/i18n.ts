// ============================================================
// i18n – Chinese / English bilingual system
// ============================================================

export type Lang = 'zh' | 'en';

export interface Translations {
  // App
  appTitle: string;
  appSubtitle: string;
  langToggle: string;
  // Tabs
  tabPC: string;
  tabProb: string;
  tabFormulas: string;
  // P&C Page
  pcTitle: string;
  pcDesc: string;
  modeLinear: string;
  modeCircular: string;
  modePermutation: string;
  modeCombination: string;
  inputN: string;
  inputR: string;
  inputK: string;
  inputKHint: string;
  btnCalculate: string;
  btnRandom: string;
  btnNewQuestion: string;
  btnShowAnswer: string;
  btnCheckAnswer: string;
  labelResult: string;
  labelSteps: string;
  labelVisualize: string;
  labelPractice: string;
  labelHint: string;
  labelYourAnswer: string;
  labelCorrect: string;
  labelWrong: string;
  labelAnswer: string;
  errorNR: string;
  errorRange: string;
  circularIdentical: string;
  // Probability Page
  probTitle: string;
  probDesc: string;
  modeSingle: string;
  modeCombProb: string;
  modeBayes: string;
  inputFav: string;
  inputTotal: string;
  inputA: string;
  inputX: string;
  inputB: string;
  inputY: string;
  inputPA: string;
  inputPBgivenA: string;
  inputPBgivenAc: string;
  labelProbResult: string;
  labelDecimal: string;
  labelTree: string;
  labelBayesFormula: string;
  // Formulas Page
  formulasTitle: string;
  formulasDesc: string;
  fmPC: string;
  fmProb: string;
  fmBayes: string;
  btnTryPC: string;
  btnTryProb: string;
  // Footer
  footer: string;
  footerNote: string;
}

const zh: Translations = {
  appTitle: 'DSE P&C 概率計算器',
  appSubtitle: '排列、組合、概率互動教學工具',
  langToggle: 'EN',
  tabPC: '排列與組合',
  tabProb: '概率計算',
  tabFormulas: '公式參考',
  pcTitle: '排列與組合計算器',
  pcDesc: '支援線性排列、組合及圓形排列，配合 DSE 風格步驟解說',
  modeLinear: '線性排列 / 組合',
  modeCircular: '圓形排列',
  modePermutation: '排列 P',
  modeCombination: '組合 C',
  inputN: '總數 n',
  inputR: '選取數 r',
  inputK: '相同物件數 k',
  inputKHint: '（若有相同物件）',
  btnCalculate: '計算',
  btnRandom: '隨機練習題',
  btnNewQuestion: '新題目',
  btnShowAnswer: '顯示答案',
  btnCheckAnswer: '核對答案',
  labelResult: '結果',
  labelSteps: '計算步驟',
  labelVisualize: '視覺化',
  labelPractice: 'DSE 練習題',
  labelHint: '提示',
  labelYourAnswer: '你的答案',
  labelCorrect: '✓ 正確！',
  labelWrong: '✗ 錯誤，請再試',
  labelAnswer: '正確答案',
  errorNR: 'r 不能大於 n',
  errorRange: '請輸入有效數值（n ≥ 1，r ≥ 0）',
  circularIdentical: '含相同物件的圓排列',
  probTitle: '概率計算器',
  probDesc: '支援簡單概率、排列與組合的概率及貝葉斯定理，自動展示完整推導步驟',
  modeSingle: '簡單概率',
  modeCombProb: '排列與組合的概率',
  modeBayes: '貝葉斯定理',
  inputFav: '有利結果數',
  inputTotal: '總結果數',
  inputA: '類型 A 總數',
  inputX: '從 A 取 x 個',
  inputB: '類型 B 總數',
  inputY: '從 B 取 y 個',
  inputPA: 'P(A) = a/b',
  inputPBgivenA: 'P(B|A) = a/b',
  inputPBgivenAc: "P(B|A') = a/b",
  labelProbResult: '概率結果',
  labelDecimal: '小數近似值',
  labelTree: '樹狀圖',
  labelBayesFormula: '貝葉斯公式',
  formulasTitle: 'DSE 公式參考',
  formulasDesc: '所有 DSE 排列、組合及概率核心公式，點擊「試用」即可跳轉計算器',
  fmPC: '排列與組合',
  fmProb: '概率',
  fmBayes: '貝葉斯定理',
  btnTryPC: '試用計算器',
  btnTryProb: '試用概率',
  footer: '© DSE P&C 概率計算器',
  footerNote: '本工具僅供學習參考，不代表任何考試機構立場',
};

const en: Translations = {
  appTitle: 'DSE P&C Probability Calculator',
  appSubtitle: 'Interactive tool for Permutation, Combination & Probability',
  langToggle: '中',
  tabPC: 'P & C',
  tabProb: 'Probability',
  tabFormulas: 'Formulas',
  pcTitle: 'Permutation & Combination Calculator',
  pcDesc: 'Supports linear arrangement, combination and circular permutation with DSE-style step-by-step solutions',
  modeLinear: 'Linear P / C',
  modeCircular: 'Circular Permutation',
  modePermutation: 'Permutation P',
  modeCombination: 'Combination C',
  inputN: 'Total n',
  inputR: 'Choose r',
  inputK: 'Identical items k',
  inputKHint: '(if any identical items)',
  btnCalculate: 'Calculate',
  btnRandom: 'Random Practice',
  btnNewQuestion: 'New Question',
  btnShowAnswer: 'Show Answer',
  btnCheckAnswer: 'Check Answer',
  labelResult: 'Result',
  labelSteps: 'Steps',
  labelVisualize: 'Visualize',
  labelPractice: 'DSE Practice',
  labelHint: 'Hint',
  labelYourAnswer: 'Your Answer',
  labelCorrect: '✓ Correct!',
  labelWrong: '✗ Wrong, try again',
  labelAnswer: 'Correct Answer',
  errorNR: 'r cannot exceed n',
  errorRange: 'Please enter valid values (n ≥ 1, r ≥ 0)',
  circularIdentical: 'Circular with identical items',
  probTitle: 'Probability Calculator',
  probDesc: 'Supports simple probability, P&C probability and Bayes theorem with full derivation steps',
  modeSingle: 'Simple Probability',
  modeCombProb: 'P&C Probability',
  modeBayes: "Bayes' Theorem",
  inputFav: 'Favourable outcomes',
  inputTotal: 'Total outcomes',
  inputA: 'Type A total',
  inputX: 'Draw x from A',
  inputB: 'Type B total',
  inputY: 'Draw y from B',
  inputPA: 'P(A) = a/b',
  inputPBgivenA: 'P(B|A) = a/b',
  inputPBgivenAc: "P(B|A') = a/b",
  labelProbResult: 'Probability Result',
  labelDecimal: 'Decimal approximation',
  labelTree: 'Tree Diagram',
  labelBayesFormula: "Bayes' Formula",
  formulasTitle: 'DSE Formula Reference',
  formulasDesc: 'All core DSE P&C and Probability formulas. Click "Try" to jump to the calculator.',
  fmPC: 'Permutation & Combination',
  fmProb: 'Probability',
  fmBayes: "Bayes' Theorem",
  btnTryPC: 'Try Calculator',
  btnTryProb: 'Try Probability',
  footer: '© DSE P&C Probability Calculator',
  footerNote: 'For educational reference only.',
};

export const translations: Record<Lang, Translations> = { zh, en };
