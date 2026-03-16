'use client';

import { useGameStore } from '../../lib/store';
import { getAllFighters } from '../../fighters';
import { BotDifficulty } from '../../core/types';

const DIFFICULTY_OPTIONS = [
  { value: BotDifficulty.BABY, label: 'Baby', desc: 'Giggle Bot' },
  { value: BotDifficulty.EASY, label: 'Easy', desc: 'The Rookie' },
  { value: BotDifficulty.MEDIUM, label: 'Medium', desc: 'The Veteran' },
  { value: BotDifficulty.HARD, label: 'Hard', desc: 'The Champion' },
  { value: BotDifficulty.BRUTAL, label: 'Brutal', desc: 'The Master' },
  { value: BotDifficulty.NIGHTMARE, label: 'Nightmare', desc: 'Face God' },
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
            } as React.CSSProperties}
          >
            <span className="emoji">{fighter.emoji}</span>
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
            </div>
            <div className="fighter-stats">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={`s${i}`}
                  className={`stat-dot ${i < fighter.stats.speed ? 'filled' : ''}`}
                  style={{ background: i < fighter.stats.speed ? '#00D9FF' : undefined }}
                />
              ))}
            </div>
            <div className="fighter-stats">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={`d${i}`}
                  className={`stat-dot ${i < fighter.stats.defense ? 'filled' : ''}`}
                  style={{ background: i < fighter.stats.defense ? '#00D26A' : undefined }}
                />
              ))}
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
