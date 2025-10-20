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
    const { url, season = 'todos', categories = 'todos' } = await req.json();
    console.log('Analyzing URL:', url, 'Season:', season, 'Categories:', categories);

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
              content: `Eres un experto analista de e-commerce y tendencias de moda femenina con especialización en productos tejidos y de temporada.
Tu tarea: EXTRAER productos REALES de ropa de mujer de la página web proporcionada.

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
      "recommendation": "Recomendación breve y específica",
      "priority": "high"
    }
  ],
  "summary": {
    "total_products": 20,
    "avg_trend_score": 7.8,
    "recommended_import": 12
  }
}

Reglas CRÍTICAS:
1. MÍNIMO 20 productos de ropa de mujer. Si no encuentras 20, devuelve todos los que tengan datos completos (título, precio, imagen).
2. SOLO ropa de mujer (vestidos, blusas, pantalones, faldas, tops, etc). NO accesorios, zapatos, bolsas, joyería.
3. Título, precio e IMAGEN son OBLIGATORIOS. Si un producto no tiene imagen válida, omítelo completamente.
4. Resuelve URLs relativas usando el "Base URL" proporcionado. Todas las imágenes deben ser URLs absolutas.
5. Colores y tallas: extrae SOLO si aparecen en el HTML. Si no los encuentras, deja arrays vacíos [].
6. EXPLORA TODO EL HTML: No te quedes con los primeros productos. Busca VARIEDAD y CALIDAD en toda la página.
7. PRIORIZA según temporada y categoría especificadas. Productos relevantes reciben trend_score más alto.
8. trend_score (1-10): evalúa estilo, modernidad, adecuación a temporada y potencial de venta.
9. priority: "high" para productos perfectos para temporada/categoría, "medium" para adecuados, "low" para básicos.
10. recommendation: análisis específico del potencial considerando temporada y tendencias (1-2 oraciones).
11. NO inventes URLs de imágenes. USA SOLO las que existen en el HTML.
12. Busca imágenes en: <img>, JSON-LD, atributos data-src, srcset, etc.
13. Responde SOLO con el JSON, sin markdown ni texto adicional.

CONTEXTO DE TEMPORADA Y CATEGORÍA:
${season === 'caliente' ? '- CLIMA CALIENTE (Primavera/Verano): Prioriza vestidos sin manga, tops tejidos ligeros, blusas frescas, pantalones ligeros, prendas con tejidos transpirables.' : ''}
${season === 'frio' ? '- CLIMA FRÍO (Otoño/Invierno): Prioriza suéteres, vestidos de manga larga, conjuntos tejidos abrigados, pantalones de telas gruesas, prendas con capas.' : ''}
${categories !== 'todos' ? `- CATEGORÍA PREFERIDA: ${categories === 'tejidos' ? 'Prendas tejidas de punto (sweaters, vestidos tejidos, tops tejidos, conjuntos tejidos)' : categories === 'tops' ? 'Tops, blusas y camisas' : categories === 'vestidos' ? 'Vestidos de todos los estilos' : categories === 'pantalones' ? 'Pantalones, leggings y palazzo' : 'Conjuntos coordinados (top + pantalón, vestido + chaqueta)'}` : ''}

EJEMPLOS DE PRODUCTOS EXITOSOS SIMILARES:
- Vestidos tejidos con rayas horizontales (estilo marinero)
- Tops tejidos sin manga con escote en V
- Pantalones tejidos de punto en colores neutros
- Conjuntos de dos piezas tejidos (top + pantalón)
- Prendas tejidas con detalles de perlas o pedrería`
            },
            {
              role: 'user',
              content: `Analiza esta tienda y extrae productos reales, priorizando según la temporada y categoría especificadas.

TEMPORADA: ${season === 'caliente' ? 'CLIMA CALIENTE (Primavera/Verano)' : season === 'frio' ? 'CLIMA FRÍO (Otoño/Invierno)' : 'TODAS LAS TEMPORADAS'}
CATEGORÍA: ${categories === 'todos' ? 'TODAS' : categories.toUpperCase()}

IMPORTANTE: 
- Busca VARIEDAD en toda la página, no solo los primeros productos
- Prioriza productos que se ajusten a la temporada y categoría
- Busca productos con estilos similares a vestidos/tops tejidos rayados, conjuntos de punto, prendas tejidas con detalles

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
