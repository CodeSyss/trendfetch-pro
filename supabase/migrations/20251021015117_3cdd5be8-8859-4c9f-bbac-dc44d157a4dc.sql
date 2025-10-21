-- Hacer user_id nullable ya que ahora será público
ALTER TABLE public.productos_referencia ALTER COLUMN user_id DROP NOT NULL;

-- Eliminar políticas RLS existentes
DROP POLICY IF EXISTS "Usuarios pueden ver sus productos" ON public.productos_referencia;
DROP POLICY IF EXISTS "Usuarios pueden insertar sus productos" ON public.productos_referencia;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus productos" ON public.productos_referencia;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus productos" ON public.productos_referencia;

-- Crear nuevas políticas públicas
CREATE POLICY "Permitir lectura pública"
ON public.productos_referencia
FOR SELECT
TO public
USING (true);

CREATE POLICY "Permitir inserción pública"
ON public.productos_referencia
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Permitir actualización pública"
ON public.productos_referencia
FOR UPDATE
TO public
USING (true);

CREATE POLICY "Permitir eliminación pública"
ON public.productos_referencia
FOR DELETE
TO public
USING (true);