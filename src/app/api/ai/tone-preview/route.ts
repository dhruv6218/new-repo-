import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../../lib/supabase/server';
import { rateLimit } from '../../../../lib/server/rate-limit';

const toneLabels = {
  1: 'friendly, warm, and conversational',
  2: 'balanced, professional, and direct',
  3: 'firm, concise, and respectfully assertive',
} as const;

export async function POST(request: Request) {
  if (!rateLimit(request, 'ai-tone-preview', 20, 60_000)) {
    return NextResponse.json({ error: 'Too many requests. Try again shortly.' }, { status: 429 });
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

  const prompt = `Writing samples:\n\n${sampleEmails}\n\nWrite one reminder preview.`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || 'gemini-2.0-flash'}:generateContent?key=${encodeURIComponent(geminiKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 500 } }),
        signal: controller.signal,
      });
      if (response.ok) {
        const result = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
        const preview = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (preview) return NextResponse.json({ preview, provider: 'gemini' });
      } else console.error('Gemini tone preview failed:', response.status);
    }

    const nvidiaKey = process.env.NVIDIA_API_KEY;
    if (nvidiaKey) {
      const response = await fetch(process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${nvidiaKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: process.env.NVIDIA_MODEL || 'meta/llama-3.1-8b-instruct',
          temperature: 0.7,
          max_tokens: 500,
          messages: [{ role: 'system', content: `You write overdue-invoice reminder emails. Match the sender's writing style from the examples, while using a ${toneLabels[toneLevel]} tone. Return only the email body.` }, { role: 'user', content: prompt }],
        }),
        signal: controller.signal,
      });
      if (response.ok) {
        const result = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
        const preview = result.choices?.[0]?.message?.content?.trim();
        if (preview) return NextResponse.json({ preview, provider: 'nvidia' });
      } else console.error('NVIDIA tone preview failed:', response.status);
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'No AI provider is configured. Add Gemini or NVIDIA credentials in the server secret manager.' }, { status: 503 });
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
          { role: 'user', content: prompt },
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
    return NextResponse.json({ preview, provider: 'openai' });
  } catch (error) {
    console.error('Tone preview request failed:', error);
    return NextResponse.json({ error: 'The AI preview request failed.' }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
