'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useGameStore } from '../../lib/store';
import { GameLoop } from '../../engine/GameLoop';
import { BotEngine } from '../../engine/BotEngine';
import { getFighter } from '../../fighters';
import { getArenaForFight, getRandomOpponentId } from '../../core/arenas';
import { MatchPhase, ExpressionType } from '../../core/types';
import FighterChar from '../components/FighterChar';
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
  const videoContainerRef = useRef<HTMLDivElement>(null);

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
  const [screenShake, setScreenShake] = useState(false);
  const [desperationMode, setDesperationMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraFailed, setCameraFailed] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('Initializing...');
  const [p1State, setP1State] = useState('');
  const [p2State, setP2State] = useState('');

  const fighterId = selectedFighterId || 'koji';
  const fighter = getFighter(fighterId);
  const [opponentId] = useState(() => getRandomOpponentId(fighterId));
  const opponent = getFighter(opponentId);
  const [arena] = useState(() => getArenaForFight(fighterId));

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
              setP1Hp(Math.max(0, Math.round(data.player1.combat.hp)));
              setP2Hp(Math.max(0, Math.round(data.player2.combat.hp)));
              setP1Meter(Math.round(data.player1.combat.meter));
              setP2Meter(Math.round(data.player2.combat.meter));
              setP1Stamina(Math.round(data.player1.combat.stamina));
              setP1RoundsWon(data.player1.roundsWon);
              setP2RoundsWon(data.player2.roundsWon);
              setDesperationMode(data.player1.combat.hp / data.player1.combat.maxHp <= 0.2);

              // Track animation states
              setP1State(data.player1.move.phase !== 'idle' ? data.player1.move.phase : '');
              setP2State(data.player2.move.phase !== 'idle' ? data.player2.move.phase : '');
            }
            break;
          case 'hit':
            if (data.damage > 0) {
              setHitFlash(true);
              setScreenShake(true);
              setTimeout(() => setHitFlash(false), 80);
              setTimeout(() => setScreenShake(false), 300);
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
              wasKO: data.roundResults?.some((r: { player1Hp: number; player2Hp: number }) =>
                r.player1Hp <= 0 || r.player2Hp <= 0
              ) || false,
            });
            setTimeout(() => setScreen('results'), 2000);
            break;
        }
      });

      // Try to init with face tracking first
      let useFaceTracking = true;

      // Check browser support
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        useFaceTracking = false;
      }

      if (useFaceTracking) {
        setLoadingStatus('Starting camera...');
        try {
          await gl.initMatch({
            matchId: uuid(),
            player1: { id: 'p1', username: 'You', fighterId },
            player2: { id: 'cpu', username: 'CPU', fighterId: opponentId },
            isPlayer1Local: true,
          });

          // Show camera preview
          const video = gl.getFaceLandmarker().getVideoElement();
          if (video && videoContainerRef.current) {
            videoContainerRef.current.appendChild(video);
          }
        } catch (initErr: any) {
          console.warn('[FightScreen] Camera/FaceLandmarker failed:', initErr.message);
          useFaceTracking = false;
        }
      }

      // Fallback: init without face tracking (button controls)
      if (!useFaceTracking) {
        setCameraFailed(true);
        setLoadingStatus('Using button controls...');
        await gl.initMatch({
          matchId: uuid(),
          player1: { id: 'p1', username: 'You', fighterId },
          player2: { id: 'cpu', username: 'CPU', fighterId: opponentId },
          isPlayer1Local: true,
          skipFaceTracking: true,
        });
      }

      // Set up bot for CPU mode
      if (matchMode === 'cpu') {
        const bot = new BotEngine(cpuDifficulty);
        botEngineRef.current = bot;

        botIntervalRef.current = setInterval(() => {
          const state = gl.getStateSnapshot();
          if (!state || state.phase !== MatchPhase.FIGHTING) return;

          const botAction = bot.update(state.player2, state.player1);
          if (botAction) {
            gl.handleRemoteInput('cpu', [botAction]);
          }
        }, 100);
      }

      setLoadingStatus('Ready!');
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

  // Button fallback — send expression events manually
  const sendExpression = useCallback((expression: ExpressionType) => {
    const gl = gameLoopRef.current;
    if (!gl) return;
    const state = gl.getStateSnapshot();
    if (!state || state.phase !== MatchPhase.FIGHTING) return;

    gl.handleButtonInput('p1', [{
      type: expression,
      magnitude: 0.8,
      timestamp: Date.now(),
      confidence: 1.0,
    }]);
  }, []);

  const handleAttack = useCallback(() => {
    const attacks = [ExpressionType.SMILE, ExpressionType.MOUTH_OPEN, ExpressionType.BROWS_DOWN];
    sendExpression(attacks[Math.floor(Math.random() * attacks.length)]);
  }, [sendExpression]);

  const handleBlock = useCallback(() => {
    sendExpression(ExpressionType.LIPS_PRESS);
  }, [sendExpression]);

  const handleDodge = useCallback(() => {
    const dodges = [ExpressionType.LEFT_WINK, ExpressionType.RIGHT_WINK];
    sendExpression(dodges[Math.floor(Math.random() * dodges.length)]);
  }, [sendExpression]);

  if (error) {
    return (
      <div className="screen" style={{ gap: '16px', textAlign: 'center', padding: '32px' }}>
        <div style={{ fontSize: '48px' }}>
          <FighterChar fighterId={fighterId} style={{ transform: 'scale(2)', margin: '0 auto' }} />
        </div>
        <h2 style={{ marginTop: '24px' }}>Failed to Start</h2>
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

  const getP1AnimClass = () => {
    if (p1Hp <= 0) return 'ko';
    if (p1State === 'active') return 'attacking';
    return '';
  };

  const getP2AnimClass = () => {
    if (p2Hp <= 0) return 'ko';
    if (p2State === 'active') return 'attacking';
    return '';
  };

  return (
    <div className={`screen fight-screen ${screenShake ? 'screen-shake' : ''}`}>
      {/* Arena background */}
      <div className={`arena-bg ${arena.cssClass}`} />

      {/* Hit flash overlay */}
      {hitFlash && <div className="hit-flash" />}

      {/* Desperation aura */}
      {desperationMode && <div className="desperation-aura" />}

      {/* HUD */}
      <div className="fight-hud">
        <div className="player-info">
          <span className="player-name" style={{ color: fighter?.color }}>
            {fighter?.name || 'P1'}
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
            {'★'.repeat(p1RoundsWon)}
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
            {opponent?.name || 'CPU'}
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
            {'★'.repeat(p2RoundsWon)}
          </div>
        </div>
      </div>

      {/* Fighter characters in arena */}
      <div className="fight-content">
        <div className={`fighter-stage p1 ${getP1AnimClass()}`}>
          <FighterChar fighterId={fighterId} />
          <div className="fighter-tag">{fighter?.name}</div>
        </div>

        <div className={`fighter-stage p2 ${getP2AnimClass()}`}>
          <FighterChar fighterId={opponentId} />
          <div className="fighter-tag">{opponent?.name}</div>
        </div>
      </div>

      {/* Camera preview */}
      {!cameraFailed && (
        <div className="camera-preview" ref={videoContainerRef} />
      )}

      {/* Button fallback controls */}
      {(cameraFailed || phase === MatchPhase.FIGHTING) && (
        <div className="fallback-controls">
          <button className="fallback-btn attack" onClick={handleAttack}>
            <span className="btn-icon">👊</span>
            ATK
          </button>
          <button className="fallback-btn block" onClick={handleBlock}>
            <span className="btn-icon">🛡</span>
            BLK
          </button>
          <button className="fallback-btn dodge" onClick={handleDodge}>
            <span className="btn-icon">💨</span>
            DGE
          </button>
        </div>
      )}

      {/* Loading status */}
      {phase === MatchPhase.LOADING && (
        <div className="round-indicator" style={{ fontSize: '24px' }}>
          {loadingStatus}
        </div>
      )}

      {/* Phase overlays */}
      {phase === MatchPhase.INTRO && (
        <div className="round-indicator" style={{ fontSize: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <FighterChar fighterId={fighterId} style={{ transform: 'scale(2)' }} />
              <span style={{ marginTop: '16px', fontSize: '16px' }}>{fighter?.name}</span>
            </div>
            <span>VS</span>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <FighterChar fighterId={opponentId} style={{ transform: 'scale(2) scaleX(-1)' }} />
              <span style={{ marginTop: '16px', fontSize: '16px' }}>{opponent?.name}</span>
            </div>
          </div>
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
