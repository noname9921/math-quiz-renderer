import { generateFullTest, type BuiltQuestion } from "./utils/generateQuestions";
import { Shape, CubeCube } from "./utils/DrawShapes";
import { useState } from "react";

const test = generateFullTest();

const SECTIONS = [
  { label: "Phần 1: Kĩ năng tư duy", questions: test.section1 },
  { label: "Phần 2: Kĩ năng tính toán", questions: test.section2 },
  { label: "Phần 3: Số học", questions: test.section3 },
  { label: "Phần 4: Hình học", questions: test.section4 },
  { label: "Phần 5: Tổ hợp", questions: test.section5 },
];

interface FlatQuestion {
  sectionLabel: string;
  localIndex: number;
  question: BuiltQuestion;
}

const ALL_QUESTIONS: FlatQuestion[] = SECTIONS.flatMap((section) =>
  section.questions.map((q, i) => ({ sectionLabel: section.label, localIndex: i + 1, question: q }))
);

const TOTAL = ALL_QUESTIONS.length;

type ThemeName = "red" | "blue" | "purple";

const THEMES: Record<ThemeName, {
  swatch: string; primaryBg: string; primaryBgHover: string; primaryText: string;
  lightBg: string; border: string; borderHover: string;
}> = {
  red: { swatch: "bg-red-600", primaryBg: "bg-red-700", primaryBgHover: "hover:bg-red-800", primaryText: "text-red-700", lightBg: "bg-red-100", border: "border-red-600", borderHover: "hover:border-red-300" },
  blue: { swatch: "bg-blue-600", primaryBg: "bg-blue-700", primaryBgHover: "hover:bg-blue-800", primaryText: "text-blue-700", lightBg: "bg-blue-100", border: "border-blue-600", borderHover: "hover:border-blue-300" },
  purple: { swatch: "bg-violet-600", primaryBg: "bg-violet-700", primaryBgHover: "hover:bg-violet-800", primaryText: "text-violet-700", lightBg: "bg-violet-100", border: "border-violet-600", borderHover: "hover:border-violet-300" },
};

function BelowTitle({ question }: { question: BuiltQuestion }) {
  const { type, below_title } = question;
  if (below_title == null) return null;

  if (type === "shapes_pattern") {
    return (
      <svg viewBox="0 0 400 60" className="mx-auto w-full max-w-[400px] h-auto" shapeRendering="geometricPrecision">
        {(below_title as string[]).map((shapeType, i) => (
          <g key={i} transform={`translate(${i * 60}, 10)`}><Shape type={shapeType as any} size={25} /></g>
        ))}
      </svg>
    );
  }

  if (type === "rotations_pattern") {
    return (
      <svg viewBox="0 0 400 60" className="mx-auto w-full max-w-[400px] h-auto" shapeRendering="geometricPrecision">
        {(below_title as number[]).map((rotationDeg, i) => (
          <g key={i} transform={`translate(${i * 60}, 10)`}><Shape type="right_triangle" size={25} rotationDeg={rotationDeg} /></g>
        ))}
      </svg>
    );
  }

  if (type === "directional_count" || type === "count_structure") {
    const { cube_front, cube_back } = below_title as { cube_front: number[][][]; cube_back: number[][][] };
    return (
      <div className="flex flex-col sm:flex-row justify-center items-center gap-6 sm:gap-16">
        <div className="text-center">
          <p className="text-sm sm:text-base text-gray-500 mb-1">Mặt trước</p>
          <svg viewBox="0 0 150 150" className="w-28 h-28 sm:w-[150px] sm:h-[150px]" shapeRendering="geometricPrecision">
            <CubeCube x={20} y={100} length={20} grid={cube_front} />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-sm sm:text-base text-gray-500 mb-1">Mặt sau</p>
          <svg viewBox="0 0 150 150" className="w-28 h-28 sm:w-[150px] sm:h-[150px]" shapeRendering="geometricPrecision">
            <CubeCube x={20} y={100} length={20} grid={cube_back} />
          </svg>
        </div>
      </div>
    );
  }

  if (type === "count_2d") {
    const grid = below_title as number[][];
    const cell = 24;
    return (
      <svg
        viewBox={`0 0 ${grid[0].length * cell} ${grid.length * cell}`}
        className="mx-auto w-full max-w-[240px] sm:max-w-none h-auto"
        style={{ maxWidth: grid[0].length * cell }}
        shapeRendering="crispEdges"
      >
        {grid.map((row, i) => row.map((val, j) => val === 1 ? (
          <rect key={`${i}-${j}`} x={j * cell} y={i * cell} width={cell} height={cell} fill="none" stroke="black" strokeWidth={1.5} />
        ) : null))}
      </svg>
    );
  }

  if (Array.isArray(below_title)) {
    return <p className="text-lg sm:text-2xl mt-2 text-center tracking-wide">{(below_title as (string | number)[]).join(",  ")}</p>;
  }

  return null;
}

