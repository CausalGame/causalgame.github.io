import rawData from '../data/rubric.json';
import './FailureHeatmap.css';

interface PatternCell {
  count: number;
  pct: number;
}
interface HeatRow {
  display: string;
  total: number;
  patterns: Record<string, PatternCell>;
}
interface DB {
  meta: {
    failure_modes: {
      order: string[];
      names: Record<string, string>;
      colors: Record<string, string>;
    };
  };
  heatmap: HeatRow[];
}

const db = rawData as unknown as DB;
const FM = db.meta.failure_modes;
const ROWS = db.heatmap;

function cellStyle(p: string) {
  return { '--cell': FM.colors[p] } as React.CSSProperties;
}

export default function FailureHeatmap() {
  return (
    <div className="fh">
      <div className="fh-scroll">
        <table className="fh-table">
          <thead>
            <tr>
              <th className="fh-model">Model</th>
              <th className="fh-total">N</th>
              {FM.order.map((p) => (
                <th key={p} title={`${p}: ${FM.names[p]}`}>
                  <span className="fh-head-code" style={{ background: FM.colors[p] }}>
                    {p}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.display}>
                <td className="fh-model">{row.display}</td>
                <td className="fh-total">{row.total}</td>
                {FM.order.map((p) => {
                  const cell = row.patterns[p];
                  const pct = cell?.pct ?? 0;
                  const count = cell?.count ?? 0;
                  return (
                    <td
                      key={p}
                      className="fh-cell"
                      style={{ ...cellStyle(p), opacity: count === 0 ? 0.08 : 0.12 + (pct / 100) * 0.88 }}
                      title={`${row.display} · ${FM.names[p]}: ${count} / ${row.total} (${pct.toFixed(1)}%)`}
                    >
                      <span className="fh-count">{count}</span>
                      <span className="fh-pct">{pct.toFixed(0)}%</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="fh-key">
        {FM.order.map((p) => (
          <span key={p} className="fh-key-item">
            <span className="fh-key-code" style={{ background: FM.colors[p] }}>
              {p}
            </span>
            {FM.names[p]}
          </span>
        ))}
      </div>
      <p className="note">
        Per-model counts on agentic sessions. Cell color intensity = share of that model's sessions
        in each pattern. <strong>A (red)</strong> dominates almost every row — causal disengagement
        is uniform across capability tiers.
      </p>
    </div>
  );
}
