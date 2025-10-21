import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProductoReferencia {
  id: string;
  titulo: string;
  precio: string;
  imagen_url: string;
  tienda: string;
  temporada: string;
  categoria: string;
  colores: string[];
  tallas: string[];
  ventas_estimadas: number;
  descripcion: string | null;
  trend_score: number;
  notas: string | null;
}

export const AdminPanel = () => {
  const [loading, setLoading] = useState(false);
  const [productos, setProductos] = useState<ProductoReferencia[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    titulo: "",
    precio: "",
    imagen_url: "",
    tienda: "shein",
    temporada: "todos",
    categoria: "todos",
    colores: "",
    tallas: "",
    ventas_estimadas: "",
    descripcion: "",
    trend_score: "7.0",
    notas: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const coloresArray = formData.colores ? formData.colores.split(",").map(c => c.trim()) : [];
      const tallasArray = formData.tallas ? formData.tallas.split(",").map(t => t.trim()) : [];

      const { error } = await supabase
        .from("productos_referencia")
        .insert({
          titulo: formData.titulo,
          precio: formData.precio,
          imagen_url: formData.imagen_url,
          tienda: formData.tienda,
          temporada: formData.temporada,
          categoria: formData.categoria,
          colores: coloresArray,
          tallas: tallasArray,
          ventas_estimadas: parseInt(formData.ventas_estimadas) || 0,
          descripcion: formData.descripcion || null,
          trend_score: parseFloat(formData.trend_score),
          notas: formData.notas || null
        });

      if (error) throw error;

      toast.success("Producto agregado exitosamente");
      
      // Limpiar formulario
      setFormData({
        titulo: "",
        precio: "",
        imagen_url: "",
        tienda: "shein",
        temporada: "todos",
        categoria: "todos",
        colores: "",
        tallas: "",
        ventas_estimadas: "",
        descripcion: "",
        trend_score: "7.0",
        notas: ""
      });

      loadProductos();
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("Error al agregar producto: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadProductos = async () => {
    setLoadingList(true);
    try {
      const { data, error } = await supabase
        .from("productos_referencia")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProductos(data || []);
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("Error al cargar productos");
    } finally {
      setLoadingList(false);
    }
  };

  const deleteProducto = async (id: string) => {
    try {
      const { error } = await supabase
        .from("productos_referencia")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Producto eliminado");
      loadProductos();
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("Error al eliminar producto");
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <Button onClick={() => navigate('/')} variant="outline" className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Volver al Análisis
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Agregar Producto de Referencia
          </CardTitle>
          <CardDescription>
            Agrega productos exitosos de tus tiendas favoritas para mejorar el análisis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título del Producto *</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                  required
                  placeholder="Ej: Vestido tejido rayado"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="precio">Precio *</Label>
                <Input
                  id="precio"
                  value={formData.precio}
                  onChange={(e) => setFormData({...formData, precio: e.target.value})}
                  required
                  placeholder="Ej: $25.99"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="imagen_url">URL de Imagen *</Label>
                <Input
                  id="imagen_url"
                  type="url"
                  value={formData.imagen_url}
                  onChange={(e) => setFormData({...formData, imagen_url: e.target.value})}
                  required
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tienda">Tienda *</Label>
                <Input
                  id="tienda"
                  value={formData.tienda}
                  onChange={(e) => setFormData({...formData, tienda: e.target.value})}
                  required
                  placeholder="Ej: shein, baku, zara"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="temporada">Temporada *</Label>
                <Select value={formData.temporada} onValueChange={(v) => setFormData({...formData, temporada: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas</SelectItem>
                    <SelectItem value="caliente">Clima Caliente</SelectItem>
                    <SelectItem value="frio">Clima Frío</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoria">Categoría *</Label>
                <Select value={formData.categoria} onValueChange={(v) => setFormData({...formData, categoria: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas</SelectItem>
                    <SelectItem value="tejidos">Tejidos</SelectItem>
                    <SelectItem value="tops">Tops</SelectItem>
                    <SelectItem value="vestidos">Vestidos</SelectItem>
                    <SelectItem value="pantalones">Pantalones</SelectItem>
                    <SelectItem value="conjuntos">Conjuntos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="colores">Colores (separados por comas)</Label>
                <Input
                  id="colores"
                  value={formData.colores}
                  onChange={(e) => setFormData({...formData, colores: e.target.value})}
                  placeholder="Ej: Negro, Blanco, Beige"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tallas">Tallas (separadas por comas)</Label>
                <Input
                  id="tallas"
                  value={formData.tallas}
                  onChange={(e) => setFormData({...formData, tallas: e.target.value})}
                  placeholder="Ej: S, M, L, XL"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ventas_estimadas">Ventas Estimadas</Label>
                <Input
                  id="ventas_estimadas"
                  type="number"
                  value={formData.ventas_estimadas}
                  onChange={(e) => setFormData({...formData, ventas_estimadas: e.target.value})}
                  placeholder="Ej: 1500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trend_score">Puntaje de Tendencia (1-10)</Label>
                <Input
                  id="trend_score"
                  type="number"
                  step="0.1"
                  min="1"
                  max="10"
                  value={formData.trend_score}
                  onChange={(e) => setFormData({...formData, trend_score: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                placeholder="Descripción del producto..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notas">Notas Personales</Label>
              <Textarea
                id="notas"
                value={formData.notas}
                onChange={(e) => setFormData({...formData, notas: e.target.value})}
                placeholder="Notas sobre por qué este producto fue exitoso..."
                rows={2}
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Agregando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Producto
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Mis Productos de Referencia</CardTitle>
            <CardDescription>
              {productos.length} productos agregados
            </CardDescription>
          </div>
          <Button onClick={loadProductos} variant="outline" disabled={loadingList}>
            {loadingList ? <Loader2 className="w-4 h-4 animate-spin" /> : "Recargar"}
          </Button>
        </CardHeader>
        <CardContent>
          {loadingList ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : productos.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay productos aún. ¡Agrega tu primer producto arriba!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {productos.map((producto) => (
                <Card key={producto.id}>
                  <CardContent className="p-4">
                    <img 
                      src={producto.imagen_url} 
                      alt={producto.titulo}
                      className="w-full h-48 object-cover rounded mb-3"
                    />
                    <h3 className="font-semibold mb-2">{producto.titulo}</h3>
                    <div className="text-sm space-y-1 text-muted-foreground">
                      <p>💰 {producto.precio}</p>
                      <p>🏪 {producto.tienda}</p>
                      <p>🌡️ {producto.temporada}</p>
                      <p>👗 {producto.categoria}</p>
                      {producto.ventas_estimadas > 0 && (
                        <p>📊 {producto.ventas_estimadas} ventas</p>
                      )}
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full mt-3"
                      onClick={() => deleteProducto(producto.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Eliminar
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};