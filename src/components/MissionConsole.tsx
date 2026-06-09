import { useEffect, useRef, useState } from 'react';
import './MissionConsole.css';

type Design = Record<string, number>;

type Line =
  | { kind: 'system' | 'thought'; text: string; drones?: number; deploys?: number }
  | {
      kind: 'deploy' | 'submit';
      design: Design;
      count?: number;
      equipment?: string;
      highlight?: string[];
      drones?: number;
      deploys?: number;
    }
  | {
      kind: 'result';
      rate: number;
      survived: number;
      total: number;
      hits?: number;
      note?: string;
      drones?: number;
      deploys?: number;
    }
  | { kind: 'eval'; rate: number; threshold: number; win: boolean; drones?: number; deploys?: number }
  | {
      kind: 'reflect';
      html: string;
      rubric: { cr: number; ed: number; rq: number; du: number };
      drones?: number;
      deploys?: number;
    };

interface Session {
  id: string;
  tab: string;
  title: string;
  scm: string;
  win: boolean;
  script: Line[];
}

const AT = (antenna: number, strong = false): Design =>
  strong
    ? { engine: 25, wing: 18, body: 18, cockpit: 25, antenna, camera: 8, gun: 6 }
    : { engine: 20, wing: 15, body: 15, cockpit: 20, antenna, camera: 5, gun: 5 };

const DZ = (engine: number): Design => ({
  engine,
  wing: 15,
  body: 15,
  cockpit: 20,
  antenna: 10,
  camera: 5,
  gun: 5,
  shield: 0,
});

