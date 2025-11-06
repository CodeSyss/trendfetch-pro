import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Productos de referencia para guiar el análisis
const productosReferencia: any[] = [
  {
    "titulo": "Vestido Midi Floral",
    "recommendation": "Perfecto para primavera/verano con estampados florales modernos",
    "trend_score": 9.2,
    "temporada": "caliente",
    "categoria": "vestidos",
    "tienda": "shein"
  },
  {
    "titulo": "Top Crop Tejido",
    "recommendation": "Tendencia en tejidos ligeros para clima cálido",
    "trend_score": 8.5,
    "temporada": "caliente",
    "categoria": "tops",
    "tienda": "shein"
  },
  {
    "titulo": "Conjunto Playero 2 Piezas",
    "recommendation": "Ideal para vacaciones de verano, estilo resort",
    "trend_score": 8.8,
    "temporada": "caliente",
    "categoria": "vacaciones",
    "tienda": "shein"
  },
  {
    "titulo": "Suéter Oversized",
    "recommendation": "Tejido grueso perfecto para otoño/invierno",
    "trend_score": 9.0,
    "temporada": "frio",
    "categoria": "tejidos",
    "tienda": "zara"
  },
  {
    "titulo": "Blazer Estructurado",
    "recommendation": "Pieza versátil para todo el año, estilo corporativo moderno",
    "trend_score": 8.7,
    "temporada": "todo el año",
    "categoria": "tops",
    "tienda": "zara"
  },
  {
    "titulo": "Vestido Camisero",
    "recommendation": "Clásico atemporal, funciona en cualquier temporada",
    "trend_score": 8.9,
    "temporada": "todo el año",
    "categoria": "vestidos",
    "tienda": "hm"
  },
  {
    "titulo": "Pantalón Wide Leg",
    "recommendation": "Tendencia actual en pantalones de pierna ancha",
    "trend_score": 9.1,
    "temporada": "todo el año",
    "categoria": "pantalones",
    "tienda": "zara"
  },
  {
    "titulo": "Cardigan Largo Punto",
    "recommendation": "Perfecto para capas en clima frío",
    "trend_score": 8.6,
    "temporada": "frio",
    "categoria": "tejidos",
    "tienda": "hm"
  },
  {
    "titulo": "Blusa Satinada",
    "recommendation": "Elegante y versátil para ocasiones especiales",
    "trend_score": 8.4,
    "temporada": "todo el año",
    "categoria": "tops",
    "tienda": "forever21"
  },
  {
    "titulo": "Conjunto Deportivo 3 Piezas",
    "recommendation": "Athleisure trend, cómodo y moderno",
    "trend_score": 9.3,
    "temporada": "todo el año",
    "categoria": "conjuntos",
    "tienda": "shein"
  }
];

// Sistema de caché simple en memoria
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutos

// User-Agent pool para rotar
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
];

const getRandomUserAgent = () => userAgents[Math.floor(Math.random() * userAgents.length)];

// URLs por defecto para categorías específicas de cada tienda
// IMPORTANTE: El usuario puede modificar estas URLs para agregar más tiendas o categorías
const defaultStoreUrls: Record<string, Record<string, Record<string, string[]>>> = {
  'shein': {
    'caliente': {
      'vestidos': ['https://us.shein.com/Women-Dresses-c-1727.html'],
      'tops': ['https://us.shein.com/Women-Tops-c-1733.html'],
      'vacaciones': ['https://us.shein.com/Women-Swimwear-c-2193.html', 'https://us.shein.com/Women-Beach-Wear-c-2419.html'],
      'todos': ['https://us.shein.com/trend-women-clothing-c-2030.html']
    },
    'frio': {
      'tejidos': ['https://us.shein.com/Women-Sweaters-c-1734.html'],
      'tops': ['https://us.shein.com/Women-Tops-c-1733.html'],
      'todos': ['https://us.shein.com/Women-Clothing-c-1727.html']
    },
    'todos': {
      'todos': ['https://us.shein.com/trend-women-clothing-c-2030.html', 'https://us.shein.com/Women-New-Arrivals-c-2766.html']
    }
  },
  'zara': {
    'caliente': {
      'vestidos': ['https://www.zara.com/es/es/mujer-vestidos-l1066.html'],
      'tops': ['https://www.zara.com/es/es/mujer-camisas-blusas-l1217.html'],
      'todos': ['https://www.zara.com/es/es/mujer-novedades-l1180.html']
    },
    'frio': {
      'tejidos': ['https://www.zara.com/es/es/mujer-punto-l1152.html'],
      'todos': ['https://www.zara.com/es/es/mujer-ropa-l1055.html']
    },
    'todos': {
      'todos': ['https://www.zara.com/es/es/mujer-novedades-l1180.html', 'https://www.zara.com/es/es/mujer-ropa-l1055.html']
    }
  },
  'hm': {
    'caliente': {
      'vestidos': ['https://www2.hm.com/es_es/mujer/compra-por-producto/vestidos.html'],
      'tops': ['https://www2.hm.com/es_es/mujer/compra-por-producto/tops-y-camisetas.html'],
      'todos': ['https://www2.hm.com/es_es/mujer/compra-por-producto.html']
    },
    'frio': {
      'tejidos': ['https://www2.hm.com/es_es/mujer/compra-por-producto/punto.html'],
      'todos': ['https://www2.hm.com/es_es/mujer/compra-por-producto.html']
    },
    'todos': {
      'todos': ['https://www2.hm.com/es_es/mujer/novedades.html', 'https://www2.hm.com/es_es/mujer/compra-por-producto.html']
    }
  },
  'forever21': {
    'caliente': {
      'vestidos': ['https://www.forever21.com/us/shop/catalog/category/f21/dress'],
      'tops': ['https://www.forever21.com/us/shop/catalog/category/f21/top'],
      'todos': ['https://www.forever21.com/us/shop/catalog/category/f21/app-main']
    },
    'frio': {
      'tejidos': ['https://www.forever21.com/us/shop/catalog/category/f21/sweater'],
      'todos': ['https://www.forever21.com/us/shop/catalog/category/f21/app-main']
    },
    'todos': {
      'todos': ['https://www.forever21.com/us/shop/catalog/category/f21/new-arrivals']
    }
  }
};