function AnswerOption({
  question, letter, value, selected, onSelect, theme, locked, isCorrectAnswer, showResult,
}: {
  question: BuiltQuestion; letter: string; value: string | number;
  selected: boolean; onSelect: () => void; theme: typeof THEMES[ThemeName];
  locked: boolean; isCorrectAnswer: boolean; showResult: boolean;
}) {
  const base = "flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border-2 text-lg sm:text-2xl transition-colors";
  const interactivity = locked ? "" : "cursor-pointer";

  let style = `${base} ${interactivity} border-gray-200 ${locked ? "" : theme.borderHover}`;
  if (showResult) {
    if (isCorrectAnswer) style = `${base} border-green-500 bg-green-50`;
    else if (selected) style = `${base} border-red-500 bg-red-50`;
  } else if (selected) {
    style = `${base} ${interactivity} ${theme.border} ${theme.lightBg}`;
  }

  const content =
    question.type === "shapes_pattern" ? (
      <svg viewBox="0 0 30 30" width={30} height={30} className="shrink-0" shapeRendering="geometricPrecision"><Shape type={value as any} size={15} /></svg>
    ) : question.type === "rotations_pattern" ? (
      <svg viewBox="0 0 30 30" width={30} height={30} className="shrink-0" shapeRendering="geometricPrecision"><Shape type="right_triangle" size={15} rotationDeg={Number(value)} /></svg>
    ) : (
      <span>{value}</span>
    );

  return (
    <div className={style} onClick={locked ? undefined : onSelect}>
      <span className={`font-bold ${showResult && isCorrectAnswer ? "text-green-600" : showResult && selected ? "text-red-600" : theme.primaryText}`}>{letter}.</span>
      {content}
    </div>
  );
}

function QuestionGrid({
  selected, current, onJump, theme, submitted,
}: {
  selected: (string | null)[]; current: number; onJump: (i: number) => void; theme: typeof THEMES[ThemeName]; submitted: boolean;
}) {
  return (
    <div className="grid grid-cols-8 sm:grid-cols-6 gap-1.5 sm:gap-2">
      {ALL_QUESTIONS.map((fq, i) => {
        const isAnswered = selected[i] !== null;
        const isCurrent = i === current;
        const isCorrect = submitted && selected[i] === fq.question.answer;
        const isWrong = submitted && isAnswered && !isCorrect;
        const base = "w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-sm sm:text-base font-medium cursor-pointer transition-colors border-2";
        const style = isCorrect
          ? `${base} bg-green-100 border-green-500 text-green-700`
          : isWrong
            ? `${base} bg-red-100 border-red-500 text-red-700`
            : isCurrent
              ? `${base} ${theme.primaryBg} text-white border-transparent`
              : isAnswered
                ? `${base} ${theme.lightBg} ${theme.border} ${theme.primaryText}`
                : `${base} bg-gray-50 border-gray-200 text-gray-400`;
        return <div key={i} className={style} onClick={() => onJump(i)}>{i + 1}</div>;
      })}
    </div>
  );
}

