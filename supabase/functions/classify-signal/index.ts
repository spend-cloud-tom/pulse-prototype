import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { description, category, amount, submitter, location } = await req.json();
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

    const systemPrompt = `You are Pulse AI, the intelligent classification engine for a Dutch care organization (Stichting VeldVliet). Your job is to classify operational Pulses — discrete, actionable units of care and operational attention.

Given a Pulse description, determine:
1. signalType: one of "purchase", "maintenance", "incident", "shift-handover", "compliance", "event", "resource", "general"
2. urgency: one of "normal", "urgent", "critical"
3. suggestedCategory: a short category label (e.g., "Mobility", "Food & nutrition", "Safety", "Facilities", "Medical supplies", "Team welfare", "Care notes")
4. suggestedFunding: one of "Wlz", "General", "Petty cash", "Mixed (Wlz/General)", "N/A"
5. confidence: 0-100 score for your classification confidence
6. aiReasoning: one sentence explaining your classification
7. flagReason: optional flag if something needs attention (e.g., "Above auto-limit", "Funding uncertain", "Compliance concern", "Recurring pattern")

Context: Amount is €${amount || 0}. Auto-approval limit is €100. Location: ${location || "unknown"}. Submitter: ${submitter || "unknown"}.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: systemPrompt,
        tools: [
          {
            name: "classify_signal",
            description: "Classify a Pulse with type, urgency, category, funding, and confidence.",
            input_schema: {
              type: "object",
              properties: {
                signalType: { type: "string", enum: ["purchase", "maintenance", "incident", "shift-handover", "compliance", "event", "resource", "general"] },
                urgency: { type: "string", enum: ["normal", "urgent", "critical"] },
                suggestedCategory: { type: "string" },
                suggestedFunding: { type: "string", enum: ["Wlz", "General", "Petty cash", "Mixed (Wlz/General)", "N/A"] },
                confidence: { type: "number" },
                aiReasoning: { type: "string" },
                flagReason: { type: "string" },
              },
              required: ["signalType", "urgency", "suggestedCategory", "suggestedFunding", "confidence", "aiReasoning"],
            },
          },
        ],
        tool_choice: { type: "tool", name: "classify_signal" },
        messages: [
          { role: "user", content: `Classify this Pulse: "${description}"${category ? ` (user-suggested category: ${category})` : ''}` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 401) {
        return new Response(JSON.stringify({ error: "Invalid Anthropic API key." }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("Anthropic API error:", response.status, text);
      return new Response(JSON.stringify({ error: "AI classification failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolUse = data.content?.find((block: { type: string }) => block.type === "tool_use");
    
    if (toolUse?.input) {
      return new Response(JSON.stringify(toolUse.input), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback if no tool call
    return new Response(JSON.stringify({
      signalType: "general",
      urgency: "normal",
      suggestedCategory: "General",
      suggestedFunding: "General",
      confidence: 50,
      aiReasoning: "Could not classify automatically. Manual review recommended.",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("classify-signal error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
