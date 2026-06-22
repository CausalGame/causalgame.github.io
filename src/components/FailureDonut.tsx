import rawData from '../data/rubric.json';
import './FailureDonut.css';

interface PatternPct {
  count: number;
  pct: number;
}
interface ModeDist {
  total: number;
  patterns: Record<string, PatternPct>;
}
interface DB {
  meta: {
    failure_modes: {
      order: string[];
      names: Record<string, string>;
      colors: Record<string, string>;
    };
  };
  distribution: Record<string, ModeDist>;
}

const db = rawData as unknown as DB;
const FM = db.meta.failure_modes;

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function wedge(cx: number, cy: number, rOuter: number, rInner: number, startDeg: number, endDeg: number) {
  if (endDeg - startDeg >= 359.99) endDeg = startDeg + 359.99;
  const [x1, y1] = polar(cx, cy, rOuter, endDeg);
  const [x2, y2] = polar(cx, cy, rOuter, startDeg);
  const [x3, y3] = polar(cx, cy, rInner, startDeg);
  const [x4, y4] = polar(cx, cy, rInner, endDeg);
  const large = endDeg - startDeg <= 180 ? 0 : 1;
  return [
    `M ${x1} ${y1}`,
    `A ${rOuter} ${rOuter} 0 ${large} 0 ${x2} ${y2}`,
    `L ${x3} ${y3}`,
    `A ${rInner} ${rInner} 0 ${large} 1 ${x4} ${y4}`,
    'Z',
  ].join(' ');
}

const SIZE = 340;
const CX = SIZE / 2;
const CY = SIZE / 2;

function Ring({ mode, rOuter, rInner }: { mode: string; rOuter: number; rInner: number }) {
  const dist = db.distribution[mode];
  if (!dist) return null;
  let acc = 0;
  return (
    <>
      {FM.order.map((p) => {
        const frac = dist.total > 0 ? dist.patterns[p]?.count / dist.total : 0;
        if (!frac) return null;
        const start = acc * 360;
        acc += frac;
        const end = acc * 360;
        const midDeg = (start + end) / 2;
        const labelR = (rOuter + rInner) / 2;
        const [lx, ly] = polar(CX, CY, labelR, midDeg);
        const pct = frac * 100;
        return (
          <g key={`${mode}-${p}`}>
            <path
              d={wedge(CX, CY, rOuter, rInner, start, end)}
              fill={FM.colors[p]}
              stroke="#fff"
              strokeWidth={2}
            >
              <title>
                {FM.names[p]} — {dist.patterns[p]?.count} sessions ({pct.toFixed(1)}%)
              </title>
            </path>
            {pct >= 4 && (
              <text
                className="fd-lbl"
                x={lx}
                y={ly}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#fff"
              >
                {pct.toFixed(0)}%
              </text>
            )}
          </g>
        );
      })}
    </>
  );
}

export default function FailureDonut() {
  const agentic = db.distribution.agentic;
  const prompt = db.distribution.prompting;
  const aTotal = agentic?.total ?? 0;
  const pTotal = prompt?.total ?? 0;
  const noEngageA = agentic?.patterns.A?.pct ?? 0;

  return (
    <div className="fd">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="fd-svg" role="img" aria-label="Failure mode distribution">
        <Ring mode="agentic" rOuter={160} rInner={120} />
        <Ring mode="prompting" rOuter={112} rInner={72} />
        <text className="fd-center-top" x={CX} y={CY - 6} textAnchor="middle">
          {noEngageA.toFixed(0)}%
        </text>
        <text className="fd-center-bot" x={CX} y={CY + 16} textAnchor="middle">
          no engagement
        </text>
      </svg>
      <div className="fd-side">
        <div className="fd-ringkey">
          <span className="fd-dot fd-dot-out" /> Outer ring · <strong>Agentic</strong> ({aTotal})
        </div>
        <div className="fd-ringkey">
          <span className="fd-dot fd-dot-in" /> Inner ring · <strong>Prompting</strong> ({pTotal})
        </div>
        <ul className="fd-legend">
          {FM.order.map((p) => (
            <li key={p}>
              <span className="fd-swatch" style={{ background: FM.colors[p] }} />
              <span className="fd-pname">
                <code>{p}</code> {FM.names[p]}
              </span>
              <span className="fd-pct">
                {aTotal > 0 ? ((agentic?.patterns[p]?.count ?? 0) / aTotal * 100).toFixed(1) : '0.0'}%
              </span>
            </li>
          ))}
        </ul>
        <p className="note">
          Agentic and prompting sessions fail in the same way: a clear majority never engages
          causal reasoning, and even the share that reaches nascent reasoning stays weak —
          causal-reasoning scores are near-zero in every pattern.
        </p>
      </div>
    </div>
  );
}
