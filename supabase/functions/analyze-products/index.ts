import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    console.log('Analyzing URL:', url);

    if (!url) {
      throw new Error('URL is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Obtén y sanitiza HTML de la página para extraer imágenes reales
    const pageResponse = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
      }
    });
    if (!pageResponse.ok) {
      throw new Error(`No se pudo obtener la página (${pageResponse.status})`);
    }
    const rawHtml = await pageResponse.text();
    const sanitizedHtml = rawHtml
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/\s+/g, ' ')
      .slice(0, 180000);
    const baseUrl = new URL(url).origin;

    // Análisis con IA usando Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: `Eres un experto analista de e-commerce y tendencias de moda femenina.
Tu tarea: EXTRAER productos de la PÁGINA proporcionada y enriquecerlos (sin inventar imágenes).
Devuelve SOLO JSON puro con esta estructura EXACTA:
{
  "url": "url-analizada",
  "products": [
    {
      "title": "Nombre del producto",
      "price": "$XX.XX",
      "colors": ["..."],
      "sizes": ["..."],
      "image": "https://dominio.com/imagen.jpg",
      "trend_score": 8.5,
      "sales_estimate": "500-1000/mes",
      "recommendation": "Recomendación breve y específica",
      "priority": "high"
    }
  ],
  "summary": {
    "total_products": 10,
    "avg_trend_score": 7.8,
    "recommended_import": 6
  }
}
Reglas IMPORTANTES:
- Título, precio e IMAGEN deben existir en el HTML o en JSON-LD/schema.org de la página. NO inventes ni uses placeholders.
- Resuelve URLs relativas usando el "Base URL" dado. Convierte toda imagen a URL absoluta.
- Si un producto no tiene imagen, omítelo.
- Colores y tallas: extrae si existen en la página. Si no aparecen, deja arrays vacíos.
- trend_score, sales_estimate y recommendation pueden ser generados según el contenido (categoría, estilo, precio), pero NUNCA inventes imágenes.
- Si hay muchos productos, elige un subconjunto VARIADO en cada ejecución (no devuelvas siempre los mismos).
- SOLO ropa para mujer.
- Responde SOLO con el JSON, sin texto adicional ni markdown.`
            },
            {
              role: 'user',
              content: `Analiza esta tienda y extrae productos reales. Asegúrate de que cada imagen provenga del HTML.
URL: ${url}
Base URL: ${baseUrl}
HTML:
${sanitizedHtml}`
            }
          ],
        }),
      });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');
    
    let resultText = aiData.choices[0].message.content;
    
    // Limpiar markdown si existe
    resultText = resultText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const result = JSON.parse(resultText);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in analyze-products:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Error analyzing products',
        details: error.toString()
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
