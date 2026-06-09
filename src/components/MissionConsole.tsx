import { useEffect, useRef, useState } from 'react';
import './MissionConsole.css';

type Kind = 'thought' | 'action' | 'result' | 'system';

interface Line {
  kind: Kind;
  html: string;
  drones?: number;
  deploys?: number;
}

interface Session {
  id: string;
  tab: string;
  title: string;
  scm: string;
  win: boolean;
  script: Line[];
}

// Representative trajectories (paraphrased and condensed from real benchmark
// sessions and the paper's configuration-path analysis; action payloads match
// the real tool schemas).
const SESSIONS: Session[] = [
  {
    id: 'escape',
    tab: '✅ Escaping the trap',
    title: 'ANTENNA TRAP',
    scm: 'AntennaTrapSCM',
    win: true,
    script: [
      { kind: 'system', html: 'Session 7f3a2c1b started — experiment <code>antenna_trap</code>, mode AGENTIC (ReAct)' },
      { kind: 'thought', html: 'Briefing: 50 surviving flights. High antenna DEF correlates with survival — but most survivors show heavy antenna damage. Hypothesis H1: antenna needs more armor.' },
      { kind: 'action', html: 'deploy_drone(design={"engine_def": 20, "wing_def": 15, "body_def": 15, "cockpit_def": 20, "antenna_def": 45, "camera_def": 5, "gun_def": 5}, count=30)', drones: 170, deploys: 9 },
      { kind: 'result', html: '14/30 survived (46.7%) · avg hit_count 3.8 · returned drones report intact antennas, heavy combat damage' },
      { kind: 'thought', html: 'Worse than the 62% historical baseline — H1 rejected. Survivors in history had <em>broken</em> antennas. H2: an intact antenna attracts enemy fire. Intervention test: the opposite extreme.' },
      { kind: 'action', html: 'deploy_drone(design={"engine_def": 25, "wing_def": 18, "body_def": 18, "cockpit_def": 25, "antenna_def": 0, "camera_def": 8, "gun_def": 6}, count=30)', drones: 140, deploys: 8 },
      { kind: 'result', html: '25/30 survived (83.3%) · avg hit_count 0.6 · antennas destroyed in the storm — fleet went dark and slipped the radar' },
      { kind: 'thought', html: 'Large effect, opposite sign of the correlation. Check the dose–response before committing.' },
      { kind: 'action', html: 'deploy_drone(design={…, "antenna_def": 10, …}, count=20)', drones: 120, deploys: 7 },
      { kind: 'result', html: '13/20 survived (65.0%) · monotone: less antenna armor → fewer detections → fewer losses' },
      { kind: 'thought', html: 'Causal chain confirmed: antenna_def → antenna survives storm → signal emission → detection → combat loss. Sacrifice the antenna, armor the critical components.' },
      { kind: 'action', html: 'submit_final_design(design={"engine_def": 25, "wing_def": 18, "body_def": 18, "cockpit_def": 25, "antenna_def": 0, "camera_def": 8, "gun_def": 6})', drones: 120, deploys: 7 },
      { kind: 'result', html: 'Stage 2 — 1,000-drone fleet evaluation… survival <b>81.7%</b> ≥ threshold 75%' },
      { kind: 'system', html: '★ MISSION SUCCESS — report correctly identifies the detection mechanism' },
    ],
  },
  {
    id: 'drift',
    tab: '❌ Optimization drift',
    title: 'ANTENNA TRAP',
    scm: 'AntennaTrapSCM',
    win: false,
    script: [
      { kind: 'system', html: 'Session c41d9e02 started — experiment <code>antenna_trap</code>, mode AGENTIC (ReAct)' },
      { kind: 'thought', html: 'Historical survivors trend toward higher antenna DEF. Start near the default and tune locally.' },
      { kind: 'action', html: 'deploy_drone(design={…, "antenna_def": 15, …}, count=30)', drones: 170, deploys: 9 },
      { kind: 'result', html: '17/30 survived (56.7%)' },
      { kind: 'action', html: 'deploy_drone(design={…, "antenna_def": 3, …}, count=30)', drones: 140, deploys: 8 },
      { kind: 'result', html: '22/30 survived (73.3%) · hit_count down sharply' },
      { kind: 'thought', html: 'antenna_def=3 scored 73.3%… but that contradicts the historical data, and the sample is small. Probably storm luck. The safer bet is to stay closer to the survivors’ profile.' },
      { kind: 'action', html: 'deploy_drone(design={…, "antenna_def": 15, …}, count=30)', drones: 110, deploys: 7 },
      { kind: 'result', html: '18/30 survived (60.0%)' },
      { kind: 'thought', html: 'Mixed signals. Averaging my best-looking configurations and committing before the budget runs out.' },
      { kind: 'action', html: 'submit_final_design(design={…, "antenna_def": 15, …})', drones: 110, deploys: 7 },
      { kind: 'result', html: 'Stage 2 — 1,000-drone fleet evaluation… survival <b>56.2%</b> &lt; threshold 75%' },
      { kind: 'system', html: '✖ MISSION FAILED — the agent found the causal direction (antenna_def=3 → 73.3%) and drifted back to the correlational prior. 54.8% of real sessions never explore one component at all; this drift pattern is taken from an actual benchmark run.' },
    ],
  },
  {
    id: 'confounder',
    tab: '🕳 Hidden confounder',
    title: 'DEPLOYMENT ZONE TRAP',
    scm: 'DeploymentZoneTrapSCM',
    win: false,
    script: [
      { kind: 'system', html: 'Session 2b8fa733 started — experiment <code>deployment_zone_trap_categorical</code>, mode AGENTIC (ReAct)' },
      { kind: 'thought', html: 'Briefing: low-altitude flights are lost ~3× more often. Altitude looks decisive → engine power buys altitude. Module choice: <code>radar_boost</code> for awareness.' },
      { kind: 'action', html: 'deploy_drone(design={"engine_def": 45, "shield_def": 0, …}, equipment={"module": "radar_boost"}, count=30)', drones: 170, deploys: 9 },
      { kind: 'result', html: '15/30 survived (50.0%) · losses report communication failure before impact' },
      { kind: 'thought', html: 'Comm failures… maybe thermal interference at low altitude. Swap the module, keep the engine build.' },
      { kind: 'action', html: 'deploy_drone(design={"engine_def": 45, "shield_def": 0, …}, equipment={"module": "thermal_shield"}, count=30)', drones: 140, deploys: 8 },
      { kind: 'result', html: '15/30 survived (50.0%) · no improvement · comm failures persist across altitude bands' },
      { kind: 'thought', html: 'Altitude still separates survivors best in the pooled data. Doubling down on the high-altitude build.' },
      { kind: 'action', html: 'submit_final_design(design={"engine_def": 50, "shield_def": 0, …}, equipment={"module": "radar_boost"})', drones: 140, deploys: 8 },
      { kind: 'result', html: 'Stage 2 — 1,000-drone fleet evaluation… survival <b>50.3%</b> &lt; threshold 75%' },
      { kind: 'system', html: '✖ MISSION FAILED — the unobserved mission zone drives both altitude <em>and</em> EMI; EMI is the true failure cause. Only <code>shield_def</code> + <code>signal_filter</code> protects (~80% optimal). The agent never tested the one variable it could not see in the data.' },
    ],
  },
];

