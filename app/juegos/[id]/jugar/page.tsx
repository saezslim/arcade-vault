import { notFound } from "next/navigation";
import { GamePlayer } from "@/app/components/game-player";
import { getGameById, getGames } from "@/app/data/games";

export async function generateStaticParams() {
  const games = await getGames();
  return games.map((g) => ({ id: g.id }));
}

export default async function PlayPage({ params }: PageProps<"/juegos/[id]/jugar">) {
  const { id } = await params;
  const game = await getGameById(id);
  if (!game) notFound();

  return <GamePlayer gameId={game.id} title={game.title} />;
}
