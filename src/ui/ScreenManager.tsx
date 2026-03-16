'use client';

import { useGameStore } from '../lib/store';
import HomeScreen from './screens/HomeScreen';
import FighterSelect from './screens/FighterSelect';
import FightScreen from './screens/FightScreen';
import ResultsScreen from './screens/ResultsScreen';

export default function ScreenManager() {
  const currentScreen = useGameStore((s) => s.currentScreen);

  switch (currentScreen) {
    case 'home':
      return <HomeScreen />;
    case 'fighter_select':
      return <FighterSelect />;
    case 'fight':
      return <FightScreen />;
    case 'results':
      return <ResultsScreen />;
    default:
      return <HomeScreen />;
  }
}
