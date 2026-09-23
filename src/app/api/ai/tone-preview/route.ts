import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../../lib/supabase/server';

const toneLabels = {
  1: 'friendly, warm, and conversational',
  2: 'balanced, professional, and direct',
  3: 'firm, concise, and respectfully assertive',
} as const;

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'AI preview is not configured yet.' }, { status: 503 });
  }

  let body: { workspaceId?: unknown; sampleEmails?: unknown; toneLevel?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const workspaceId = typeof body.workspaceId === 'string' ? body.workspaceId : '';
  const sampleEmails = typeof body.sampleEmails === 'string' ? body.sampleEmails.trim() : '';
  const toneLevel = body.toneLevel === 1 || body.toneLevel === 2 || body.toneLevel === 3 ? body.toneLevel : null;
  if (!workspaceId || !sampleEmails || !toneLevel || sampleEmails.length > 12000) {
    return NextResponse.json({ error: 'Provide a workspace, sample emails, and a valid tone level.' }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const { data: membership, error: membershipError } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (membershipError) return NextResponse.json({ error: membershipError.message }, { status: 500 });
  if (!membership) return NextResponse.json({ error: 'You do not have access to this workspace.' }, { status: 403 });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OPENAI_TONE_MODEL || 'gpt-4o-mini',
        temperature: 0.7,
        max_tokens: 500,
        messages: [
          {
            role: 'system',
            content: `You write overdue-invoice reminder emails. Match the sender's writing style from the examples, while using a ${toneLabels[toneLevel]} tone. Return only the email body. Use these fictional placeholders: [Client name], [Invoice number], [Amount], [Payment link]. Never invent personal data or claim that an email was sent.`,
          },
          { role: 'user', content: `Writing samples:\n\n${sampleEmails}\n\nWrite one reminder preview.` },
        ],
      }),
      signal: controller.signal,
    });
    if (!response.ok) {
      const detail = await response.text();
      console.error('OpenAI tone preview failed:', response.status, detail.slice(0, 500));
      return NextResponse.json({ error: 'The AI provider could not generate a preview.' }, { status: 502 });
    }
    const result = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const preview = result.choices?.[0]?.message?.content?.trim();
    if (!preview) return NextResponse.json({ error: 'The AI provider returned an empty preview.' }, { status: 502 });
    return NextResponse.json({ preview });
  } catch (error) {
    console.error('Tone preview request failed:', error);
    return NextResponse.json({ error: 'The AI preview request failed.' }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