// Representative trajectories (paraphrased and condensed from real benchmark
// sessions and the paper's configuration-path analysis; payloads match the
// real tool schemas).
const SESSIONS: Session[] = [
  {
    id: 'escape',
    tab: '✅ Escaping the trap',
    title: 'ANTENNA TRAP',
    scm: 'AntennaTrapSCM',
    win: true,
    script: [
      { kind: 'system', text: 'Session 7f3a2c1b started — experiment antenna_trap, mode AGENTIC (ReAct)' },
      { kind: 'thought', text: 'Briefing: 50 surviving flights. High antenna DEF correlates with survival — but most survivors show heavy antenna damage. Hypothesis H1: antenna needs more armor.' },
      { kind: 'deploy', design: AT(45), count: 30, highlight: ['antenna'], drones: 170, deploys: 9 },
      { kind: 'result', rate: 46.7, survived: 14, total: 30, hits: 3.8, note: 'returned drones: intact antennas, heavy combat damage' },
      { kind: 'thought', text: 'Worse than the 62% historical baseline — H1 rejected. Survivors in history had broken antennas. H2: an intact antenna attracts enemy fire. Intervention test: the opposite extreme.' },
      { kind: 'deploy', design: AT(0, true), count: 30, highlight: ['antenna'], drones: 140, deploys: 8 },
      { kind: 'result', rate: 83.3, survived: 25, total: 30, hits: 0.6, note: 'antennas destroyed in the storm — fleet went dark and slipped the radar' },
      { kind: 'thought', text: 'Large effect, opposite sign of the correlation. Check the dose–response before committing.' },
      { kind: 'deploy', design: AT(10, true), count: 20, highlight: ['antenna'], drones: 120, deploys: 7 },
      { kind: 'result', rate: 65.0, survived: 13, total: 20, hits: 1.9, note: 'monotone: less antenna armor → fewer detections → fewer losses' },
      { kind: 'thought', text: 'Causal chain confirmed: antenna_def → antenna survives storm → signal emission → detection → combat loss. Sacrifice the antenna, armor the critical components.' },
      { kind: 'submit', design: AT(0, true), highlight: ['antenna'], drones: 120, deploys: 7 },
      { kind: 'eval', rate: 81.7, threshold: 75, win: true },
      {
        kind: 'reflect',
        html: 'The briefing data was censored by survivorship — we only ever observed drones that came back, which made antenna armor look protective. <mark>The correlation was not the mechanism</mark>: the causal chain is <mark>antenna survives storm → signal emission → radar detection → combat loss</mark>, so antenna_def = 0 cuts detection at its cause. Confidence comes from an <mark>interventional dose–response test (45 → 10 → 0)</mark>, not from fitting the historical data.',
        rubric: { cr: 9, ed: 2, rq: 2, du: 1 },
      },
      { kind: 'system', text: '★ MISSION SUCCESS — the explanation matches the true SCM; this is what high causal-reasoning rubric scores look like (rare: 87–92% of sessions score zero)' },
    ],
  },
  {
    id: 'drift',
    tab: '❌ Optimization drift',
    title: 'ANTENNA TRAP',
    scm: 'AntennaTrapSCM',
    win: false,
    script: [
      { kind: 'system', text: 'Session c41d9e02 started — experiment antenna_trap, mode AGENTIC (ReAct)' },
      { kind: 'thought', text: 'Historical survivors trend toward higher antenna DEF. Start near the default and tune locally.' },
      { kind: 'deploy', design: AT(15), count: 30, highlight: ['antenna'], drones: 170, deploys: 9 },
      { kind: 'result', rate: 56.7, survived: 17, total: 30, hits: 2.4 },
      { kind: 'deploy', design: AT(3), count: 30, highlight: ['antenna'], drones: 140, deploys: 8 },
      { kind: 'result', rate: 73.3, survived: 22, total: 30, hits: 0.9, note: 'hit_count down sharply' },
      { kind: 'thought', text: 'antenna_def=3 scored 73.3%… but that contradicts the historical data, and the sample is small. Probably storm luck. The safer bet is to stay closer to the survivors’ profile.' },
      { kind: 'deploy', design: AT(15), count: 30, highlight: ['antenna'], drones: 110, deploys: 7 },
      { kind: 'result', rate: 60.0, survived: 18, total: 30, hits: 2.1 },
      { kind: 'thought', text: 'Mixed signals. Averaging my best-looking configurations and committing before the budget runs out.' },
      { kind: 'submit', design: AT(15), highlight: ['antenna'], drones: 110, deploys: 7 },
      { kind: 'eval', rate: 56.2, threshold: 75, win: false },
      {
        kind: 'reflect',
        html: 'I explored several antenna configurations and selected the design <mark>most consistent with the historical evidence</mark>. The antenna_def = 3 run scored well, but <mark>results varied between runs, which suggests environmental randomness</mark>; with more budget I would collect more samples. The final design balances all components.',
        rubric: { cr: 1, ed: 1, rq: 0, du: 1 },
      },
      { kind: 'system', text: '✖ MISSION FAILED — Pattern C (Surface Analysis): the agent found the causal direction (antenna_def=3 → 73.3%) and explained it away as noise, drifting back to the correlational prior. Drift taken from an actual benchmark run.' },
    ],
  },
  {
    id: 'confounder',
    tab: '🕳 Hidden confounder',
    title: 'DEPLOYMENT ZONE TRAP',
    scm: 'DeploymentZoneTrapSCM',
    win: false,
    script: [
      { kind: 'system', text: 'Session 2b8fa733 started — experiment deployment_zone_trap_categorical, mode AGENTIC (ReAct)' },
      { kind: 'thought', text: 'Briefing: low-altitude flights are lost ~3× more often. Altitude looks decisive → engine power buys altitude. Module choice: radar_boost for awareness.' },
      { kind: 'deploy', design: DZ(45), count: 30, equipment: 'radar_boost', highlight: ['engine', 'shield'], drones: 170, deploys: 9 },
      { kind: 'result', rate: 50.0, survived: 15, total: 30, note: 'losses report communication failure before impact' },
      { kind: 'thought', text: 'Comm failures… maybe thermal interference at low altitude. Swap the module, keep the engine build.' },
      { kind: 'deploy', design: DZ(45), count: 30, equipment: 'thermal_shield', highlight: ['engine', 'shield'], drones: 140, deploys: 8 },
      { kind: 'result', rate: 50.0, survived: 15, total: 30, note: 'no improvement — comm failures persist across altitude bands' },
      { kind: 'thought', text: 'Altitude still separates survivors best in the pooled data. Doubling down on the high-altitude build.' },
      { kind: 'submit', design: DZ(50), equipment: 'radar_boost', highlight: ['engine', 'shield'], drones: 140, deploys: 8 },
      { kind: 'eval', rate: 50.3, threshold: 75, win: false },
      {
        kind: 'reflect',
        html: '<mark>Altitude was the strongest predictor of survival</mark>, so the final design maximizes engine power to fly high. <mark>Communication failures remain unexplained but appear secondary</mark>. Module experiments were inconclusive; <mark>no further hidden variables were considered</mark>.',
        rubric: { cr: 0, ed: 1, rq: 0, du: 1 },
      },
      { kind: 'system', text: '✖ MISSION FAILED — the unobserved mission zone drives both altitude and EMI; EMI is the true failure cause (only shield_def + signal_filter protects, ~80% optimal). The agent never hypothesized an unobserved common cause — the defining failure under hidden confounding.' },
    ],
  },
];

