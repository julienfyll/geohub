"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  BorderPathEntity,
  BorderPathGraph,
  BorderPathPack,
  BorderPathMode,
  BorderPathSessionInit,
  BorderPathMapTheme,
} from "@/lib/games/borderpath/types";
import {
  getPackGraph,
  generateChallenge,
  validateBidirectionalStep,
  findShortestPath,
  findMinDistanceBetweenSets,
  findShortestPathWithinSet,
} from "@/lib/games/borderpath/engine";
import { BorderPathMap } from "@/components/game/borderpath/BorderPathMap";
import { BorderPathHUD } from "@/components/game/borderpath/BorderPathHUD";
import { BorderPathInput } from "@/components/game/borderpath/BorderPathInput";
import { BorderPathTargetCard } from "@/components/game/borderpath/BorderPathTargetCard";
import { BorderPathSummaryModal } from "@/components/game/borderpath/BorderPathSummaryModal";
import { BorderPathRulesModal } from "@/components/game/borderpath/BorderPathRulesModal";
import { BorderPathPackModal } from "@/components/game/borderpath/BorderPathPackModal";
import { BorderPathSettingsModal } from "@/components/game/borderpath/BorderPathSettingsModal";

function BorderPathGame() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const rawPack = searchParams.get("pack") as BorderPathPack | null;
  const rawMode = searchParams.get("mode") as BorderPathMode | null;

  const validPacks: BorderPathPack[] = [
    "monde",
    "europe",
    "france_departements",
    "ameriques",
    "afrique",
  ];
  const pack: BorderPathPack = rawPack && validPacks.includes(rawPack) ? rawPack : "monde";
  const mode: BorderPathMode = rawMode === "free" ? "free" : "daily";

  // Map settings
  const [theme, setTheme] = useState<BorderPathMapTheme>("dark");
  const [hideBorders, setHideBorders] = useState(false);

  // Modals
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showPackModal, setShowPackModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Active Game State - Initialized synchronously so UI renders immediately without blocking spinner
  const [session, setSession] = useState<BorderPathSessionInit>(() =>
    generateChallenge({ pack, mode })
  );

  // Bidirectional branches: Branch A (from Start) and Branch B (from Target)
  const [branchAEntities, setBranchAEntities] = useState<BorderPathEntity[]>(() => [
    session.startEntity,
  ]);
  const [branchBEntities, setBranchBEntities] = useState<BorderPathEntity[]>(() => [
    session.targetEntity,
  ]);
  const [fullConnectedPath, setFullConnectedPath] = useState<BorderPathEntity[]>([]);
  const [failedAttempts, setFailedAttempts] = useState<BorderPathEntity[]>([]);

  const [invalidFlashId, setInvalidFlashId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    text: string;
    type: "error" | "success" | "info";
  } | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);

  // Precomputed optimal solutions
  const [optimalSolutions, setOptimalSolutions] = useState<string[][]>(() => {
    const initGraph = getPackGraph(pack);
    const shortest = findShortestPath(
      session?.startEntity?.id || "",
      session?.targetEntity?.id || "",
      initGraph
    );
    return shortest.paths;
  });

  // Load graph for current pack
  const graph = useMemo<BorderPathGraph>(() => {
    return getPackGraph(pack);
  }, [pack]);

  // Active heads for each front
  const headA = useMemo<BorderPathEntity>(() => {
    return branchAEntities[branchAEntities.length - 1] || session.startEntity;
  }, [branchAEntities, session.startEntity]);

  const headB = useMemo<BorderPathEntity>(() => {
    return branchBEntities[branchBEntities.length - 1] || session.targetEntity;
  }, [branchBEntities, session.targetEntity]);

  // Restart / Re-generate session
  const initGameSession = useCallback(
    (targetPack: BorderPathPack, targetMode: BorderPathMode) => {
      const newSession = generateChallenge({
        pack: targetPack,
        mode: targetMode,
      });

      setSession(newSession);
      setBranchAEntities([newSession.startEntity]);
      setBranchBEntities([newSession.targetEntity]);
      setFullConnectedPath([]);
      setFailedAttempts([]);
      setInvalidFlashId(null);
      setFeedbackMessage(null);
      setIsComplete(false);
      setGaveUp(false);
      setShowSummaryModal(false);

      const shortest = findShortestPath(
        newSession.startEntity.id,
        newSession.targetEntity.id,
        getPackGraph(targetPack)
      );
      setOptimalSolutions(shortest.paths);
    },
    []
  );

  // When URL query params change (pack or mode), regenerate session
  useEffect(() => {
    if (session.pack !== pack || session.mode !== mode) {
      initGameSession(pack, mode);
    }
  }, [pack, mode, session.pack, session.mode, initGameSession]);

  // Remaining BFS distance between Side A and Side B
  const remainingSteps = useMemo(() => {
    if (isComplete) return 0;
    const branchAIds = branchAEntities.map((e) => e.id);
    const branchBIds = branchBEntities.map((e) => e.id);
    return findMinDistanceBetweenSets(branchAIds, branchBIds, graph);
  }, [branchAEntities, branchBEntities, graph, isComplete]);

  // Auto-complete immediately if Side A and Side B touch each other
  useEffect(() => {
    if (isComplete || gaveUp) return;
    const branchAIds = branchAEntities.map((e) => e.id);
    const branchBIds = branchBEntities.map((e) => e.id);
    const areTouching = branchAIds.some((aId) =>
      branchBIds.some((bId) => graph[aId]?.neighbors.includes(bId))
    );
    if (areTouching && branchAIds.length > 0 && branchBIds.length > 0) {
      const allPlacedSet = new Set([...branchAIds, ...branchBIds]);
      const connectedPath = findShortestPathWithinSet(
        session.startEntity.id,
        session.targetEntity.id,
        allPlacedSet,
        graph
      );
      if (connectedPath) {
        setIsComplete(true);
        const fullEntities = connectedPath.map((id) => graph[id]).filter(Boolean);
        setFullConnectedPath(fullEntities);
        setFeedbackMessage({
          text: "🎯 Jonction réussie ! Les deux côtés se touchent !",
          type: "success",
        });
        setTimeout(() => setShowSummaryModal(true), 1200);
      }
    }
  }, [
    branchAEntities,
    branchBEntities,
    graph,
    isComplete,
    gaveUp,
    session.startEntity.id,
    session.targetEntity.id,
  ]);

  // Total unique countries placed so far
  const uniquePlacedCount = useMemo(() => {
    const set = new Set([
      ...branchAEntities.map((e) => e.id),
      ...branchBEntities.map((e) => e.id),
    ]);
    return set.size;
  }, [branchAEntities, branchBEntities]);

  const totalAttempts = uniquePlacedCount + failedAttempts.length;

  // Handle player candidate selection (Bidirectional)
  const handleSelectCandidate = (candidate: BorderPathEntity) => {
    if (isComplete || gaveUp) return;

    const branchAIds = branchAEntities.map((e) => e.id);
    const branchBIds = branchBEntities.map((e) => e.id);

    const result = validateBidirectionalStep(
      candidate.id,
      branchAIds,
      branchBIds,
      graph
    );

    if (!result.valid) {
      setFeedbackMessage({
        text: result.message || "Mouvement impossible",
        type: "error",
      });
      setFailedAttempts((prev) => [...prev, candidate]);
      setInvalidFlashId(candidate.id);
      setTimeout(() => setInvalidFlashId(null), 1000);
      return;
    }

    // Candidate is valid
    if (result.attachedTo === "branchA") {
      setBranchAEntities((prev) => [...prev, candidate]);
    } else if (result.attachedTo === "branchB") {
      setBranchBEntities((prev) => [...prev, candidate]);
    } else if (result.attachedTo === "bridge") {
      setBranchAEntities((prev) => [...prev, candidate]);
    }

    if (result.isComplete && result.fullConnectedPath) {
      setIsComplete(true);
      const fullPathEntities = result.fullConnectedPath
        .map((id) => graph[id])
        .filter(Boolean);
      setFullConnectedPath(fullPathEntities);
      setFeedbackMessage({
        text: result.message || "🎯 Jonction réussie ! Félicitations !",
        type: "success",
      });
      setTimeout(() => {
        setShowSummaryModal(true);
      }, 1200);
    } else {
      setFeedbackMessage({
        text: result.message || `Maillon posé : ${candidate.name}`,
        type: "info",
      });
      setTimeout(() => setFeedbackMessage(null), 3500);
    }
  };

  // Give Up (never spoilers the optimal path)
  const handleGiveUp = () => {
    if (isComplete) return;
    setGaveUp(true);
    setIsComplete(true);
    setFullConnectedPath([]);
    setShowSummaryModal(true);
  };

  // Replay exactly the same challenge
  const handleReplaySameChallenge = () => {
    setBranchAEntities([session.startEntity]);
    setBranchBEntities([session.targetEntity]);
    setFullConnectedPath([]);
    setFailedAttempts([]);
    setInvalidFlashId(null);
    setFeedbackMessage(null);
    setIsComplete(false);
    setGaveUp(false);
    setShowSummaryModal(false);
  };

  // New random challenge in current pack
  const handleNewChallenge = () => {
    initGameSession(pack, "free");
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
  const handleSelectPackMode = (newPack: BorderPathPack, newMode: BorderPathMode) => {
    setShowPackModal(false);
    router.push(`/play/borderpath?pack=${newPack}&mode=${newMode}`);
  };

  const visitedIds = [
    ...branchAEntities.map((e) => e.id),
    ...branchBEntities.map((e) => e.id),
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 select-none">
      {/* Map layer (Client-only dynamically loaded) - Zero click interaction */}
      <BorderPathMap
        pack={pack}
        theme={theme}
        hideBorders={hideBorders}
        startEntity={session.startEntity}
        targetEntity={session.targetEntity}
        branchAEntities={branchAEntities}
        branchBEntities={branchBEntities}
        fullConnectedPathEntities={fullConnectedPath}
        isComplete={isComplete}
        invalidFlashId={invalidFlashId}
      />

      {/* Floating Top HUD */}
      <BorderPathHUD
        pack={pack}
        mode={mode}
        startEntity={session.startEntity}
        targetEntity={session.targetEntity}
        onOpenRules={() => setShowRulesModal(true)}
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenPackModal={() => setShowPackModal(true)}
        onChangeMode={(newMode) => {
          router.push(`/play/borderpath?pack=${pack}&mode=${newMode}`);
        }}
        onGiveUp={handleGiveUp}
        onRestart={() => initGameSession(pack, mode)}
      />

      {/* Optimal Target Card (Bottom-Left) */}
      <BorderPathTargetCard
        optimalCountries={session.minOptimalSteps + 1}
        totalAttempts={totalAttempts}
        uniquePlacedCount={uniquePlacedCount}
        errorCount={failedAttempts.length}
        remainingSteps={remainingSteps}
      />

      {/* 100% Keyboard Input at Bottom */}
      <div className="absolute bottom-8 sm:bottom-10 left-0 right-0 z-30 pointer-events-none">
        <div className="pointer-events-auto">
          <BorderPathInput
            headA={headA}
            headB={headB}
            graph={graph}
            visitedIds={visitedIds}
            isComplete={isComplete}
            onSelectCandidate={handleSelectCandidate}
            feedbackMessage={feedbackMessage}
          />
        </div>
      </div>

      {/* Summary Modal */}
      <BorderPathSummaryModal
        isOpen={showSummaryModal}
        onCloseToMap={() => setShowSummaryModal(false)}
        pack={pack}
        mode={mode}
        startEntity={session.startEntity}
        targetEntity={session.targetEntity}
        fullConnectedPath={fullConnectedPath}
        totalCountriesPlaced={uniquePlacedCount}
        failedAttempts={failedAttempts}
        minOptimalSteps={session.minOptimalSteps}
        gaveUp={gaveUp}
        onReplaySame={handleReplaySameChallenge}
        onNewChallenge={handleNewChallenge}
        onChangePack={() => {
          setShowSummaryModal(false);
          setShowPackModal(true);
        }}
      />

      {/* Rules Modal */}
      <BorderPathRulesModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
      />

      {/* Pack & Mode Selector Modal */}
      <BorderPathPackModal
        isOpen={showPackModal}
        onClose={() => setShowPackModal(false)}
        currentPack={pack}
        currentMode={mode}
        onSelect={handleSelectPackMode}
      />

      {/* Game Settings Modal (Roue crantée standard GeoHub) */}
      <BorderPathSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        theme={theme}
        onChangeTheme={setTheme}
        hideBorders={hideBorders}
        onToggleHideBorders={handleToggleHideBorders}
      />
    </div>
  );
}

export default function BorderPathPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <BorderPathGame />
    </Suspense>
  );
}
