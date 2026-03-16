'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useGameStore } from '../../lib/store';
import { GameLoop } from '../../engine/GameLoop';
import { BotEngine } from '../../engine/BotEngine';
import { getFighter } from '../../fighters';
import { MatchPhase, BotDifficulty } from '../../core/types';
import { v4 as uuid } from 'uuid';

export default function FightScreen() {
  const selectedFighterId = useGameStore((s) => s.selectedFighterId);
  const matchMode = useGameStore((s) => s.matchMode);
  const cpuDifficulty = useGameStore((s) => s.cpuDifficulty);
  const setScreen = useGameStore((s) => s.setScreen);
  const setLastMatchResult = useGameStore((s) => s.setLastMatchResult);

  const gameLoopRef = useRef<GameLoop | null>(null);
  const botEngineRef = useRef<BotEngine | null>(null);
  const botIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [phase, setPhase] = useState<MatchPhase>(MatchPhase.LOADING);
  const [countdown, setCountdown] = useState(3);
  const [roundTime, setRoundTime] = useState(20);
  const [currentRound, setCurrentRound] = useState(1);
  const [p1Hp, setP1Hp] = useState(100);
  const [p2Hp, setP2Hp] = useState(100);
  const [p1Meter, setP1Meter] = useState(0);
  const [p2Meter, setP2Meter] = useState(0);
  const [p1Stamina, setP1Stamina] = useState(100);
  const [p1RoundsWon, setP1RoundsWon] = useState(0);
  const [p2RoundsWon, setP2RoundsWon] = useState(0);
  const [hitFlash, setHitFlash] = useState(false);
  const [desperationMode, setDesperationMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fighterId = selectedFighterId || 'koji';
  const fighter = getFighter(fighterId);
  const opponentId = matchMode === 'cpu' ? 'granite' : 'koji'; // Default CPU opponent
  const opponent = getFighter(opponentId);

  const initMatch = useCallback(async () => {
    try {
      const gl = new GameLoop();
      gameLoopRef.current = gl;

      // Set up event listeners
      gl.on((event, data) => {
        switch (event) {
          case 'phase:intro':
            setPhase(MatchPhase.INTRO);
            break;
          case 'countdown':
            setPhase(MatchPhase.COUNTDOWN);
            setCountdown(data.count);
            break;
          case 'phase:fighting':
            setPhase(MatchPhase.FIGHTING);
            setCurrentRound(data.round);
            break;
          case 'state:update':
            if (data) {
              setRoundTime(Math.ceil(data.roundTime));
              setP1Hp(data.player1.combat.hp);
              setP2Hp(data.player2.combat.hp);
              setP1Meter(data.player1.combat.meter);
              setP2Meter(data.player2.combat.meter);
              setP1Stamina(data.player1.combat.stamina);
              setP1RoundsWon(data.player1.roundsWon);
              setP2RoundsWon(data.player2.roundsWon);
              setDesperationMode(data.player1.combat.hp / data.player1.combat.maxHp <= 0.2);
            }
            break;
          case 'hit':
            if (data.damage > 0) {
              setHitFlash(true);
              setTimeout(() => setHitFlash(false), 80);
            }
            break;
          case 'round:end':
            setPhase(MatchPhase.ROUND_END);
            break;
          case 'match:end':
            setPhase(MatchPhase.MATCH_END);
            setLastMatchResult({
              winnerId: data.winnerId,
              player1RoundsWon: data.player1RoundsWon,
              player2RoundsWon: data.player2RoundsWon,
              player1FighterId: fighterId,
              player2FighterId: opponentId,
              wasKO: data.roundResults?.some((r: any) =>
                r.player1Hp === 0 || r.player2Hp === 0
              ) || false,
            });
            setTimeout(() => setScreen('results'), 2000);
            break;
        }
      });

      await gl.initMatch({
        matchId: uuid(),
        player1: { id: 'p1', username: 'You', fighterId },
        player2: { id: 'cpu', username: 'CPU', fighterId: opponentId },
        isPlayer1Local: true,
      });

      // Set up bot for CPU mode
      if (matchMode === 'cpu') {
        const bot = new BotEngine(cpuDifficulty);
        botEngineRef.current = bot;

        // Bot update loop — check every 100ms
        botIntervalRef.current = setInterval(() => {
          const state = gl.getStateSnapshot();
          if (!state || state.phase !== MatchPhase.FIGHTING) return;

          const botAction = bot.update(state.player2, state.player1);
          if (botAction) {
            gl.handleRemoteInput('cpu', [botAction]);
          }
        }, 100);
      }

      await gl.start();
    } catch (err: any) {
      console.error('[FightScreen] Init failed:', err);
      setError(err.message || 'Failed to start fight');
    }
  }, [fighterId, opponentId, matchMode, cpuDifficulty, setScreen, setLastMatchResult]);

  useEffect(() => {
    initMatch();

    return () => {
      if (gameLoopRef.current) {
        gameLoopRef.current.destroy();
        gameLoopRef.current = null;
      }
      if (botIntervalRef.current) {
        clearInterval(botIntervalRef.current);
        botIntervalRef.current = null;
      }
    };
  }, [initMatch]);

  if (error) {
    return (
      <div className="screen" style={{ gap: '16px', textAlign: 'center', padding: '32px' }}>
        <div style={{ fontSize: '48px' }}>😵</div>
        <h2>Failed to Start</h2>
        <p style={{ color: 'var(--ff-text-muted)', maxWidth: '400px' }}>{error}</p>
        <p style={{ color: 'var(--ff-text-dim)', fontSize: '14px' }}>
          Make sure camera access is allowed and try again.
        </p>
        <button className="btn-primary" onClick={() => setScreen('fighter_select')}>
          GO BACK
        </button>
      </div>
    );
  }

  const hpClass = (hp: number) =>
    hp > 60 ? 'hp-high' : hp > 25 ? 'hp-mid' : 'hp-low';

  return (
    <div className="screen fight-screen">
      {/* Arena background */}
      <div
        className="arena"
        style={{
          background: 'linear-gradient(180deg, #1a0a2e 0%, #0d0520 40%, #0A0A0F 100%)',
        }}
      />

      {/* Hit flash overlay */}
      {hitFlash && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(255,255,255,0.3)',
            zIndex: 30,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Desperation aura */}
      {desperationMode && <div className="desperation-aura" />}

      {/* HUD */}
      <div className="fight-hud">
        <div className="player-info">
          <span className="player-name" style={{ color: fighter?.color }}>
            {fighter?.emoji} {fighter?.name || 'P1'}
          </span>
          <div className="hp-bar-container">
            <div
              className={`hp-bar-fill ${hpClass(p1Hp)}`}
              style={{ width: `${p1Hp}%` }}
            />
            <span className="hp-text">{p1Hp}</span>
          </div>
          <div className="meter-bar-container">
            <div
              className={`meter-bar-fill ${p1Meter >= 100 ? 'meter-full' : ''}`}
              style={{ width: `${p1Meter}%` }}
            />
          </div>
          <div className="stamina-bar-container">
            <div className="stamina-bar-fill" style={{ width: `${p1Stamina}%` }} />
          </div>
          <div style={{ fontSize: '12px', color: 'var(--ff-yellow)', marginTop: '4px' }}>
            {'⭐'.repeat(p1RoundsWon)}
          </div>
        </div>

        <div className="round-timer-area" style={{ textAlign: 'center', minWidth: '80px' }}>
          <div style={{ fontSize: '12px', color: 'var(--ff-text-muted)' }}>
            ROUND {currentRound}
          </div>
          <div className={`round-timer ${roundTime <= 5 ? 'time-low' : ''}`}>
            {roundTime}
          </div>
        </div>

        <div className="player-info" style={{ textAlign: 'right' }}>
          <span className="player-name" style={{ color: opponent?.color }}>
            {opponent?.name || 'CPU'} {opponent?.emoji}
          </span>
          <div className="hp-bar-container p2">
            <div
              className={`hp-bar-fill ${hpClass(p2Hp)}`}
              style={{ width: `${p2Hp}%` }}
            />
            <span className="hp-text">{p2Hp}</span>
          </div>
          <div className="meter-bar-container">
            <div className="meter-bar-fill" style={{ width: `${p2Meter}%` }} />
          </div>
          <div style={{ fontSize: '12px', color: 'var(--ff-yellow)', marginTop: '4px', textAlign: 'right' }}>
            {'⭐'.repeat(p2RoundsWon)}
          </div>
        </div>
      </div>

      {/* Fight content */}
      <div className="fight-content">
        {/* Player 1 fighter */}
        <div className="fighter-area p1">
          <div className="fighter-emoji-display">{fighter?.emoji || '🥊'}</div>
          <div style={{ fontSize: '12px', color: 'var(--ff-text-muted)', marginTop: '4px' }}>
            {fighter?.name}
          </div>
        </div>

        {/* Player 2 fighter */}
        <div className="fighter-area p2">
          <div className="fighter-emoji-display">{opponent?.emoji || '🤖'}</div>
          <div style={{ fontSize: '12px', color: 'var(--ff-text-muted)', marginTop: '4px' }}>
            {opponent?.name}
          </div>
        </div>
      </div>

      {/* Phase overlays */}
      {phase === MatchPhase.INTRO && (
        <div className="round-indicator">
          {fighter?.emoji} VS {opponent?.emoji}
        </div>
      )}

      {phase === MatchPhase.COUNTDOWN && (
        <div className="round-indicator">
          {countdown > 0 ? countdown : 'FIGHT!'}
        </div>
      )}

      {phase === MatchPhase.ROUND_END && (
        <div className="round-indicator" style={{ fontSize: '48px' }}>
          ROUND OVER
        </div>
      )}
    </div>
  );
}
