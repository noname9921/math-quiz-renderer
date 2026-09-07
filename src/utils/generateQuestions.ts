// generateQuestions.ts

// ============ UTILS ============

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function choice<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sample<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n);
}

function permutations<T>(arr: T[]): T[][] {
  if (arr.length <= 1) return [arr];
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const p of permutations(rest)) {
      result.push([arr[i], ...p]);
    }
  }
  return result;
}

// ============ GLOBALS ============

const shapePattern: Record<number, string> = {
  0: "square",
  1: "rect",
  2: "isoceles_triangle",
  3: "eq_triangle",
  4: "right_triangle",
};

const reverseShapePattern: Record<string, number> = Object.fromEntries(
  Object.entries(shapePattern).map(([k, v]) => [v, Number(k)])
);

const dates: Record<number, string> = {
  0: "Chủ nhật",
  1: "Thứ Hai",
  2: "Thứ Ba",
  3: "Thứ Tư",
  4: "Thứ Năm",
  5: "Thứ Sáu",
  6: "Thứ Bảy",
};

const themes: Record<number, string[]> = {
  1: ["quả cam", "quả táo", "quả nho", "quả dứa", "quả dâu tây"],
  2: ["học sinh", "giáo viên"],
  3: ["chiếc bút bi", "chiếc bút chì", "chiếc thước kẻ", "cục tẩy"],
};

// ============ SECTION 1 ============

function generatePatternList(
  length: number,
  incRange: [number, number] = [2, 4],
  baseRange: [number, number] = [0, 8],
  forceLinear = false,
  modulo = -1
): number[] {
  const seq: number[] = [];
  const patternType = forceLinear ? "linear" : choice(["intertwined", "linear"]);

  const genInc = () => {
    if (modulo === -1) return randInt(incRange[0], incRange[1]);
    let inc = randInt(incRange[0], incRange[1]);
    while (inc % modulo === 0) inc = randInt(incRange[0], incRange[1]);
    return inc;
  };

  if (patternType === "linear") {
    const inc = genInc();
    const base = randInt(baseRange[0], baseRange[1]);
    for (let i = 0; i < length; i++) seq.push(base + i * inc);
    return seq;
  }

  // intertwined
  const l1: number[] = [];
  const l2: number[] = [];
  const inc = genInc();
  let base = 0;
  for (let i = 0; i < length; i++) l1.push(base + i * inc);
  base = length * inc + 1;
  for (let i = 0; i < length; i++) l2.push(base - i * inc);

  let i = 0;
  for (i = 0; i < Math.floor(length / 2); i++) {
    seq.push(l1[i]);
    seq.push(l2[i]);
  }
  if (seq.length < length) seq.push(l1[i]);
  return seq;
}

interface PatternQuestion {
  type: "numbers" | "rotations" | "shapes";
  sequence: (number | string)[];
  answer: number | string;
}

function generatePatternQuestion(): PatternQuestion {
  const theme = choice(["shapes", "numbers"]);
  let length = randInt(5, 12);
  let seq = generatePatternList(length);

  if (theme === "numbers") {
    return { type: "numbers", sequence: seq.slice(0, -1), answer: seq[seq.length - 1] };
  }

  const modulo = randInt(2, 4);
  const base = randInt(0, 3);

  const randomPattern = choice(["rotation", "shapes"]);
  let rotations = generatePatternList(length, [90, 90], [0, 0], true);
  rotations = rotations.map((x) => ((x % 360) + 360) % 360);

  if (randomPattern === "rotation") {
    return { type: "rotations", sequence: rotations.slice(0, -1), answer: rotations[rotations.length - 1] };
  }

  length = randInt(4, 8);
  seq = generatePatternList(length, undefined, undefined, true, modulo);
  const modSeq = seq.map((x) => (((x + base) % modulo) + modulo) % modulo);
  const shapeSeq = modSeq.map((x) => shapePattern[x]);

  return { type: "shapes", sequence: shapeSeq.slice(0, -1), answer: shapeSeq[shapeSeq.length - 1] };
}

