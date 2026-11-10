"use client";

import React, { useState, useRef, useEffect } from "react";
import { Flame, User, LogOut, ChevronDown, UserCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { ProfileModal } from "@/components/profile/ProfileModal";

interface UserNavProps {
  compact?: boolean;
}

export const UserNav: React.FC<UserNavProps> = ({ compact = false }) => {
  const { user, profile, streak, loading, signInWithGoogle, signOut } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayName = profile?.username || user?.user_metadata?.name || "Joueur";
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  return (
    <>
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Streak Badge */}
        <button
          onClick={() => setShowProfileModal(true)}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-xs font-semibold text-amber-400 transition-colors shadow-sm cursor-pointer ${
            compact ? "hidden lg:flex" : ""
          }`}
          title="Voir vos statistiques et séries"
        >
          <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span>Série : {streak.current_streak || 0} {streak.current_streak > 1 ? "jours" : "jour"}</span>
        </button>

        {/* User Account / Auth Section */}
        {loading ? (
          <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
            <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />
          </div>
        ) : user ? (
          /* Logged In User Dropdown */
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown((prev) => !prev)}
              className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 transition-all text-xs font-medium text-slate-200"
              title="Mon profil & statistiques"
            >
              <div className="w-6 h-6 rounded-full overflow-hidden bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white border border-blue-400/40">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  displayName.charAt(0).toUpperCase()
                )}
              </div>
              <span className={`max-w-[100px] truncate font-semibold text-white ${compact ? "hidden sm:inline" : ""}`}>
                {displayName}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-52 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-1.5 z-50 animate-fade-in text-xs font-medium">
                <div className="px-3 py-2 border-b border-slate-800 mb-1">
                  <p className="font-bold text-white truncate">{displayName}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                </div>

                <button
                  onClick={() => {
                    setShowDropdown(false);
                    setShowProfileModal(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors text-left"
                >
                  <UserCircle className="w-4 h-4 text-blue-400" />
                  Mon profil & stats
                </button>

                <div className="my-1 border-t border-slate-800" />

                <button
                  onClick={() => {
                    setShowDropdown(false);
                    signOut();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Se déconnecter
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Guest: Sign in with Google Button */
          <button
            onClick={() => signInWithGoogle()}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all cursor-pointer shrink-0"
            title="Connexion Google en 1 clic pour sauvegarder vos scores"
          >
            {/* Google Icon SVG */}
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className={compact ? "hidden sm:inline" : ""}>Connexion</span>
          </button>
        )}
      </div>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </>
  );
};
