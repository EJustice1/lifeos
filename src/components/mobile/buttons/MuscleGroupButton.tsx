import React from 'react';
import { triggerHapticFeedback } from '@/lib/utils/haptic-feedback';

interface MuscleGroupButtonProps {
  muscleGroup: string;
  count: number;
  isDisabled: boolean;
  onClick: () => void;
}

export const MuscleGroupButton: React.FC<MuscleGroupButtonProps> = ({ muscleGroup, count, isDisabled, onClick }) => {
  const handleClickWithHaptic = () => {
    if (!isDisabled) {
      triggerHapticFeedback();
      onClick();
    }
  };

  return (
    <button
      onClick={handleClickWithHaptic}
      disabled={isDisabled}
      className={`p-3 rounded-[var(--mobile-border-radius)] text-sm font-medium capitalize transition-colors flex-1 ${
        isDisabled
          ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
      }`}
    >
      {muscleGroup} ({count})
    </button>
  );
};