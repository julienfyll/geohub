"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  BorderPassEntity,
  BorderPassGraph,
  BorderPassPack,
  BorderPassMode,
  BorderPassSessionInit,
} from "@/lib/games/borderpass/types";
import {
  getPackGraph,
  generateChallenge,
  validateStep,
  findShortestPath,
} from "@/lib/games/borderpass/engine";
import { BorderPassMap, BorderPassMapTheme } from "@/components/game/borderpass/BorderPassMap";
import { BorderPassHUD } from "@/components/game/borderpass/BorderPassHUD";
import { BorderPassInput } from "@/components/game/borderpass/BorderPassInput";
import { BorderPassSummaryModal } from "@/components/game/borderpass/BorderPassSummaryModal";
import { BorderPassRulesModal } from "@/components/game/borderpass/BorderPassRulesModal";
import { BorderPassPackModal } from "@/components/game/borderpass/BorderPassPackModal";

function BorderPassGame() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const rawPack = searchParams.get("pack") as BorderPassPack | null;
  const rawMode = searchParams.get("mode") as BorderPassMode | null;

  const validPacks: BorderPassPack[] = [
    "monde",
    "europe",
    "france_departements",
    "ameriques",
    "afrique",
  ];
  const pack: BorderPassPack = rawPack && validPacks.includes(rawPack) ? rawPack : "monde";
  const mode: BorderPassMode = rawMode === "free" ? "free" : "daily";

  // Map settings
  const [theme, setTheme] = useState<BorderPassMapTheme>("dark");
  const [hideBorders, setHideBorders] = useState(false);

  // Modals
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showPackModal, setShowPackModal] = useState(false);

  // Active Game State
  const [session, setSession] = useState<BorderPassSessionInit | null>(null);
  const [visitedEntities, setVisitedEntities] = useState<BorderPassEntity[]>([]);
  const [invalidFlashId, setInvalidFlashId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    text: string;
    type: "error" | "success" | "info";
  } | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const [optimalSolutions, setOptimalSolutions] = useState<string[][]>([]);

  // Load graph for current pack
  const graph = useMemo<BorderPassGraph>(() => {
    return getPackGraph(pack);
  }, [pack]);

  // Initialize or restart session
  const initGameSession = useCallback(
    (targetPack: BorderPassPack, targetMode: BorderPassMode) => {
      const newSession = generateChallenge({
        pack: targetPack,
        mode: targetMode,
      });

      setSession(newSession);
      setVisitedEntities([]);
      setInvalidFlashId(null);
      setFeedbackMessage(null);
      setIsComplete(false);
      setGaveUp(false);
      setShowSummaryModal(false);

      // Pre-compute optimal path for reference
      const shortest = findShortestPath(
        newSession.startEntity.id,
        newSession.targetEntity.id,
        getPackGraph(targetPack)
      );
      setOptimalSolutions(shortest.paths);
    },
    []
  );

  // Init on mount or pack/mode change
  useEffect(() => {
    initGameSession(pack, mode);
  }, [pack, mode, initGameSession]);

  const currentEntity = useMemo<BorderPassEntity | null>(() => {
    if (!session) return null;
    return visitedEntities.length > 0
      ? visitedEntities[visitedEntities.length - 1]
      : session.startEntity;
  }, [session, visitedEntities]);

  // Dynamic remaining BFS distance
  const remainingSteps = useMemo(() => {
    if (!currentEntity || !session) return 0;
    if (currentEntity.id === session.targetEntity.id) return 0;
    const shortest = findShortestPath(currentEntity.id, session.targetEntity.id, graph);
    return shortest.found ? shortest.distance : -1;
  }, [currentEntity, session, graph]);

  // Handle player candidate selection
  const handleSelectCandidate = (candidate: BorderPassEntity) => {
    if (!session || !currentEntity || isComplete || gaveUp) return;

    const visitedIds = [session.startEntity.id, ...visitedEntities.map((e) => e.id)];
    const result = validateStep(
      currentEntity.id,
      candidate.id,
      session.targetEntity.id,
      visitedIds,
      graph
    );

    if (!result.valid) {
      setFeedbackMessage({
        text: result.message || "Mouvement impossible",
        type: "error",
      });
      setInvalidFlashId(candidate.id);
      setTimeout(() => setInvalidFlashId(null), 1000);
      return;
    }

    // Step is valid
    const updated = [...visitedEntities, candidate];
    setVisitedEntities(updated);

    if (result.isComplete) {
      setIsComplete(true);
      setFeedbackMessage({
        text: "🎯 Destination atteinte ! Félicitations !",
        type: "success",
      });
      // Show summary after slight delay to see map connection
      setTimeout(() => {
        setShowSummaryModal(true);
      }, 1000);
    } else {
      setFeedbackMessage({
        text: result.message || `Frontière franchie : ${candidate.name}`,
        type: "info",
      });
      setTimeout(() => setFeedbackMessage(null), 3500);
    }
  };

  // Undo last step
  const handleUndoLastStep = () => {
    if (visitedEntities.length === 0 || isComplete) return;
    setVisitedEntities((prev) => prev.slice(0, prev.length - 1));
    setFeedbackMessage({
      text: "Étape précédente rétablie",
      type: "info",
    });
    setTimeout(() => setFeedbackMessage(null), 2000);
  };

  // Give Up
  const handleGiveUp = () => {
    if (!session || isComplete) return;
    setGaveUp(true);
    setIsComplete(true);
    setShowSummaryModal(true);
  };

  // Toggle Theme
  const handleToggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "voyager" : prev === "voyager" ? "satellite" : "dark"));
  };

  // Toggle Hide Borders
  const handleToggleHideBorders = () => {
    setHideBorders((prev) => !prev);
  };

  // Handle pack & mode selection from PackModal
  const handleSelectPackMode = (newPack: BorderPassPack, newMode: BorderPassMode) => {
    setShowPackModal(false);
    router.push(`/play/borderpass?pack=${newPack}&mode=${newMode}`);
  };

  if (!session || !currentEntity) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold">Génération du défi frontalier...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 select-none">
      {/* Map layer */}
      <BorderPassMap
        pack={pack}
        theme={theme}
        hideBorders={hideBorders}
        startEntity={session.startEntity}
        targetEntity={session.targetEntity}
        visitedEntities={visitedEntities}
        invalidFlashId={invalidFlashId}
        onMapClick={(clickedId) => {
          if (graph[clickedId]) {
            handleSelectCandidate(graph[clickedId]);
          }
        }}
      />

      {/* Floating HUD */}
      <BorderPassHUD
        pack={pack}
        mode={mode}
        startEntity={session.startEntity}
        targetEntity={session.targetEntity}
        visitedEntities={visitedEntities}
        minOptimalSteps={session.minOptimalSteps}
        remainingSteps={remainingSteps}
        theme={theme}
        hideBorders={hideBorders}
        onToggleTheme={handleToggleTheme}
        onToggleHideBorders={handleToggleHideBorders}
        onOpenRules={() => setShowRulesModal(true)}
        onGiveUp={handleGiveUp}
        onRestart={() => initGameSession(pack, mode)}
      />

      {/* Keyboard Input at Bottom */}
      <div className="absolute bottom-5 left-0 right-0 z-30">
        <BorderPassInput
          currentEntity={currentEntity}
          targetEntity={session.targetEntity}
          graph={graph}
          visitedIds={[session.startEntity.id, ...visitedEntities.map((e) => e.id)]}
          isComplete={isComplete}
          onSelectCandidate={handleSelectCandidate}
          onUndoLastStep={handleUndoLastStep}
          feedbackMessage={feedbackMessage}
        />
      </div>

      {/* Summary Modal */}
      <BorderPassSummaryModal
        isOpen={showSummaryModal}
        onCloseToMap={() => setShowSummaryModal(false)}
        pack={pack}
        mode={mode}
        startEntity={session.startEntity}
        targetEntity={session.targetEntity}
        visitedEntities={visitedEntities}
        minOptimalSteps={session.minOptimalSteps}
        optimalSolutions={optimalSolutions}
        allEntities={graph}
        gaveUp={gaveUp}
        onReplay={() => initGameSession(pack, "free")}
        onChangePack={() => {
          setShowSummaryModal(false);
          setShowPackModal(true);
        }}
      />

      {/* Rules Modal */}
      <BorderPassRulesModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
      />

      {/* Pack & Mode Selector Modal */}
      <BorderPassPackModal
        isOpen={showPackModal}
        onClose={() => setShowPackModal(false)}
        currentPack={pack}
        currentMode={mode}
        onSelect={handleSelectPackMode}
      />
    </div>
  );
}

export default function BorderPassPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <BorderPassGame />
    </Suspense>
  );
}