interface DateQuestion {
  type: "dates";
  from_today_amount: number;
  from_today: number;
  today: number;
  question: number;
  base_direction: "forward" | "backward";
  question_direction: "forward" | "backward";
  answer: number;
}

function generateDateQuestion(): DateQuestion {
  const baseDtype = choice<"forward" | "backward">(["forward", "backward"]);
  const questionDtype = choice<"forward" | "backward">(["forward", "backward"]);

  const amount = randInt(0, 6);
  const afterAmounts = randInt(1, 6);
  const questionAmount = randInt(2, 6);
  const today = (((afterAmounts - amount * (baseDtype === "forward" ? 1 : -1)) % 7) + 7) % 7;
  const answer = ((today + questionAmount * (questionDtype === "forward" ? 1 : -1)) % 7 + 7) % 7;

  return {
    type: "dates",
    from_today_amount: amount,
    from_today: afterAmounts,
    today,
    question: questionAmount,
    base_direction: baseDtype,
    question_direction: questionDtype,
    answer,
  };
}

interface ArithmeticQuestion {
  type: "logic_arithmetic";
  num1: number;
  num2: number;
  unit1: string;
  unit2: string;
  answer: number;
}

function generateArithmeticQuestion(): ArithmeticQuestion {
  const theme = randInt(1, 3);
  const num1 = randInt(0, 20);
  const num2 = randInt(0, 20);
  const unit1 = choice(themes[theme]);
  const unit2 = choice(themes[theme]);

  return { type: "logic_arithmetic", num1, num2, unit1, unit2, answer: num1 + num2 };
}

type Section1Question = PatternQuestion | DateQuestion | ArithmeticQuestion;

function generateSection1(questionCount = 5): Section1Question[] {
  const questions: Section1Question[] = [];
  for (let i = 0; i < questionCount; i++) {
    const qType = choice(["pattern", "date", "arithmetic"]);
    if (qType === "date") questions.push(generateDateQuestion());
    else if (qType === "pattern") questions.push(generatePatternQuestion());
    else questions.push(generateArithmeticQuestion());
  }
  return questions;
}

// ============ SECTION 2 ============

interface OpsArithQuestion {
  type: "ops-arith";
  expr: string;
  ans: number;
}

function generateArithQuestion(
  ops = 3,
  ranges: [number, number][] = [
    [0, 15],
    [0, 15],
    [0, 15],
    [0, 10],
  ]
): OpsArithQuestion {
  let answer = -1;
  let expr = "";
  while (answer < 0) {
    expr = String(randInt(ranges[0][0], ranges[0][1]));
    const parts: (string | number)[] = [Number(expr)];
    for (let i = 0; i < ops - 1; i++) {
      const op = choice(["+", "-"]);
      const val = randInt(ranges[i][0], ranges[i][1]);
      expr += op + val;
      parts.push(op, val);
    }
    answer = evalExpr(expr);
  }
  return { type: "ops-arith", expr, ans: answer };
}

// safe left-to-right +/- evaluator (avoids JS eval)
function evalExpr(expr: string): number {
  const tokens = expr.match(/\d+|\+|-/g) ?? [];
  let result = Number(tokens[0]);
  for (let i = 1; i < tokens.length; i += 2) {
    const op = tokens[i];
    const val = Number(tokens[i + 1]);
    result = op === "+" ? result + val : result - val;
  }
  return result;
}

interface FindMissingQuestion {
  type: "find-missing" | "find-missing-both-side";
  lhs: string;
  rhs: string;
  missing_op: "+" | "-";
  answer: number;
}

