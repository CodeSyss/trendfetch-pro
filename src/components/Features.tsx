import { BarChart3, Globe, Zap, Shield } from "lucide-react";

export const Features = () => {
  const features = [
    {
      icon: BarChart3,
      title: "Análisis de Datos en Tiempo Real",
      description: "Procesa miles de productos instantáneamente con IA avanzada"
    },
    {
      icon: Globe,
      title: "Soporte Multi-Tienda",
      description: "Compatible con Shein, AliExpress y más tiendas populares"
    },
    {
      icon: Zap,
      title: "Resultados Instantáneos",
      description: "Obtén recomendaciones en segundos, no en horas"
    },
    {
      icon: Shield,
      title: "Datos Confiables",
      description: "Algoritmos probados con +10,000 análisis exitosos"
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
