import React from 'react';
import { getDifficultyTier, getTierColor } from '../../engine/adaptiveEngine';

interface AbilityBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showTier?: boolean;
  delta?: number;
}

export const AbilityBadge: React.FC<AbilityBadgeProps> = ({
  score,
  size = 'md',
  showTier = true,
  delta,
}) => {
  const tier = getDifficultyTier(score);
  const colors = getTierColor(tier);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3.5 py-1.5 font-bold',
  };

  return (
    <div className="inline-flex items-center gap-1.5 font-sans">
      <span
        id={`ability-badge-${score}`}
        className={`inline-flex items-center gap-1 rounded-md border font-semibold tracking-tight ${sizeClasses[size]} ${colors.badge}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
        <span>{score}</span>
        {showTier && (
          <span className="opacity-80 font-normal text-[0.85em]">
            • {tier}
          </span>
        )}
      </span>
      {delta !== undefined && delta !== 0 && (
        <span
          className={`text-xs font-bold ${
            delta > 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}
        >
          {delta > 0 ? `+${delta}` : delta}
        </span>
      )}
    </div>
  );
};
