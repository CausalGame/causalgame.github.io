import { useState } from 'react';
import './GameScene.css';

const C = {
  bg: '#0d1117',
  cliff: '#1c2128',
  cliffEdge: '#30363d',
  cyan: '#7dd3fc',
  amber: '#fbbf24',
  purple: '#c084fc',
  red: '#f87171',
  green: '#4ade80',
  soft: '#8b949e',
};

function Drone({
  color,
  antenna = false,
  className = '',
  x = 0,
  y = 0,
}: {
  color: string;
  antenna?: boolean;
  className?: string;
  x?: number;
  y?: number;
}) {
  return (
    <g className={className} transform={`translate(${x},${y})`}>
      <g className="bob">
        {antenna && (
          <>
            <line x1="0" y1="-6" x2="0" y2="-20" stroke={C.amber} strokeWidth="2" />
            <circle cx="0" cy="-22" r="2.5" fill={C.amber} />
          </>
        )}
        <line x1="-14" y1="-8" x2="14" y2="8" stroke={color} strokeWidth="2" />
        <line x1="-14" y1="8" x2="14" y2="-8" stroke={color} strokeWidth="2" />
        <ellipse className="rotor" cx="-14" cy="-8" rx="7" ry="2" fill="none" stroke={color} strokeWidth="1.4" />
        <ellipse className="rotor" cx="14" cy="-8" rx="7" ry="2" fill="none" stroke={color} strokeWidth="1.4" />
        <ellipse className="rotor" cx="-14" cy="8" rx="7" ry="2" fill="none" stroke={color} strokeWidth="1.4" />
        <ellipse className="rotor" cx="14" cy="8" rx="7" ry="2" fill="none" stroke={color} strokeWidth="1.4" />
        <rect x="-9" y="-5" width="18" height="10" rx="3" fill={color} />
      </g>
    </g>
  );
}

function AntennaScene() {
  return (
    <svg className="gs-svg" viewBox="0 0 800 400" role="img" aria-label="Animated antenna trap scenario: a drone with a live antenna emits signals, gets detected by radar and shot down; a drone with a sacrificed antenna passes silently.">
      <rect width="800" height="400" fill={C.bg} />
      {/* stars */}
      {[[90, 40], [200, 70], [340, 30], [520, 55], [640, 25], [740, 70], [430, 80]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.3" fill="#3d4450" />
      ))}

      {/* storm cloud + lightning + rain */}
      <g>
        <ellipse cx="150" cy="78" rx="78" ry="26" fill="#21262d" />
        <ellipse cx="95" cy="92" rx="48" ry="20" fill="#21262d" />
        <ellipse cx="210" cy="95" rx="52" ry="20" fill="#21262d" />
        <polyline className="at-lightning" points="150,104 138,136 152,134 136,170" fill="none" stroke={C.amber} strokeWidth="2.5" />
        <g className="at-rain" stroke={C.cyan} strokeWidth="1" opacity="0.5">
          {[100, 125, 150, 175, 200].map((x, i) => (
            <line key={i} x1={x} y1={112 + (i % 2) * 8} x2={x - 4} y2={126 + (i % 2) * 8} />
          ))}
        </g>
      </g>

      {/* canyon cliffs */}
      <polygon points="0,400 0,210 45,225 90,300 130,340 170,400" fill={C.cliff} stroke={C.cliffEdge} strokeWidth="1" />
      <polygon points="800,400 800,140 760,150 735,205 700,260 660,330 620,400" fill={C.cliff} stroke={C.cliffEdge} strokeWidth="1" />

      {/* radar on right cliff */}
      <g>
        <line x1="742" y1="150" x2="742" y2="120" stroke={C.soft} strokeWidth="3" />
        <circle cx="742" cy="114" r="8" fill="none" stroke={C.red} strokeWidth="2" />
        <circle cx="742" cy="114" r="2.5" fill={C.red} />
        <g transform="translate(742,114)">
          <g className="at-sweep">
            <path d="M0,0 L-148,-26 A150,150 0 0 0 -148,26 Z" fill={C.red} opacity="0.12" />
            <line x1="0" y1="0" x2="-149" y2="0" stroke={C.red} strokeWidth="1" opacity="0.45" />
          </g>
        </g>
        <text x="742" y="100" textAnchor="middle" className="lbl" fill={C.red}>RADAR</text>
      </g>

      {/* doomed drone: live antenna, emits, gets locked, falls */}
      <g className="at-d1">
        <g transform="translate(80,170)">
          <g className="at-rings">
            <circle className="at-ring" cx="0" cy="-22" r="9" fill="none" stroke={C.amber} strokeWidth="1.6" />
            <circle className="at-ring" style={{ animationDelay: '0.45s' }} cx="0" cy="-22" r="9" fill="none" stroke={C.amber} strokeWidth="1.6" />
            <circle className="at-ring" style={{ animationDelay: '0.9s' }} cx="0" cy="-22" r="9" fill="none" stroke={C.amber} strokeWidth="1.6" />
          </g>
          <Drone color={C.cyan} antenna />
          <g className="at-spark">
            {[[-18, -14], [16, -18], [22, 8], [-20, 12], [4, -26]].map(([x, y], i) => (
              <line key={i} x1={x} y1={y} x2={x * 1.6} y2={y * 1.6} stroke={C.amber} strokeWidth="2" />
            ))}
          </g>
        </g>
      </g>
      {/* lock beam from radar to interception point */}
      <line className="at-lock" x1="742" y1="114" x2="528" y2="168" stroke={C.red} strokeWidth="2" strokeDasharray="6 4" />
      <text className="at-detect-lbl lbl" x="600" y="135" fill={C.red}>DETECTED ✖</text>

      {/* stealth drone: no antenna, sails through */}
      <g className="at-d2">
        <Drone color={C.green} x={80} y={300} />
      </g>

      {/* captions */}
      <text x="60" y="232" className="lbl" fill={C.amber}>antenna_def = 45 → emitting → detected → destroyed</text>
      <text x="60" y="346" className="lbl" fill={C.green}>antenna_def = 0 → storm kills antenna → silent → safe</text>
    </svg>
  );
}

