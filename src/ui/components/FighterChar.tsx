'use client';

/**
 * Pure CSS fighter character component.
 * Renders the correct head, body, eyes, mouth, and detail elements
 * for each fighter ID using CSS classes from fighters.css.
 */

// Fighters that have a visible mouth element
const FIGHTERS_WITH_MOUTH = ['venus', 'coco', 'baron', 'nana'];

interface FighterCharProps {
  fighterId: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function FighterChar({ fighterId, className = '', style }: FighterCharProps) {
  const hasMouth = FIGHTERS_WITH_MOUTH.includes(fighterId);

  return (
    <div className={`fighter-char fighter-${fighterId} ${className}`} style={style}>
      <div className="head">
        <div className="eyes">
          <div className="eye"></div>
          <div className="eye"></div>
        </div>
        {hasMouth && <div className="mouth"></div>}
      </div>
      <div className="detail"></div>
      <div className="body"></div>
    </div>
  );
}
