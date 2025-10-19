import { BarChart3, Globe, Zap, Shield } from "lucide-react";

export const Features = () => {
  const features = [
    {
      icon: BarChart3,
      title: "Análisis Inteligente de Ropa",
      description: "Extrae productos reales de cualquier tienda online con IA"
    },
    {
      icon: Globe,
      title: "Extracción de Datos Reales",
      description: "Imágenes, precios, colores y tallas directamente de la página"
    },
    {
      icon: Zap,
      title: "Evaluación de Tendencias",
      description: "Score de moda y prioridad basados en análisis de mercado"
    },
    {
      icon: Shield,
      title: "Solo Ropa Femenina",
      description: "Filtrado automático para enfocarse en tu nicho específico"
    }
  ];

  return (
    <section className="max-w-6xl mx-auto mb-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">¿Por qué ImportAI?</h2>
        <p className="text-muted-foreground">
          La herramienta más avanzada para distribuidores inteligentes
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div 
              key={index}
              className="p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all group"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold mb-2 text-lg">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
