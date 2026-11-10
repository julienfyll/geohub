import Link from "next/link";
import {
  Compass,
  MapPin,
  Play,
  Sparkles,
  Layers,
  Zap,
  ArrowRight,
  Plane,
  Users,
} from "lucide-react";
import { UserNav } from "@/components/navigation/UserNav";
import { QuickMenuDrawer } from "@/components/navigation/QuickMenuDrawer";
import { LeaderboardTriggerButton } from "@/components/leaderboard/LeaderboardTriggerButton";

export default function Home() {
  const todayDate = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Platform Navigation */}
      <nav className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <QuickMenuDrawer />
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400">
                <Compass className="w-5 h-5 animate-spin-slow" />
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-white block leading-none">
                  GeoHub
                </span>
                <span className="text-[10px] font-medium text-slate-400 tracking-wider uppercase">
                  Arcade Géographique
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LeaderboardTriggerButton
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-semibold transition-all cursor-pointer shadow-sm"
              label="Classement"
            />
            <UserNav />
          </div>
        </div>
      </nav>

      {/* Hero Banner */}
      <section className="relative overflow-hidden py-12 px-6 border-b border-slate-800/50">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10 flex flex-col items-center">
          <div className="flex flex-wrap items-center justify-center gap-2.5 mb-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Défis du jour disponibles — {todayDate}</span>
            </div>
            <LeaderboardTriggerButton />
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight">
            L'Arcade Ultime pour les <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400">
              Passionnés de Géographie
            </span>
          </h1>

          <p className="text-slate-400 text-sm sm:text-base max-w-2xl leading-relaxed">
            Relevez vos défis du jour officiels (tirages équitables identiques pour tous) ou perfectionnez votre intuition territoriale en partie rapide.
          </p>
        </div>
      </section>

      {/* Section 1 : Les Défis du Jour Officiels (2 Grands Encadrés) */}
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

        {/* 2 GRANDS ENCADRÉS MAJEURS CÔTE À CÔTE */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ENCADRÉ 1 : GEORINGS (5 DÉFIS QUOTIDIENS) */}
          <div className="bg-slate-900/90 border-2 border-blue-500/40 rounded-3xl p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -right-16 -top-16 w-36 h-36 bg-blue-500/10 blur-3xl rounded-full pointer-events-none" />

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center font-bold text-lg">
                    🧭
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white leading-tight">GeoRings — Cercles Concentriques</h3>
                    <span className="text-xs text-slate-400">5 anneaux quotidiens • 3 vies</span>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-blue-400 bg-blue-950/80 border border-blue-500/40 px-2.5 py-1 rounded-lg font-bold">
                  5 déclinaisons
                </span>
              </div>

              {/* 5 Déclinaisons de GeoRings */}
              <div className="space-y-2.5">
                {/* 1. France Villes */}
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border-2 border-blue-500/50 hover:border-blue-400 transition-all flex items-center justify-between gap-3 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl shrink-0">👥</span>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white truncate">France — Villes (Population)</h4>
                        <span className="text-[10px] text-slate-400 font-mono">• 1 904 villes</span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">Centre du jour fixe • 5 anneaux concentriques</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-[10px] font-black uppercase tracking-wider shadow-md shadow-blue-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      <span>À relever</span>
                    </span>
                    <Link
                      href="/play/georings?metric=population&scale=fr&mode=daily"
                      className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-md shadow-blue-600/30 transition-all"
                    >
                      Jouer →
                    </Link>
                  </div>
                </div>

                {/* 2. Europe Villes */}
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-blue-500/40 transition-all flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl shrink-0">🇪🇺</span>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white truncate">Europe — Villes (Population)</h4>
                        <span className="text-[10px] text-slate-400 font-mono">• 12 669 villes</span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">Centre continental européen fixe pour tous</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-[10px] font-black uppercase tracking-wider shadow-md shadow-blue-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      <span>À relever</span>
                    </span>
                    <Link
                      href="/play/georings?metric=population&scale=eu&mode=daily"
                      className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-md shadow-blue-600/30 transition-all"
                    >
                      Jouer →
                    </Link>
                  </div>
                </div>

                {/* 3. Monde Villes */}
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-blue-500/40 transition-all flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl shrink-0">🌍</span>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white truncate">Monde — Villes (Population)</h4>
                        <span className="text-[10px] text-slate-400 font-mono">• 21 324 villes</span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">Centre planétaire fixe à échelle globale</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-[10px] font-black uppercase tracking-wider shadow-md shadow-blue-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      <span>À relever</span>
                    </span>
                    <Link
                      href="/play/georings?metric=population&scale=world&mode=daily"
                      className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-md shadow-blue-600/30 transition-all"
                    >
                      Jouer →
                    </Link>
                  </div>
                </div>

                {/* 4. France Aéroports */}
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-sky-500/40 transition-all flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl shrink-0">✈️</span>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white truncate">France — Aéroports (Trafic)</h4>
                        <span className="text-[10px] text-slate-400 font-mono">• 55 aéroports</span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">Hubs & aéroports commerciaux métropolitains</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 text-white text-[10px] font-black uppercase tracking-wider shadow-md shadow-sky-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      <span>À relever</span>
                    </span>
                    <Link
                      href="/play/georings?metric=airports&scale=fr&mode=daily"
                      className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-md shadow-sky-600/30 transition-all"
                    >
                      Jouer →
                    </Link>
                  </div>
                </div>

                {/* 5. Monde Aéroports */}
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-sky-500/40 transition-all flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl shrink-0">🛫</span>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white truncate">Monde — Aéroports Internationaux</h4>
                        <span className="text-[10px] text-slate-400 font-mono">• 3 282 hubs</span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">Grands hubs mondiaux (Atlanta, Dubaï, Heathrow...)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 text-white text-[10px] font-black uppercase tracking-wider shadow-md shadow-sky-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      <span>À relever</span>
                    </span>
                    <Link
                      href="/play/georings?metric=airports&scale=world&mode=daily"
                      className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-md shadow-sky-600/30 transition-all"
                    >
                      Jouer →
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Modifier le centre ou les anneaux ?</span>
              <Link href="/play/georings" className="text-blue-400 hover:underline font-bold flex items-center gap-1">
                <span>Page Dédiée GeoRings</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          {/* ENCADRÉ 2 : BLIND POINT (5 DÉFIS QUOTIDIENS) */}
          <div className="bg-slate-900/90 border-2 border-emerald-500/40 rounded-3xl p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -right-16 -top-16 w-36 h-36 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-lg">
                    🎯
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white leading-tight">Blind Point — Précision Aveugle</h3>
                    <span className="text-xs text-slate-400">5 manches quotidiennes • Carte muette</span>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-1 rounded-lg font-bold">
                  5 déclinaisons
                </span>
              </div>

              {/* 5 Déclinaisons de Blind Point */}
              <div className="space-y-2.5">
                {/* 1. France */}
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border-2 border-emerald-500/50 hover:border-emerald-400 transition-all flex items-center justify-between gap-3 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl shrink-0">🇫🇷</span>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white truncate">Villes de France</h4>
                        <span className="text-[10px] text-slate-400 font-mono">• 139 villes</span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">Calibré : 2 faciles • 2 moyennes • 1 terroir</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-md shadow-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      <span>À relever</span>
                    </span>
                    <Link
                      href="/play/blindpoint?pack=villes_france&mode=daily&play=1"
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 transition-all"
                    >
                      Jouer →
                    </Link>
                  </div>
                </div>

                {/* 2. Europe */}
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500/40 transition-all flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl shrink-0">🇪🇺</span>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white truncate">Villes d'Europe</h4>
                        <span className="text-[10px] text-slate-400 font-mono">• 42 métropoles</span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">Capitales majeures & métropoles continentales</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-md shadow-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      <span>À relever</span>
                    </span>
                    <Link
                      href="/play/blindpoint?pack=villes_europe&mode=daily&play=1"
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 transition-all"
                    >
                      Jouer →
                    </Link>
                  </div>
                </div>

                {/* 3. Monde */}
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500/40 transition-all flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl shrink-0">🌍</span>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white truncate">Villes du Monde</h4>
                        <span className="text-[10px] text-slate-400 font-mono">• 167 mégapoles</span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">Équilibrage continental progressif (5 continents)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-md shadow-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      <span>À relever</span>
                    </span>
                    <Link
                      href="/play/blindpoint?pack=villes_monde&mode=daily&play=1"
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 transition-all"
                    >
                      Jouer →
                    </Link>
                  </div>
                </div>

                {/* 4. Paris */}
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500/40 transition-all flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl shrink-0">🗼</span>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white truncate">Monuments de Paris</h4>
                        <span className="text-[10px] text-slate-400 font-mono">• 105 trésors</span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">Intra-muros : précision à la rue près</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-md shadow-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      <span>À relever</span>
                    </span>
                    <Link
                      href="/play/blindpoint?pack=lieux_paris&mode=daily&play=1"
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 transition-all"
                    >
                      Jouer →
                    </Link>
                  </div>
                </div>

                {/* 5. Merveilles */}
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500/40 transition-all flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl shrink-0">🏛️</span>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white truncate">Merveilles du Monde (UNESCO)</h4>
                        <span className="text-[10px] text-slate-400 font-mono">• 50 sites</span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">Pétra, Taj Mahal, Colisée, Machu Picchu...</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-md shadow-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      <span>À relever</span>
                    </span>
                    <Link
                      href="/play/blindpoint?pack=lieux_monde&mode=daily&play=1"
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 transition-all"
                    >
                      Jouer →
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Entraînement libre ou custom ?</span>
              <Link href="/play/blindpoint" className="text-emerald-400 hover:underline font-bold flex items-center gap-1">
                <span>Page Dédiée Blind Point</span>
                <span>→</span>
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* Section 2 : Catalogue des Mini-Jeux (Présentation Claire & Accès Dédié) */}
      <section className="max-w-6xl mx-auto px-6 py-12 flex-1 w-full space-y-6 border-t border-slate-800/80">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-white">
              Catalogue des Mini-Jeux
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Des défis spatiaux variés, conçus pour tester chaque facette de vos connaissances géographiques.
            </p>
          </div>
          <span className="text-xs text-slate-500">Cliquez pour configurer vos parties libres & personnalisées</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Game 1 : GeoRings */}
          <Link
            href="/play/georings"
            className="relative group bg-slate-900/90 border-2 border-blue-500/50 hover:border-blue-400 rounded-3xl p-7 shadow-2xl transition-all flex flex-col justify-between overflow-hidden cursor-pointer hover:shadow-blue-500/10 hover:scale-[1.01]"
          >
            <div className="absolute top-0 right-0 p-6 pointer-events-none opacity-10 group-hover:opacity-20 transition-opacity">
              <Compass className="w-32 h-32 text-blue-400" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" />
                  <span>★ Jeu Phare • 2 Critères</span>
                </span>
                <span className="text-xs text-slate-400 font-mono">5 Anneaux • 3 Vies</span>
              </div>

              <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
                GeoRings — Cercles Concentriques
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                À partir d'un centre géographique, 5 anneaux concentriques s'étendent. Débusquez la cible maximale à chaque niveau en fonction du critère choisi (population des métropoles ou trafic aéroportuaire).
              </p>

              <div className="grid grid-cols-2 gap-2.5 mb-6">
                <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                    <Users className="w-3.5 h-3.5 text-blue-400" />
                    <span>👥 Critère Villes</span>
                  </div>
                  <span className="text-[11px] text-slate-400 leading-tight">
                    1 904 France • 21 324 Monde
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                    <Plane className="w-3.5 h-3.5 text-sky-400" />
                    <span>✈️ Critère Aéroports</span>
                  </div>
                  <span className="text-[11px] text-slate-400 leading-tight">
                    55 France • 3 282 Monde
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between py-3.5 px-5 rounded-2xl bg-blue-600 group-hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-600/25">
              <span>Configurer & Jouer à GeoRings</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Game 2 : Blind Point */}
          <Link
            href="/play/blindpoint"
            className="relative group bg-slate-900/90 border-2 border-emerald-500/50 hover:border-emerald-400 rounded-3xl p-7 shadow-2xl transition-all flex flex-col justify-between overflow-hidden cursor-pointer hover:shadow-emerald-500/10 hover:scale-[1.01]"
          >
            <div className="absolute top-0 right-0 p-6 pointer-events-none opacity-10 group-hover:opacity-20 transition-opacity">
              <MapPin className="w-32 h-32 text-emerald-400" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold uppercase tracking-wider">
                  ★ Précision & Distance
                </span>
                <span className="text-xs text-slate-400 font-mono">5 Manches • 25 000 pts</span>
              </div>

              <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">
                Blind Point — Précision Aveugle
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Une cible géographique vous est imposée sur une carte muette. Visez au plus près pour maximiser votre score exponentiel et décrochez le <i>Bullseye</i> parfait !
              </p>

              <div className="grid grid-cols-2 gap-2.5 mb-6">
                <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col gap-1">
                  <span className="text-xs font-bold text-slate-200">🏙️ Villes & Agglomérations</span>
                  <span className="text-[11px] text-slate-400 leading-tight">
                    139 FR • 42 Europe • 167 Monde
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col gap-1">
                  <span className="text-xs font-bold text-slate-200">🏛️ Trésors & Monuments</span>
                  <span className="text-[11px] text-slate-400 leading-tight">
                    105 Paris • 58 Châteaux • 50 UNESCO
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between py-3.5 px-5 rounded-2xl bg-emerald-600 group-hover:bg-emerald-500 text-white font-semibold text-sm transition-all shadow-lg shadow-emerald-600/25">
              <span>Configurer & Jouer à Blind Point</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Game 3 : BorderPath (Coming Soon) */}
          <div className="relative bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between opacity-75">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-xs font-medium uppercase tracking-wider">
                  Sprint 2 • Bientôt
                </span>
                <Layers className="w-5 h-5 text-slate-500" />
              </div>

              <h3 className="text-xl font-bold text-slate-300 mb-2">
                BorderPath — Le Maillon Frontalier
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Reliez deux pays éloignés (ex: Portugal à la Chine) en nommant la séquence minimale de pays contigus ayant des frontières terrestres communes.
              </p>
            </div>

            <button
              disabled
              className="w-full py-3 px-4 rounded-xl bg-slate-800/60 text-slate-500 font-semibold text-xs border border-slate-700/50 cursor-not-allowed"
            >
              En cours de développement
            </button>
          </div>

          {/* Game 4 : Capital Blitz (Coming Soon) */}
          <div className="relative bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between opacity-75">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-xs font-medium uppercase tracking-wider">
                  Sprint 3 • Bientôt
                </span>
                <Zap className="w-5 h-5 text-slate-500" />
              </div>

              <h3 className="text-xl font-bold text-slate-300 mb-2">
                Capital Blitz — Contre-la-montre
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                60 secondes pour identifier un maximum de capitales, drapeaux et silhouettes nationales. Combo multiplicateur pour les séries sans faute.
              </p>
            </div>

            <button
              disabled
              className="w-full py-3 px-4 rounded-xl bg-slate-800/60 text-slate-500 font-semibold text-xs border border-slate-700/50 cursor-not-allowed"
            >
              En cours de développement
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-8 px-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} GeoHub — Plateforme d'Arcade Géographique.</p>
          <p>Données géographiques ouvertes : INSEE, GeoNames & OurAirports.</p>
        </div>
      </footer>
    </div>
  );
}