function generateFindMissingQuestion(
  ranges: [number, number][] = [
    [0, 15],
    [0, 15],
    [0, 15],
  ],
  bothSide = false
): FindMissingQuestion {
  let lhs = "-1";
  let rhs = "";
  let rhsVal = -1;
  let lhsVal = -1;

  do {
    lhs = String(randInt(ranges[0][0], ranges[0][1]));
    lhsVal = Number(lhs);
    if (!bothSide) {
      rhs = String(randInt(ranges[1][0], ranges[1][1] * 3));
      rhsVal = Number(rhs);
    } else {
      const a = randInt(ranges[2][0], ranges[2][1]);
      const op = choice(["+", "-"]);
      const b = randInt(ranges[2][0], ranges[2][1]);
      rhs = `${a} ${op} ${b}`;
      rhsVal = op === "+" ? a + b : a - b;
    }
  } while (lhsVal < 0 || rhsVal < 0 || rhsVal - lhsVal < 0 || rhsVal + lhsVal < 0);

  const missingOp = choice<"+" | "-">(["+", "-"]);
  const missing = missingOp === "+" ? rhsVal - lhsVal : rhsVal + lhsVal;

  return {
    type: bothSide ? "find-missing-both-side" : "find-missing",
    lhs,
    rhs,
    missing_op: missingOp,
    answer: missing,
  };
}

type Section2Question = OpsArithQuestion | FindMissingQuestion;

function generateSection2(questionCount = 25): Section2Question[] {
  const questions: Section2Question[] = [];
  for (let i = 0; i < questionCount; i++) {
    const qType = choice(["3ops_arith", "4ops_arith", "find_missing", "find_missing_both_side"]);
    if (qType === "3ops_arith") questions.push(generateArithQuestion());
    else if (qType === "4ops_arith") questions.push(generateArithQuestion(4));
    else if (qType === "find_missing") questions.push(generateFindMissingQuestion());
    else questions.push(generateFindMissingQuestion(undefined, true));
  }
  return questions;
}

// ============ SECTION 3 ============

interface NthPatternQuestion {
  type: "nth-pattern";
  display: number[];
  n: number;
  ans: number;
}

function generateNthPatternQuestion(): NthPatternQuestion {
  const length = randInt(8, 12);
  const n = randInt(Math.max(length - 3, 1), 10);
  const cutoff = randInt(3, Math.max(n - 2, 3));
  const seq = generatePatternList(length * 2, [2, 3], [2, 4], true);
  const displaySeq = seq.slice(0, cutoff);
  const ans = seq[n];
  return { type: "nth-pattern", display: displaySeq, n: n + 1, ans };
}

interface NumbersTheoryQuestion {
  type: "numbers_theory";
  max_min: "max" | "min";
  odd_even: "even" | "odd" | "";
  dcount: string;
  key: string;
  answer: number;
}

function generateNumbersQuestion(): NumbersTheoryQuestion {
  const nums: Record<string, number> = {
    "max-2-digit": 99,
    "max-odd-2-digit": 99,
    "max-even-2-digit": 98,
    "max-1-digit": 9,
    "max-odd-1-digit": 9,
    "max-even-1-digit": 8,
    "min-2-digit": 10,
    "min-odd-2-digit": 11,
    "min-even-2-digit": 10,
    "min-1-digit": 0,
    "min-odd-1-digit": 1,
    "min-even-1-digit": 0,
  };

  const maxMin = choice<"max" | "min">(["max", "min"]);
  const oddEven = choice<"even" | "odd" | "">(["even", "odd", ""]);
  const dcount = choice<"1-digit" | "2-digit">(["1-digit", "2-digit"]);
  const prop = `${maxMin}${oddEven ? `-${oddEven}` : ""}-${dcount}`;
  const num = nums[prop];

  return {
    type: "numbers_theory",
    max_min: maxMin,
    odd_even: oddEven,
    dcount: dcount === "1-digit" ? "1 chữ số" : "2 chữ số",
    key: prop,
    answer: num,
  };
}

interface CompareSequenceQuestion {
  type: "compare_sequence";
  sequence: number[];
  sign: ">" | "<";
  larger_smaller: string;
  target: number;
  answer: number;
}

