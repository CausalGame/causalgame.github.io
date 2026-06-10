import { useMemo, useState } from 'react';
import rawData from '../data/leaderboard.json';
import './LeaderboardTable.css';

interface Cell {
  mean: number | null;
  std: number | null;
  ci95: number | null;
}

interface Row {
  model: string;
  display: string;
  provider: string;
  avg: { mean: number; std: number | null; ci95: number | null };
  derived?: boolean;
  scenarios: Record<string, Cell>;
}

interface ScenarioMeta {
  id: string;
  abbr: string;
  family: string;
  threshold: number;
  selection_bias: boolean;
  hidden_confounder: boolean;
}

interface Database {
  meta: { scenarios: ScenarioMeta[] };
  modes: Record<string, { label: string; description: string; rows: Row[] }>;
}

const db = rawData as unknown as Database;
const SCENARIOS = db.meta.scenarios;
const FAMILIES = [...new Set(SCENARIOS.map((s) => s.family))];
const MODE_KEYS = Object.keys(db.modes);

type ModeKey = string;
type View = 'summary' | 'full';

function familyMean(row: Row, family: string): number | null {
  const vals = SCENARIOS.filter((s) => s.family === family)
    .map((s) => row.scenarios[s.id].mean)
    .filter((v): v is number => v !== null);
  if (vals.length === 0) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function winCount(row: Row): number | null {
  const known = SCENARIOS.filter((s) => row.scenarios[s.id].mean !== null);
  if (known.length === 0) return null;
  return known.filter((s) => (row.scenarios[s.id].mean as number) >= s.threshold).length;
}

function fmt(x: number): string {
  return x.toFixed(1);
}

export default function LeaderboardTable() {
  const [mode, setMode] = useState<ModeKey>('agentic');
  const [view, setView] = useState<View>('summary');
  const [sortKey, setSortKey] = useState<string>('avg');
  const [desc, setDesc] = useState(true);

  const rows = db.modes[mode].rows;

  const avgRank = useMemo(() => {
    const order = [...rows].sort((a, b) => b.avg.mean - a.avg.mean);
    return new Map(order.map((r, i) => [r.model, i + 1]));
  }, [rows]);

  const sorted = useMemo(() => {
    const value = (r: Row): number => {
      if (sortKey === 'avg') return r.avg.mean;
      if (sortKey === 'wins') return winCount(r) ?? -Infinity;
      if (sortKey.startsWith('f:')) return familyMean(r, sortKey.slice(2)) ?? -Infinity;
      if (sortKey.startsWith('s:')) return r.scenarios[sortKey.slice(2)].mean ?? -Infinity;
      return r.avg.mean;
    };
    return [...rows].sort((a, b) => (desc ? value(b) - value(a) : value(a) - value(b)));
  }, [rows, sortKey, desc]);

  const onSort = (key: string) => {
    if (key === sortKey) {
      setDesc(!desc);
    } else {
      setSortKey(key);
      setDesc(true);
    }
  };

  const arrow = (key: string) => (sortKey === key ? (desc ? ' ▾' : ' ▴') : '');

  return (
    <div>
      <div className="lb-controls">
        <span className="lb-seg" role="tablist" aria-label="Execution mode">
          {MODE_KEYS.map((m) => (
            <button
              key={m}
              className={mode === m ? 'active' : ''}
              onClick={() => setMode(m)}
            >
              {db.modes[m].label}
            </button>
          ))}
        </span>
        <span className="lb-seg" aria-label="View">
          {(
            [
              ['summary', 'Summary'],
              ['full', 'All 14 scenarios'],
            ] as [View, string][]
          ).map(([v, label]) => (
            <button
              key={v}
              className={view === v ? 'active' : ''}
              onClick={() => setView(v)}
            >
              {label}
            </button>
          ))}
        </span>
        <span className="lb-hint">{db.modes[mode].description}</span>
      </div>

      <div className="lb-scroll">
        <table className="lb">
          <thead>
            <tr>
              <th className="txt" style={{ cursor: 'default' }}>
                #
              </th>
              <th className="txt" style={{ cursor: 'default' }}>
                Model
              </th>
              <th onClick={() => onSort('avg')} title="Mean survival over all 14 scenarios">
                Avg{arrow('avg')}
              </th>
              {view === 'summary' && (
                <>
                  {FAMILIES.map((f) => (
                    <th
                      key={f}
                      onClick={() => onSort(`f:${f}`)}
                      title={`Mean over the ${SCENARIOS.filter((s) => s.family === f).length} ${f} scenario(s), computed from per-scenario paper numbers`}
                    >
                      {f}
                      {arrow(`f:${f}`)}
                    </th>
                  ))}
                  <th onClick={() => onSort('wins')} title="Scenarios with survival ≥ win threshold">
                    Wins / 14{arrow('wins')}
                  </th>
                </>
              )}
              {view === 'full' &&
                SCENARIOS.map((s) => (
                  <th
                    key={s.id}
                    onClick={() => onSort(`s:${s.id}`)}
                    title={`${s.id} (threshold ${s.threshold}%)`}
                  >
                    {s.abbr}
                    {arrow(`s:${s.id}`)}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.model}>
                <td className="rank">{avgRank.get(r.model)}</td>
                <td className="model">
                  {r.display}
                  {r.derived && (
                    <sup title="Average derived from the paper's reported Δ vs ReAct; per-scenario results not published"> †</sup>
                  )}{' '}
                  <span className="provider">{r.provider}</span>
                </td>
                <td className="num">
                  <strong>{fmt(r.avg.mean)}</strong>
                  {r.avg.std !== null && <span className="std"> ±{fmt(r.avg.std)}</span>}
                </td>
                {view === 'summary' && (
                  <>
                    {FAMILIES.map((f) => {
                      const m = familyMean(r, f);
                      return (
                        <td key={f} className="num">
                          {m === null ? '—' : fmt(m)}
                        </td>
                      );
                    })}
                    <td className="num">{winCount(r) ?? '—'}</td>
                  </>
                )}
                {view === 'full' &&
                  SCENARIOS.map((s) => {
                    const c = r.scenarios[s.id];
                    if (c.mean === null) {
                      return (
                        <td key={s.id} className="num" title={`${s.id}: not published`}>
                          —
                        </td>
                      );
                    }
                    const win = c.mean >= s.threshold;
                    const tip =
                      `${s.id}: ${fmt(c.mean)}%` +
                      (c.std !== null ? ` ± ${fmt(c.std)} (std)` : '') +
                      (c.ci95 !== null ? `, ±${fmt(c.ci95)} (95% CI)` : '');
                    return (
                      <td key={s.id} className={`num${win ? ' win' : ''}`} title={tip}>
                        {fmt(c.mean)}
                      </td>
                    );
                  })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="lb-foot">
        Survival rate (%), mean of 3 independent trials per model × scenario. Hover a
        cell for std and 95% CI where available. Green cells meet the scenario win
        threshold (75%, or 55% for weather_noise). Family columns are means over
        per-scenario results; rank (#) is always by overall average within the mode.
        † averages derived from the paper's reported Δ vs ReAct — per-scenario
        breakdowns not published.
      </p>
    </div>
  );
}
