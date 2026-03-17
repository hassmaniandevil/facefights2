'use client';

import { useGameStore } from '../../lib/store';
import { getFighter } from '../../fighters';
import FighterChar from '../components/FighterChar';

export default function ResultsScreen() {
  const setScreen = useGameStore((s) => s.setScreen);
  const lastMatchResult = useGameStore((s) => s.lastMatchResult);

  if (!lastMatchResult) {
    return (
      <div className="screen results-screen">
        <p>No match data</p>
        <button className="btn-primary" onClick={() => setScreen('home')}>
          HOME
        </button>
      </div>
    );
  }

  const isWin = lastMatchResult.winnerId === 'p1';
  const player1Fighter = getFighter(lastMatchResult.player1FighterId);
  const player2Fighter = getFighter(lastMatchResult.player2FighterId);

  return (
    <div className="screen results-screen">
      <h1 className={`results-title ${isWin ? 'win' : 'lose'}`}>
        {isWin ? 'VICTORY!' : lastMatchResult.winnerId === null ? 'DRAW' : 'DEFEAT'}
      </h1>

      <div className="results-score">
        {lastMatchResult.player1RoundsWon} - {lastMatchResult.player2RoundsWon}
      </div>

      <div style={{ display: 'flex', gap: '48px', alignItems: 'center', margin: '16px 0' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ transform: 'scale(2)', marginBottom: '16px' }}>
            <FighterChar fighterId={lastMatchResult.player1FighterId} />
          </div>
          <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '24px', color: player1Fighter?.color }}>
            {player1Fighter?.name}
          </div>
        </div>
        <div style={{ fontSize: '24px', color: 'var(--ff-text-muted)' }}>VS</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ transform: 'scale(2) scaleX(-1)', marginBottom: '16px' }}>
            <FighterChar fighterId={lastMatchResult.player2FighterId} />
          </div>
          <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '24px', color: player2Fighter?.color }}>
            {player2Fighter?.name}
          </div>
        </div>
      </div>

      {lastMatchResult.wasKO && (
        <div style={{
          padding: '8px 24px',
          background: 'linear-gradient(135deg, var(--ff-pink), var(--ff-orange))',
          borderRadius: 'var(--radius-full)',
          fontWeight: 700,
          fontSize: '14px',
          letterSpacing: '2px',
        }}>
          KO FINISH
        </div>
      )}

      <div className="results-buttons">
        <button
          className="btn-primary"
          onClick={() => setScreen('fight')}
        >
          REMATCH
        </button>
        <button
          className="btn-secondary"
          onClick={() => setScreen('fighter_select')}
        >
          NEW FIGHTER
        </button>
        <button
          className="btn-secondary"
          onClick={() => setScreen('home')}
        >
          HOME
        </button>
      </div>
    </div>
  );
}