function generateCompareSequence(): CompareSequenceQuestion {
  const largerSmaller = choice<">" | "<">([">", "<"]);
  const target = randInt(15, 40);
  const length = randInt(5, 12);
  const seq: number[] = [];
  for (let i = 0; i < length; i++) seq.push(randInt(20, 30));

  let count = 0;
  for (const x of seq) {
    if (largerSmaller === ">" ? x > target : x < target) count++;
  }

  return {
    type: "compare_sequence",
    sequence: seq,
    sign: largerSmaller,
    larger_smaller: largerSmaller === ">" ? "lớn hơn" : "nhỏ hơn",
    target,
    answer: count,
  };
}

type Section3Question = NthPatternQuestion | NumbersTheoryQuestion | CompareSequenceQuestion;

function generateSection3(questionCount = 25): Section3Question[] {
  const questions: Section3Question[] = [];
  for (let i = 0; i < questionCount; i++) {
    const qType = choice(["nth_pattern", "number_theory", "cmp_sequence"]);
    if (qType === "nth_pattern") questions.push(generateNthPatternQuestion());
    else if (qType === "number_theory") questions.push(generateNumbersQuestion());
    else questions.push(generateCompareSequence());
  }
  return questions;
}

// ============ SECTION 4 (cubes) ============

type Cube3D = number[][][]; // [z][y][x]
type Grid2D = number[][];

function makeCube(zCount: number, yCount: number, xCount: number): Cube3D {
  return Array.from({ length: zCount }, () =>
    Array.from({ length: yCount }, () =>
      Array.from({ length: xCount }, () => randInt(0, 1))
    )
  );
}

function validate(cube: Cube3D): boolean {
  for (const layer of cube) {
    for (const row of layer) {
      for (const v of row) {
        if (v === 1) return true;
      }
    }
  }
  return false;
}

function reverseCube(cube: Cube3D): Cube3D {
  return [...cube].reverse().map((layer) => layer.map((row) => [...row].reverse()));
}

function countVisible3d(grid: Cube3D, axis: "x" | "y" | "z"): number {
  const zCount = grid.length;
  const yCount = grid[0].length;
  const xCount = grid[0][0].length;

  let countX = 0;
  const collapsedX: number[][] = [];
  for (let z = 0; z < zCount; z++) {
    const row: number[] = [];
    for (let y = 0; y < yCount; y++) {
      row.push(grid[z][y].includes(1) ? 1 : 0);
    }
    collapsedX.push(row);
  }

  const collapsedY: number[][] = [];
  for (let z = 0; z < zCount; z++) {
    const row: number[] = [];
    for (let x = 0; x < xCount; x++) {
      const hasOne = Array.from({ length: yCount }, (_, y) => grid[z][y][x] === 1).some(Boolean);
      row.push(hasOne ? 1 : 0);
    }
    collapsedY.push(row);
  }

  const collapsedZ: number[][] = [];
  for (let y = 0; y < yCount; y++) {
    const row: number[] = [];
    for (let x = 0; x < xCount; x++) {
      const hasOne = Array.from({ length: zCount }, (_, z) => grid[z][y][x] === 1).some(Boolean);
      row.push(hasOne ? 1 : 0);
    }
    collapsedZ.push(row);
  }

  countX = collapsedX.flat().reduce((a, b) => a + b, 0);
  const countY = collapsedY.flat().reduce((a, b) => a + b, 0);
  const countZ = collapsedZ.flat().reduce((a, b) => a + b, 0);

  return axis === "x" ? countX : axis === "y" ? countY : countZ;
}

interface CountMaterialsQuestion {
  type: "count_materials";
  cube_front: Cube3D;
  cube_back: Cube3D;
  count: number;
}

function generateCountCubes(): CountMaterialsQuestion {
  const zCount = 2;
  const yCount = randInt(1, 3);
  const xCount = randInt(1, 2);

  let cube = makeCube(zCount, yCount, xCount);
  while (!validate(cube)) cube = makeCube(zCount, yCount, xCount);

  const reverse = reverseCube(cube);

  let count = 0;
  for (const layer of cube) {
    for (const row of layer) {
      count += row.reduce((a, b) => a + b, 0);
    }
  }

  return { type: "count_materials", cube_front: cube, cube_back: reverse, count };
}

