import { useEffect, useState } from 'react';
import './GameFlow.css';

interface Stage {
  icon: string;
  label: string;
  title: string;
  text: string;
  chips: string[];
}

const STAGES: Stage[] = [
  {
    icon: '📡',
    label: 'Briefing',
    title: 'Historical data',
    text: 'The mission starts with logs of up to 50 past flights — but only drones that came back are in the logs. The selection bias begins before your first move.',
    chips: ['50 flights', 'survivors only'],
  },
  {
    icon: '🚁',
    label: 'Explore',
    title: 'Stage 1 — Deploy & observe',
    text: 'Choose a DEF design and send a small batch into the canyon. Each call returns survival outcomes, hit counts, and partial environment readings.',
    chips: ['200 drones', '≤10 deployments'],
  },
  {
    icon: '🔬',
    label: 'Reason',
    title: 'Stage 1 — Analyze',
    text: 'Mine the feedback in the analysis sandbox, form causal hypotheses — and design the next deployment to test them.',
    chips: ['sandboxed analysis', 'hypothesize → test'],
  },
  {
    icon: '🎯',
    label: 'Commit',
    title: 'One-shot final submission',
    text: 'Submit a single final design. The call is irreversible — there is no retry, exactly like committing to a real-world intervention.',
    chips: ['1 submission', 'irreversible'],
  },
  {
    icon: '⚔️',
    label: 'Evaluate',
    title: 'Stage 2 — Fleet evaluation',
    text: 'Your design flies on a fleet of 1,000 drones under fresh environment samples. Win = fleet survival above the scenario threshold.',
    chips: ['1,000 drones', 'threshold 75% / 55%'],
  },
  {
    icon: '📝',
    label: 'Debrief',
    title: 'Report & rubric',
    text: 'You also explain why your design works. An LLM judge panel scores the explanation against the true causal mechanism — winning by luck does not survive the debrief.',
    chips: ['16-point rubric', '3 judges'],
  },
];

export default function GameFlow() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setActive((a) => (a + 1) % STAGES.length), 3500);
    return () => clearInterval(t);
  }, [paused]);

  const stage = STAGES[active];

  return (
    <div
      className="gf"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="gf-track">
        <div className="gf-bar">
          <div
            className="gf-bar-fill"
            style={{ width: `${(active / (STAGES.length - 1)) * 100}%` }}
          />
        </div>
        {STAGES.map((s, i) => (
          <button
            key={s.label}
            className={`gf-node${i === active ? ' active' : ''}${i < active ? ' done' : ''}`}
            onClick={() => setActive(i)}
            aria-label={s.label}
          >
            <span className="gf-dot">{s.icon}</span>
            <span className="gf-label">{s.label}</span>
          </button>
        ))}
      </div>
      <div className="gf-panel" key={active}>
        <h4>{stage.title}</h4>
        <p>{stage.text}</p>
        <div className="gf-chips">
          {stage.chips.map((c) => (
            <span key={c} className="gf-chip">
              {c}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
