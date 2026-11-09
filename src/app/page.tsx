import Link from "next/link";
import {
  Compass,
  Trophy,
  Play,
  Sparkles,
  MapPin,
  Zap,
  Layers,
  Flame,
} from "lucide-react";

export default function Home() {
  const todayDate = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Platform Navigation */}
      <nav className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400">
              <Compass className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white block leading-none">
                GeoHub
              </span>
              <span className="text-[11px] font-medium text-slate-400 tracking-wider uppercase">
                Arcade Géographique
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-amber-400">
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Série : 1 jour</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Banner */}
      <section className="relative overflow-hidden py-16 px-6 border-b border-slate-800/50">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Défi du jour disponible — {todayDate}</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-5 leading-tight">
            L'Arcade Ultime pour les <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400">
              Passionnés de Géographie
            </span>
          </h1>

          <p className="text-slate-400 text-base sm:text-lg max-w-2xl leading-relaxed">
            Défiez votre intuition territoriale, trouvez les métropoles cachées dans des cercles concentriques, et comparez vos scores avec vos amis en un clic.
          </p>
        </div>
      </section>

      {/* Game Catalog Grid */}
      <section className="max-w-6xl mx-auto px-6 py-14 flex-1">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Catalogue des Mini-Jeux
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Des défis spatiaux variés, conçus pour tester chaque facette de vos connaissances.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Game 1 : GeoRings (Active) */}
          <div className="relative group bg-slate-900/90 border-2 border-blue-500/50 hover:border-blue-500 rounded-3xl p-6 shadow-2xl transition-all flex flex-col justify-between overflow-hidden">
            <div className="absolute top-0 right-0 p-6 pointer-events-none opacity-10 group-hover:opacity-20 transition-opacity">
              <Compass className="w-32 h-32 text-blue-400" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/40 text-xs font-bold uppercase tracking-wider">
                  ★ Jeu Phare (Jouable)
                </span>
                <span className="text-xs text-slate-400 font-mono">5 Anneaux • 3 Vies</span>
              </div>

              <h3 className="text-2xl font-bold text-white mb-2">
                GeoRings — Cercles de Population
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                À partir d'une ville centre, 5 anneaux concentriques s'étendent. Trouvez la commune ou métropole la plus peuplée de chaque anneau avant d'épuiser vos 3 essais !
              </p>

              {/* Scales selection */}
              <div className="flex flex-col gap-2.5 mb-6">
                <span className="text-xs text-slate-400 font-medium">Échelle de jeu (Défi du Jour) :</span>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/play/georings?scale=fr&mode=daily"
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
                  >
                    🇫🇷 France
                  </Link>
                  <Link
                    href="/play/georings?scale=eu&mode=daily"
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
                  >
                    🇪🇺 Europe
                  </Link>
                  <Link
                    href="/play/georings?scale=world&mode=daily"
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
                  >
                    🌍 Monde
                  </Link>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/play/georings?scale=fr&mode=daily"
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm transition-all shadow-lg shadow-blue-600/20"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Défi du Jour</span>
              </Link>
              <Link
                href="/play/georings?scale=fr&mode=free"
                className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm border border-slate-700 transition-all"
              >
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Partie Rapide</span>
              </Link>
            </div>
          </div>

          {/* Game 2 : Blind Point (Coming Soon) */}
          <div className="relative bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between opacity-80 hover:opacity-100 transition-opacity">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-xs font-medium uppercase tracking-wider">
                  Sprint 2 • Bientôt
                </span>
                <MapPin className="w-5 h-5 text-slate-500" />
              </div>

              <h3 className="text-xl font-bold text-slate-200 mb-2">
                Blind Point — Précision Aveugle
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Une cible géographique vous est imposée sur une carte muette sans aucune frontière ni texte. Pointez au plus près pour marquer un maximum de points.
              </p>
            </div>

            <button
              disabled
              className="w-full py-3 px-4 rounded-xl bg-slate-800/60 text-slate-500 font-semibold text-xs border border-slate-700/50 cursor-not-allowed"
            >
              En cours de développement
            </button>
          </div>

          {/* Game 3 : BorderPath (Coming Soon) */}
          <div className="relative bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between opacity-80 hover:opacity-100 transition-opacity">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-xs font-medium uppercase tracking-wider">
                  Sprint 2 • Bientôt
                </span>
                <Layers className="w-5 h-5 text-slate-500" />
              </div>

              <h3 className="text-xl font-bold text-slate-200 mb-2">
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
          <div className="relative bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between opacity-80 hover:opacity-100 transition-opacity">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-xs font-medium uppercase tracking-wider">
                  Sprint 3 • Bientôt
                </span>
                <Zap className="w-5 h-5 text-slate-500" />
              </div>

              <h3 className="text-xl font-bold text-slate-200 mb-2">
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
          <p>© {new Date().getFullYear()} GeoHub — Plateforme conçue avec Next.js & MapLibre GL.</p>
          <p>Données géographiques ouvertes : INSEE & GeoNames.</p>
        </div>
      </footer>
    </div>
  );
}
