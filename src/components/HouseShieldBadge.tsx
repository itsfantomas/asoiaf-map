import React from 'react';
import { GreatHouseInfo } from '../types/atlas';

interface HouseShieldBadgeProps {
  house: GreatHouseInfo;
  regionId: string;
  size?: number;
}

export const HouseShieldGlyph: React.FC<{ regionId: string; accent: string }> = ({
  regionId,
  accent,
}) => {
  switch (regionId) {
    case 'the-north':
      // Direwolf silhouette / stylized wolf head
      return (
        <path
          d="M-6,-2 L-8,-7 L-3,-4 L2,-5 L7,-8 L5,-2 L8,1 L4,4 L0,7 L-5,4 L-7,1 Z"
          fill={accent}
        />
      );
    case 'iron-islands':
      // Golden Kraken
      return (
        <path
          d="M0,-7 C4,-7 5,-3 3,0 L7,5 M0,-7 C-4,-7 -5,-3 -3,0 L-7,5 M-2,0 L-3,7 M2,0 L3,7 M0,-2 L0,6"
          stroke={accent}
          strokeWidth="1.9"
          strokeLinecap="round"
          fill="none"
        />
      );
    case 'riverlands':
      // Leaping Trout
      return (
        <path
          d="M-6,4 C-4,-3 1,-6 6,-5 C4,-1 3,2 -1,4 L-4,7 L-4,4 Z"
          fill={accent}
        />
      );
    case 'vale-of-arryn':
      // Crescent Moon & Falcon wing
      return (
        <g fill={accent}>
          <path d="M-3,-6 A6,6 0 1,0 5,4 A4.5,4.5 0 1,1 -3,-6 Z" />
          <path d="M0,-3 L6,-5 L3,0 L5,2 L0,0 Z" />
        </g>
      );
    case 'westerlands':
      // Rampant Lion crest
      return (
        <path
          d="M-4,-6 C0,-8 5,-5 4,-1 C3,2 6,4 4,7 L-4,7 C-5,3 -2,1 -4,-2 Z"
          fill={accent}
        />
      );
    case 'crownlands':
      // Three-headed Dragon emblem
      return (
        <path
          d="M0,-7 L2,-2 L7,-5 L4,1 L6,6 L0,3 L-6,6 L-4,1 L-7,-5 L-2,-2 Z"
          fill="#E5B242"
        />
      );
    case 'the-reach':
      // Golden Rose
      return (
        <g fill={accent}>
          <circle cx="0" cy="-4.5" r="2.6" />
          <circle cx="4.3" cy="-1.4" r="2.6" />
          <circle cx="2.7" cy="3.6" r="2.6" />
          <circle cx="-2.7" cy="3.6" r="2.6" />
          <circle cx="-4.3" cy="-1.4" r="2.6" />
          <circle cx="0" cy="0" r="2" fill="#3E6B48" />
        </g>
      );
    case 'stormlands':
      // Crowned Stag antlers
      return (
        <path
          d="M0,6 L0,-1 M0,1 L-6,-5 M-4,-3 L-4,-7 M0,1 L6,-5 M4,-3 L4,-7 M-2,-6 L0,-8 L2,-6"
          stroke={accent}
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      );
    case 'dorne':
      // Sun pierced by Spear
      return (
        <g>
          <circle cx="0" cy="0" r="4.8" fill={accent} />
          <line
            x1="-7"
            y1="6"
            x2="7"
            y2="-6"
            stroke="#FFF7ED"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <polygon points="7,-6 3,-6 6,-2.5" fill="#FFF7ED" />
        </g>
      );
    default:
      return <circle cx="0" cy="0" r="4" fill={accent} />;
  }
};

export const HouseShieldBadge: React.FC<HouseShieldBadgeProps> = ({
  house,
  regionId,
  size = 38,
}) => {
  return (
    <svg
      width={size}
      height={Math.round(size * 1.15)}
      viewBox="-14 -15 28 32"
      className="shrink-0 drop-shadow-sm"
      aria-hidden="true"
    >
      <path
        d="M-12,-13 L12,-13 L12,-1 C12,7 6,12 0,15 C-6,12 -12,7 -12,-1 Z"
        fill={house.bannerColor}
        stroke="#B08D57"
        strokeWidth="1.8"
      />
      <path
        d="M-9.5,-10.5 L9.5,-10.5 L9.5,-1 C9.5,5.2 4.8,9.4 0,12 C-4.8,9.4 -9.5,5.2 -9.5,-1 Z"
        fill="none"
        stroke="rgba(255,255,255,0.28)"
        strokeWidth="0.8"
      />
      <HouseShieldGlyph regionId={regionId} accent={house.accentColor} />
    </svg>
  );
};
