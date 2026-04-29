import { Metadata } from 'next';
import { Trophy, Medal, Crown } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Leaderboard - Arena Protocol',
};

async function fetchLeaderboard() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/leaderboard?limit=100`, {
      cache: 'revalidate',
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error('Failed to fetch leaderboard');
    return res.json();
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return { data: [] };
  }
}

export default async function Leaderboard() {
  const leaderboardRes = await fetchLeaderboard();
  const players = leaderboardRes.data || [];

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-orange-600" />;
    return <Trophy className="w-5 h-5 text-muted-foreground" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-card">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-12">
          <div className="p-3 bg-accent/10 clip-edges border border-accent/30">
            <Trophy className="w-8 h-8 text-accent" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-accent">Global Rankings</h1>
            <p className="text-muted-foreground font-mono text-sm">Top commanders in the Arena Protocol</p>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-card border border-border clip-edges overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-card/50 border-b border-border">
                  <th className="text-left py-4 px-6 text-muted-foreground font-mono text-sm">Rank</th>
                  <th className="text-left py-4 px-6 text-muted-foreground font-mono text-sm">Player</th>
                  <th className="text-left py-4 px-6 text-muted-foreground font-mono text-sm">Wins</th>
                  <th className="text-left py-4 px-6 text-muted-foreground font-mono text-sm">Battles</th>
                  <th className="text-left py-4 px-6 text-muted-foreground font-mono text-sm">Win Rate</th>
                  <th className="text-left py-4 px-6 text-muted-foreground font-mono text-sm">Rewards</th>
                  <th className="text-left py-4 px-6 text-muted-foreground font-mono text-sm">Region</th>
                </tr>
              </thead>
              <tbody>
                {players && players.length > 0 ? (
                  players.map((player, idx) => {
                    const rank = idx + 1;
                    const winRate = player.total_battles > 0
                      ? ((player.total_wins / player.total_battles) * 100).toFixed(1)
                      : 0;

                    return (
                      <tr
                        key={player.id}
                        className="border-b border-border/50 hover:bg-background/50 transition"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            {getRankIcon(rank)}
                            <span className="font-bold text-lg">#{rank}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <p className="font-mono text-sm">{player.address.slice(0, 10)}...</p>
                          {player.username && <p className="text-xs text-muted-foreground">{player.username}</p>}
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-bold text-primary">{player.total_wins}</span>
                        </td>
                        <td className="py-4 px-6 text-muted-foreground">{player.total_battles}</td>
                        <td className="py-4 px-6">
                          <span className="bg-accent/10 text-accent px-3 py-1 rounded text-sm font-mono">
                            {winRate}%
                          </span>
                        </td>
                        <td className="py-4 px-6 text-secondary font-bold">{String(player.total_rewards)} ARENA</td>
                        <td className="py-4 px-6 text-muted-foreground text-sm">
                          {player.region === 'UNKNOWN' ? '-' : player.region}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      No players yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
