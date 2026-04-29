import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const supabase = getServerSupabase();
  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '100');
  const season = searchParams.get('season');
  const region = searchParams.get('region');

  try {
    let query = supabase
      .from('players')
      .select('*')
      .order('total_wins', { ascending: false });

    if (region && region !== 'all') {
      query = query.eq('region', region);
    }

    const { data, error, count } = await query.limit(limit);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Add ranking
    const rankedData = (data || []).map((player, idx) => ({
      ...player,
      rank: idx + 1,
      winRate: player.total_battles > 0 
        ? ((player.total_wins / player.total_battles) * 100).toFixed(1)
        : '0',
    }));

    return NextResponse.json({ data: rankedData, count, limit });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
