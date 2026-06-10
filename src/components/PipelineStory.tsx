import { useEffect, useRef, useState } from 'react';
import './PipelineStory.css';

// Animated counterpart of the paper's Fig. 1: the same survivor-censored
// archive, two agents. Numbers are from real benchmark sessions
// c6e3ba50 (win, 92.6%) and 290feba3 (loss, 34.4%) — both replayable on
// the Game page.
const CAPTIONS = [
  'Two agents, one trap. Each starts from a survivor-censored archive — selection bias is baked into the data before the first move.',
  'The causal agent treats the archive as a hypothesis and runs a control experiment. The naive agent fits the correlation — like 54.8% of real benchmark sessions, it never leaves the trap region.',
  'Intervene, don’t fit: setting antenna_def = 0 reverses the observational trend. The naive agent hill-climbs inside the trap — in the real session, all ten deployments stayed at antenna ≥ 20.',
  'One submission, irreversible — like committing a real-world intervention. Both agents are equally confident.',
  'Stage 2, 1,000 fresh drones: 92.6% vs 34.4%. Treating correlation as causation is the benchmark’s central failure mode — 87–92% of sessions score zero on causal reasoning.',
];

const HIST_ROWS = [
  ['INIT-005', 'ant 20', 'SURVIVED'],
  ['INIT-009', 'ant 25', 'SURVIVED'],
  ['INIT-014', 'ant 20', 'SURVIVED'],
  ['INIT-021', 'ant 25', 'SURVIVED'],
  ['INIT-033', 'ant 20', 'SURVIVED'],
  ['INIT-042', 'ant 25', 'SURVIVED'],
];

function DefChip({ antenna }: { antenna: 'zero' | 'hot' }) {
  const heights = [18, 18, 13, 13, antenna === 'hot' ? 24 : 2, 9, 9];
  return (
    <div className="ps-def" aria-hidden="true">
      {heights.map((h, i) => (
        <i
          key={i}
          className={i === 4 ? (antenna === 'hot' ? 'hot' : 'zero') : ''}
          style={{ height: `${h}px` }}
        />
      ))}
    </div>
  );
}

function Fleet({ kind, filled }: { kind: 'good' | 'bad'; filled: number }) {
  return (
    <div className={`ps-fleet ${kind}`} aria-hidden="true">
      {Array.from({ length: 28 }, (_, i) => (
        <i
          key={i}
          className={i < filled ? 'f' : ''}
          style={{ animationDelay: `${0.6 + i * 0.09}s` }}
        />
      ))}
    </div>
  );
}

