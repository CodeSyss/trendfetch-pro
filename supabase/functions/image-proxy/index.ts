import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { searchParams } = new URL(req.url);
    const target = searchParams.get("url");

    if (!target) {
      return new Response(JSON.stringify({ error: "Missing 'url' query parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Basic validation to avoid SSRF to internal metadata endpoints
    const targetUrl = target; // URLSearchParams returns decoded value
    const lower = targetUrl.toLowerCase();
    if (lower.startsWith("http://169.254.") || lower.startsWith("http://127.") || lower.startsWith("http://localhost") ||
        lower.startsWith("https://169.254.") || lower.startsWith("https://127.") || lower.startsWith("https://localhost")) {
      return new Response(JSON.stringify({ error: "Blocked URL" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const urlObj = new URL(targetUrl);
    const headers: Record<string, string> = {
      "User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
    };
    const host = urlObj.host.toLowerCase();
    if (host.endsWith("ltwebstatic.com") || host.includes("shein")) {
      headers["Referer"] = "https://us.shein.com/";
      headers["Origin"] = "https://us.shein.com";
    }

    const upstream = await fetch(targetUrl, { headers });

    if (!upstream.ok || !upstream.body) {
      console.error("image-proxy upstream error:", upstream.status, await upstream.text());
      return new Response(JSON.stringify({ error: "Failed to fetch image" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contentType = upstream.headers.get("content-type") ?? "image/jpeg";

    return new Response(upstream.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err) {
    console.error("image-proxy error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
