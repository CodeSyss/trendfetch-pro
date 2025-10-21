import { useState } from "react";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { AnalysisForm } from "@/components/AnalysisForm";
import { ResultsDisplay } from "@/components/ResultsDisplay";
import { Sparkles, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export interface AnalysisResult {
  url: string;
  products: {
    title: string;
    price: string;
    colors: string[];
    sizes: string[];
    image?: string;
    trend_score: number;
    recommendation: string;
    priority: "high" | "medium" | "low";
  }[];
  summary: {
    total_products: number;
    avg_trend_score: number;
    recommended_import: number;
  };
}

const Index = () => {
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              ImportAI
            </h1>
          </div>
          <Button onClick={() => navigate('/admin')} variant="outline" className="gap-2">
            <Settings className="w-4 h-4" />
            Mis Productos
          </Button>
        </header>

        <Hero />
        <Features />
        
        <AnalysisForm 
          onResults={setResults} 
          isAnalyzing={isAnalyzing}
          setIsAnalyzing={setIsAnalyzing}
        />
        
        {results && <ResultsDisplay results={results} />}
      </div>
    </div>
  );
};

export default Index;
