/**
 * Arena definitions — maps to CSS classes in arenas.css
 */

export interface ArenaDefinition {
  id: string;
  name: string;
  cssClass: string;
}

export const ARENAS: ArenaDefinition[] = [
  { id: 'dojo', name: 'Dojo', cssClass: 'arena-dojo' },
  { id: 'jungle', name: 'Jungle', cssClass: 'arena-jungle' },
  { id: 'city', name: 'City', cssClass: 'arena-city' },
  { id: 'volcano', name: 'Volcano', cssClass: 'arena-volcano' },
  { id: 'cyber', name: 'Cyber', cssClass: 'arena-cyber' },
  { id: 'beach', name: 'Beach', cssClass: 'arena-beach' },
  { id: 'arena', name: 'Arena', cssClass: 'arena-arena' },
  { id: 'temple', name: 'Temple', cssClass: 'arena-temple' },
  { id: 'lab', name: 'Lab', cssClass: 'arena-lab' },
];

/**
 * Map fighters to their "home" arena
 */
const FIGHTER_HOME_ARENA: Record<string, string> = {
  koji: 'dojo',
  venus: 'beach',
  granite: 'volcano',
  flicka: 'cyber',
  hexbyte: 'lab',
  coco: 'jungle',
  baron: 'arena',
  nana: 'temple',
  daze: 'city',
  mirror: 'cyber',
  relic: 'temple',
  twins: 'arena',
};

/**
 * Get arena for a fight — uses attacker's home arena or random
 */
export function getArenaForFight(fighterId: string): ArenaDefinition {
  const homeId = FIGHTER_HOME_ARENA[fighterId];
  if (homeId) {
    const arena = ARENAS.find(a => a.id === homeId);
    if (arena) return arena;
  }
  return ARENAS[Math.floor(Math.random() * ARENAS.length)];
}

/**
 * Get a random opponent ID that differs from the player's fighter
 */
export function getRandomOpponentId(playerFighterId: string): string {
  const ALL_FIGHTER_IDS = [
    'koji', 'venus', 'granite', 'flicka', 'hexbyte', 'coco',
    'baron', 'nana', 'daze', 'mirror', 'relic', 'twins'
  ];
  const others = ALL_FIGHTER_IDS.filter(id => id !== playerFighterId);
  return others[Math.floor(Math.random() * others.length)];
}