interface CountVisibleQuestion {
  type: "count_visible";
  cube_front: Cube3D;
  cube_back: Cube3D;
  face: string;
  axis: "x" | "y" | "z";
  count: number;
}

function generateCountFromFace(): CountVisibleQuestion {
  const zCount = 2;
  const yCount = randInt(1, 3);
  const xCount = randInt(1, 2);

  let cube = makeCube(zCount, yCount, xCount);
  while (!validate(cube)) cube = makeCube(zCount, yCount, xCount);

  const reverse = reverseCube(cube);

  const face = choice(["trước", "sau", "trái", "phải", "trên", "dưới"]);
  const dirMap: Record<string, "x" | "y" | "z"> = {
    trước: "z",
    sau: "z",
    trái: "x",
    phải: "x",
    trên: "y",
    dưới: "y",
  };
  const dir = dirMap[face];
  const count = countVisible3d(cube, dir);

  return { type: "count_visible", cube_front: cube, cube_back: reverse, face, axis: dir, count };
}

interface Count2dQuestion {
  type: "count_2d";
  grid: Grid2D;
  answer: number;
}

function generate2dStructCount(): Count2dQuestion {
  let count = 0;
  const grid: Grid2D = Array.from({ length: 5 }, () =>
    Array.from({ length: 5 }, () => randInt(0, 1))
  );
  for (const row of grid) {
    for (const v of row) {
      if (v === 1) count++;
    }
  }
  return { type: "count_2d", grid, answer: count + 1 };
}

type Section4Question = CountMaterialsQuestion | CountVisibleQuestion | Count2dQuestion;

function generateQuestionsS4(questionCount = 25): Section4Question[] {
  const questions: Section4Question[] = [];
  for (let i = 0; i < questionCount; i++) {
    const qType = choice(["count_cube", "count_face", "count_2d"]);
    if (qType === "count_cube") questions.push(generateCountCubes());
    else if (qType === "count_face") questions.push(generateCountFromFace());
    else questions.push(generate2dStructCount());
  }
  return questions;
}

// ============ SECTION 5 ============

interface CombinatoricsArithQuestion {
  type: "combinatorics_arithmetic";
  num: number;
  unit_count: number;
  unit: string;
  answer: number;
}

function generateArithCombinatoric(): CombinatoricsArithQuestion {
  const theme = randInt(1, 3);
  const unitCount = randInt(1, 5);
  let num = randInt(0, 30);
  while (num % unitCount !== 0) num = randInt(0, 30);
  const unit = choice(themes[theme]);
  const div = Math.round(num / unitCount);

  return { type: "combinatorics_arithmetic", num, unit_count: unitCount, unit, answer: div };
}

interface FindOrderQuestion {
  type: "find_order";
  seq: number[];
  descending_ascending: string;
  num_keyword: string;
  nth: number;
  num: number;
}

function sortSeqFindOrder(): FindOrderQuestion {
  const length = randInt(4, 8);
  const seq = Array.from({ length }, () => randInt(4, 16));
  const descending = choice([true, false]);
  const sorted = [...seq].sort((a, b) => (descending ? b - a : a - b));
  const nth = randInt(2, length);
  const num = sorted[nth - 1];

  return {
    type: "find_order",
    seq,
    descending_ascending: descending ? "giảm dần" : "tăng dần",
    num_keyword: descending ? "lớn nhất" : "nhỏ nhất",
    nth,
    num,
  };
}

interface ChessGamesQuestion {
  type: "chess_games";
  people_count: number;
  count: number;
}

function generateChessQuestion(): ChessGamesQuestion {
  const peopleCount = randInt(2, 5);
  const count = (peopleCount * (peopleCount - 1)) / 2;
  return { type: "chess_games", people_count: peopleCount, count };
}

