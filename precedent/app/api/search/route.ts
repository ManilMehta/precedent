import { NextRequest, NextResponse } from 'next/server';
import { searchCases } from '@/lib/graphrag';

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }
    
    const results = await searchCases(query);
    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}