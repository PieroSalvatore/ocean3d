import { useState, useEffect } from 'react'

// ─── Data ─────────────────────────────────────────────────────────

const SPECIES = [
  { icon: '🐠', name: 'Pez Payaso',      rarity: 'Común',      cls: 'r-common'    },
  { icon: '🦅', name: 'Mantarraya',      rarity: 'Raro',       cls: 'r-rare'      },
  { icon: '🐋', name: 'Tiburón Ballena', rarity: 'Épico',      cls: 'r-epic'      },
  { icon: '👁',  name: '???',             rarity: 'Legendario', cls: 'r-legendary' },
]

const ZONES = [
  { name: 'Arrecife Turquesa', type: 'Zona segura',       tCls: 'zt-safe',    bg: 'linear-gradient(155deg,#003d4d 0%,#006890 35%,#009faa 65%,#004f60 100%)' },
  { name: 'Bosque Verde',      type: 'Zona misteriosa',   tCls: 'zt-mystery', bg: 'linear-gradient(155deg,#001609 0%,#00270e 40%,#003a15 65%,#000e05 100%)' },
  { name: 'Profundidades',     type: 'Zona peligrosa',    tCls: 'zt-danger',  bg: 'linear-gradient(160deg,#000010 0%,#000028 50%,#000015 100%)' },
  { name: 'Cueva Oculta',      type: 'Zona secreta',      tCls: 'zt-secret',  bg: 'linear-gradient(160deg,#030308 0%,#06060f 45%,#0a0a1a 70%,#000000 100%)' },
  { name: 'Abismo',            type: 'Zona desconocida',  tCls: 'zt-unknown', bg: 'linear-gradient(180deg,#000000 0%,#010105 50%,#000000 100%)' },
]

type TimeLabel = 'Mañana' | 'Día' | 'Atardecer' | 'Noche'
const TIME_OPTIONS: { label: TimeLabel; icon: string }[] = [
  { label: 'Mañana',    icon: '🌅' },
  { label: 'Día',       icon: '☀️' },
  { label: 'Atardecer', icon: '🌇' },
  { label: 'Noche',     icon: '🌙' },
]

const COMPASS = ['N', 'NE', 'E', 'SE', 'S']

// ─── Component ────────────────────────────────────────────────────
export function HUD() {
  const [timeOfDay, setTimeOfDay] = useState<TimeLabel>('Día')
  const [activeZone, setActiveZone] = useState(0)
  const [depth, setDepth] = useState(18.4)
  const [sound, setSound] = useState(true)

  // Gentle depth fluctuation (simulates camera drifting up/down)
  useEffect(() => {
    const id = setInterval(() => {
      setDepth(d => +(d + (Math.random() - 0.5) * 0.3).toFixed(1))
    }, 2000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="hud-root" aria-label="Ocean Realms HUD">

      {/* ══ TOP BAR ══════════════════════════════════════════════ */}
      <header className="hud-topbar">

        {/* Logo */}
        <div className="hud-logo">
          <button className="hud-icon-btn hud-hamburger" aria-label="Menu">
            <span /><span /><span />
          </button>
          <div className="hud-brand">
            <span className="hud-brand-name">OCEAN REALMS</span>
            <span className="hud-brand-sub">explore the unknown</span>
          </div>
        </div>

        {/* Compass */}
        <nav className="hud-compass" aria-label="Brújula">
          <div className="compass-track">
            {COMPASS.map(c => (
              <div key={c} className={`compass-point ${c === 'E' ? 'active' : ''}`}>
                <span className="compass-label">{c}</span>
                {c === 'E' && <div className="compass-diamond" />}
              </div>
            ))}
          </div>
        </nav>

        {/* Top-right actions */}
        <div className="hud-top-actions">
          <button className="hud-icon-btn" title="Modo foto">📷</button>
          <button
            className={`hud-icon-btn ${sound ? '' : 'dimmed'}`}
            onClick={() => setSound(s => !s)}
            title="Sonido"
          >
            {sound ? '🔊' : '🔇'}
          </button>
          <button className="hud-icon-btn" title="Información">ℹ</button>
        </div>
      </header>

      {/* ══ SPECIES PANEL (left) ═════════════════════════════════ */}
      <aside className="hud-species-panel">
        <p className="hud-section-label">ESPECIES</p>
        {SPECIES.map((sp, i) => (
          <div className="species-row" key={i}>
            <div className="species-icon" aria-hidden="true">{sp.icon}</div>
            <div className="species-info">
              <span className="species-name">{sp.name}</span>
              <span className={`species-rarity ${sp.cls}`}>{sp.rarity}</span>
            </div>
          </div>
        ))}
      </aside>

      {/* ══ BOTTOM-LEFT: Minimap + Stats ═════════════════════════ */}
      <div className="hud-bottom-left">
        <div className="hud-minimap" aria-label="Minimapa">
          <div className="minimap-bg" />
          <div className="minimap-arrow" />
          <div className="minimap-ring" />
        </div>
        <div className="hud-stats">
          <div className="stat-item">
            <span className="stat-label">PROFUNDIDAD</span>
            <span className="stat-value">{depth} m <span className="stat-caret">▾</span></span>
          </div>
          <div className="stat-item">
            <span className="stat-label">TEMPERATURA</span>
            <span className="stat-value">22.1 °C</span>
          </div>
        </div>
      </div>

      {/* ══ BOTTOM-CENTRE: Control hints ═════════════════════════ */}
      <div className="hud-controls">
        <div className="ctrl-hint">
          <span className="ctrl-icon">🖱</span>
          <span>Mirar alrededor</span>
        </div>
        <div className="ctrl-hint">
          <span className="ctrl-icon">⚲</span>
          <span>Acercar / Alejar</span>
        </div>
        <div className="ctrl-hint">
          <span className="ctrl-keys">
            <kbd>W</kbd>
            <div className="ctrl-keys-row"><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></div>
          </span>
          <span>Mover cámara</span>
        </div>
      </div>

      {/* ══ BOTTOM-RIGHT: Time of day + Photo mode ═══════════════ */}
      <aside className="hud-right-panel">
        <p className="hud-section-label">HORA DEL DÍA</p>
        <div className="time-list">
          {TIME_OPTIONS.map(({ label, icon }) => (
            <button
              key={label}
              className={`time-btn ${timeOfDay === label ? 'active' : ''}`}
              onClick={() => setTimeOfDay(label)}
            >
              <span className="time-icon">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
        <button className="photo-btn">
          <span>📷</span>
          <span>MODO FOTO</span>
        </button>
      </aside>

      {/* ══ ZONE STRIP (bottom) ══════════════════════════════════ */}
      <div className="hud-zone-strip" role="tablist" aria-label="Zonas">
        {ZONES.map((z, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === activeZone}
            className={`zone-card ${i === activeZone ? 'active' : ''}`}
            style={{ background: z.bg }}
            onClick={() => setActiveZone(i)}
          >
            <div className="zone-shimmer" />
            <div className="zone-content">
              <span className="zone-name">{z.name}</span>
              <span className={`zone-type ${z.tCls}`}>{z.type}</span>
            </div>
          </button>
        ))}
      </div>

    </div>
  )
}
