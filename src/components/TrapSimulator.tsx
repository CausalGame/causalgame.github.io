import { useRef, useState } from 'react';
import './TrapSimulator.css';

const N = 200;
const THRESHOLD = 75;
const OPTIMAL = 82;

/**
 * Simplified, illustrative version of the antenna_trap SCM (the real engine
 * has 7 components, hidden weather variables, agility, and survivor-censored
 * feedback). Key mechanism preserved: a live antenna emits a signal that
 * raises detection; storms destroy unarmored antennas, enabling stealth.
 */
function simulateDrone(antennaDef: number, otherDef: number): boolean {
  const storm = Math.random() < 0.8;
  const dRaw = storm ? 50 + Math.random() * 25 : Math.random() * 12;
  const antennaHp = Math.max(0, 50 - dRaw + Math.min(3.5 * antennaDef, 0.8 * dRaw));
  const emitting = antennaHp > 0;
  const baseDetect = storm ? 0.1 : 0.2;
  const pDetect = emitting
    ? Math.min(1, baseDetect + (0.75 * antennaHp) / 50)
    : 0.3 * baseDetect;

  if (Math.random() < pDetect) {
    // combat only happens when detected; armor on the other components
    // mitigates it slightly — the antenna is what decides your fate
    const intensity = storm ? 4.0 : 0.3;
    let pKilled = Math.min(0.92, 0.22 + 0.15 * intensity);
    pKilled *= 1 - (0.18 * otherDef) / 50;
    if (Math.random() < pKilled) return false;
  }
  const pCrash = storm ? 0.09 : 0.04;
  return Math.random() >= pCrash;
}

interface Attempt {
  antennaDef: number;
  otherDef: number;
  rate: number;
}

export default function TrapSimulator() {
  const [antennaDef, setAntennaDef] = useState(40);
  const [otherDef, setOtherDef] = useState(20);
  const [fleet, setFleet] = useState<(boolean | null)[]>(Array(N).fill(null));
  const [rate, setRate] = useState<number | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>[]>([]);

  const deploy = () => {
    timer.current.forEach(clearTimeout);
    timer.current = [];
    setBusy(true);
    const results = Array.from({ length: N }, () => simulateDrone(antennaDef, otherDef));
    setFleet(Array(N).fill(null));
    // reveal in waves for a launch effect
    const WAVES = 10;
    for (let w = 0; w < WAVES; w++) {
      timer.current.push(
        setTimeout(() => {
          setFleet((prev) => {
            const next = [...prev];
            for (let i = w; i < N; i += WAVES) next[i] = results[i];
            return next;
          });
          if (w === WAVES - 1) {
            const r = (results.filter(Boolean).length / N) * 100;
            setRate(r);
            setAttempts((a) => [{ antennaDef, otherDef, rate: r }, ...a].slice(0, 4));
            setBusy(false);
          }
        }, 90 * (w + 1)),
      );
    }
  };

  const win = rate !== null && rate >= THRESHOLD;

  return (
    <div className="ts-wrap">
      <div className="ts-head">
        <b>🪤 Try the Antenna Trap</b>
        <span className="note">
          simplified live SCM — the briefing data says survivors have strong antennas…
        </span>
      </div>
      <div className="ts-body">
        <div className="ts-controls">
          <label>
            antenna_def <span className="val">{antennaDef}</span>
          </label>
          <input
            type="range"
            min={0}
            max={50}
            value={antennaDef}
            onChange={(e) => setAntennaDef(Number(e.target.value))}
          />
          <label>
            other components (avg DEF) <span className="val">{otherDef}</span>
          </label>
          <input
            type="range"
            min={0}
            max={50}
            value={otherDef}
            onChange={(e) => setOtherDef(Number(e.target.value))}
          />
          <button className="ts-deploy" onClick={deploy} disabled={busy}>
            {busy ? 'Deploying…' : `Deploy ${N} drones`}
          </button>
          <div className="ts-readout">
            <div className={`big${rate === null ? '' : win ? ' win' : ' lose'}`}>
              {rate === null ? '—' : `${rate.toFixed(1)}%`}
            </div>
            fleet survival {rate !== null && (win ? '· ✅ above threshold' : '· ❌ below 75% threshold')}
            <div className="ts-thresh">
              <div
                className={`fill${win ? ' win' : ''}`}
                style={{ width: `${rate ?? 0}%` }}
              />
              <div className="mark" style={{ left: `${THRESHOLD}%` }} title="75% win threshold" />
              <div className="mark opt" style={{ left: `${OPTIMAL}%` }} title="~82% optimal (antenna_def = 0)" />
            </div>
            <div className="ts-legend">
              <span><i className="sw thr" /> win threshold {THRESHOLD}%</span>
              <span><i className="sw opt" /> optimal ~{OPTIMAL}%</span>
            </div>
          </div>
        </div>
        <div className="ts-grid" aria-hidden="true">
          {fleet.map((alive, i) => (
            <div
              key={i}
              className={`ts-dot${alive === null ? '' : alive ? ' alive' : ' dead'}`}
            />
          ))}
        </div>
      </div>
      {attempts.length > 0 && (
        <div className="ts-log">
          {attempts.map((a, i) => (
            <span key={i}>
              ant={a.antennaDef} oth={a.otherDef} → <b>{a.rate.toFixed(1)}%</b>
            </span>
          ))}
          <span style={{ marginLeft: 'auto' }}>
            {antennaDef > 10 ? (
              <>hint: what happens at <b>antenna_def = 0</b>?</>
            ) : (
              <>that's the causal mechanism: a dead antenna can't be detected 🎉 — notice how little the other armor matters.</>
            )}
          </span>
        </div>
      )}
    </div>
  );
}
