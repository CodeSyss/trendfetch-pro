import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Productos de referencia desde el JSON
const productosReferencia = [
  {
    "titulo": "Blusa Floral Verano",
    "precio": "$299",
    "imagen_url": "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=400",
    "temporada": "caliente",
    "categoria": "blusas",
    "colores": ["rosa", "blanco", "azul"],
    "tallas": ["S", "M", "L", "XL"],
    "trend_score": 8.5,
    "recommendation": "Producto de catálogo - Blusa floral perfecta para temporada caliente, diseño fresco y ligero"
  },
  {
    "titulo": "Vestido Casual Primavera",
    "precio": "$450",
    "imagen_url": "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400",
    "temporada": "caliente",
    "categoria": "vestidos",
    "colores": ["amarillo", "verde", "blanco"],
    "tallas": ["XS", "S", "M", "L"],
    "trend_score": 9.0,
    "recommendation": "Producto de catálogo - Vestido ligero ideal para clima cálido, muy versátil"
  },
  {
    "titulo": "Suéter Tejido Invierno",
    "precio": "$599",
    "imagen_url": "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400",
    "temporada": "frio",
    "categoria": "sueteres",
    "colores": ["gris", "negro", "beige"],
    "tallas": ["S", "M", "L", "XL"],
    "trend_score": 8.0,
    "recommendation": "Producto de catálogo - Suéter cálido de alta calidad para temporada fría"
  },
  {
    "titulo": "Chamarra Acolchada",
    "precio": "$899",
    "imagen_url": "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400",
    "temporada": "frio",
    "categoria": "chamarras",
    "colores": ["negro", "azul marino", "gris"],
    "tallas": ["M", "L", "XL"],
    "trend_score": 9.5,
    "recommendation": "Producto de catálogo - Chamarra perfecta para invierno, diseño moderno"
  },
  {
    "titulo": "Pantalón Mezclilla Clásico",
    "precio": "$499",
    "imagen_url": "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400",
    "temporada": "todo el año",
    "categoria": "pantalones",
    "colores": ["azul", "negro", "gris"],
    "tallas": ["26", "28", "30", "32", "34"],
    "trend_score": 8.5,
    "recommendation": "Producto de catálogo - Pantalón versátil para cualquier temporada"
  }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { urls, season = 'todos', categories = 'todos' } = await req.json();
    console.log('Analyzing URLs:', urls, 'Season:', season, 'Categories:', categories);

    // Filtrar productos del catálogo según temporada y categoría
    let productosCatalogo = productosReferencia.filter(producto => {
      let matchTemporada = season === 'todos' || 
                          producto.temporada === 'todo el año' || 
                          producto.temporada === season;
      
      let matchCategoria = categories === 'todos' || 
                          producto.categoria.toLowerCase().includes(categories.toLowerCase()) ||
                          categories.toLowerCase().includes(producto.categoria.toLowerCase());
      
      return matchTemporada && matchCategoria;
    });

    console.log(`Productos del catálogo filtrados: ${productosCatalogo.length}`);

    if (!urls || urls.length === 0) {
      throw new Error('At least one URL is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Procesar todas las URLs en paralelo
    const analysisPromises = urls.map(async (url: string) => {
      try {
        // Obtén y sanitiza HTML de la página con headers mejorados
        const pageResponse = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Upgrade-Insecure-Requests': '1'
          },
          redirect: 'follow'
        });
        
        if (!pageResponse.ok) {
          console.error(`Error fetching ${url}: ${pageResponse.status}`);
          return { url, products: [] };
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
Tu tarea: EXTRAER exactamente 10 productos REALES de ropa de mujer de la página web proporcionada.

IMPORTANTE: A continuación te mostraré productos de referencia de nuestro catálogo que coinciden con la búsqueda actual. 
Úsalos como INSPIRACIÓN para identificar productos similares en la tienda que estás analizando:

PRODUCTOS DE REFERENCIA DEL CATÁLOGO:
${productosCatalogo.map(p => `- ${p.titulo}: ${p.recommendation} (Score: ${p.trend_score})`).join('\n')}

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
  ]
}

Reglas CRÍTICAS:
1. EXACTAMENTE 10 productos de ropa de mujer con datos completos (título, precio, imagen).
2. USA los productos de referencia como guía para identificar estilos y tendencias similares.
3. SOLO ropa de mujer (vestidos, blusas, pantalones, faldas, tops, etc). NO accesorios, zapatos, bolsas.
4. Título, precio e IMAGEN son OBLIGATORIOS. Si no tiene imagen válida, omítelo.
5. Resuelve URLs relativas usando el "Base URL". Todas las imágenes deben ser URLs absolutas.
6. Colores y tallas: extrae SOLO si aparecen en el HTML. Si no, deja arrays vacíos [].
7. PRIORIZA productos que se alineen con los estilos de los productos de referencia.
8. trend_score (1-10): evalúa estilo, modernidad, similitud con referencias, adecuación a temporada.
9. priority: "high" para productos que coinciden con las tendencias de referencia, "medium" para adecuados, "low" para básicos.
10. NO inventes URLs de imágenes. USA SOLO las del HTML.
11. Responde SOLO con el JSON, sin markdown.

CONTEXTO DE BÚSQUEDA:
${season === 'caliente' ? '- CLIMA CALIENTE: Prioriza prendas ligeras, sin manga, frescas que coincidan con el estilo de las referencias.' : ''}
${season === 'frio' ? '- CLIMA FRÍO: Prioriza suéteres, manga larga, abrigos similares a las referencias.' : ''}
${categories === 'vacaciones' ? '- ROPA DE VACACIONES: Prioriza vestidos playeros, pareos, trajes de baño tipo cover-ups, ropa resort, vestidos fluidos, conjuntos veraniegos que sigan el estilo de las referencias.' : ''}
${categories === 'tejidos' ? '- PRENDAS TEJIDAS: Prioriza sweaters, vestidos tejidos, tops tejidos similares a las referencias.' : ''}
${categories === 'tops' ? '- TOPS Y BLUSAS que sigan las tendencias de las referencias' : ''}
${categories === 'vestidos' ? '- VESTIDOS de todos los estilos alineados con las referencias' : ''}
${categories === 'pantalones' ? '- PANTALONES, leggings, palazzo similares a las referencias' : ''}
${categories === 'conjuntos' ? '- CONJUNTOS coordinados que sigan el estilo de las referencias' : ''}`
              },
              {
                role: 'user',
                content: `Analiza esta tienda y extrae EXACTAMENTE 10 productos reales.

TEMPORADA: ${season === 'caliente' ? 'CLIMA CALIENTE' : season === 'frio' ? 'CLIMA FRÍO' : 'TODAS'}
CATEGORÍA: ${categories.toUpperCase()}

URL: ${url}
Base URL: ${baseUrl}
HTML:
${sanitizedHtml}`
              }
            ],
          }),
        });

        if (!aiResponse.ok) {
          console.error(`AI API error for ${url}:`, aiResponse.status);
          return { url, products: [] };
        }

        const aiData = await aiResponse.json();
        let resultText = aiData.choices[0].message.content;
        resultText = resultText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        const aiResult = JSON.parse(resultText);
        return aiResult;
      } catch (error) {
        console.error(`Error processing ${url}:`, error);
        return { url, products: [] };
      }
    });

    // Esperar a que todas las URLs se procesen
    const allResults = await Promise.all(analysisPromises);

    // Convertir productos del catálogo al formato esperado (sin campo source para que aparezcan mezclados)
    const catalogoProducts = productosCatalogo.map(p => ({
      title: p.titulo,
      price: p.precio,
      colors: p.colores,
      sizes: p.tallas,
      image: p.imagen_url,
      trend_score: p.trend_score,
      recommendation: p.recommendation,
      priority: p.trend_score >= 9 ? "high" : p.trend_score >= 7.5 ? "medium" : "low"
    }));

    // Combinar todos los productos de IA de todas las URLs (sin campo source)
    const allAiProducts = allResults.flatMap(result => 
      result.products.map((p: any) => ({
        title: p.title,
        price: p.price,
        colors: p.colors || [],
        sizes: p.sizes || [],
        image: p.image,
        trend_score: p.trend_score,
        recommendation: p.recommendation,
        priority: p.priority,
        store_url: result.url
      }))
    );

    // Combinar y mezclar productos: catálogo + IA, mezclados aleatoriamente
    const allProducts = [...catalogoProducts, ...allAiProducts]
      .sort(() => Math.random() - 0.5);

    // Recalcular resumen
    const totalProducts = allProducts.length;
    const avgScore = allProducts.reduce((sum: number, p: any) => sum + p.trend_score, 0) / totalProducts;
    const recommendedImport = allProducts.filter((p: any) => p.priority === "high").length;

    const finalResult = {
      urls: urls,
      products: allProducts,
      summary: {
        total_products: totalProducts,
        avg_trend_score: Number(avgScore.toFixed(1)),
        recommended_import: recommendedImport,
        stores_analyzed: urls.length
      }
    };

    return new Response(JSON.stringify(finalResult), {
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
