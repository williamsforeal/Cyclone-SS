import { BookOpen, Bot, Search, Palette, BarChart3, Workflow, Zap } from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { LucideIcon } from "lucide-react";

interface Service {
  id: number;
  icon: LucideIcon;
  name: string;
  description: string;
  price: string;
  timeline: string;
  deliverables: string[];
}

const sampleServices: Service[] = [
  {
    id: 1,
    icon: Bot,
    name: "E-Commerce Chatbot",
    description: "AI-powered customer service bot with natural language understanding, product recommendations, and seamless handoff to human agents.",
    price: "From $3,500",
    timeline: "3-4 weeks",
    deliverables: ["Chatbot setup", "FAQ training", "Integration", "Analytics"],
  },
  {
    id: 2,
    icon: Search,
    name: "Lead Qualification System",
    description: "Automated lead scoring and routing system that qualifies inbound leads and routes them to the right sales team member in real-time.",
    price: "From $4,000",
    timeline: "2-3 weeks",
    deliverables: ["Scoring model", "CRM integration", "Alerts", "Reports"],
  },
  {
    id: 3,
    icon: Palette,
    name: "Ad Creative Automation",
    description: "End-to-end ad generation pipeline from concept ideation to image prompt creation with built-in A/B testing and performance analytics.",
    price: "From $8,000",
    timeline: "4-6 weeks",
    deliverables: ["Concept generation", "Image prompts", "A/B testing", "Analytics"],
  },
  {
    id: 4,
    icon: BarChart3,
    name: "Reporting Dashboard",
    description: "Custom analytics and reporting dashboard with automated data integration, scheduled reports, and interactive visualizations.",
    price: "From $2,500",
    timeline: "1-2 weeks",
    deliverables: ["Dashboard design", "Data integration", "Automated reports"],
  },
  {
    id: 5,
    icon: Workflow,
    name: "Marketing Ops Audit",
    description: "Full marketing operations review including current state assessment, gap analysis, and a detailed implementation roadmap.",
    price: "From $1,500",
    timeline: "1 week",
    deliverables: ["Current state audit", "Recommendations", "Implementation roadmap"],
  },
  {
    id: 6,
    icon: Zap,
    name: "Workflow Automation",
    description: "Custom n8n workflow builds tailored to your business processes with full integration, testing, and documentation.",
    price: "From $2,000",
    timeline: "1-3 weeks",
    deliverables: ["Workflow design", "Integration", "Testing", "Documentation"],
  },
];

export default function ServiceCatalog() {
  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-muted-foreground" />
            <h1 className="text-2xl font-bold font-heading tracking-tight" data-testid="text-page-title">
              Service Catalog
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1" data-testid="text-page-subtitle">
            {sampleServices.length} services offered
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sampleServices.map((service) => (
            <Card key={service.id} className="hover-elevate" data-testid={`card-service-${service.id}`}>
              <CardContent className="p-5 space-y-4">
                <service.icon className="h-8 w-8 text-primary" />
                <CardTitle className="text-base" data-testid={`text-service-name-${service.id}`}>
                  {service.name}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{service.description}</p>

                <Badge variant="secondary" className="no-default-hover-elevate font-mono" data-testid={`badge-price-${service.id}`}>
                  {service.price}
                </Badge>

                <ul className="space-y-1.5">
                  {service.deliverables.map((item, index) => (
                    <li key={item} className="flex items-center gap-2 text-sm" data-testid={`text-deliverable-${service.id}-${index}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>

                <Badge variant="outline" className="no-default-hover-elevate" data-testid={`badge-timeline-${service.id}`}>
                  {service.timeline}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}
