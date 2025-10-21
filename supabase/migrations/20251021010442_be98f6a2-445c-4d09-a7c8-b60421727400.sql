-- Crear tabla de productos de referencia
CREATE TABLE public.productos_referencia (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  titulo TEXT NOT NULL,
  precio TEXT NOT NULL,
  imagen_url TEXT NOT NULL,
  tienda TEXT NOT NULL,
  temporada TEXT NOT NULL CHECK (temporada IN ('caliente', 'frio', 'todos')),
  categoria TEXT NOT NULL CHECK (categoria IN ('todos', 'tejidos', 'tops', 'vestidos', 'pantalones', 'conjuntos')),
  colores TEXT[] DEFAULT '{}',
  tallas TEXT[] DEFAULT '{}',
  ventas_estimadas INTEGER DEFAULT 0,
  descripcion TEXT,
  trend_score DECIMAL(3,1) DEFAULT 7.0 CHECK (trend_score >= 1.0 AND trend_score <= 10.0),
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.productos_referencia ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: usuarios pueden ver y gestionar sus propios productos
CREATE POLICY "Usuarios pueden ver sus productos" 
ON public.productos_referencia 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden insertar sus productos" 
ON public.productos_referencia 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus productos" 
ON public.productos_referencia 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus productos" 
ON public.productos_referencia 
FOR DELETE 
USING (auth.uid() = user_id);

-- Índices para búsquedas rápidas
CREATE INDEX idx_productos_ref_tienda ON public.productos_referencia(tienda);
CREATE INDEX idx_productos_ref_temporada ON public.productos_referencia(temporada);
CREATE INDEX idx_productos_ref_categoria ON public.productos_referencia(categoria);
CREATE INDEX idx_productos_ref_user ON public.productos_referencia(user_id);