interface SumDigitsPermsQuestion {
  type: "sum_digits_perms";
  sum: number;
  digits: number[];
  gen_nums: number[];
}

function generateDigitsQuestion(): SumDigitsPermsQuestion {
  const dcount = randInt(2, 3);
  const digits = sample([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], dcount);
  const nums = permutations(digits).map((p) => Number(p.join("")));
  const sum = nums.reduce((a, b) => a + b, 0);
  return { type: "sum_digits_perms", sum, digits, gen_nums: nums };
}

type Section5Question =
  | CombinatoricsArithQuestion
  | FindOrderQuestion
  | ChessGamesQuestion
  | SumDigitsPermsQuestion;

function generateQuestionsS5(questionCount = 25): Section5Question[] {
  const questions: Section5Question[] = [];
  for (let i = 0; i < questionCount; i++) {
    const qType = choice(["arith", "sort", "chess", "perms"]);
    if (qType === "arith") questions.push(generateArithCombinatoric());
    else if (qType === "sort") questions.push(sortSeqFindOrder());
    else if (qType === "chess") questions.push(generateChessQuestion());
    else questions.push(generateDigitsQuestion());
  }
  return questions;
}

// ============ DISTRACTORS ============

function getNumbersAround(num: number, range: [number, number] = [-8, 8]): number {
  let offset: number;
  do {
    offset = randInt(0 > range[0] ? range[0] : 0, range[1]);
  } while (offset === 0 || Number(num) + offset < 0);
  return Number(num) + offset;
}

function makeMcOptions(
  correct: number,
  genDistractor: (correct: number, range: [number, number]) => number,
  n = 3,
  maxTries = 100,
  range: [number, number] = [-8, 8]
): { letter: string; options: number[] } {
  const wrong = new Set<number>();
  let tries = 0;
  while (wrong.size < n) {
    const w = genDistractor(correct, range);
    if (w !== correct) wrong.add(w);
    tries++;
    if (tries > maxTries) throw new Error("couldn't generate enough distinct distractors");
  }

  const options = shuffle([correct, ...Array.from(wrong)]);
  const letter = "ABCD"[options.indexOf(correct)];
  return { letter, options };
}

// ============ CONSTRUCT QUESTIONS ============

export interface BuiltQuestion {
  title: string;
  below_title: unknown;
  type: string;
  answer: string;
  answerA: string | number;
  answerB: string | number;
  answerC: string | number;
  answerD: string | number;
}

type RawQuestion =
  | Section1Question
  | Section2Question
  | Section3Question
  | Section4Question
  | Section5Question;

