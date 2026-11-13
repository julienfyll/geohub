"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { useDailyChallenges } from "@/lib/stats/useDailyChallenges";

export const DailyChallengesSection: React.FC = () => {
  const { statusMap } = useDailyChallenges();

  const renderDailyStatus = (
    key: string,
    isGeoRings: boolean,
    linkUrl: string,
    buttonTheme: "blue" | "sky" | "emerald" | "indigo"
  ) => {
    const status = statusMap[key];
    const isCompleted = status?.completed;

    if (isCompleted) {
      return (
        <div className="flex items-center gap-2 shrink-0">
          <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-black font-mono">
            {isGeoRings
              ? `${status.ringsCompleted}/${status.totalRings || 5} ann.`
              : status.attempts
              ? `${status.attempts} coups`
              : `${status.score?.toLocaleString("fr-FR")} pts`}
          </span>
          <Link
            href={linkUrl}
            className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-bold text-xs transition-colors shadow-sm"
          >
            Rejouer
          </Link>
        </div>
      );
    }

    const buttonClasses =
      buttonTheme === "sky"
        ? "bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/25"
        : buttonTheme === "emerald"
        ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20"
        : buttonTheme === "indigo"
        ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/25"
        : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/25";

    return (
      <Link
        href={linkUrl}
        className={`px-3 py-1.5 rounded-xl font-bold text-xs shadow-md transition-all shrink-0 hover:scale-[1.02] flex items-center gap-1 ${buttonClasses}`}
      >
        <span>Jouer</span>
        <span>→</span>
      </Link>
    );
  };

  return (
    <section className="max-w-6xl mx-auto px-6 pt-10 pb-6 w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-0.5">
            <span>★ Rendez-vous Officiel Quotidien</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Les Défis du Jour
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Tirages officiels uniques avec difficulté progressive intégrée. Une seule tentative comptabilisée par jour pour le classement.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Reset quotidien à <strong>00:00 UTC</strong></span>
        </div>
      </div>

      {/* 3 GRANDS ENCADRÉS MAJEURS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ENCADRÉ 1 : GEORINGS (5 DÉFIS QUOTIDIENS) */}
        <div className="bg-slate-900/90 border-2 border-blue-500/40 rounded-3xl p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-36 h-36 bg-blue-500/10 blur-3xl rounded-full pointer-events-none" />

          <div className="space-y-3.5">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center font-bold text-lg shrink-0">
                🧭
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-white leading-tight truncate">GeoRings</h3>
                <span className="text-xs text-slate-400 block truncate">5 anneaux concentriques • 3 vies</span>
              </div>
            </div>

            {/* 5 Déclinaisons de GeoRings */}
            <div className="space-y-2.5">
              {/* 1. France Population */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border-2 border-blue-500/50 hover:border-blue-400 transition-all flex items-center justify-between gap-3 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl shrink-0">🇫🇷</span>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-white truncate">France — Population</h4>
                    <p className="text-[11px] text-slate-400 truncate">Centre du jour fixe • 5 anneaux concentriques</p>
                  </div>
                </div>
                {renderDailyStatus(
                  "georings_population_fr",
                  true,
                  "/play/georings?metric=population&scale=fr&mode=daily",
                  "blue"
                )}
              </div>

              {/* 2. Europe Population */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-blue-500/60 transition-all flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl shrink-0">🇪🇺</span>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-white truncate">Europe — Population</h4>
                    <p className="text-[11px] text-slate-400 truncate">5 anneaux à travers les capitales européennes</p>
                  </div>
                </div>
                {renderDailyStatus(
                  "georings_population_eu",
                  true,
                  "/play/georings?metric=population&scale=eu&mode=daily",
                  "blue"
                )}
              </div>

              {/* 3. Monde Population */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-blue-500/60 transition-all flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl shrink-0">🌍</span>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-white truncate">Monde — Population</h4>
                    <p className="text-[11px] text-slate-400 truncate">Échelle planétaire (Tokyo, NYC, São Paulo...)</p>
                  </div>
                </div>
                {renderDailyStatus(
                  "georings_population_world",
                  true,
                  "/play/georings?metric=population&scale=world&mode=daily",
                  "blue"
                )}
              </div>

              {/* 4. France Aéroports */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-sky-500/60 transition-all flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl shrink-0">✈️</span>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-white truncate">France — Aéroports</h4>
                    <p className="text-[11px] text-slate-400 truncate">Critère : Trafic passagers annuel (DGAC)</p>
                  </div>
                </div>
                {renderDailyStatus(
                  "georings_airports_fr",
                  true,
                  "/play/georings?metric=airports&scale=fr&mode=daily",
                  "sky"
                )}
              </div>

              {/* 5. Monde Aéroports */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-sky-500/60 transition-all flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl shrink-0">🛫</span>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-white truncate">Monde — Aéroports</h4>
                    <p className="text-[11px] text-slate-400 truncate">Grands hubs mondiaux (Atlanta, Dubaï, Heathrow...)</p>
                  </div>
                </div>
                {renderDailyStatus(
                  "georings_airports_world",
                  true,
                  "/play/georings?metric=airports&scale=world&mode=daily",
                  "sky"
                )}
              </div>
            </div>
          </div>

          <div className="pt-3 mt-3.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-500 text-[11px]">Entraînement libre</span>
            <Link href="/play/georings" className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 transition-colors">
              <span>Page Dédiée</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* ENCADRÉ 2 : BLIND POINT (5 DÉFIS QUOTIDIENS) */}
        <div className="bg-slate-900/90 border-2 border-emerald-500/40 rounded-3xl p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-36 h-36 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />

          <div className="space-y-3.5">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-lg shrink-0">
                🎯
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-white leading-tight truncate">Blind Point</h3>
                <span className="text-xs text-slate-400 block truncate">5 manches quotidiennes • Carte muette</span>
              </div>
            </div>

            {/* 5 Déclinaisons de Blind Point */}
            <div className="space-y-2.5">
              {/* 1. France */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border-2 border-emerald-500/50 hover:border-emerald-400 transition-all flex items-center justify-between gap-3 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl shrink-0">🇫🇷</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-white truncate">Villes de France</h4>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">• 139 villes</span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">Calibré : 2 faciles • 2 moyennes • 1 terroir</p>
                  </div>
                </div>
                {renderDailyStatus(
                  "blindpoint_villes_france",
                  false,
                  "/play/blindpoint?pack=villes_france&mode=daily&play=1",
                  "emerald"
                )}
              </div>

              {/* 2. Europe */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500/60 transition-all flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl shrink-0">🇪🇺</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-white truncate">Villes d'Europe</h4>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">• 42 métropoles</span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">Calibré : 2 faciles • 2 moyennes • 1 perle</p>
                  </div>
                </div>
                {renderDailyStatus(
                  "blindpoint_villes_europe",
                  false,
                  "/play/blindpoint?pack=villes_europe&mode=daily&play=1",
                  "emerald"
                )}
              </div>

              {/* 3. Monde */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500/60 transition-all flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl shrink-0">🌍</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-white truncate">Villes du Monde</h4>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">• 167 mégapoles</span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">Équilibrage continental progressif (5 continents)</p>
                  </div>
                </div>
                {renderDailyStatus(
                  "blindpoint_villes_monde",
                  false,
                  "/play/blindpoint?pack=villes_monde&mode=daily&play=1",
                  "emerald"
                )}
              </div>

              {/* 4. Paris */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500/60 transition-all flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl shrink-0">🗼</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-white truncate">Monuments de Paris</h4>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">• 105 trésors</span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">Micro-carte Paris Intra • Tolérance 1,5 km</p>
                  </div>
                </div>
                {renderDailyStatus(
                  "blindpoint_lieux_paris",
                  false,
                  "/play/blindpoint?pack=lieux_paris&mode=daily&play=1",
                  "emerald"
                )}
              </div>

              {/* 5. Merveilles du Monde */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500/60 transition-all flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl shrink-0">🏛️</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-white truncate">Merveilles du Monde</h4>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">• 50 sites</span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">Pétra, Taj Mahal, Colisée, Machu Picchu...</p>
                  </div>
                </div>
                {renderDailyStatus(
                  "blindpoint_lieux_monde",
                  false,
                  "/play/blindpoint?pack=lieux_monde&mode=daily&play=1",
                  "emerald"
                )}
              </div>
            </div>
          </div>

          <div className="pt-3 mt-3.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-500 text-[11px]">Entraînement libre</span>
            <Link href="/play/blindpoint" className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 transition-colors">
              <span>Page Dédiée</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* ENCADRÉ 3 : BORDERPATH (5 DÉFIS QUOTIDIENS) */}
        <div className="bg-slate-900/90 border-2 border-indigo-500/40 rounded-3xl p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-36 h-36 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />

          <div className="space-y-3.5">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center font-bold text-lg shrink-0">
                🗺️
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-white leading-tight truncate">BorderPath</h3>
                <span className="text-xs text-slate-400 block truncate">5 parcours quotidiens • Connexion contiguë</span>
              </div>
            </div>

            <div className="space-y-2.5">
              {/* 1. Monde */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/60 transition-all flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl shrink-0">🌍</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-white truncate">Monde Continental</h4>
                      <span className="text-[10px] text-indigo-400 font-mono shrink-0">• 167 pays</span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">Reliez deux pays à travers les frontières terrestres</p>
                  </div>
                </div>
                {renderDailyStatus(
                  "borderpath_monde",
                  false,
                  "/play/borderpath?pack=monde&mode=daily&play=1",
                  "indigo"
                )}
              </div>

              {/* 2. Europe */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/60 transition-all flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl shrink-0">🇪🇺</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-white truncate">Europe</h4>
                      <span className="text-[10px] text-indigo-400 font-mono shrink-0">• 46 pays</span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">Traversez le continent d'un bout à l'autre</p>
                  </div>
                </div>
                {renderDailyStatus(
                  "borderpath_europe",
                  false,
                  "/play/borderpath?pack=europe&mode=daily&play=1",
                  "indigo"
                )}
              </div>

              {/* 3. France 96 Dépts */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/60 transition-all flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl shrink-0">🇫🇷</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-white truncate">France — 96 Dépts</h4>
                      <span className="text-[10px] text-indigo-400 font-mono shrink-0">• 96 départements</span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">Corridor contigu de préfecture en préfecture</p>
                  </div>
                </div>
                {renderDailyStatus(
                  "borderpath_france_departements",
                  false,
                  "/play/borderpath?pack=france_departements&mode=daily&play=1",
                  "indigo"
                )}
              </div>

              {/* 4. Amériques */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/60 transition-all flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl shrink-0">🌎</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-white truncate">Amériques</h4>
                      <span className="text-[10px] text-indigo-400 font-mono shrink-0">• 35 pays</span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">Corridor panaméricain du Nord au Sud</p>
                  </div>
                </div>
                {renderDailyStatus(
                  "borderpath_ameriques",
                  false,
                  "/play/borderpath?pack=ameriques&mode=daily&play=1",
                  "indigo"
                )}
              </div>

              {/* 5. Afrique */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/60 transition-all flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl shrink-0">🌍</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-white truncate">Afrique</h4>
                      <span className="text-[10px] text-indigo-400 font-mono shrink-0">• 54 pays</span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">Traversez le Sahara, le Sahel et le Rift</p>
                  </div>
                </div>
                {renderDailyStatus(
                  "borderpath_afrique",
                  false,
                  "/play/borderpath?pack=afrique&mode=daily&play=1",
                  "indigo"
                )}
              </div>
            </div>
          </div>

          <div className="pt-3 mt-3.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-500 text-[11px]">Entraînement libre</span>
            <Link href="/play/borderpath" className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 transition-colors">
              <span>Page Dédiée</span>
              <span>→</span>
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
};
