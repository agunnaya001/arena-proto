import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const supabase = getServerSupabase();
  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');
  const rarity = searchParams.get('rarity');
  const sort = searchParams.get('sort') || 'listed_at';

  try {
    let query = supabase
      .from('marketplace_listings')
      .select('*')
      .eq('active', true);

    if (rarity && rarity !== 'all') {
      query = query.eq('rarity', rarity);
    }

    // Determine sort order
    const sortAscending = sort === 'price_asc';
    const sortField = sort === 'price_asc' || sort === 'price_desc' ? 'price' : 'listed_at';

    const { data, error, count } = await query
      .order(sortField, { ascending: sortAscending })
      .range(offset, offset + limit - 1);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ data, count, limit, offset });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