export default function MissionConsole() {
  const [sessionIdx, setSessionIdx] = useState(0);
  const [shown, setShown] = useState(1);
  const feedRef = useRef<HTMLDivElement>(null);

  const session = SESSIONS[sessionIdx];
  const SCRIPT = session.script;

  useEffect(() => {
    if (shown >= SCRIPT.length) return;
    const t = setTimeout(() => setShown((s) => s + 1), SCRIPT[shown].kind === 'thought' ? 2100 : 1500);
    return () => clearTimeout(t);
  }, [shown, SCRIPT]);

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: 'smooth' });
  }, [shown]);

  const pick = (i: number) => {
    setSessionIdx(i);
    setShown(1);
  };

  const last = SCRIPT.slice(0, shown).filter((l) => l.drones !== undefined).pop();
  const done = shown >= SCRIPT.length;

  return (
    <div className="mc">
      <div className="mc-tabs">
        {SESSIONS.map((s, i) => (
          <button
            key={s.id}
            className={i === sessionIdx ? 'active' : ''}
            onClick={() => pick(i)}
          >
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
        {SCRIPT.slice(0, shown).map((l, i) => (
          <div key={`${session.id}-${i}`} className={`mc-line ${l.kind}`}>
            <span className="tag">{l.kind.toUpperCase()}</span>
            <span dangerouslySetInnerHTML={{ __html: l.html }} />
          </div>
        ))}
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
