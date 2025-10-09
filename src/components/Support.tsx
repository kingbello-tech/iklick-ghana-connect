import { Clock, Wrench, UserCheck } from "lucide-react";

const supportFeatures = [
  {
    icon: Clock,
    title: "24/7 Network Operating Center",
    description: "Our dedicated NOC team is available round the clock to address any issues promptly at all times, ensuring uninterrupted service."
  },
  {
    icon: Wrench,
    title: "Regular Maintenance",
    description: "Proactive maintenance checks are conducted regularly to ensure continuous functionality and optimal performance of all services."
  },
  {
    icon: UserCheck,
    title: "Dedicated Account Managers",
    description: "Every client receives a dedicated Technical Account Manager for personalized support and streamlined communication."
  }
];

const Support = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            World-Class <span className="gradient-text">Technical Support</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Expert assistance when you need it, backed by cutting-edge infrastructure
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {supportFeatures.map((feature, index) => (
            <div
              key={index}
              className="p-8 rounded-2xl bg-card/50 backdrop-blur-sm border border-border hover:border-primary/50 transition-all duration-300 glow-card animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6 mx-auto">
                <feature.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-center">{feature.title}</h3>
              <p className="text-muted-foreground text-center leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Support;
