import { useEffect, useRef, useState } from 'react';
import './MissionConsole.css';

type Kind = 'thought' | 'action' | 'result' | 'system';

interface Line {
  kind: Kind;
  html: string;
  drones?: number;
  deploys?: number;
}

// Example Agentic-mode session against antenna_trap (numbers illustrative,
// action payloads match the real tool schemas).
const SCRIPT: Line[] = [
  { kind: 'system', html: 'Session 7f3a2c1b started — experiment <code>antenna_trap</code>, mode AGENTIC (ReAct)' },
  { kind: 'thought', html: 'Briefing data: 50 surviving flights. Most survivors show heavy antenna damage but high antenna DEF designs correlate with survival. Hypothesis H1: antenna needs more armor.' },
  { kind: 'action', html: 'deploy_drone(design={"engine_def": 20, "wing_def": 15, "body_def": 15, "cockpit_def": 20, "antenna_def": 45, "camera_def": 5, "gun_def": 5}, count=30)', drones: 170, deploys: 9 },
  { kind: 'result', html: '14/30 survived (46.7%) · avg hit_count 3.8 · returned drones report intact antennas, heavy combat damage' },
  { kind: 'thought', html: 'Worse than the 62% historical baseline — H1 rejected. Survivors in history had <em>broken</em> antennas… is the antenna itself attracting fire?' },
  { kind: 'action', html: 'query_environment("what could make drones easier for radar to detect?")', drones: 170, deploys: 9 },
  { kind: 'result', html: '"Canyon-wide radar sweeps lock onto active signal emissions. Storm fronts damage exposed components."' },
  { kind: 'thought', html: 'New hypothesis H2: a live antenna emits a signal → detection → combat. Intervention test: send drones with zero antenna armor and let the storm break it.' },
  { kind: 'action', html: 'deploy_drone(design={"engine_def": 25, "wing_def": 18, "body_def": 18, "cockpit_def": 25, "antenna_def": 0, "camera_def": 8, "gun_def": 6}, count=30)', drones: 140, deploys: 8 },
  { kind: 'result', html: '25/30 survived (83.3%) · avg hit_count 0.6 · antennas destroyed early — fleet went dark and slipped the radar' },
  { kind: 'thought', html: 'Causal chain confirmed: antenna_def → antenna survives storm → signal emission → detection → combat loss. Optimal design sacrifices the antenna entirely.' },
  { kind: 'action', html: 'submit_final_design(design={"engine_def": 25, "wing_def": 18, "body_def": 18, "cockpit_def": 25, "antenna_def": 0, "camera_def": 8, "gun_def": 6})', drones: 140, deploys: 8 },
  { kind: 'result', html: 'Stage 2 — 1,000-drone fleet evaluation… survival <b>81.7%</b> ≥ threshold 75%' },
  { kind: 'system', html: '★ MISSION SUCCESS — report submitted for rubric scoring (causal mechanism: correctly identified)' },
];

export default function MissionConsole() {
  const [shown, setShown] = useState(1);
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (shown >= SCRIPT.length) return;
    const t = setTimeout(() => setShown((s) => s + 1), SCRIPT[shown].kind === 'thought' ? 2100 : 1500);
    return () => clearTimeout(t);
  }, [shown]);

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: 'smooth' });
  }, [shown]);

  const last = SCRIPT.slice(0, shown).filter((l) => l.drones !== undefined).pop();
  const done = shown >= SCRIPT.length;

  return (
    <div className="mc">
      <div className="mc-bar">
        <span className="title">ANTENNA TRAP</span>
        <span className="scm">// AntennaTrapSCM // session 7f3a2c1b</span>
        <span className={`live${done ? ' over' : ''}`}>{done ? 'MISSION COMPLETE' : '● LIVE'}</span>
      </div>
      <div className="mc-stats">
        <span>DRONES <b>{last?.drones ?? 200}</b>/200</span>
        <span>DEPLOY CALLS <b>{last?.deploys ?? 10}</b>/10</span>
        <span>ENV QUERIES <b>{shown > 6 ? 9 : 10}</b>/10</span>
        <span>STAGE <b>{done ? '2 — EVALUATED' : '1 — EXPLORATION'}</b></span>
      </div>
      <div className="mc-feed" ref={feedRef}>
        {SCRIPT.slice(0, shown).map((l, i) => (
          <div key={i} className={`mc-line ${l.kind}`}>
            <span className="tag">{l.kind.toUpperCase()}</span>
            <span dangerouslySetInnerHTML={{ __html: l.html }} />
          </div>
        ))}
      </div>
      <div className="mc-foot">
        <button onClick={() => setShown(1)}>↻ Replay session</button>
        <span className="hint">
          example Agentic (ReAct) session — payloads match the real tool schemas
        </span>
      </div>
    </div>
  );
}
