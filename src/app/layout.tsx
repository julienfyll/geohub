import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GeoHub — L'Arcade de Jeux de Géographie",
  description:
    "Plateforme de mini-jeux géographiques : défiez vos amis sur GeoRings, trouvez les villes les plus peuplées et testez votre sens de l'orientation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
