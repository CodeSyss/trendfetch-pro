import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Productos de referencia desde el JSON (ahora vacío, el usuario agregará productos)
const productosReferencia: any[] = [];

// Sistema de caché simple en memoria
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutos

// Función para obtener el nombre de la tienda desde la URL
const getStoreName = (url: string): string => {
  try {
    const hostname = new URL(url).hostname;
    // Extraer el nombre principal del dominio (ej: zara.com -> zara, shein.com -> shein)
    const parts = hostname.split('.');
    const storeName = parts.length >= 2 ? parts[parts.length - 2] : hostname;
    return storeName.toLowerCase();
  } catch {
    return 'unknown';
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { urls, season = 'todos', categories = 'todos' } = await req.json();
    console.log('Analyzing URLs:', urls, 'Season:', season, 'Categories:', categories);

    // Verificar caché primero
    const cacheKey = `${urls.join('|')}|${season}|${categories}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('🎯 Returning cached results');
      return new Response(JSON.stringify(cached.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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
        const storeName = getStoreName(url);
        console.log(`🏪 Analyzing store: ${storeName}`);

        // Filtrar productos del catálogo según temporada, categoría Y tienda
        let productosCatalogo = productosReferencia.filter(producto => {
          let matchTemporada = season === 'todos' || 
                              producto.temporada === 'todo el año' || 
                              producto.temporada === season;
          
          let matchCategoria = categories === 'todos' || 
                              producto.categoria?.toLowerCase().includes(categories.toLowerCase()) ||
                              categories.toLowerCase().includes(producto.categoria?.toLowerCase());
          
          // Solo incluir productos de la misma tienda o productos sin tienda especificada
          let matchTienda = !producto.tienda || producto.tienda.toLowerCase() === storeName;
          
          return matchTemporada && matchCategoria && matchTienda;
        });

        console.log(`📦 Productos del catálogo filtrados para ${storeName}: ${productosCatalogo.length}`);

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

Tu tarea: EXTRAER entre 15-18 productos REALES de ropa de mujer de la página web proporcionada. Extraeré más productos para compensar posibles imágenes inválidas.

PRODUCTOS DE REFERENCIA (úsalos como guía de estilo y tendencias):
${productosCatalogo.length > 0 
  ? productosCatalogo.map(p => `• ${p.titulo} - ${p.recommendation} [Score: ${p.trend_score}/10]`).join('\n')
  : '• No hay productos de referencia para esta tienda aún. Selecciona los mejores productos basándote en tendencias actuales de moda.'
}

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
✅ 15-18 productos de ROPA DE MUJER únicamente (vestidos, blusas, pantalones, faldas, tops, suéteres, chamarras)
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
                content: `Analiza esta tienda (${storeName.toUpperCase()}) y extrae EXACTAMENTE 15-18 productos reales de alta calidad.

TIENDA: ${storeName.toUpperCase()}
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
              // Agregar el campo tienda al producto
              validatedProducts.push({
                ...product,
                store: storeName
              });
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
        
        return { url, products: topProducts, storeName };
      } catch (error) {
        console.error(`Error processing ${url}:`, error);
        return { url, products: [] };
      }
    });

    // Esperar a que todas las URLs se procesen
    const allResults = await Promise.all(analysisPromises);

    // Procesar productos del catálogo por tienda
    const catalogoProductsByStore = new Map<string, any[]>();
    
    for (const result of allResults) {
      const storeName = result.storeName;
      
      // Filtrar productos del catálogo para esta tienda específica
      const storeProducts = productosReferencia.filter(producto => {
        let matchTemporada = season === 'todos' || 
                            producto.temporada === 'todo el año' || 
                            producto.temporada === season;
        
        let matchCategoria = categories === 'todos' || 
                            producto.categoria?.toLowerCase().includes(categories.toLowerCase()) ||
                            categories.toLowerCase().includes(producto.categoria?.toLowerCase());
        
        let matchTienda = !producto.tienda || producto.tienda.toLowerCase() === storeName;
        
        return matchTemporada && matchCategoria && matchTienda;
      });

      // Validar imágenes del catálogo para esta tienda
      const catalogoValidated = [];
      for (const p of storeProducts) {
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
            priority: p.trend_score >= 9 ? "high" : p.trend_score >= 7.5 ? "medium" : "low",
            store: storeName,
            store_url: result.url
          });
        }
      }
      
      catalogoProductsByStore.set(storeName, catalogoValidated);
    }

    // Combinar todos los productos de IA y catálogo por tienda
    const allProductsByStore: any[] = [];
    
    for (const result of allResults) {
      const storeName = result.storeName;
      const aiProducts = result.products.map((p: any) => ({
        title: p.title,
        price: p.price,
        colors: p.colors || [],
        sizes: p.sizes || [],
        image: p.image,
        trend_score: p.trend_score,
        recommendation: p.recommendation,
        priority: p.priority,
        store: storeName,
        store_url: result.url
      }));

      const catalogoProducts = catalogoProductsByStore.get(storeName) || [];
      
      // Mezclar productos de catálogo con productos de IA de forma aleatoria
      const storeProducts = [...catalogoProducts, ...aiProducts]
        .sort(() => Math.random() - 0.5);
      
      allProductsByStore.push(...storeProducts);
    }

    // Mezcla final aleatoria de todos los productos de todas las tiendas
    const allProducts = allProductsByStore.sort(() => Math.random() - 0.5);

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

    // Guardar en caché
    cache.set(cacheKey, { data: finalResult, timestamp: Date.now() });
    console.log('💾 Results cached');

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