export default function App() {
  const [cq, setCq] = useState(0);
  const [selected, setSelected] = useState<(string | null)[]>(Array(TOTAL).fill(null));
  const [themeName, setThemeName] = useState<ThemeName>("purple");
  const [submitted, setSubmitted] = useState(false);
  const theme = THEMES[themeName];

  const current = ALL_QUESTIONS[cq];
  const { question, sectionLabel, localIndex } = current;

  const goNext = () => setCq((prev) => (prev + 1) % TOTAL);
  const goPrev = () => setCq((prev) => (prev - 1 + TOTAL) % TOTAL);

  const pickAnswer = (letter: string) => {
    if (submitted) return;
    setSelected((prev) => prev.map((val, i) => (i === cq ? letter : val)));
  };

  const answers: [string, string | number][] = [
    ["A", question.answerA], ["B", question.answerB], ["C", question.answerC], ["D", question.answerD],
  ];

  const answeredCount = selected.filter((s) => s !== null).length;
  const score = ALL_QUESTIONS.filter((fq, i) => selected[i] === fq.question.answer).length;

  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col lg:flex-row justify-between items-stretch gap-6 lg:gap-16 py-6 px-4 sm:px-8 lg:py-10 lg:px-16">

      {/* main question card */}
      <div className="flex-1 lg:max-w-3xl bg-white rounded-2xl shadow-md p-5 sm:p-8 pb-24 lg:pb-28 min-h-[70vh] lg:h-[90vh] relative order-1">
        <div className="flex items-center justify-between mb-2 gap-2">
          <span className={`text-sm sm:text-lg font-semibold ${theme.primaryText}`}>{sectionLabel}</span>
          <span className="text-sm sm:text-lg text-gray-400 shrink-0">{cq + 1} / {TOTAL}</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full mb-6 sm:mb-8">
          <div className={`h-2 ${theme.primaryBg} rounded-full transition-all`} style={{ width: `${((cq + 1) / TOTAL) * 100}%` }} />
        </div>

        <h2 className="text-xl sm:text-3xl font-medium leading-snug">
          <span className={`font-bold ${theme.primaryText}`}>{localIndex}.</span> {question.title}
        </h2>

        <div className="my-6 sm:my-8 overflow-x-auto"><BelowTitle question={question} /></div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {answers.map(([letter, value]) => (
            <AnswerOption
              key={letter} question={question} letter={letter} value={value}
              selected={selected[cq] === letter} onSelect={() => pickAnswer(letter)}
              theme={theme} locked={submitted} isCorrectAnswer={submitted && letter === question.answer} showResult={submitted}
            />
          ))}
        </div>

        <div className="absolute bottom-6 sm:bottom-8 left-0 right-0 flex justify-center items-center gap-10 sm:gap-16">
          <button className={`${theme.primaryBg} ${theme.primaryBgHover} rounded-full w-12 h-12 sm:w-14 sm:h-14 text-white text-xl sm:text-2xl flex items-center justify-center transition-colors`} onClick={goPrev}>←</button>
          <button className={`${theme.primaryBg} ${theme.primaryBgHover} rounded-full w-12 h-12 sm:w-14 sm:h-14 text-white text-xl sm:text-2xl flex items-center justify-center transition-colors`} onClick={goNext}>→</button>
        </div>
      </div>

      {/* sidebar: theme + grading + status grid */}
      <div className="w-full lg:w-72 shrink-0 bg-white rounded-2xl shadow-md p-5 sm:p-6 order-2">
        <p className="text-base sm:text-lg font-semibold text-gray-700 mb-3">Theme</p>
        <div className="flex gap-3 mb-6">
          {(Object.keys(THEMES) as ThemeName[]).map((name) => (
            <button key={name} onClick={() => setThemeName(name)} className={`w-8 h-8 rounded-full ${THEMES[name].swatch} ${themeName === name ? "ring-2 ring-offset-2 ring-gray-400" : ""}`} aria-label={name} />
          ))}
        </div>

        {!submitted ? (
          <button onClick={() => setSubmitted(true)} className={`${theme.primaryBg} ${theme.primaryBgHover} w-full text-white text-base sm:text-lg font-semibold py-2.5 rounded-xl transition-colors mb-6`}>
            Submit ({answeredCount}/{TOTAL})
          </button>
        ) : (
          <div className="mb-6">
            <p className="text-xl sm:text-2xl font-bold text-green-600 mb-2">Score: {score}/{TOTAL}</p>
            <button onClick={() => { setSubmitted(false); setSelected(Array(TOTAL).fill(null)); setCq(0); }} className="w-full bg-gray-600 hover:bg-gray-700 text-white text-base sm:text-lg font-semibold py-2.5 rounded-xl transition-colors">
              Retry
            </button>
          </div>
        )}

        <p className="text-base sm:text-lg font-semibold text-gray-700 mb-1">Progress: {answeredCount} / {TOTAL}</p>
        <p className="text-xs sm:text-sm text-gray-400 mb-3">Click a number to jump</p>
        <QuestionGrid selected={selected} current={cq} onJump={setCq} theme={theme} submitted={submitted} />
      </div>
    </div>
  );
}