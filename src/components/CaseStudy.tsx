import { useState } from 'react';
import rawData from '../data/rubric.json';
import './CaseStudy.css';

interface Criterion {
  id: string;
  dimension: string;
  weight: number;
  verdict: string;
  score: number;
  weighted_score: number;
  reasoning: string;
  evidence: string[];
}
interface CaseStudy {
  pattern: string;
  pattern_name: string;
  model: string;
  model_csv: string;
  scenario: string;
  survival: number | null;
  win: boolean;
  rubric_points: number;
  summary: string;
  criteria: Criterion[];
  session_id: string;
}
interface DB {
  meta: {
    failure_modes: {
      order: string[];
      names: Record<string, string>;
      colors: Record<string, string>;
      logic: Record<string, string>;
    };
    criteria: { id: string; title: string; weight: number }[];
  };
  case_studies: CaseStudy[];
}

const db = rawData as unknown as DB;
const FM = db.meta.failure_modes;

const CRITERIA_TITLE: Record<string, string> = Object.fromEntries(
  db.meta.criteria.map((c) => [c.id, c.title]),
);

export default function CaseStudyViewer() {
  const cases = db.case_studies;
  const [idx, setIdx] = useState(0);
  const [openCr, setOpenCr] = useState<string | null>(null);

  const cs = cases[idx];

  const select = (i: number) => {
    setIdx(i);
    setOpenCr(null);
  };

  return (
    <div className="cs">
      <div className="cs-tabs" role="tablist" aria-label="Failure-mode case studies">
        {cases.map((c, i) => (
          <button
            key={c.pattern}
            role="tab"
            aria-selected={i === idx}
            className={`cs-tab${i === idx ? ' active' : ''}`}
            style={{ borderColor: FM.colors[c.pattern] }}
            onClick={() => select(i)}
          >
            <span className="cs-tab-code" style={{ background: FM.colors[c.pattern] }}>
              {c.pattern}
            </span>
            <span className="cs-tab-name">{FM.names[c.pattern]}</span>
          </button>
        ))}
      </div>

      <div className="cs-panel">
        <div className="cs-head">
          <div>
            <h3 className="cs-title">
              <span className="cs-tag" style={{ background: FM.colors[cs.pattern] }}>
                {cs.pattern}
              </span>
              {cs.pattern_name}
            </h3>
            <p className="cs-summary">{cs.summary}</p>
          </div>
          <div className="cs-meta">
            <div className="cs-meta-row">
              <span className="cs-k">Model</span>
              <span className="cs-v">{cs.model}</span>
            </div>
            <div className="cs-meta-row">
              <span className="cs-k">Scenario</span>
              <span className="cs-v">
                <code>{cs.scenario}</code>
              </span>
            </div>
            <div className="cs-meta-row">
              <span className="cs-k">Survival</span>
              <span className={`cs-v ${cs.win ? 'win' : 'loss'}`}>
                {cs.survival != null ? `${cs.survival}%` : '—'} {cs.win ? '✓ win' : '✖ loss'}
              </span>
            </div>
            <div className="cs-meta-row">
              <span className="cs-k">Rubric</span>
              <span className="cs-v">
                {cs.rubric_points} / 16
              </span>
            </div>
          </div>
        </div>

        <p className="cs-thesis">
          {cs.win ? (
            <>
              <strong>Why this matters:</strong> this session <em>won</em> on survival yet scored{' '}
              <strong>{cs.rubric_points}/16</strong> on causal reasoning — the two metrics diverge,
              exactly the gap CausalGame is designed to expose.
            </>
          ) : (
            <>
              <strong>Why this matters:</strong> this session failed on both survival and causal
              reasoning ({cs.rubric_points}/16) — the agent never engaged with the problem at all.
            </>
          )}
        </p>

        <div className="cs-rubric">
          <div className="cs-rubric-h">Rubric breakdown · judge 1 of 3 · click a row to expand</div>
          {cs.criteria.map((cr) => {
            const passed = cr.verdict === 'SATISFIED';
            const open = openCr === cr.id;
            return (
              <div key={cr.id} className={`cs-crit${open ? ' open' : ''}`}>
                <button
                  className="cs-crit-head"
                  onClick={() => setOpenCr(open ? null : cr.id)}
                  aria-expanded={open}
                >
                  <span className={`cs-verdict ${passed ? 'pass' : 'fail'}`}>
                    {passed ? '✓' : '✗'}
                  </span>
                  <span className="cs-crit-id">
                    <code>{cr.id}</code>
                  </span>
                  <span className="cs-crit-title">{CRITERIA_TITLE[cr.id] ?? cr.id}</span>
                  <span className="cs-crit-score">
                    {cr.score.toFixed(0)}/{cr.weight}
                  </span>
                  <span className="cs-chev">{open ? '▴' : '▾'}</span>
                </button>
                {open && (
                  <div className="cs-crit-body">
                    <p className="cs-reasoning">{cr.reasoning}</p>
                    {cr.evidence.length > 0 && (
                      <div className="cs-evidence">
                        <span className="cs-evidence-h">Evidence quoted from the agent report:</span>
                        <ul>
                          {cr.evidence.map((e, i) => (
                            <li key={i}>{e}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="note cs-foot">
          Verdict and reasoning shown for one representative judge; criteria scores are averaged
          across all 3 judges in the aggregate stats. Pattern <code>{cs.pattern}</code> classified
          by: <code>{FM.logic[cs.pattern]}</code>.
        </p>
      </div>
    </div>
  );
}
