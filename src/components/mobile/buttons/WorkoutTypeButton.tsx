import React from 'react';
import { triggerHapticFeedback } from '@/lib/utils/haptic-feedback';

interface WorkoutTypeButtonProps {
  type: string;
  isSelected: boolean;
  onClick: () => void;
}

export const WorkoutTypeButton: React.FC<WorkoutTypeButtonProps> = ({ type, isSelected, onClick }) => {
  const handleClickWithHaptic = () => {
    triggerHapticFeedback();
    onClick();
  };

  return (
    <button
      onClick={handleClickWithHaptic}
      className={`p-3 rounded-[var(--mobile-border-radius)] text-sm font-medium transition-colors flex-1 ${
        isSelected
          ? 'bg-[var(--mobile-accent)] text-white'
          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
      }`}
    >
      {type}
    </button>
  );
};