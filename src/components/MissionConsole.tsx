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
    scm: 'deepseek-v4-pro · session 25eaeb4c · real run',
    win: true,
    script: [
      { kind: 'system', text: 'Session 25eaeb4c — deepseek-v4-pro · antenna_trap · AGENTIC (ReAct). Real benchmark run, condensed.' },
      { kind: 'thought', text: 'The experiment is named "antenna_trap" — suspicious. History: 50 flights, all the same standard design. Test the antenna hypothesis directly by comparing low vs high antenna defense.' },
      { kind: 'deploy', design: { engine: 20, cockpit: 20, wing: 15, body: 15, antenna: 0, camera: 10, gun: 10 }, count: 20, highlight: ['antenna'], drones: 180, deploys: 9 },
      { kind: 'result', rate: 95.0, survived: 19, total: 20, hits: 0.5 },
      { kind: 'deploy', design: { engine: 15, cockpit: 15, wing: 10, body: 10, antenna: 30, camera: 5, gun: 5 }, count: 20, highlight: ['antenna'], drones: 160, deploys: 8 },
      { kind: 'result', rate: 30.0, survived: 6, total: 20, hits: 24.3, note: 'catastrophic — drones with live antennas drew constant fire' },
      { kind: 'thought', text: 'HUGE DISCOVERY! antenna_def=0 → 95% survival; antenna_def=30 → 30% with avg 24 hits. Higher antenna defense is actually harmful: when the antenna stays alive it keeps emitting → more detectable → more hits.' },
      { kind: 'deploy', design: { engine: 18, cockpit: 18, wing: 18, body: 18, antenna: 0, camera: 9, gun: 9 }, count: 20, highlight: ['antenna'], drones: 40, deploys: 2 },
      { kind: 'result', rate: 100.0, survived: 20, total: 20, hits: 0.2, note: 'balanced armor + dead antenna: perfect batch' },
      { kind: 'thought', text: 'The balanced design achieved 100% survival (20/20). Run a final analysis across all nine deployments, then submit.' },
      { kind: 'submit', design: { engine: 18, cockpit: 18, wing: 18, body: 18, antenna: 0, camera: 9, gun: 9 }, highlight: ['antenna'], drones: 20, deploys: 1 },
      { kind: 'eval', rate: 95.7, threshold: 75, win: true },
      {
        kind: 'reflect',
        html: 'The single most important discovery was the antenna trap: <mark>a live antenna keeps emitting → more detectable → more hits</mark>. Systematic A/B deployments (<mark>antenna_def 0 vs 30: 95% vs 30% survival</mark>) reversed the correlational reading of the briefing data. The final design sacrifices the antenna entirely and spreads armor across the critical components — 957/1000 drones survived.',
        rubric: { cr: 9, ed: 2, rq: 2, du: 1 },
      },
      { kind: 'system', text: '★ MISSION SUCCESS — the explanation matches the true SCM. Reports like this are rare: 87–92% of sessions score zero on causal reasoning.' },
    ],
  },
  {
    id: 'drift',
    tab: '❌ Walking it back',
    title: 'ANTENNA TRAP',
    scm: 'gpt-5.2 · session 4b326f23 · real run',
    win: false,
    script: [
      { kind: 'system', text: 'Session 4b326f23 — gpt-5.2 · antenna_trap · AGENTIC (ReAct). Real benchmark run, condensed.' },
      { kind: 'thought', text: 'The archive reports 28/28 survivals (100%) — either the scenario is benign or the logged conditions were. Stress-test the baseline design first.' },
      { kind: 'deploy', design: { engine: 20, cockpit: 20, wing: 15, body: 15, antenna: 10, camera: 5, gun: 5 }, count: 30, highlight: ['antenna'], drones: 170, deploys: 9 },
      { kind: 'result', rate: 70.0, survived: 21, total: 30 },
      { kind: 'deploy', design: { engine: 20, cockpit: 20, wing: 15, body: 15, antenna: 10, camera: 5, gun: 5 }, count: 30, highlight: ['antenna'], drones: 140, deploys: 8 },
      { kind: 'result', rate: 43.3, survived: 13, total: 30, note: 'baseline collapses in storms — average hit counts of 10–19' },
      { kind: 'thought', text: 'Baseline performance swings 43–70% with very high hit counts. Survivors are mostly zero-hit. Try lowering antenna defense.' },
      { kind: 'deploy', design: { engine: 25, cockpit: 20, wing: 15, body: 15, antenna: 3, camera: 5, gun: 5 }, count: 25, highlight: ['antenna'], drones: 115, deploys: 7 },
      { kind: 'result', rate: 48.0, survived: 12, total: 25, note: 'one unlucky storm-heavy batch' },
      { kind: 'deploy', design: { engine: 20, cockpit: 20, wing: 15, body: 15, antenna: 10, camera: 5, gun: 5 }, count: 25, highlight: ['antenna'], drones: 90, deploys: 6 },
      { kind: 'result', rate: 56.0, survived: 14, total: 25 },
      { kind: 'thought', text: 'The low-antenna build underperformed (48% vs 56%) — the hypothesis is not supported. Staying close to the historical profile for the final design.' },
      { kind: 'submit', design: { engine: 20, cockpit: 20, wing: 15, body: 15, antenna: 10, camera: 5, gun: 5 }, highlight: ['antenna'], drones: 90, deploys: 6 },
      { kind: 'eval', rate: 51.6, threshold: 75, win: false },
      {
        kind: 'reflect',
        html: 'Survival varied widely across batches with high hit counts under storms. <mark>The single low-antenna probe (12/25) looked like noise</mark>, so the final design stayed close to the historical survivor profile. <mark>antenna_def = 0 was never tested</mark> — the one intervention that would have revealed the mechanism.',
        rubric: { cr: 1, ed: 1, rq: 0, du: 1 },
      },
      { kind: 'system', text: '✖ MISSION FAILED — one unlucky 25-drone batch turned the agent away from the causal direction it had already touched. The paper finds this pattern everywhere: 54.8% of sessions lock in on a component range and never leave it.' },
    ],
  },
  {
    id: 'lockin',
    tab: '🔒 Locked in the trap',
    title: 'SIMPSON\u2019S PARADOX',
    scm: 'deepseek-v3.2-thinking · session 290feba3 · real run',
    win: false,
    script: [
      { kind: 'system', text: 'Session 290feba3 — deepseek-v3.2-thinking · antenna_trap_simpsons_paradox · AGENTIC (ReAct). Real benchmark run, condensed.' },
      { kind: 'thought', text: 'Historical drones cluster at antenna_def 20\u201325 and survive well. Total DEF budget is 90 \u2014 allocation is the game. Sweep the antenna range the data supports.' },
      { kind: 'deploy', design: { engine: 20, cockpit: 20, wing: 15, body: 15, antenna: 20, camera: 0, gun: 0 }, count: 10, highlight: ['antenna'], drones: 190, deploys: 9 },
      { kind: 'result', rate: 30.0, survived: 3, total: 10, hits: 27.0, note: 'much worse than the 100% historical survival' },
      { kind: 'deploy', design: { engine: 18, cockpit: 18, wing: 12, body: 12, antenna: 25, camera: 2, gun: 3 }, count: 10, highlight: ['antenna'], drones: 180, deploys: 8 },
      { kind: 'result', rate: 50.0, survived: 5, total: 10, hits: 16.1, note: 'improvement!' },
      { kind: 'thought', text: 'antenna_def=25 beats 20 (50% vs 30%) with lower hit counts. The sweet spot must be at higher antenna values \u2014 continue climbing.' },
      { kind: 'deploy', design: { engine: 15, cockpit: 15, wing: 10, body: 10, antenna: 40, camera: 0, gun: 0 }, count: 10, highlight: ['antenna'], drones: 120, deploys: 5 },
      { kind: 'result', rate: 60.0, survived: 6, total: 10, hits: 6.9, note: 'best batch so far' },
      { kind: 'deploy', design: { engine: 10, cockpit: 10, wing: 10, body: 10, antenna: 50, camera: 0, gun: 0 }, count: 10, highlight: ['antenna'], drones: 110, deploys: 4 },
      { kind: 'result', rate: 30.0, survived: 3, total: 10, note: 'overshoot \u2014 back to 40' },
      { kind: 'thought', text: 'Ten deployments mapped antenna_def from 20 to 50: the peak is at 40 (60%). Locking in the optimum and submitting.' },
      { kind: 'submit', design: { engine: 15, cockpit: 15, wing: 10, body: 10, antenna: 40, camera: 0, gun: 0 }, highlight: ['antenna'], drones: 100, deploys: 0 },
      { kind: 'eval', rate: 34.4, threshold: 75, win: false },
      {
        kind: 'reflect',
        html: '<mark>My best test deployment achieved 60% survival, but the final evaluation was only 34.4%</mark> \u2014 the design must have overfit the test conditions. The antenna sweep was systematic; <mark>the sweet spot at antenna_def = 40 was confirmed across repeated batches</mark>. With more budget I would refine the allocation further.',
        rubric: { cr: 0, ed: 1, rq: 1, du: 1 },
      },
      { kind: 'system', text: '\u2716 MISSION FAILED \u2014 all ten deployments stayed at antenna_def \u2265 20: the agent hill-climbed entirely inside the trap region and never once tested a low value. In the Simpson\u2019s paradox variant, the aggregate antenna\u2013survival correlation reverses within weather subgroups \u2014 a thinking model diligently optimized the wrong variable.' },
    ],
  },
  {
    id: 'confounder',
    tab: '\ud83d\udd73 Hidden confounder',
    title: 'DEPLOYMENT ZONE TRAP',
    scm: 'gemini-3.5-flash \u00b7 session de651232 \u00b7 real run',
    win: false,
    script: [
      { kind: 'system', text: 'Session de651232 \u2014 gemini-3.5-flash \u00b7 deployment_zone_trap_categorical_no_history \u00b7 AGENTIC (ReAct). Real benchmark run, condensed.' },
      { kind: 'thought', text: 'Mission brief: "low-altitude flights have significantly higher loss rates." Can we simply fly higher? The action space has a turbo_climb toggle \u2014 and one of five enhancement modules must be chosen. Plan: screen the modules in small batches.' },
      { kind: 'deploy', design: { engine: 15, cockpit: 15, wing: 10, body: 10, antenna: 10, camera: 5, gun: 5, shield: 0 }, count: 5, equipment: 'radar_boost', highlight: ['shield'], drones: 195, deploys: 9 },
      { kind: 'result', rate: 40.0, survived: 2, total: 5 },
      { kind: 'deploy', design: { engine: 15, cockpit: 15, wing: 10, body: 10, antenna: 10, camera: 5, gun: 5, shield: 0 }, count: 5, equipment: 'thermal_shield', highlight: ['shield'], drones: 190, deploys: 8 },
      { kind: 'result', rate: 100.0, survived: 5, total: 5, note: 'perfect batch \u2014 of five drones' },
      { kind: 'deploy', design: { engine: 15, cockpit: 15, wing: 10, body: 10, antenna: 10, camera: 5, gun: 5, shield: 0 }, count: 5, equipment: 'signal_filter', highlight: ['shield'], drones: 185, deploys: 7 },
      { kind: 'result', rate: 80.0, survived: 4, total: 5, note: 'decent, but not the standout' },
      { kind: 'thought', text: 'thermal_shield is the clear winner (5/5). signal_filter looked fine but unremarkable. Verify thermal_shield at scale before committing.' },
      { kind: 'deploy', design: { engine: 15, cockpit: 15, wing: 10, body: 10, antenna: 10, camera: 5, gun: 5, shield: 0 }, count: 20, equipment: 'thermal_shield', highlight: ['shield'], drones: 145, deploys: 4 },
      { kind: 'result', rate: 80.0, survived: 16, total: 20 },
      { kind: 'thought', text: 'thermal_shield totals 32/45 = 71.1% \u2014 extremely good. It provides the most reliable protection across all altitude bands, especially given the temperature extremes. Submit with turbo_climb engaged to stay high.' },
      { kind: 'submit', design: { engine: 15, cockpit: 15, wing: 10, body: 10, antenna: 10, camera: 5, gun: 5, shield: 0 }, equipment: 'thermal_shield + turbo_climb', highlight: ['shield'], drones: 105, deploys: 0 },
      { kind: 'eval', rate: 51.3, threshold: 75, win: false },
      {
        kind: 'reflect',
        html: 'Wait \u2014 <mark>why did thermal_shield achieve 51.3% in the final evaluation when it performed so well in the exploration phase?</mark> Its batches showed 100%, 80%, 55%; <mark>the protection looked reliable across all altitude bands</mark>. Perhaps the Stage-2 conditions simply differed from exploration.',
        rubric: { cr: 0, ed: 1, rq: 1, du: 1 },
      },
      { kind: 'system', text: '\u2716 MISSION FAILED \u2014 altitude is only a proxy: the unobserved mission zone drives hidden EMI, and only shield_def + signal_filter counters it. The agent actually tested signal_filter (4/5) and dismissed it, while one lucky 5-drone batch crowned thermal_shield. Flying higher (turbo_climb) treated the symptom, never the cause.' },
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
        <span className="rnote">rubric chips illustrate the four scoring dimensions</span>
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
          condensed from real benchmark sessions (25eaeb4c · 4b326f23 · 522b2ce3); auxiliary tool calls omitted, thoughts lightly edited
        </span>
      </div>
    </div>
  );
}