function constructQuestions(rawQuestions: RawQuestion[]): BuiltQuestion[] {
  const questions: BuiltQuestion[] = [];

  for (const i of rawQuestions) {
    if (i.type === "logic_arithmetic") {
      const { letter, options } = makeMcOptions(i.answer, getNumbersAround);
      const unitStr = i.unit1 === i.unit2 ? i.unit1 : `${i.unit1} và ${i.unit2}`;
      questions.push({
        title: `Tôi có ${i.num1} ${i.unit1} và ${i.num2} ${i.unit2}. Hỏi có tổng ${unitStr}?`,
        below_title: null,
        type: "arithmetic",
        answer: letter,
        answerA: options[0], answerB: options[1], answerC: options[2], answerD: options[3],
      });
    }
    if (i.type === "numbers") {
      const { letter, options } = makeMcOptions(i.answer as number, getNumbersAround);
      questions.push({
        title: `Cho dãy số dưới. Hỏi số tiếp theo là số bao nhiêu?`,
        below_title: i.sequence,
        type: "number_pattern",
        answer: letter,
        answerA: options[0], answerB: options[1], answerC: options[2], answerD: options[3],
      });
    }
    if (i.type === "shapes") {
      const { letter, options } = makeMcOptions(reverseShapePattern[i.answer as string], getNumbersAround);
      const mapped = options.map((x) => shapePattern[((x % 5) + 5) % 5]);
      questions.push({
        title: `Cho dãy hình dưới. Hỏi hình tiếp theo là hình gì?`,
        below_title: i.sequence,
        type: "shapes_pattern",
        answer: letter,
        answerA: mapped[0], answerB: mapped[1], answerC: mapped[2], answerD: mapped[3],
      });
    }
    if (i.type === "rotations") {
      const { letter, options } = makeMcOptions(i.answer as number, getNumbersAround, undefined, undefined, [-180, 180]);
      const mapped = options.map((x) => ((x % 360) + 360) % 360);
      questions.push({
        title: `Cho dãy hình dưới. Hỏi hình tiếp theo là hình gì?`,
        below_title: i.sequence,
        type: "rotations_pattern",
        answer: letter,
        answerA: mapped[0], answerB: mapped[1], answerC: mapped[2], answerD: mapped[3],
      });
    }
    if (i.type === "dates") {
      const { letter, options } = makeMcOptions(i.answer, getNumbersAround);
      const mapped = options.map((x) => dates[((x % 7) + 7) % 7]);
      const prefix =
        i.from_today_amount !== 0
          ? `${i.from_today_amount} ngày ${i.base_direction === "forward" ? "sau hôm nay" : "trước hôm nay"} là ${dates[i.from_today]}`
          : `Hôm nay là ${dates[i.today]}`;
      questions.push({
        title: `${prefix}. Hỏi ${i.question} ngày ${i.question_direction === "forward" ? "sau" : "trước"} hôm nay là ngày nào?`,
        below_title: null,
        type: "dates",
        answer: letter,
        answerA: mapped[0], answerB: mapped[1], answerC: mapped[2], answerD: mapped[3],
      });
    }
    if (i.type === "find-missing-both-side" || i.type === "find-missing") {
      const { letter, options } = makeMcOptions(i.answer, getNumbersAround);
      questions.push({
        title: `Tìm số bị thiếu: ? ${i.missing_op} ${i.lhs} = ${i.rhs}`,
        below_title: null,
        type: i.type,
        answer: letter,
        answerA: options[0], answerB: options[1], answerC: options[2], answerD: options[3],
      });
    }
    if (i.type === "ops-arith") {
      const { letter, options } = makeMcOptions(i.ans, getNumbersAround);
      questions.push({
        title: `Tính ${i.expr}`,
        below_title: null,
        type: "ops-arith",
        answer: letter,
        answerA: options[0], answerB: options[1], answerC: options[2], answerD: options[3],
      });
    }
    if (i.type === "compare_sequence") {
      const { letter, options } = makeMcOptions(i.answer, getNumbersAround);
      questions.push({
        title: `Cho dãy số dưới. Hỏi bao nhiêu số ${i.larger_smaller} số ${i.target}?`,
        below_title: i.sequence,
        type: "cmp_sq",
        answer: letter,
        answerA: options[0], answerB: options[1], answerC: options[2], answerD: options[3],
      });
    }
    if (i.type === "numbers_theory") {
      const { letter, options } = makeMcOptions(i.answer, getNumbersAround);
      const oddEvenStr = i.odd_even === "odd" ? "lẻ " : i.odd_even === "even" ? "chẵn " : "";
      const maxMinStr = i.max_min === "max" ? "lớn nhất " : "nhỏ nhất ";
      questions.push({
        title: `Số ${oddEvenStr}${i.dcount} ${maxMinStr} là số nào?`,
        below_title: null,
        type: "number_theory",
        answer: letter,
        answerA: options[0], answerB: options[1], answerC: options[2], answerD: options[3],
      });
    }
    if (i.type === "nth-pattern") {
      const { letter, options } = makeMcOptions(i.ans, getNumbersAround);
      questions.push({
        title: `Cho dãy số dưới. Hỏi số thứ ${i.n} là số nào?`,
        below_title: i.display,
        type: "nth_pattern",
        answer: letter,
        answerA: options[0], answerB: options[1], answerC: options[2], answerD: options[3],
      });
    }
    if (i.type === "count_visible") {
      const { letter, options } = makeMcOptions(i.count, getNumbersAround);
      questions.push({
        title: `Cho hình dưới. Bao nhiêu khối lập phương có thể nhìn thấy khi nhìn từ phía ${i.face}?`,
        below_title: { cube_front: i.cube_front, cube_back: i.cube_back },
        type: "directional_count",
        answer: letter,
        answerA: options[0], answerB: options[1], answerC: options[2], answerD: options[3],
      });
    }
    if (i.type === "count_materials") {
      const { letter, options } = makeMcOptions(i.count, getNumbersAround);
      questions.push({
        title: `Cho hình dưới. Hỏi chung ta cần bao nhiêu khối lập phương để tạo nên hình đó?`,
        below_title: { cube_front: i.cube_front, cube_back: i.cube_back },
        type: "count_structure",
        answer: letter,
        answerA: options[0], answerB: options[1], answerC: options[2], answerD: options[3],
      });
    }
    if (i.type === "combinatorics_arithmetic") {
      const { letter, options } = makeMcOptions(i.answer, getNumbersAround);
      questions.push({
        title: `Nếu chia ${i.num} ${i.unit} vào ${i.unit_count} đơn vị, hỏi mỗi đơn vị có bao nhiêu ${i.unit}?`,
        below_title: null,
        type: "combinatorics_arithmetic",
        answer: letter,
        answerA: options[0], answerB: options[1], answerC: options[2], answerD: options[3],
      });
    }
    if (i.type === "find_order") {
      const { letter, options } = makeMcOptions(i.num, getNumbersAround);
      questions.push({
        title: `Cho dãy số dưới. Sắp xếp chúng theo thứ tự ${i.descending_ascending} để tìm số thứ ${i.nth} ${i.num_keyword}.`,
        below_title: i.seq,
        type: "sort_find_order",
        answer: letter,
        answerA: options[0], answerB: options[1], answerC: options[2], answerD: options[3],
      });
    }
    if (i.type === "chess_games") {
      const { letter, options } = makeMcOptions(i.count, getNumbersAround);
      questions.push({
        title: `${i.people_count} bạn chơi cờ với nhau. Hỏi có bao nhiêu ván cờ được chơi, biết rằng mỗi bạn chỉ chơi với nhau một lần.`,
        below_title: null,
        type: "chess_games",
        answer: letter,
        answerA: options[0], answerB: options[1], answerC: options[2], answerD: options[3],
      });
    }
    if (i.type === "sum_digits_perms") {
      const { letter, options } = makeMcOptions(i.sum, getNumbersAround);
      questions.push({
        title: `Cho các chữ số: ${i.digits.join(", ")}. Tìm các số được tạo từ các chữ số trên không lặp lại (VD: số 111 không được) rồi tính tổng của chúng.`,
        below_title: null,
        type: "sum_permutations",
        answer: letter,
        answerA: options[0], answerB: options[1], answerC: options[2], answerD: options[3],
      });
    }
    if (i.type === "count_2d") {
      const { letter, options } = makeMcOptions(i.answer, getNumbersAround);
      questions.push({
        title: `Cho hình sau. Hỏi có bao nhiêu hình vuông trong hình dưới?`,
        below_title: i.grid,
        type: "count_2d",
        answer: letter,
        answerA: options[0], answerB: options[1], answerC: options[2], answerD: options[3],
      });
    }
  }

  return questions;
}

// ============ PUBLIC API ============

export function generateFullTest() {
  return {
    section1: constructQuestions(generateSection1(10)),
    section2: constructQuestions(generateSection2(15)),
    section3: constructQuestions(generateSection3(10)),
    section4: constructQuestions(generateQuestionsS4(10)),
    section5: constructQuestions(generateQuestionsS5(10)),
  };
}