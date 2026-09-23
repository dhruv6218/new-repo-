import "jsr:@supabase/functions-js/edge-runtime.d.ts";

type Invoice = {
  id: string;
  workspace_id: string;
  invoice_number: string;
  client_name: string;
  client_email: string;
  currency: string;
  total_minor: number;
  reminder_count: number;
  due_at: string | null;
  last_chased_at: string | null;
};

type ToneSettings = { tone: string; settings: Record<string, unknown> };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

const requiredEnv = (name: string) => {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

const postgrest = async (
  path: string,
  init: RequestInit = {},
): Promise<Response> => {
  const url = `${requiredEnv("SUPABASE_URL")}/rest/v1/${path}`;
  return fetch(url, {
    ...init,
    headers: {
      apikey: requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
      authorization: `Bearer ${requiredEnv("SUPABASE_SERVICE_ROLE_KEY")}`,
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  });
};

const intervalDays = () => {
  const configured = Number(Deno.env.get("REMINDER_INTERVAL_DAYS") ?? "3");
  return Number.isFinite(configured)
    ? Math.min(5, Math.max(3, Math.floor(configured)))
    : 3;
};

const reminderKind = (dueAt: string, now: Date) =>
  new Date(dueAt).toDateString() === now.toDateString() ? "due" : "overdue";

const subjectFor = (invoice: Invoice) =>
  `Payment reminder for invoice ${invoice.invoice_number}`;

const fallbackBody = (invoice: Invoice, tone: string) =>
  `Hi ${invoice.client_name},\n\nThis is a ${tone} reminder that invoice ${invoice.invoice_number} is still outstanding. Please let us know if you need anything from us to complete payment.\n\nThank you.`;

async function generateBody(invoice: Invoice, tone: ToneSettings | null) {
  const prompt = `Write a concise ${tone?.tone ?? "professional"} payment reminder for ${invoice.client_name} about invoice ${invoice.invoice_number}. Do not invent dates, amounts, links, or threats. Return only the email body.`;
  const geminiKey = Deno.env.get("GEMINI_API_KEY");
  if (geminiKey) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${Deno.env.get("GEMINI_MODEL") ?? "gemini-2.0-flash"}:generateContent?key=${encodeURIComponent(geminiKey)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2, maxOutputTokens: 300 } }),
    });
    if (response.ok) {
      const data = await response.json();
      const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (typeof content === "string" && content.trim()) return content.trim();
    } else console.error("Gemini request failed with", response.status);
  }
  const nvidiaKey = Deno.env.get("NVIDIA_API_KEY");
  if (nvidiaKey) {
    const response = await fetch(Deno.env.get("NVIDIA_BASE_URL") ?? "https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: { authorization: `Bearer ${nvidiaKey}`, "content-type": "application/json" },
      body: JSON.stringify({ model: Deno.env.get("NVIDIA_MODEL") ?? "meta/llama-3.1-8b-instruct", temperature: 0.2, max_tokens: 300, messages: [{ role: "user", content: prompt }] }),
    });
    if (response.ok) {
      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (typeof content === "string" && content.trim()) return content.trim();
    } else console.error("NVIDIA request failed with", response.status);
  }
  const openAiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openAiKey) return fallbackBody(invoice, tone?.tone ?? "professional");
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { authorization: `Bearer ${openAiKey}`, "content-type": "application/json" },
    body: JSON.stringify({ model: Deno.env.get("OPENAI_MODEL") ?? "gpt-4o-mini", temperature: 0.2, messages: [{ role: "user", content: prompt }] }),
  });
  if (!response.ok) throw new Error(`OpenAI request failed with ${response.status}`);
  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) throw new Error("OpenAI returned an empty reminder");
  return content.trim();
}

