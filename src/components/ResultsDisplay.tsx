import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Download, Package } from "lucide-react";
import type { AnalysisResult } from "@/pages/Index";
import { useToast } from "@/hooks/use-toast";

const IMAGE_PROXY_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/image-proxy`;
const proxiedImage = (u?: string) => (u ? `${IMAGE_PROXY_BASE}?url=${encodeURIComponent(u)}` : "");
 
interface ResultsDisplayProps {
  results: AnalysisResult;
}

export const ResultsDisplay = ({ results }: ResultsDisplayProps) => {
  const { toast } = useToast();

  const handleExport = () => {
    // Función para escapar campos CSV correctamente
    const escapeCSV = (field: string) => {
      if (field.includes(',') || field.includes('"') || field.includes('\n')) {
        return `"${field.replace(/"/g, '""')}"`;
      }
      return field;
    };

    const csvRows = [
      // Encabezados
      ["Producto", "Precio", "Colores", "Tallas", "Score de Tendencia", "Recomendación", "Prioridad", "URL de Imagen"].join(","),
      // Datos de productos
      ...results.products.map(p => [
        escapeCSV(p.title),
        escapeCSV(p.price),
        escapeCSV(p.colors.join(", ")),
        escapeCSV(p.sizes.join(", ")),
        p.trend_score.toString(),
        escapeCSV(p.recommendation),
        escapeCSV(p.priority === "high" ? "Alta" : p.priority === "medium" ? "Media" : "Baja"),
        p.image || ""
      ].join(","))
    ];

    // Agregar líneas de resumen al final
    csvRows.push("");
    csvRows.push("RESUMEN");
    csvRows.push(`Total de productos analizados,${results.summary.total_products}`);
    csvRows.push(`Score promedio de tendencia,${results.summary.avg_trend_score}`);
    csvRows.push(`Productos recomendados para importar,${results.summary.recommended_import}`);
    csvRows.push(`URL analizada,${escapeCSV(results.url)}`);

    const csv = csvRows.join("\n");
    
    // Agregar BOM UTF-8 para mejor compatibilidad con Excel
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const timestamp = new Date().toISOString().slice(0, 10);
    a.download = `analisis-productos-${timestamp}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Exportado",
      description: "Lista de productos exportada exitosamente con formato mejorado",
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "medium": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "low": return "bg-gray-500/10 text-gray-500 border-gray-500/20";
      default: return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const makeAbsolute = (src?: string) => {
    if (!src) return "";
    let s = src.trim();
    // Protocol-relative
    if (s.startsWith("//")) s = "https:" + s;
    // Already absolute
    if (/^https?:\/\//i.test(s)) return s;
    try {
      return new URL(s, results.url).toString();
    } catch {
      return s;
    }
  };
 
  return (
    <section className="max-w-6xl mx-auto animate-fade-in">
      <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-6 border-2 border-primary/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Productos Analizados</p>
                <p className="text-2xl font-bold">{results.summary.total_products}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-2 border-secondary/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Score Promedio</p>
                <p className="text-2xl font-bold">{results.summary.avg_trend_score}/10</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-2 border-accent/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <Download className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Recomendados Importar</p>
                <p className="text-2xl font-bold">{results.summary.recommended_import}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex justify-end mb-6">
          <Button onClick={handleExport} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar Lista
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.products.map((product, index) => (
          <Card key={index} className="p-6 hover:shadow-xl transition-all border-2 hover:border-primary/30 relative">
            {product.source === "catalog" && (
              <Badge className="absolute top-2 right-2 bg-purple-500/10 text-purple-500 border-purple-500/20">
                Catálogo
              </Badge>
            )}
            {product.image && (
              <div className="mb-4 rounded-lg overflow-hidden bg-muted aspect-square">
                <img
                  src={proxiedImage(makeAbsolute(product.image))}
                  alt={product.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const direct = makeAbsolute(product.image);
                    if (e.currentTarget.dataset.fallback !== "direct" && direct) {
                      e.currentTarget.dataset.fallback = "direct";
                      e.currentTarget.src = direct;
                    } else {
                      e.currentTarget.src = "/placeholder.svg";
                    }
                  }}
                />
              </div>
            )}
            
            <div className="flex items-start justify-between mb-4">
              <Badge className={getPriorityColor(product.priority)}>
                {product.priority === "high" ? "Alta" : product.priority === "medium" ? "Media" : "Baja"}
              </Badge>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-primary">{product.trend_score}/10</span>
              </div>
            </div>

            <h3 className="font-semibold mb-2 line-clamp-2">{product.title}</h3>
            <p className="text-2xl font-bold text-primary mb-3">{product.price}</p>
            
            <div className="space-y-3 text-sm mb-3">
              <div>
                <span className="text-muted-foreground block mb-1">Colores:</span>
                <div className="flex flex-wrap gap-1">
                  {product.colors.map((color, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {color}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <span className="text-muted-foreground block mb-1">Tallas:</span>
                <div className="flex flex-wrap gap-1">
                  {product.sizes.map((size, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {size}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground pt-3 border-t">
              {product.recommendation}
            </p>
          </Card>
        ))}
      </div>
    </section>
  );
};
