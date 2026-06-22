import rawData from '../data/rubric.json';
import './FailureDimBar.css';

interface DimStat {
  mean: number;
  sem: number;
  n: number;
}
interface DB {
  meta: {
    dimensions: string[];
    failure_modes: {
      order: string[];
      names: Record<string, string>;
      colors: Record<string, string>;
    };
  };
  dim_scores_by_pattern: Record<string, Record<string, DimStat>>;
}

const db = rawData as unknown as DB;
const DIMS = db.meta.dimensions;
const FM = db.meta.failure_modes;
const PATTERNS = FM.order;

const DIM_SHORT: Record<string, string> = {
  CausalReasoning: 'Causal Reasoning',
  ExperimentalDesign: 'Exp. Design',
  ReflectionQuality: 'Reflection',
  DataUsage: 'Data Usage',
};

const W = 560;
const H = 320;
const PAD = { l: 44, r: 14, t: 16, b: 48 };
const GROUP_W = (W - PAD.l - PAD.r) / DIMS.length;
const BAR_W = (GROUP_W - 12) / PATTERNS.length;

export default function FailureDimBar() {
  const maxY = 100;
  const plotH = H - PAD.t - PAD.b;
  const y = (v: number) => PAD.t + plotH - (v / maxY) * plotH;

  return (
    <div className="fdb">
      <svg viewBox={`0 0 ${W} ${H}`} className="fdb-svg" role="img" aria-label="Rubric dimension scores by failure mode">
        {[0, 25, 50, 75, 100].map((v) => (
          <g key={v}>
            <line className="fdb-grid" x1={PAD.l} y1={y(v)} x2={W - PAD.r} y2={y(v)} />
            <text className="fdb-ytick" x={PAD.l - 6} y={y(v)} textAnchor="end" dominantBaseline="middle">
              {v}
            </text>
          </g>
        ))}
        <text className="fdb-yaxis" x={6} y={H / 2} transform={`rotate(-90 6 ${H / 2})`} textAnchor="middle">
          mean score (% of max)
        </text>

        {DIMS.map((d, gi) => {
          const gx = PAD.l + gi * GROUP_W;
          return (
            <g key={d}>
              {PATTERNS.map((p, bi) => {
                const s = db.dim_scores_by_pattern[p]?.[d] ?? { mean: 0, sem: 0, n: 0 };
                const bx = gx + 6 + bi * BAR_W;
                const top = y(s.mean);
                return (
                  <g key={p}>
                    <rect
                      x={bx}
                      y={top}
                      width={BAR_W - 2}
                      height={Math.max(0, PAD.t + plotH - top)}
                      className="fdb-bar"
                      fill={FM.colors[p]}
                      rx={2}
                    >
                      <title>
                        {FM.names[p]} · {DIM_SHORT[d]}: {s.mean.toFixed(1)}% ± {s.sem.toFixed(1)} (n={s.n})
                      </title>
                    </rect>
                    {s.sem > 0 && (
                      <line
                        className="fdb-err"
                        x1={bx + (BAR_W - 2) / 2}
                        x2={bx + (BAR_W - 2) / 2}
                        y1={y(Math.min(100, s.mean + s.sem))}
                        y2={y(Math.max(0, s.mean - s.sem))}
                      />
                    )}
                  </g>
                );
              })}
              <text className="fdb-glabel" x={gx + GROUP_W / 2} y={H - PAD.b + 16} textAnchor="middle">
                {DIM_SHORT[d]}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="fdb-dimkey">
        {PATTERNS.map((p) => (
          <span key={p} className="fdb-dimitem">
            <span className="fdb-pchip" style={{ background: FM.colors[p] }}>
              {p}
            </span>
            {FM.names[p]}
          </span>
        ))}
      </div>
      <p className="note">
        Within each dimension, bars show the four failure modes. Causal Reasoning
        stays low for every mode (≤16.3%), whereas Experimental Design, Reflection and Data Usage
        climb far higher for the engaging modes — the bottleneck is causal reasoning specifically.
      </p>
    </div>
  );
}