// Función para obtener el nombre de la tienda desde la URL
const getStoreName = (url: string): string => {
  try {
    const hostname = new URL(url).hostname;
    const parts = hostname.split('.');
    const storeName = parts.length >= 2 ? parts[parts.length - 2] : hostname;
    return storeName.toLowerCase();
  } catch {
    return 'unknown';
  }
};

// Función para detectar si es una homepage y obtener URLs específicas
const getSpecificUrls = (url: string, season: string, categories: string): string[] => {
  const storeName = getStoreName(url);
  const urlObj = new URL(url);
  const pathname = urlObj.pathname;
  
  // Detectar si es homepage (ruta raíz o muy corta)
  const isHomepage = pathname === '/' || pathname === '' || pathname.length < 10;
  
  if (!isHomepage) {
    console.log(`✓ URL específica detectada para ${storeName}: ${url}`);
    return [url]; // Ya es una URL específica
  }
  
  console.log(`🏠 Homepage detectada para ${storeName}, buscando URLs específicas...`);
  
  // Buscar URLs por defecto para esta tienda
  const storeUrls = defaultStoreUrls[storeName];
  if (!storeUrls) {
    console.log(`⚠️ No hay URLs configuradas para ${storeName}, usando homepage`);
    return [url];
  }
  
  // Buscar por temporada y categoría
  const seasonUrls = storeUrls[season] || storeUrls['todos'];
  if (!seasonUrls) {
    console.log(`⚠️ No hay URLs para temporada ${season} en ${storeName}`);
    return [url];
  }
  
  const categoryUrls = seasonUrls[categories] || seasonUrls['todos'];
  if (!categoryUrls || categoryUrls.length === 0) {
    console.log(`⚠️ No hay URLs para categoría ${categories} en ${storeName}`);
    return [url];
  }
  
  console.log(`✅ URLs específicas encontradas para ${storeName}: ${categoryUrls.length} URLs`);
  return categoryUrls;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { urls, season = 'todos', categories = 'todos' } = await req.json();
    console.log('📥 Input URLs:', urls, 'Season:', season, 'Categories:', categories);

    // Expandir URLs: si es homepage, reemplazar con URLs específicas
    const expandedUrls: string[] = [];
    for (const url of urls) {
      const specificUrls = getSpecificUrls(url, season, categories);
      expandedUrls.push(...specificUrls);
    }
    
    console.log('🔍 URLs a analizar después de expansión:', expandedUrls);

    // Verificar caché primero
    const cacheKey = `${expandedUrls.join('|')}|${season}|${categories}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('🎯 Returning cached results');
      return new Response(JSON.stringify(cached.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!expandedUrls || expandedUrls.length === 0) {
      throw new Error('At least one URL is required');
    }

    // Procesar todas las URLs expandidas
    const analysisPromises = expandedUrls.map(async (url: string) => {
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

        // Mapear productos del catálogo al formato esperado
        const products = productosCatalogo.map((producto, index) => ({
          title: producto.titulo,
          price: "Ver tienda",
          image: `https://via.placeholder.com/400x500/E5DEFF/1A1F2C?text=${encodeURIComponent(producto.titulo)}`,
          url: url,
          recommendation: producto.recommendation,
          trend_score: producto.trend_score,
          priority: producto.trend_score >= 9 ? "high" : producto.trend_score >= 7.5 ? "medium" : "low",
          colors: [],
          sizes: [],
          store: storeName,
          store_url: url
        }));

        console.log(`✅ Productos de catálogo generados: ${products.length}`);
        
        return { url, products, storeName };
      } catch (error) {
        const storeName = getStoreName(url);
        console.error(`Error processing ${url}:`, error);
        return { url, products: [], storeName };
      }
    });

    // Esperar a que todas las URLs se procesen
    const allResults = await Promise.all(analysisPromises);


    // Combinar todos los productos
    const allProducts = allResults.flatMap(result => result.products);

    // Mezcla aleatoria
    const shuffledProducts = allProducts.sort(() => Math.random() - 0.5);

    // Recalcular resumen
    const totalProducts = shuffledProducts.length;
    const avgScore = totalProducts > 0 
      ? shuffledProducts.reduce((sum: number, p: any) => sum + p.trend_score, 0) / totalProducts 
      : 0;
    const recommendedImport = shuffledProducts.filter((p: any) => p.priority === "high").length;

    const finalResult = {
      urls: expandedUrls,
      products: shuffledProducts,
      summary: {
        total_products: totalProducts,
        avg_trend_score: Number(avgScore.toFixed(1)),
        recommended_import: recommendedImport,
        stores_analyzed: expandedUrls.length
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
