"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Layers,
  Settings,
  HelpCircle,
  Zap,
  Play,
  CheckCircle2,
} from "lucide-react";
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
import { RestartConfirmModal } from "@/components/game/RestartConfirmModal";
import { QuickMenuDrawer } from "@/components/navigation/QuickMenuDrawer";
import { UserNav } from "@/components/navigation/UserNav";
import { LeaderboardTriggerButton } from "@/components/leaderboard/LeaderboardTriggerButton";

const BORDERPATH_PACKS: {
  id: BorderPathPack;
  name: string;
  badge: string;
  icon: string;
  countLabel: string;
  description: string;
}[] = [
  {
    id: "monde",
    name: "Monde Continental",
    badge: "167 pays",
    icon: "🌍",
    countLabel: "167 pays & frontières",
    description: "Le grand défi planétaire reliant l'Eurasie, l'Afrique et les Amériques.",
  },
  {
    id: "france_departements",
    name: "France Métropolitaine",
    badge: "96 départements",
    icon: "🇫🇷",
    countLabel: "96 départements contigus",
    description: "Traversez l'Hexagone d'un département à l'autre sans sauter de frontière.",
  },
  {
    id: "europe",
    name: "Europe Continentale",
    badge: "46 pays",
    icon: "🇪🇺",
    countLabel: "46 pays continentaux",
    description: "Naviguez à travers l'enchevêtrement des frontières d'Europe centrale et occidentale.",
  },
  {
    id: "ameriques",
    name: "Amériques (Nord & Sud)",
    badge: "35 pays",
    icon: "🌎",
    countLabel: "35 nations américaines",
    description: "De l'Alaska à la Terre de Feu en passant par l'isthme d'Amérique Centrale.",
  },
  {
    id: "afrique",
    name: "Afrique Continentale",
    badge: "54 pays",
    icon: "🌍",
    countLabel: "54 pays africains",
    description: "Traversez le Sahara, le Sahel et l'Afrique australe de frontière en frontière.",
  },
];

// =========================================================================
// 1. LOBBY BORDERPATH (Cockpit de Sélection & Lancement)
// =========================================================================
interface BorderPathLobbyProps {
  initialPack: BorderPathPack;
  initialMode: BorderPathMode;
  onStartGame: (pack: BorderPathPack, mode: BorderPathMode, seed?: string) => void;
  onOpenRules: () => void;
  onOpenSettings: () => void;
}

