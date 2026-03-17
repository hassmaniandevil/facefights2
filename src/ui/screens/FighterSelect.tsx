'use client';

import { useGameStore } from '../../lib/store';
import { getAllFighters } from '../../fighters';
import { BotDifficulty } from '../../core/types';
import FighterChar from '../components/FighterChar';

const DIFFICULTY_OPTIONS = [
  { value: BotDifficulty.BABY, label: 'Baby', desc: 'Giggle Bot', color: '#00D26A' },
  { value: BotDifficulty.EASY, label: 'Easy', desc: 'The Rookie', color: '#00D9FF' },
  { value: BotDifficulty.MEDIUM, label: 'Medium', desc: 'The Veteran', color: '#FFE66D' },
  { value: BotDifficulty.HARD, label: 'Hard', desc: 'The Champion', color: '#FF9F43' },
  { value: BotDifficulty.BRUTAL, label: 'Brutal', desc: 'The Master', color: '#FF3366' },
  { value: BotDifficulty.NIGHTMARE, label: 'Nightmare', desc: 'Face God', color: '#6C5CE7' },
];

export default function FighterSelect() {
  const setScreen = useGameStore((s) => s.setScreen);
  const selectedFighterId = useGameStore((s) => s.selectedFighterId);
  const selectFighter = useGameStore((s) => s.selectFighter);
  const matchMode = useGameStore((s) => s.matchMode);
  const cpuDifficulty = useGameStore((s) => s.cpuDifficulty);
  const setCpuDifficulty = useGameStore((s) => s.setCpuDifficulty);

  const fighters = getAllFighters();

  const handleFight = () => {
    if (!selectedFighterId) return;
    setScreen('fight');
  };

  return (
    <div className="screen select-screen">
      <h2 className="select-title">Choose Your Fighter</h2>

      <div className="fighter-grid">
        {fighters.map((fighter) => (
          <button
            key={fighter.id}
            className={`fighter-card ${selectedFighterId === fighter.id ? 'selected' : ''}`}
            onClick={() => selectFighter(fighter.id)}
            style={{
              '--fighter-color': fighter.color,
              borderColor: selectedFighterId === fighter.id ? fighter.color : undefined,
              boxShadow: selectedFighterId === fighter.id
                ? `0 0 20px ${fighter.color}40`
                : undefined,
            } as React.CSSProperties}
          >
            <div style={{ transform: 'scale(0.9)', marginBottom: '4px' }}>
              <FighterChar fighterId={fighter.id} />
            </div>
            <span className="name">{fighter.name}</span>
            <span className="title">{fighter.title}</span>
            <div className="fighter-stats">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={`p${i}`}
                  className={`stat-dot ${i < fighter.stats.power ? 'filled' : ''}`}
                  style={{ background: i < fighter.stats.power ? '#FF3366' : undefined }}
                />
              ))}
              <span style={{ fontSize: '8px', color: 'var(--ff-text-dim)', marginLeft: '2px' }}>PWR</span>
            </div>
            <div className="fighter-stats">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={`s${i}`}
                  className={`stat-dot ${i < fighter.stats.speed ? 'filled' : ''}`}
                  style={{ background: i < fighter.stats.speed ? '#00D9FF' : undefined }}
                />
              ))}
              <span style={{ fontSize: '8px', color: 'var(--ff-text-dim)', marginLeft: '2px' }}>SPD</span>
            </div>
            <div className="fighter-stats">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={`d${i}`}
                  className={`stat-dot ${i < fighter.stats.defense ? 'filled' : ''}`}
                  style={{ background: i < fighter.stats.defense ? '#00D26A' : undefined }}
                />
              ))}
              <span style={{ fontSize: '8px', color: 'var(--ff-text-dim)', marginLeft: '2px' }}>DEF</span>
            </div>
          </button>
        ))}
      </div>

      {matchMode === 'cpu' && (
        <div className="difficulty-selector">
          {DIFFICULTY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`difficulty-btn ${cpuDifficulty === opt.value ? 'active' : ''}`}
              onClick={() => setCpuDifficulty(opt.value)}
              title={opt.desc}
              style={cpuDifficulty === opt.value ? { background: opt.color, borderColor: opt.color } : undefined}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px' }}>
        <button className="btn-secondary" onClick={() => setScreen('home')}>
          BACK
        </button>
        <button
          className="btn-primary"
          onClick={handleFight}
          style={{ opacity: selectedFighterId ? 1 : 0.4 }}
        >
          FIGHT!
        </button>
      </div>
    </div>
  );
}
