import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { AnalysisResult } from "@/pages/Index";

interface AnalysisFormProps {
  onResults: (results: AnalysisResult) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (value: boolean) => void;
}

export const AnalysisForm = ({ onResults, isAnalyzing, setIsAnalyzing }: AnalysisFormProps) => {
  const [url, setUrl] = useState("");
  const [season, setSeason] = useState("caliente");
  const [categories, setCategories] = useState("todos");
  const { toast } = useToast();

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa una URL válida",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-products", {
        body: { url, season, categories },
      });

      if (error) throw error;

      onResults(data);
      toast({
        title: "Análisis Completo",
        description: `Se analizaron ${data.summary.total_products} productos`,
      });
    } catch (error: any) {
      console.error("Error analyzing:", error);
      toast({
        title: "Error",
        description: error.message || "Error al analizar la tienda",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <section className="max-w-3xl mx-auto mb-16">
      <div className="backdrop-blur-sm bg-card/50 rounded-3xl p-8 border border-border shadow-xl">
        <form onSubmit={handleAnalyze} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="url" className="text-sm font-medium">
              URL de la Tienda
            </label>
            <div className="relative">
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.shein.com/..."
                className="pr-12 h-12 text-lg"
                disabled={isAnalyzing}
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">
              Ingresa la URL de cualquier categoría o producto de Shein u otras tiendas
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="season" className="text-sm font-medium">
                Temporada / Clima
              </Label>
              <Select value={season} onValueChange={setSeason} disabled={isAnalyzing}>
                <SelectTrigger id="season" className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="caliente">🌞 Clima Caliente (Primavera/Verano)</SelectItem>
                  <SelectItem value="frio">❄️ Clima Frío (Otoño/Invierno)</SelectItem>
                  <SelectItem value="todos">🌈 Todas las Temporadas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categories" className="text-sm font-medium">
                Categorías Preferidas
              </Label>
              <Select value={categories} onValueChange={setCategories} disabled={isAnalyzing}>
                <SelectTrigger id="categories" className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas las Categorías</SelectItem>
                  <SelectItem value="tejidos">🧶 Prendas Tejidas</SelectItem>
                  <SelectItem value="tops">👕 Tops y Blusas</SelectItem>
                  <SelectItem value="vestidos">👗 Vestidos</SelectItem>
                  <SelectItem value="pantalones">👖 Pantalones</SelectItem>
                  <SelectItem value="conjuntos">💫 Conjuntos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isAnalyzing}
            className="w-full h-12 text-lg bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Analizando con IA...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Analizar Productos
              </>
            )}
          </Button>
        </form>
      </div>
    </section>
  );
};
