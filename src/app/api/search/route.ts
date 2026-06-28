import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': process.env.SERPER_API_KEY as string,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: query, num: 15 }), // Fetching top 5 results for brevity
    });

    const data = await response.json();
    return NextResponse.json({ results: data.organic || [] });
  } catch (error) {
    console.error('Search API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch search results' }, { status: 500 });
  }
}