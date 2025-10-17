import { useState } from "react";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { AnalysisForm } from "@/components/AnalysisForm";
import { ResultsDisplay } from "@/components/ResultsDisplay";
import { Sparkles } from "lucide-react";

export interface AnalysisResult {
  url: string;
  products: {
    title: string;
    price: string;
    trend_score: number;
    sales_estimate: string;
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        <header className="flex items-center justify-center gap-2 mb-12">
          <Sparkles className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            ImportAI
          </h1>
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
