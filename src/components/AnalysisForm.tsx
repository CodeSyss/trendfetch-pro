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
  const [url1, setUrl1] = useState("");
  const [url2, setUrl2] = useState("");
  const [url3, setUrl3] = useState("");
  const [season, setSeason] = useState("caliente");
  const [categories, setCategories] = useState("todos");
  const [language, setLanguage] = useState("es");
  const { toast } = useToast();

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const urls = [url1, url2, url3].filter(u => u.trim());
    
    if (urls.length === 0) {
      toast({
        title: "Error",
        description: "Por favor ingresa al menos una URL válida",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-products", {
        body: { urls, season, categories, language },
      });

      if (error) throw error;

      onResults(data);
      
      const messages = {
        es: {
          title: "Análisis Completo",
          description: `Se analizaron ${data.summary.total_products} productos de ${urls.length} tienda${urls.length > 1 ? 's' : ''}`,
        },
        en: {
          title: "Analysis Complete",
          description: `Analyzed ${data.summary.total_products} products from ${urls.length} store${urls.length > 1 ? 's' : ''}`,
        },
        zh: {
          title: "分析完成",
          description: `已分析 ${urls.length} 家商店的 ${data.summary.total_products} 件产品`,
        }
      };
      
      toast(messages[language as keyof typeof messages]);
    } catch (error: any) {
      console.error("Error analyzing:", error);
      
      const errorMessages = {
        es: { title: "Error", description: error.message || "Error al analizar las tiendas" },
        en: { title: "Error", description: error.message || "Error analyzing stores" },
        zh: { title: "错误", description: error.message || "分析商店时出错" }
      };
      
      toast({
        ...errorMessages[language as keyof typeof errorMessages],
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
          <div className="space-y-4">
            <label className="text-sm font-medium">
              URLs de Tiendas (1-3 tiendas)
            </label>
            
            <div className="space-y-3">
              <div className="relative">
                <Input
                  type="url"
                  value={url1}
                  onChange={(e) => setUrl1(e.target.value)}
                  placeholder="URL Tienda 1 (obligatoria)"
                  className="pr-12 h-12"
                  disabled={isAnalyzing}
                />
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              </div>
              
              <div className="relative">
                <Input
                  type="url"
                  value={url2}
                  onChange={(e) => setUrl2(e.target.value)}
                  placeholder="URL Tienda 2 (opcional)"
                  className="pr-12 h-12"
                  disabled={isAnalyzing}
                />
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              </div>
              
              <div className="relative">
                <Input
                  type="url"
                  value={url3}
                  onChange={(e) => setUrl3(e.target.value)}
                  placeholder="URL Tienda 3 (opcional)"
                  className="pr-12 h-12"
                  disabled={isAnalyzing}
                />
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Analiza hasta 3 tiendas simultáneamente. Mínimo 10 productos por tienda.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="language" className="text-sm font-medium">
                🌍 Idioma / Language / 语言
              </Label>
              <Select value={language} onValueChange={setLanguage} disabled={isAnalyzing}>
                <SelectTrigger id="language" className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="es">🇪🇸 Español</SelectItem>
                  <SelectItem value="en">🇺🇸 English</SelectItem>
                  <SelectItem value="zh">🇨🇳 中文</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="season" className="text-sm font-medium">
                {language === "es" ? "Temporada / Clima" : language === "en" ? "Season / Climate" : "季节 / 气候"}
              </Label>
              <Select value={season} onValueChange={setSeason} disabled={isAnalyzing}>
                <SelectTrigger id="season" className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="caliente">
                    {language === "es" ? "🌞 Clima Caliente (Primavera/Verano)" : 
                     language === "en" ? "🌞 Hot Climate (Spring/Summer)" : 
                     "🌞 炎热气候 (春夏)"}
                  </SelectItem>
                  <SelectItem value="frio">
                    {language === "es" ? "❄️ Clima Frío (Otoño/Invierno)" : 
                     language === "en" ? "❄️ Cold Climate (Fall/Winter)" : 
                     "❄️ 寒冷气候 (秋冬)"}
                  </SelectItem>
                  <SelectItem value="todos">
                    {language === "es" ? "🌈 Todas las Temporadas" : 
                     language === "en" ? "🌈 All Seasons" : 
                     "🌈 所有季节"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categories" className="text-sm font-medium">
                {language === "es" ? "Categorías Preferidas" : language === "en" ? "Preferred Categories" : "首选类别"}
              </Label>
              <Select value={categories} onValueChange={setCategories} disabled={isAnalyzing}>
                <SelectTrigger id="categories" className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">
                    {language === "es" ? "Todas las Categorías" : language === "en" ? "All Categories" : "所有类别"}
                  </SelectItem>
                  <SelectItem value="tejidos">🧶 {language === "es" ? "Prendas Tejidas" : language === "en" ? "Knitted Garments" : "针织服装"}</SelectItem>
                  <SelectItem value="tops">👕 {language === "es" ? "Tops y Blusas" : language === "en" ? "Tops & Blouses" : "上衣和衬衫"}</SelectItem>
                  <SelectItem value="vestidos">👗 {language === "es" ? "Vestidos" : language === "en" ? "Dresses" : "连衣裙"}</SelectItem>
                  <SelectItem value="pantalones">👖 {language === "es" ? "Pantalones" : language === "en" ? "Pants" : "裤子"}</SelectItem>
                  <SelectItem value="conjuntos">💫 {language === "es" ? "Conjuntos" : language === "en" ? "Sets" : "套装"}</SelectItem>
                  <SelectItem value="vacaciones">🏖️ {language === "es" ? "Ropa de Vacaciones" : language === "en" ? "Vacation Wear" : "度假服装"}</SelectItem>
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
                {language === "es" ? "Analizando con IA..." : 
                 language === "en" ? "Analyzing with AI..." : 
                 "正在使用 AI 分析..."}
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                {language === "es" ? "Analizar Productos" : 
                 language === "en" ? "Analyze Products" : 
                 "分析产品"}
              </>
            )}
          </Button>
        </form>
      </div>
    </section>
  );
};
