import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error: 'Dodo webhook ingestion is disabled until the provider signature format is configured.',
      setup: 'Add the documented Dodo verification implementation before enabling this route.',
    },
    { status: 503 },
  );
}