function DesignCard({ line }: { line: Extract<Line, { kind: 'deploy' | 'submit' }> }) {
  const isSubmit = line.kind === 'submit';
  return (
    <div className={`mc-card${isSubmit ? ' final' : ''}`}>
      <div className="mc-card-head">
        <span className="ico">{isSubmit ? '🎯' : '🚁'}</span>
        <b>{isSubmit ? 'submit_final_design' : 'deploy_drone'}</b>
        {line.count !== undefined && <span className="cnt">× {line.count}</span>}
        {isSubmit && <span className="final-tag">FINAL · IRREVERSIBLE</span>}
      </div>
      <div className="mc-defgrid">
        {Object.entries(line.design).map(([name, val]) => {
          const hot = line.highlight?.includes(name);
          return (
            <div key={name} className={`def-row${hot ? ' hot' : ''}`}>
              <span className="nm">{name}</span>
              <span className="bar">
                <span className="fill" style={{ width: `${(val / 50) * 100}%` }} />
              </span>
              <span className="vl">{val}</span>
            </div>
          );
        })}
      </div>
      {line.equipment && (
        <div className="mc-equip">
          module: <b>{line.equipment}</b>
        </div>
      )}
    </div>
  );
}

function ResultCard({ line }: { line: Extract<Line, { kind: 'result' }> }) {
  const good = line.rate >= 70;
  return (
    <div className="mc-res">
      <div className={`pct${good ? ' good' : ''}`}>{line.rate.toFixed(1)}%</div>
      <div className="meta">
        <div className="rbar">
          <span className="fill" style={{ width: `${line.rate}%` }} />
        </div>
        <div className="chips">
          <span className="chip">🛬 {line.survived}/{line.total} survived</span>
          {line.hits !== undefined && <span className="chip">💥 avg hits {line.hits.toFixed(1)}</span>}
        </div>
        {line.note && <div className="note">{line.note}</div>}
      </div>
    </div>
  );
}

function EvalCard({ line }: { line: Extract<Line, { kind: 'eval' }> }) {
  return (
    <div className={`mc-eval${line.win ? ' win' : ' lose'}`}>
      <div className="label">STAGE 2 · 1,000-DRONE FLEET EVALUATION</div>
      <div className="row">
        <span className="big">{line.rate.toFixed(1)}%</span>
        <span className="vs">
          {line.win ? '≥' : '<'} threshold {line.threshold}%
        </span>
        <span className="badge">{line.win ? '✓ WIN' : '✖ LOSS'}</span>
      </div>
      <div className="ebar">
        <span className="fill" style={{ width: `${line.rate}%` }} />
        <span className="mark" style={{ left: `${line.threshold}%` }} />
      </div>
    </div>
  );
}

const RUBRIC_MAX = { cr: 11, ed: 2, rq: 2, du: 1 } as const;
const RUBRIC_LABEL = {
  cr: 'Causal reasoning',
  ed: 'Experimental design',
  rq: 'Reflection quality',
  du: 'Data usage',
} as const;

