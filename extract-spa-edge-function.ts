// Supabase Edge Function: extract-spa
// Deploy as function name: extract-spa
// Secret required: GEMINI_API_KEY

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY not set on the function" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify user JWT
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const body = await req.json();
    const path = body?.path as string;
    if (!path || !path.startsWith(userId + "/")) {
      return new Response(JSON.stringify({ error: "Invalid file path" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: fileData, error: dlErr } = await admin.storage.from("spa-uploads").download(path);
    if (dlErr || !fileData) {
      return new Response(JSON.stringify({ error: "Could not download file: " + (dlErr?.message || "unknown") }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const bytes = new Uint8Array(await fileData.arrayBuffer());
    // base64
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    const b64 = btoa(binary);

    const lower = path.toLowerCase();
    let mime = "image/jpeg";
    if (lower.endsWith(".png")) mime = "image/png";
    else if (lower.endsWith(".webp")) mime = "image/webp";
    else if (lower.endsWith(".pdf")) mime = "application/pdf";
    else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) mime = "image/jpeg";

    const prompt = `You are extracting data from a UAE real estate Sales Purchase Agreement (SPA) or payment plan schedule.
Return ONLY valid JSON (no markdown) with this shape:
{
  "name": "project or unit name",
  "developer": "developer name or empty string",
  "location": "area/community in UAE",
  "total_price": 0,
  "property_type": "OFF_PLAN or READY",
  "use_type": "residential or commercial",
  "prop_subtype": "Apartment or Villa or Townhouse or Penthouse or Land or Retail Shop or Office Space or Warehouse or Factory",
  "bedrooms": "studio or 1 or 2 or 3 or 4 or 5 or 6 or 7 or empty",
  "installments": [
    { "stage": "Booking 10%", "due_date": "YYYY-MM-DD", "amount": 0 }
  ]
}
Rules:
- total_price and installment amounts are numbers in AED (no commas).
- due_date must be YYYY-MM-DD when possible; if only month/year, use first day of that month.
- If a field is unknown, use empty string or empty array.
- Prefer OFF_PLAN if a payment plan / installment schedule is present.`;

    const geminiUrl =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" +
      geminiKey;

    const geminiBody = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mime,
                data: b64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    };

    const aiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiBody),
    });
    const aiJson = await aiRes.json();
    if (!aiRes.ok) {
      return new Response(
        JSON.stringify({ error: "AI error", detail: aiJson }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const textOut =
      aiJson?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("") ||
      "";
    let parsed: unknown;
    try {
      parsed = JSON.parse(textOut);
    } catch {
      // try extract JSON object from text
      const m = textOut.match(/\{[\s\S]*\}/);
      if (!m) {
        return new Response(JSON.stringify({ error: "AI returned non-JSON", raw: textOut }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      parsed = JSON.parse(m[0]);
    }

    return new Response(JSON.stringify({ data: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
