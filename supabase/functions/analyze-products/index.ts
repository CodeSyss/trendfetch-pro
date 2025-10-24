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

    // Función para validar si una imagen es accesible
    const validateImage = async (imageUrl: string): Promise<boolean> => {
      try {
        const response = await fetch(imageUrl, { 
          method: 'HEAD',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        const contentType = response.headers.get('content-type');
        return response.ok && (contentType?.startsWith('image/') ?? false);
      } catch {
        return false;
      }
    };

    // Función para calcular similitud entre títulos (detección de duplicados)
    const calculateTitleSimilarity = (title1: string, title2: string): number => {
      const normalize = (str: string) => str.toLowerCase().trim().replace(/[^\w\s]/g, '');
      const t1 = normalize(title1);
      const t2 = normalize(title2);
      
      if (t1 === t2) return 1.0;
      
      const words1 = new Set(t1.split(/\s+/));
      const words2 = new Set(t2.split(/\s+/));
      const intersection = [...words1].filter(w => words2.has(w)).length;
      const union = new Set([...words1, ...words2]).size;
      
      return intersection / union;
    };

    // Función para eliminar duplicados basándose en similitud de títulos
    const removeDuplicates = (products: any[]): any[] => {
      const unique: any[] = [];
      
      for (const product of products) {
        const isDuplicate = unique.some(u => 
          calculateTitleSimilarity(u.title, product.title) > 0.75
        );
        
        if (!isDuplicate) {
          unique.push(product);
        } else {
          console.log(`🔄 Duplicado eliminado: ${product.title}`);
        }
      }
      
      return unique;
    };

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
                content: `Eres un experto analista de e-commerce y tendencias de moda femenina con experiencia en merchandising y análisis de tendencias.

Tu tarea: EXTRAER entre 12-15 productos REALES de ropa de mujer de la página web proporcionada. Extraeré más productos para compensar posibles imágenes inválidas.

PRODUCTOS DE REFERENCIA (úsalos como guía de estilo y tendencias):
${productosCatalogo.map(p => `• ${p.titulo} - ${p.recommendation} [Score: ${p.trend_score}/10]`).join('\n')}

CRITERIOS DE SELECCIÓN (en orden de prioridad):
1. 🎯 ALINEACIÓN CON REFERENCIAS: Productos que sigan las tendencias y estilos de los productos de referencia
2. 📸 IMAGEN DE CALIDAD: URLs de imágenes absolutas, claras y funcionales
3. 💎 CALIDAD DEL PRODUCTO: Diseño moderno, buena presentación, descripción completa
4. 💰 PRECIO COMPETITIVO: Precios realistas y acordes al mercado
5. 🌟 VARIEDAD: Diferentes estilos dentro de la tendencia (no todos iguales)

FORMATO JSON (devuelve SOLO esto, sin markdown):
{
  "url": "url-analizada",
  "products": [
    {
      "title": "Nombre exacto del producto",
      "price": "$XXX.XX",
      "colors": ["color1", "color2"],
      "sizes": ["S", "M", "L"],
      "image": "https://dominio.com/ruta/completa/imagen.jpg",
      "trend_score": 8.5,
      "recommendation": "Por qué este producto es tendencia y cómo se alinea con las referencias",
      "priority": "high",
      "similarity_to_reference": 0.85
    }
  ]
}

REGLAS ESTRICTAS:
✅ 12-15 productos de ROPA DE MUJER únicamente (vestidos, blusas, pantalones, faldas, tops, suéteres, chamarras)
✅ Título + precio + imagen son OBLIGATORIOS (si falta algo, omite el producto)
✅ URLs de imágenes ABSOLUTAS (resuelve relativas con Base URL)
✅ Colores/tallas: extrae si están visibles, sino deja []
✅ trend_score: 1-10 basado en modernidad, calidad, alineación con referencias
✅ priority: "high" (90%+ alineación), "medium" (70-89%), "low" (<70%)
✅ similarity_to_reference: 0-1 (qué tan similar es a los productos de referencia)

❌ NO accesorios, zapatos, bolsas, joyería
❌ NO inventes URLs de imágenes
❌ NO incluyas productos sin imagen válida
❌ NO repitas productos similares (evita duplicados)

CONTEXTO DE BÚSQUEDA ESPECÍFICO:
${season === 'caliente' ? '🌞 CLIMA CALIENTE: Enfócate en prendas ligeras, frescas, transpirables, sin manga o manga corta, colores claros.' : ''}
${season === 'frio' ? '❄️ CLIMA FRÍO: Prioriza suéteres, manga larga, chamarras, abrigos, capas, tejidos gruesos.' : ''}
${categories === 'vacaciones' ? '🏖️ VACACIONES: Vestidos playeros, pareos, kaftanes, cover-ups, ropa resort, estampados tropicales, looks casuales de playa.' : ''}
${categories === 'tejidos' ? '🧶 TEJIDOS: Sweaters, cardigans, vestidos tejidos, tops de punto, texturas artesanales.' : ''}
${categories === 'tops' ? '👚 TOPS: Blusas, camisas, crop tops, bodysuits, tops casuales y elegantes.' : ''}
${categories === 'vestidos' ? '👗 VESTIDOS: Todos los estilos - casuales, elegantes, midi, maxi, mini, con estampados o lisos.' : ''}
${categories === 'pantalones' ? '👖 PANTALONES: Jeans, leggings, palazzo, cargo, formales, casuales.' : ''}
${categories === 'conjuntos' ? '👔 CONJUNTOS: Coordinados de 2-3 piezas, matching sets, outfits completos.' : ''}
${season === 'todos' && categories === 'todos' ? '🌈 TODO: Selecciona lo mejor de la tienda, variedad de estilos y temporadas.' : ''}`
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
        
        // Validar imágenes de productos y filtrar los que no tienen imagen válida
        const validatedProducts = [];
        for (const product of aiResult.products) {
          if (product.image) {
            const isValid = await validateImage(product.image);
            if (isValid) {
              validatedProducts.push(product);
              console.log(`✓ Imagen válida: ${product.title}`);
            } else {
              console.log(`✗ Imagen inválida, producto omitido: ${product.title}`);
            }
          } else {
            console.log(`✗ Sin imagen, producto omitido: ${product.title}`);
          }
        }
        
        // Eliminar duplicados
        const uniqueProducts = removeDuplicates(validatedProducts);
        
        // Ordenar por trend_score y tomar los 10 mejores
        const topProducts = uniqueProducts
          .sort((a, b) => b.trend_score - a.trend_score)
          .slice(0, 10);
        
        console.log(`📊 Productos procesados: ${aiResult.products.length} → ${validatedProducts.length} válidos → ${uniqueProducts.length} únicos → ${topProducts.length} mejores`);
        
        return { url, products: topProducts };
      } catch (error) {
        console.error(`Error processing ${url}:`, error);
        return { url, products: [] };
      }
    });

    // Esperar a que todas las URLs se procesen
    const allResults = await Promise.all(analysisPromises);

    // Validar imágenes del catálogo
    const catalogoValidated = [];
    for (const p of productosCatalogo) {
      const isValid = await validateImage(p.imagen_url);
      if (isValid) {
        catalogoValidated.push({
          title: p.titulo,
          price: p.precio,
          colors: p.colores,
          sizes: p.tallas,
          image: p.imagen_url,
          trend_score: p.trend_score,
          recommendation: p.recommendation,
          priority: p.trend_score >= 9 ? "high" : p.trend_score >= 7.5 ? "medium" : "low"
        });
      }
    }
    
    const catalogoProducts = catalogoValidated;

    // Combinar todos los productos de IA de todas las URLs (sin campo source)
    // Ya vienen filtrados con imágenes válidas
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
