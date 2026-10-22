"use client";

import { useAuth } from "./auth-provider";

export function YourBest({
  gameTitle,
  gameId,
  referenceScore,
  delay,
}: {
  gameTitle: string;
  gameId: string;
  referenceScore: number;
  delay: number;
}) {
  const { user } = useAuth();
  if (!user) return null;

  const rank = 8 + (gameId.length % 4);
  const score = referenceScore - 2400;

  return (
    <>
      <div className="tr you-label">▸ TU MEJOR MARCA EN {gameTitle}</div>
      <div className="tr you" style={{ animationDelay: `${delay}ms` }}>
        <div className="rk" style={{ color: "var(--yellow)" }}>
          #{String(rank).padStart(2, "0")}
        </div>
        <div className="pl" style={{ color: "var(--yellow)" }}>
          {user.name}
        </div>
        <div
          className="sc"
          style={{ color: "var(--yellow)", textShadow: "0 0 6px rgba(245,255,0,0.5)" }}
        >
          {(score || 9999).toLocaleString("es-ES")}
        </div>
        <div className="dt">11/05/2026</div>
      </div>
    </>
  );
}
