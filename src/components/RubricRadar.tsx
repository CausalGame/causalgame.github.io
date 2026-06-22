import { useMemo, useState } from 'react';
import rawData from '../data/rubric.json';
import './RubricRadar.css';

// always render the 6-axis criteria radar (dimension view removed by design)

interface ScoreBlock {
  mean: number;
  sem: number;
  n_judges: number;
}
interface Criterion {
  id: string;
  dimension: string;
  weight: number;
  title: string;
  mandatory: boolean;
}
interface Model {
  csv_name: string;
  display: string;
  available: boolean;
  criteria: Record<string, ScoreBlock>;
  dimensions: Record<string, ScoreBlock>;
  overall: { compliance: number; points_norm: number; n_sessions: number };
  n_judges: number;
}
interface DB {
  meta: {
    criteria: Criterion[];
    criteria_ids: string[];
    dimensions: string[];
    max_points: number;
  };
  models: Model[];
}

const db = rawData as unknown as DB;
const PALETTE = [
  '#e2422f', '#1f77b4', '#2ca02c', '#9467bd', '#ff7f0e',
  '#17becf', '#bcbd22', '#d62728', '#393b79', '#8c564b',
  '#e377c2', '#7f7f7f', '#aec7e8', '#ffbb78', '#98df8a', '#dbdb8d',
];

const SIZE = 380;
const R = 140;
const CX = SIZE / 2;
const CY = SIZE / 2;

function pt(angle: number, val: number) {
  return [CX + R * val * Math.cos(angle), CY + R * val * Math.sin(angle)];
}

export default function RubricRadar() {
  // available is sorted descending by overall points_norm (best first).
  const available = useMemo(
    () => db.models.filter((m) => m.available).sort((a, b) => b.overall.points_norm - a.overall.points_norm),
    [],
  );

  // Default selection: 5 representative models spanning the score distribution —
  // max, 75th pct, median, 25th pct, min (nearest-rank, de-duplicated).
  const [visible, setVisible] = useState<Set<string>>(() => {
    const len = available.length;
    if (len === 0) return new Set();
    // descending index for percentile p (p=0 -> worst, p=100 -> best)
    const idxAt = (p: number) =>
      Math.min(len - 1, Math.max(0, len - Math.ceil((p / 100) * len)));
    const picks = new Set<number>([0, idxAt(75), idxAt(50), idxAt(25), len - 1]);
    return new Set([...picks].map((i) => available[i].csv_name));
  });

  const axisIds = db.meta.criteria_ids;
  const axisLabels = db.meta.criteria.map((c) => c.id);
  const n = axisIds.length;
  const angles = axisIds.map((_, i) => (2 * Math.PI * i) / n - Math.PI / 2);

  const setPreset = (preset: 'top5' | 'top10' | 'all' | 'none') => {
    const next = new Set<string>();
    if (preset === 'top5') available.slice(0, 5).forEach((m) => next.add(m.csv_name));
    else if (preset === 'top10') available.slice(0, 10).forEach((m) => next.add(m.csv_name));
    else if (preset === 'all') available.forEach((m) => next.add(m.csv_name));
    setVisible(next);
  };

  const toggle = (csv: string) => {
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(csv)) next.delete(csv);
      else next.add(csv);
      return next;
    });
  };

  const polygon = (m: Model) => {
    const vals = axisIds.map((id) => {
      const blk = m.criteria[id];
      return Math.max(0, Math.min(1, blk?.mean ?? 0));
    });
    const pts = vals.map((v, i) => pt(angles[i], v).map((x) => x.toFixed(1)).join(','));
    return pts.join(' ');
  };

  const rings = [0.25, 0.5, 0.75, 1.0];
  const colorOf = (display: string) => {
    const idx = available.findIndex((m) => m.display === display);
    return PALETTE[idx % PALETTE.length];
  };

  return (
    <div className="rr">
      <div className="rr-controls">
        <span className="lb-seg" aria-label="Preset">
          {(
            [
              ['top5', 'Top 5'],
              ['top10', 'Top 10'],
              ['all', 'All'],
              ['none', 'None'],
            ] as ['top5' | 'top10' | 'all' | 'none', string][]
          ).map(([p, label]) => (
            <button key={p} onClick={() => setPreset(p)}>
              {label}
            </button>
          ))}
        </span>
      </div>

      <div className="rr-body">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="rr-svg" role="img" aria-label="Rubric radar chart">
          {/* grid rings */}
          {rings.map((r) => (
            <polygon
              key={r}
              className="rr-ring"
              points={angles.map((a) => pt(a, r).map((x) => x.toFixed(1)).join(',')).join(' ')}
            />
          ))}
          {/* spokes + labels */}
          {angles.map((a, i) => {
            const [ex, ey] = pt(a, 1.16);
            const [ix, iy] = pt(a, 1.0);
            const anchor = Math.abs(Math.cos(a)) < 0.3 ? 'middle' : Math.cos(a) > 0 ? 'start' : 'end';
            return (
              <g key={axisIds[i]}>
                <line className="rr-spoke" x1={CX} y1={CY} x2={ix} y2={iy} />
                <text className="rr-alabel" x={ex} y={ey} textAnchor={anchor} dominantBaseline="middle">
                  {axisLabels[i]}
                </text>
              </g>
            );
          })}
          {/* ring scale ticks */}
          {rings.map((r) => (
            <text key={r} className="rr-scale" x={CX + 3} y={CY - R * r + 3}>
              {r.toFixed(2)}
            </text>
          ))}
          {/* model polygons */}
          {available
            .filter((m) => visible.has(m.csv_name))
            .map((m) => {
              const color = colorOf(m.display);
              return (
                <g key={m.csv_name} className="rr-poly">
                  <polygon
                    points={polygon(m)}
                    fill={color}
                    fillOpacity={0.13}
                    stroke={color}
                    strokeWidth={1.8}
                  >
                    <title>
                      {m.display} ({m.overall.points_norm.toFixed(2)}/16)
                    </title>
                  </polygon>
                </g>
              );
            })}
        </svg>

        <div className="rr-legend">
          <div className="rr-legend-hint">Click to toggle · {visible.size} shown</div>
          {available.map((m, i) => {
            const on = visible.has(m.csv_name);
            return (
              <button
                key={m.csv_name}
                className={`rr-item${on ? ' on' : ''}`}
                onClick={() => toggle(m.csv_name)}
                title={`${m.overall.points_norm.toFixed(2)} / 16 (norm)`}
              >
                <span className="rr-swatch" style={{ background: PALETTE[i % PALETTE.length] }} />
                <span className="rr-name">{m.display}</span>
                <span className="rr-val">{m.overall.points_norm.toFixed(2)}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rr-key">
        {db.meta.criteria.map((c) => (
          <span key={c.id} className="rr-key-item">
            <code>{c.id}</code> ({c.weight}) {c.title}
          </span>
        ))}
      </div>
      <p className="note rr-note">
        Scores normalized to 0–1 (weighted_score / weight), averaged across the{' '}
        {db.models[0]?.n_judges ?? 3} judges. Larger area = stronger causal-reasoning competence.
        The causal axis (CR1–CR3) is consistently the weakest dimension across all models.
      </p>
    </div>
  );
}
