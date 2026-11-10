"use client";

import React, { useState } from "react";
import { Trophy } from "lucide-react";
import { LeaderboardModal } from "./LeaderboardModal";

interface LeaderboardTriggerButtonProps {
  className?: string;
  label?: string;
  initialGame?: "georings" | "blindpoint";
  initialVariant?: string;
}

export const LeaderboardTriggerButton: React.FC<LeaderboardTriggerButtonProps> = ({
  className,
  label = "Classements du jour",
  initialGame = "georings",
  initialVariant,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={
          className ||
          "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-semibold transition-all shadow-sm cursor-pointer"
        }
        title="Consulter les classements du jour"
      >
        <Trophy className="w-3.5 h-3.5 text-amber-400" />
        <span>{label}</span>
      </button>

      <LeaderboardModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        initialGame={initialGame}
        initialVariant={initialVariant}
      />
    </>
  );
};