function BorderPathLobby({
  initialPack,
  onStartGame,
  onOpenRules,
  onOpenSettings,
}: BorderPathLobbyProps) {
  const [selectedPack, setSelectedPack] = useState<BorderPathPack>(initialPack);

  const selectedPackMeta = useMemo(() => {
    return BORDERPATH_PACKS.find((p) => p.id === selectedPack) || BORDERPATH_PACKS[0];
  }, [selectedPack]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Lobby Navigation Bar */}
      <nav className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <QuickMenuDrawer />
            <Link
              href="/"
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Hub</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm tracking-tight text-white hidden sm:inline">
              BorderPath
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <LeaderboardTriggerButton
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-all shadow-sm cursor-pointer"
              label="Classement"
            />
            <button
              type="button"
              onClick={onOpenRules}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
              title="Règles du jeu"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onOpenSettings}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
              title="Paramètres de carte"
            >
              <Settings className="w-4 h-4" />
            </button>
            <UserNav />
          </div>
        </div>
      </nav>

      {/* Main Cockpit / Selection Screen */}
      <main className="max-w-4xl mx-auto px-6 py-8 flex-1 w-full space-y-10">
        {/* 1. RAPPEL DES RENDEZ-VOUS DU JOUR BORDERPATH (FLASHY) */}
        <section className="p-6 rounded-3xl bg-slate-900/90 border-2 border-indigo-500/40 space-y-4 shadow-xl relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-44 h-44 bg-indigo-500/10 blur-3xl pointer-events-none rounded-full" />

          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Rendez-vous Quotidien (BorderPath)</span>
            </span>
            <span className="text-[11px] text-slate-400 font-mono">Tirages uniques du jour</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            {/* Monde */}
            <button
              type="button"
              onClick={() => onStartGame("monde", "daily")}
              className="p-3.5 rounded-2xl bg-slate-950/80 border-2 border-indigo-500/50 hover:border-indigo-400 transition-all group flex flex-col justify-between shadow-[0_0_15px_rgba(99,102,241,0.15)] text-left cursor-pointer"
            >
              <div>
                <span className="text-xs font-bold text-white block group-hover:text-indigo-300">
                  🌍 Monde Continental
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  167 pays • Frontières terrestres
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 text-white text-[9px] font-black uppercase tracking-wider shadow-sm">
                  <span className="w-1 h-1 rounded-full bg-white animate-ping" />
                  <span>À relever</span>
                </span>
                <span className="text-xs font-bold text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                  Jouer →
                </span>
              </div>
            </button>

            {/* France */}
            <button
              type="button"
              onClick={() => onStartGame("france_departements", "daily")}
              className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/60 transition-all group flex flex-col justify-between text-left cursor-pointer"
            >
              <div>
                <span className="text-xs font-bold text-white block group-hover:text-indigo-300">
                  🇫🇷 France Métropolitaine
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  96 départements contigus
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 text-white text-[9px] font-black uppercase tracking-wider shadow-sm">
                  <span className="w-1 h-1 rounded-full bg-white animate-ping" />
                  <span>À relever</span>
                </span>
                <span className="text-xs font-bold text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                  Jouer →
                </span>
              </div>
            </button>

            {/* Europe */}
            <button
              type="button"
              onClick={() => onStartGame("europe", "daily")}
              className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/60 transition-all group flex flex-col justify-between text-left cursor-pointer"
            >
              <div>
                <span className="text-xs font-bold text-white block group-hover:text-indigo-300">
                  🇪🇺 Europe
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  46 pays continentaux
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 text-white text-[9px] font-black uppercase tracking-wider shadow-sm">
                  <span className="w-1 h-1 rounded-full bg-white animate-ping" />
                  <span>À relever</span>
                </span>
                <span className="text-xs font-bold text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                  Jouer →
                </span>
              </div>
            </button>
          </div>
        </section>

        {/* 2. ESPACE LANCEMENT DE PARTIE RAPIDE (COCKPIT ÉPURÉ) */}
        <section className="p-6 sm:p-8 rounded-3xl bg-slate-900 border-2 border-slate-800 space-y-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <span>Lancement de Partie Rapide & Entraînement Libre</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Entraînement illimité. Choisissez votre terrain pour jouer immédiatement.
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">100% Clavier • BFS Optimal</span>
          </div>

          {/* Choix du Terrain / Pack */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Déclinaison / Terrain
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {BORDERPATH_PACKS.map((p) => {
                const isSelected = selectedPack === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPack(p.id)}
                    className={`p-3.5 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-950/30 text-white font-bold shadow-md shadow-indigo-500/10"
                        : "border-slate-800 bg-slate-950/60 hover:border-slate-700 text-slate-300 font-semibold"
                    }`}
                  >
                    <span className="text-xl block mb-1">{p.icon}</span>
                    <span className="text-xs block font-bold">{p.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{p.badge}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Boutons d'Action Majeurs */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={() => onStartGame(selectedPack, "free")}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-black text-sm sm:text-base shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all flex items-center justify-between cursor-pointer hover:scale-[1.01]"
            >
              <span className="flex items-center gap-2.5">
                <Play className="w-5 h-5 fill-white" />
                <span>Lancer la Partie BorderPath ({selectedPackMeta.name})</span>
              </span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <div className="flex justify-center pt-1">
              <button
                type="button"
                onClick={onOpenRules}
                className="py-2.5 px-4 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-transparent hover:border-slate-700 font-semibold text-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 text-indigo-400" />
                <span>Consulter les Règles du Jeu</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-8 px-6 text-center text-xs text-slate-500 mt-12">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} GeoHub — BorderPath.</p>
          <Link href="/" className="text-slate-400 hover:text-white underline">
            Retourner au hub principal
          </Link>
        </div>
      </footer>
    </div>
  );
}

function BorderPathGame() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const rawPack = searchParams.get("pack") as BorderPathPack | null;
  const rawMode = searchParams.get("mode") as BorderPathMode | null;
  const rawPlay = searchParams.get("play") === "1";

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
  const [showRestartModal, setShowRestartModal] = useState(false);

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
    router.push(`/play/borderpath?pack=${newPack}&mode=${newMode}&play=1`);
  };

  const visitedIds = [
    ...branchAEntities.map((e) => e.id),
    ...branchBEntities.map((e) => e.id),
  ];

  if (!rawPlay) {
    return (
      <>
        <BorderPathLobby
          initialPack={pack}
          initialMode={mode}
          onStartGame={(p, m, seed) => {
            let url = `/play/borderpath?pack=${p}&mode=${m}&play=1`;
            if (seed) url += `&seed=${seed}`;
            router.push(url);
          }}
          onOpenRules={() => setShowRulesModal(true)}
          onOpenSettings={() => setShowSettingsModal(true)}
        />

        {/* Rules Modal */}
        <BorderPathRulesModal
          isOpen={showRulesModal}
          onClose={() => setShowRulesModal(false)}
        />

        {/* Settings Modal */}
        <BorderPathSettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          theme={theme}
          onChangeTheme={setTheme}
          hideBorders={hideBorders}
          onToggleHideBorders={handleToggleHideBorders}
        />
      </>
    );
  }

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
          router.push(`/play/borderpath?pack=${pack}&mode=${newMode}&play=1`);
        }}
        onGiveUp={handleGiveUp}
        onRestart={() => setShowRestartModal(true)}
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

      {/* Restart Confirmation Modal */}
      <RestartConfirmModal
        isOpen={showRestartModal}
        onClose={() => setShowRestartModal(false)}
        onConfirm={handleReplaySameChallenge}
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