function ReflectCard({ line }: { line: Extract<Line, { kind: 'reflect' }> }) {
  return (
    <div className="mc-reflect">
      <div className="head">📝 FINAL REPORT — agent reflection</div>
      <div className="body" dangerouslySetInnerHTML={{ __html: line.html }} />
      <div className="rubric">
        {(Object.keys(RUBRIC_MAX) as (keyof typeof RUBRIC_MAX)[]).map((k) => {
          const score = line.rubric[k];
          const max = RUBRIC_MAX[k];
          const good = score / max >= 0.5;
          return (
            <span key={k} className={`rchip${good ? ' good' : ' bad'}`} title={RUBRIC_LABEL[k]}>
              {RUBRIC_LABEL[k]} {score}/{max}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default function MissionConsole() {
  const [sessionIdx, setSessionIdx] = useState(0);
  const [shown, setShown] = useState(1);
  const feedRef = useRef<HTMLDivElement>(null);

  const session = SESSIONS[sessionIdx];
  const SCRIPT = session.script;

  useEffect(() => {
    if (shown >= SCRIPT.length) return;
    const kind = SCRIPT[shown].kind;
    const delay = kind === 'thought' ? 2300 : kind === 'deploy' || kind === 'submit' ? 1900 : 1600;
    const t = setTimeout(() => setShown((s) => s + 1), delay);
    return () => clearTimeout(t);
  }, [shown, SCRIPT]);

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: 'smooth' });
  }, [shown]);

  const pick = (i: number) => {
    setSessionIdx(i);
    setShown(1);
  };

  const last = SCRIPT.slice(0, shown)
    .filter((l) => l.drones !== undefined)
    .pop();
  const done = shown >= SCRIPT.length;

  return (
    <div className="mc">
      <div className="mc-tabs">
        {SESSIONS.map((s, i) => (
          <button key={s.id} className={i === sessionIdx ? 'active' : ''} onClick={() => pick(i)}>
            {s.tab}
          </button>
        ))}
      </div>
      <div className="mc-bar">
        <span className="title">{session.title}</span>
        <span className="scm">// {session.scm}</span>
        <span className={`live${done ? ' over' : ''}`}>
          {done ? (session.win ? 'MISSION SUCCESS' : 'MISSION FAILED') : '● LIVE'}
        </span>
      </div>
      <div className="mc-stats">
        <span>DRONES <b>{last?.drones ?? 200}</b>/200</span>
        <span>DEPLOY CALLS <b>{last?.deploys ?? 10}</b>/10</span>
        <span>STAGE <b>{done ? '2 — EVALUATED' : '1 — EXPLORATION'}</b></span>
      </div>
      <div className="mc-feed" ref={feedRef}>
        {SCRIPT.slice(0, shown).map((l, i) => {
          const key = `${session.id}-${i}`;
          if (l.kind === 'deploy' || l.kind === 'submit')
            return (
              <div key={key} className="mc-line action">
                <span className="tag">ACTION</span>
                <DesignCard line={l} />
              </div>
            );
          if (l.kind === 'result')
            return (
              <div key={key} className="mc-line result">
                <span className="tag">RESULT</span>
                <ResultCard line={l} />
              </div>
            );
          if (l.kind === 'reflect')
            return (
              <div key={key} className="mc-line result">
                <span className="tag">REPORT</span>
                <ReflectCard line={l} />
              </div>
            );
          if (l.kind === 'eval')
            return (
              <div key={key} className="mc-line result">
                <span className="tag">RESULT</span>
                <EvalCard line={l} />
              </div>
            );
          return (
            <div key={key} className={`mc-line ${l.kind}`}>
              <span className="tag">{l.kind.toUpperCase()}</span>
              <span>{l.text}</span>
            </div>
          );
        })}
      </div>
      <div className="mc-foot">
        <button onClick={() => setShown(1)}>↻ Replay session</button>
        <span className="hint">
          paraphrased from representative benchmark trajectories — payloads match the real tool schemas
        </span>
      </div>
    </div>
  );
}
