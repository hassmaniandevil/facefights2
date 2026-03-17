'use client';

import { useGameStore } from '../../lib/store';
import FighterChar from '../components/FighterChar';

export default function HomeScreen() {
  const setScreen = useGameStore((s) => s.setScreen);
  const setMatchMode = useGameStore((s) => s.setMatchMode);

  const handleCpuFight = () => {
    setMatchMode('cpu');
    setScreen('fighter_select');
  };

  return (
    <div className="screen home-screen">
      {/* Showcase fighters */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '8px',
      }}>
        <div style={{ transform: 'scale(1.5)', opacity: 0.6 }}>
          <FighterChar fighterId="koji" />
        </div>
        <div style={{ transform: 'scale(1.8)' }}>
          <FighterChar fighterId="venus" />
        </div>
        <div style={{ transform: 'scale(1.5)', opacity: 0.6 }}>
          <FighterChar fighterId="granite" />
        </div>
      </div>

      <h1 className="home-title">FACE FIGHTS</h1>

      <p className="home-subtitle">
        Your face is the controller. Make expressions to attack, block, and dodge.
      </p>

      <div className="home-buttons">
        <button className="btn-primary" onClick={handleCpuFight}>
          FIGHT CPU
        </button>

        <button
          className="btn-secondary"
          onClick={() => {
            setMatchMode('pvp_online');
            setScreen('fighter_select');
          }}
        >
          FIGHT A FRIEND
        </button>

        <button
          className="btn-secondary"
          onClick={() => setScreen('story_mode')}
          style={{ opacity: 0.5, pointerEvents: 'none' }}
        >
          STORY MODE (COMING SOON)
        </button>
      </div>

      <p className="home-tagline">
        The game where your face is simultaneously the controller, the character, and the joke.
      </p>
    </div>
  );
}
