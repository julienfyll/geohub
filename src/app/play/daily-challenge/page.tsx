import { Metadata } from "next";
import { DailyChallengeHubView } from "@/components/daily/DailyChallengeHubView";

export const metadata: Metadata = {
  title: "Défis du Jour Officiels | GeoHub",
  description: "Relevez chaque jour les 10 tirages officiels identiques pour tous les joueurs sur GeoRings et Blind Point.",
};

export default function DailyChallengePage() {
  return <DailyChallengeHubView />;
}
