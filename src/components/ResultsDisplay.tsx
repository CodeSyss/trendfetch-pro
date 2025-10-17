import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Download, Package } from "lucide-react";
import type { AnalysisResult } from "@/pages/Index";
import { useToast } from "@/hooks/use-toast";

interface ResultsDisplayProps {
  results: AnalysisResult;
}

export const ResultsDisplay = ({ results }: ResultsDisplayProps) => {
  const { toast } = useToast();

  const handleExport = () => {
    const csv = [
      ["Producto", "Precio", "Score de Tendencia", "Ventas Estimadas", "Recomendación", "Prioridad"],
      ...results.products.map(p => [
        p.title,
        p.price,
        p.trend_score.toString(),
        p.sales_estimate,
        p.recommendation,
        p.priority
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "analisis-productos.csv";
    a.click();

    toast({
      title: "Exportado",
      description: "Lista de productos exportada exitosamente",
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
          <Card key={index} className="p-6 hover:shadow-xl transition-all border-2 hover:border-primary/30">
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
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ventas estimadas:</span>
                <span className="font-medium">{product.sales_estimate}</span>
              </div>
              <p className="text-xs text-muted-foreground pt-2 border-t">
                {product.recommendation}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
};