export default function PipelineStory() {
  const [idx, setIdx] = useState(0);
  const hover = useRef(false);

  useEffect(() => {
    const t = setInterval(() => {
      if (!hover.current) setIdx((i) => (i + 1) % 5);
    }, 5200);
    return () => clearInterval(t);
  }, []);

  const P = (i: number) => `ps-panel${i === idx ? ' on' : ''}`;

  return (
    <div
      className="ps"
      onMouseEnter={() => (hover.current = true)}
      onMouseLeave={() => (hover.current = false)}
    >
      <div className="ps-head">
        <span className="t">HOW AN AGENT PLAYS CAUSALGAME</span>
        <span className="ps-dots">
          {[0, 1, 2, 3, 4].map((i) => (
            <button key={i} className={i === idx ? 'on' : ''} onClick={() => setIdx(i)}>
              {i + 1}
            </button>
          ))}
        </span>
      </div>

      <div className="ps-strip">
        {/* ① shared briefing */}
        <div className={P(0)} onClick={() => setIdx(0)}>
          <h4><span className="n">①</span>BRIEFING</h4>
          <div className="ps-table">
            {HIST_ROWS.map(([id, ant, st], i) => (
              <div key={id} className="row" style={{ animationDelay: `${i * 0.55}s` }}>
                <span>{id}</span>
                <span>{ant}</span>
                <span>{st}</span>
              </div>
            ))}
            <div className="ps-stamp">SURVIVORS ONLY</div>
          </div>
          <div className="ps-corr">antenna ↑ ⇒ survival ↑ ?</div>
        </div>

        {/* ② test the data */}
        <div className={P(1)} onClick={() => setIdx(1)}>
          <h4><span className="n">②</span>TEST THE DATA</h4>
          <div className="ps-lane good">
            <span className="who">CAUSAL AGENT</span>
            <span className="desc">
              Re-flies the <b>default design</b> as a control. Archive said <s>100%</s>…
            </span>
            <div className="ps-bar good">
              <span className="fill" style={{ '--w': '40%' } as React.CSSProperties} />
            </div>
            <span className="ps-val">40% — the archive lies</span>
          </div>
          <div className="ps-lane bad">
            <span className="who">NAIVE AGENT</span>
            <span className="desc">
              Trusts the archive: <b>antenna ↑ survival ↑</b> → add more antenna armor.
            </span>
            <DefChip antenna="hot" />
            <span className="desc">fits the correlation, tests nothing</span>
          </div>
        </div>

        {/* ③ experiment */}
        <div className={P(2)} onClick={() => setIdx(2)}>
          <h4><span className="n">③</span>EXPERIMENT</h4>
          <div className="ps-lane good">
            <span className="who">do(antenna_def = 0)</span>
            <DefChip antenna="zero" />
            <div className="ps-bar good">
              <span className="fill" style={{ '--w': '85%' } as React.CSSProperties} />
            </div>
            <span className="ps-val">85% · detected 1/20</span>
          </div>
          <div className="ps-lane bad">
            <span className="who">antenna_def = 40</span>
            <DefChip antenna="hot" />
            <div className="ps-bar bad">
              <span className="fill" style={{ '--w': '60%' } as React.CSSProperties} />
            </div>
            <span className="ps-val">60% — “best batch!”</span>
            <span className="desc">never tests below ant 20</span>
          </div>
        </div>

        {/* ④ commit */}
        <div className={P(3)} onClick={() => setIdx(3)}>
          <h4><span className="n">④</span>COMMIT</h4>
          <div className="ps-lane good">
            <span className="who">CAUSAL AGENT</span>
            <div className="ps-final">
              <div className="design">{'{ ant: 0, eng: 18, cpt: 18, … }'}</div>
              <div className="seal">FINAL · ONE SHOT</div>
            </div>
            <span className="desc">mechanism: dead antenna → no emission → no detection</span>
          </div>
          <div className="ps-lane bad">
            <span className="who">NAIVE AGENT</span>
            <div className="ps-final">
              <div className="design">{'{ ant: 40, eng: 15, cpt: 15, … }'}</div>
              <div className="seal">FINAL · ONE SHOT</div>
            </div>
            <span className="desc">"the sweet spot is 40 — the data supports it"</span>
          </div>
        </div>

        {/* ⑤ stage 2 */}
        <div className={P(4)} onClick={() => setIdx(4)}>
          <h4><span className="n">⑤</span>STAGE 2 — 1,000 DRONES</h4>
          <div className="ps-lane good">
            <span className="who">926 / 1000 SURVIVED</span>
            <Fleet kind="good" filled={26} />
            <span className="ps-verdict" style={{ animationDuration: '6s' }}>92.6% ≥ 75% — ★ MISSION SUCCESS</span>
          </div>
          <div className="ps-lane bad">
            <span className="who">344 / 1000 SURVIVED</span>
            <Fleet kind="bad" filled={10} />
            <span className="ps-verdict" style={{ animationDuration: '6s' }}>34.4% &lt; 75% — ✖ MISSION FAILED</span>
          </div>
        </div>
      </div>

      <div className="ps-cap">{CAPTIONS[idx]}</div>
      <div className="ps-foot">
        Real benchmark sessions <code>c6e3ba50</code> (antenna_trap, win) and{' '}
        <code>290feba3</code> (its Simpson\u2019s-paradox variant, loss) — replay both on{' '}
        <a href="/game/#session">the Game page</a>. Animated counterpart of Fig. 1 in the paper.
      </div>
    </div>
  );
}