function ZoneScene() {
  return (
    <svg className="gs-svg" viewBox="0 0 800 400" role="img" aria-label="Animated deployment zone scenario: altitude looks protective but a hidden EMI field is the true cause; a shielded drone with signal_filter survives at low altitude.">
      <rect width="800" height="400" fill={C.bg} />
      {[[120, 35], [300, 55], [480, 30], [650, 50], [730, 30]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.3" fill="#3d4450" />
      ))}

      {/* altitude bands */}
      <line x1="0" y1="170" x2="800" y2="170" stroke={C.cliffEdge} strokeDasharray="8 6" />
      <text x="14" y="92" className="lbl" fill={C.soft}>HIGH ALTITUDE — looks safe</text>
      <text x="14" y="195" className="lbl" fill={C.soft}>LOW ALTITUDE — high losses…</text>

      {/* canyon floor */}
      <polygon points="0,400 0,372 140,358 320,376 520,360 690,378 800,366 800,400" fill={C.cliff} stroke={C.cliffEdge} strokeWidth="1" />

      {/* hidden EMI field in the low band */}
      <g className="dz-emi" stroke={C.purple} fill="none" strokeWidth="2">
        <path d="M250,250 l18,-14 18,14 18,-14 18,14 18,-14 18,14 18,-14 18,14" />
        <path d="M260,290 l18,-14 18,14 18,-14 18,14 18,-14 18,14 18,-14" transform="translate(0,6)" />
        <path d="M250,330 l18,-14 18,14 18,-14 18,14 18,-14 18,14 18,-14 18,14" />
      </g>
      <rect x="232" y="218" width="230" height="138" rx="10" fill="none" stroke={C.purple} strokeDasharray="4 6" opacity="0.5" />
      <text className="dz-hidden-lbl lbl" x="347" y="210" textAnchor="middle" fill={C.purple}>EMI FIELD — unobserved</text>

      {/* high-altitude drone: cruises */}
      <g className="dz-da">
        <Drone color={C.cyan} x={70} y={120} />
      </g>
      <text x="60" y="62" className="lbl" fill={C.cyan}>engine-heavy build flies high → survives (correlation)</text>

      {/* low drone, no shield: comms die inside EMI */}
      <g className="dz-db">
        <g transform="translate(70,265)">
          <Drone color={C.amber} />
          <g className="dz-static">
            <text x="14" y="-18" fontSize="13" fill={C.red}>📡✖</text>
            {[[-16, 10], [20, -8], [-22, -10]].map(([x, y], i) => (
              <line key={i} x1={x} y1={y} x2={x + 6} y2={y - 6} stroke={C.red} strokeWidth="2" />
            ))}
          </g>
        </g>
      </g>
      <text x="60" y="392" className="lbl" fill={C.red}>no shield → comm failure inside the field → lost</text>

      {/* low drone with shield + signal_filter: passes */}
      <g className="dz-dc">
        <g transform="translate(90,318)">
          <circle className="dz-shield" cx="0" cy="0" r="24" fill="none" stroke={C.green} strokeWidth="1.8" />
          <path className="dz-deflect" d="M-30,-14 q8,10 0,22" fill="none" stroke={C.purple} strokeWidth="2" />
          <path className="dz-deflect" style={{ animationDelay: '0.8s' }} d="M30,-14 q-8,10 0,22" fill="none" stroke={C.purple} strokeWidth="2" />
          <Drone color={C.green} />
        </g>
      </g>
      <text x="470" y="392" className="lbl" fill={C.green}>shield_def + signal_filter → safe at ANY altitude</text>
    </svg>
  );
}

const SCENES = [
  { id: 'antenna', tab: '📡 Antenna Trap', cap: <><b>Selection bias:</b> survivors in the archive have broken antennas — because a live antenna is a radar beacon. The optimal design sacrifices it.</> },
  { id: 'zone', tab: '🌀 Deployment Zone Trap', cap: <><b>Hidden confounder:</b> the mission zone drives both visible altitude and an unobserved EMI field. Altitude is a proxy; EMI protection is the cause.</> },
];

export default function GameScene() {
  const [idx, setIdx] = useState(0);
  return (
    <div className="gs-wrap">
      <div className="gs-tabs">
        {SCENES.map((s, i) => (
          <button key={s.id} className={i === idx ? 'active' : ''} onClick={() => setIdx(i)}>
            {s.tab}
          </button>
        ))}
      </div>
      {idx === 0 ? <AntennaScene /> : <ZoneScene />}
      <div className="gs-cap">{SCENES[idx].cap}</div>
    </div>
  );
}
