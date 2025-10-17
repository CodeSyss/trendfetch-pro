import { TrendingUp, Sparkles, ShoppingBag } from "lucide-react";

export const Hero = () => {
  return (
    <section className="text-center mb-16 animate-fade-in">
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6 border border-primary/20">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-primary">Análisis Inteligente con IA</span>
      </div>
      
      <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
        Importa los Mejores Productos
      </h2>
      
      <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
        Analiza tiendas online y descubre qué productos importar con inteligencia artificial. 
        Identifica tendencias, productos más vendidos y optimiza tu inventario.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12">
        <div className="p-6 rounded-2xl bg-card border border-border hover:shadow-lg transition-all">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 mx-auto">
            <TrendingUp className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-semibold mb-2">Detecta Tendencias</h3>
          <p className="text-sm text-muted-foreground">
            Identifica productos con mayor potencial de venta
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border hover:shadow-lg transition-all">
          <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-4 mx-auto">
            <Sparkles className="w-6 h-6 text-secondary" />
          </div>
          <h3 className="font-semibold mb-2">Análisis con IA</h3>
          <p className="text-sm text-muted-foreground">
            Recomendaciones basadas en datos e inteligencia artificial
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border hover:shadow-lg transition-all">
          <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 mx-auto">
            <ShoppingBag className="w-6 h-6 text-accent" />
          </div>
          <h3 className="font-semibold mb-2">Lista de Pedidos</h3>
          <p className="text-sm text-muted-foreground">
            Genera listas optimizadas para importación
          </p>
        </div>
      </div>
    </section>
  );
};