async function sendEmail(invoice: Invoice, subject: string, body: string) {
  const from = Deno.env.get("REMINDER_FROM_EMAIL");
  if (!from) throw new Error("Missing required environment variable: REMINDER_FROM_EMAIL");

  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (resendKey) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${resendKey}`, "content-type": "application/json" },
      body: JSON.stringify({ from, to: [invoice.client_email], subject, text: body }),
    });
    if (!response.ok) throw new Error(`Resend request failed with ${response.status}`);
    return (await response.json()).id as string | undefined;
  }

  const postmarkToken = Deno.env.get("POSTMARK_SERVER_TOKEN");
  if (postmarkToken) {
    const response = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        "X-Postmark-Server-Token": postmarkToken,
        "content-type": "application/json",
      },
      body: JSON.stringify({ From: from, To: invoice.client_email, Subject: subject, TextBody: body }),
    });
    if (!response.ok) throw new Error(`Postmark request failed with ${response.status}`);
    return (await response.json()).MessageID as string | undefined;
  }

  throw new Error("No email provider configured; set RESEND_API_KEY or POSTMARK_SERVER_TOKEN");
}

async function getTone(workspaceId: string) {
  const response = await postgrest(
    `tone_settings?workspace_id=eq.${workspaceId}&select=tone,settings&order=updated_at.desc&limit=1`,
  );
  if (!response.ok) throw new Error(`Tone settings lookup failed with ${response.status}`);
  return ((await response.json()) as ToneSettings[])[0] ?? null;
}

async function claim(invoice: Invoice, kind: string, date: string) {
  const idempotencyKey = `${invoice.id}:${kind}:${date}`;
  const response = await postgrest("reminder_logs", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      workspace_id: invoice.workspace_id,
      invoice_id: invoice.id,
      kind,
      idempotency_key: idempotencyKey,
    }),
  });
  if (response.status === 409) return null;
  if (!response.ok) throw new Error(`Reminder claim failed with ${response.status}`);
  return idempotencyKey;
}

async function removeClaim(idempotencyKey: string) {
  const response = await postgrest(
    `reminder_logs?idempotency_key=eq.${encodeURIComponent(idempotencyKey)}`,
    { method: "DELETE" },
  );
  if (!response.ok) throw new Error(`Reminder claim cleanup failed with ${response.status}`);
}

Deno.serve(async (request: Request) => {
  try {
    if (request.method !== "POST") return json({ error: "POST required" }, 405);

    const demo = Deno.env.get("DEMO_MODE") === "true" ||
      request.headers.get("x-astrix-demo") === "true";
    const cronSecret = Deno.env.get("CRON_SECRET");
    if (!demo && (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`)) {
      return json({ error: "Unauthorized" }, 401);
    }

    requiredEnv("SUPABASE_URL");
    requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    const now = new Date();
    const cutoff = new Date(now.getTime() - intervalDays() * 86400000).toISOString();
    const response = await postgrest(
      `invoices?status=eq.pending&due_at=lte.${encodeURIComponent(now.toISOString())}` +
        `&paused_at=is.null&disputed_at=is.null&paid_at=is.null` +
        `&or=(last_chased_at.is.null,last_chased_at.lte.${encodeURIComponent(cutoff)})` +
        `&select=id,workspace_id,invoice_number,client_name,client_email,currency,total_minor,reminder_count,due_at,last_chased_at`,
    );
    if (!response.ok) throw new Error(`Invoice lookup failed with ${response.status}`);

    const invoices = (await response.json()) as Invoice[];
    const results = [];
    for (const invoice of invoices) {
      if (!invoice.due_at) continue;
      const kind = reminderKind(invoice.due_at, now);
      if (demo) {
        results.push({ invoice_id: invoice.id, kind, action: "preview" });
        continue;
      }

      const key = await claim(invoice, kind, now.toISOString().slice(0, 10));
      if (!key) {
        results.push({ invoice_id: invoice.id, action: "already_claimed" });
        continue;
      }

      try {
        const body = await generateBody(invoice, await getTone(invoice.workspace_id));
        const providerMessageId = await sendEmail(invoice, subjectFor(invoice), body);
        const sent = await postgrest(`invoices?id=eq.${invoice.id}`, {
          method: "PATCH",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({
            last_chased_at: now.toISOString(),
            reminder_count: invoice.reminder_count + 1,
          }),
        });
        if (!sent.ok) throw new Error(`Invoice update failed with ${sent.status}`);
        const logged = await postgrest(`reminder_logs?idempotency_key=eq.${encodeURIComponent(key)}`, {
          method: "PATCH",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({ provider_message_id: providerMessageId ?? null, sent_at: now.toISOString() }),
        });
        if (!logged.ok) throw new Error(`Reminder log update failed with ${logged.status}`);
        results.push({ invoice_id: invoice.id, action: "sent", kind });
      } catch (error) {
        await removeClaim(key);
        throw error;
      }
    }
    return json({ ok: true, demo, interval_days: intervalDays(), processed: results });
  } catch (error) {
    console.error("[daily-chase]", error);
    return json({ error: error instanceof Error ? error.message : "Daily chase failed" }, 500);
  }
});
