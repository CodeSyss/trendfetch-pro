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
            content: `Eres un experto analista de e-commerce y tendencias de moda femenina. Tu trabajo es analizar URLs de tiendas online (como Shein) y generar recomendaciones de productos de ropa para mujer para importar.

Analiza la URL proporcionada y genera un JSON con la siguiente estructura EXACTA (sin markdown, solo JSON puro):
{
  "url": "url-analizada",
  "products": [
    {
      "title": "Nombre del producto",
      "price": "$XX.XX",
      "colors": ["Negro", "Blanco", "Rosa"],
      "sizes": ["S", "M", "L", "XL"],
      "image": "URL de la imagen del producto si está disponible",
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

Genera entre 6-12 productos de ROPA PARA MUJER basándote en:
- Tendencias actuales de moda femenina
- Popularidad estimada
- Relación precio-valor
- Potencial de reventa
- Colores disponibles (genera colores realistas y atractivos)
- Tallas disponibles (enfócate en el rango estándar S-XL)

Los trend_score van de 1-10. Priority puede ser: "high", "medium", "low".
Para el campo "image", incluye una URL de imagen si es posible extraerla o genera una URL placeholder.
IMPORTANTE: SOLO productos de ropa para mujer. Responde SOLO con el JSON, sin texto adicional ni markdown.`
          },
          {
            role: 'user',
            content: `Analiza esta URL de tienda y genera recomendaciones de productos para importar: ${url}`
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
