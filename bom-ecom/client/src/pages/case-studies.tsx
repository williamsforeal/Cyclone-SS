import { Award, TrendingUp, Users, Clock, ArrowRight, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { KpiCard } from "@/components/kpi-card";

interface CaseStudy {
  id: number;
  client: string;
  industry: string;
  title: string;
  challenge: string;
  solution: string;
  results: { label: string; value: string; improvement: string }[];
  services: string[];
  duration: string;
  testimonial?: string;
}

const caseStudies: CaseStudy[] = [
  {
    id: 1,
    client: "GlowSkin Co.",
    industry: "Beauty & Skincare",
    title: "3.2x ROAS Improvement Through AI-Powered Ad Creative Pipeline",
    challenge: "GlowSkin was spending $15k/month on ads with a 1.4x ROAS. Their creative team was manually producing 5-10 ad variants per week, leading to creative fatigue and declining performance.",
    solution: "Implemented an end-to-end ad creative automation pipeline using n8n workflows. Built automated competitor ad scraping, AI-driven concept generation with avatar/angle matching, and a bulk approval system for rapid creative iteration.",
    results: [
      { label: "ROAS", value: "3.2x", improvement: "+128%" },
      { label: "Creatives/Week", value: "45", improvement: "+350%" },
      { label: "Cost per Lead", value: "$4.20", improvement: "-62%" },
      { label: "Monthly Revenue", value: "$48K", improvement: "+85%" },
    ],
    services: ["Ad Creative Automation", "Workflow Automation", "Reporting Dashboard"],
    duration: "6 weeks",
    testimonial: "The AI pipeline completely transformed our ad operations. We went from scrambling for new creatives to having a systematic approach that consistently outperforms.",
  },
  {
    id: 2,
    client: "FitFuel Inc.",
    industry: "Health & Supplements",
    title: "Automated Support System Reduced Response Times by 78%",
    challenge: "FitFuel was handling 200+ support tickets weekly with a 3-person team. Average response time was 11 hours, leading to poor CSAT scores and high churn among subscription customers.",
    solution: "Deployed an AI-powered support triage system with automated FAQ responses, smart ticket routing, and a self-service portal. Integrated with their existing Shopify and subscription management tools.",
    results: [
      { label: "Avg Response", value: "2.4h", improvement: "-78%" },
      { label: "CSAT Score", value: "4.7/5", improvement: "+0.9" },
      { label: "Auto-Resolved", value: "42%", improvement: "New" },
      { label: "Churn Rate", value: "3.1%", improvement: "-45%" },
    ],
    services: ["E-Commerce Chatbot", "Workflow Automation", "Lead Qualification System"],
    duration: "4 weeks",
    testimonial: "Our support team can now focus on complex issues while the bot handles repetitive questions instantly. Customer satisfaction has never been higher.",
  },
  {
    id: 3,
    client: "PureVita Labs",
    industry: "Wellness & Nutrition",
    title: "Marketing Ops Overhaul Driving 2.1x Revenue Growth",
    challenge: "PureVita had no centralized marketing operations. Data lived in spreadsheets, ad performance was tracked manually, and there was no systematic approach to product research or creative testing.",
    solution: "Built a complete marketing operations infrastructure including a custom dashboard, automated metrics ingestion from ad platforms, product research pipeline with 9-criteria scoring, and weekly automated performance reports.",
    results: [
      { label: "Revenue Growth", value: "2.1x", improvement: "+110%" },
      { label: "Time Saved", value: "25h/wk", improvement: "Automated" },
      { label: "Products Launched", value: "4", improvement: "+300%" },
      { label: "Data Accuracy", value: "99.2%", improvement: "+34%" },
    ],
    services: ["Marketing Ops Audit", "Reporting Dashboard", "Workflow Automation", "Ad Creative Automation"],
    duration: "8 weeks",
  },
  {
    id: 4,
    client: "NovaPet Supplies",
    industry: "Pet Products",
    title: "Competitor Intelligence System Uncovered $120K in New Revenue",
    challenge: "NovaPet was losing market share to competitors running aggressive TikTok ad campaigns. They had no visibility into competitor strategies, winning angles, or trending products in their niche.",
    solution: "Built an automated competitor ad scraping and analysis system. Integrated TikTok trends monitoring, competitor creative analysis with pattern extraction, and an automated weekly briefing for the marketing team.",
    results: [
      { label: "New Revenue", value: "$120K", improvement: "6 months" },
      { label: "Market Share", value: "+8%", improvement: "vs prev year" },
      { label: "Winning Hooks", value: "23", improvement: "Identified" },
      { label: "Time to Launch", value: "3 days", improvement: "-70%" },
    ],
    services: ["Ad Creative Automation", "Reporting Dashboard"],
    duration: "3 weeks",
    testimonial: "Being able to see exactly what our competitors are running and automatically generate our own variations was a game-changer. We went from reactive to proactive.",
  },
];

export default function CaseStudies() {
  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6" data-testid="page-case-studies">
        <div>
          <div className="flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold font-heading tracking-tight" data-testid="page-title-case-studies">
              Case Studies
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1" data-testid="text-subtitle">
            {caseStudies.length} client success stories
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="case-studies-kpi-row">
          <KpiCard title="Clients Served" value="12" icon={Users} subtitle="since launch" />
          <KpiCard title="Avg ROAS Lift" value="+145%" icon={TrendingUp} subtitle="across clients" />
          <KpiCard title="Hours Automated" value="380+" icon={Clock} subtitle="weekly total" />
          <KpiCard title="Client Retention" value="96%" icon={Award} subtitle="renewal rate" />
        </div>

        <div className="space-y-6">
          {caseStudies.map((cs) => (
            <Card key={cs.id} data-testid={`card-case-study-${cs.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-primary" data-testid={`text-cs-client-${cs.id}`}>{cs.client}</span>
                      <Badge variant="outline" className="no-default-hover-elevate no-default-active-elevate text-[10px]" data-testid={`badge-cs-industry-${cs.id}`}>
                        {cs.industry}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg font-heading leading-snug" data-testid={`text-cs-title-${cs.id}`}>
                      {cs.title}
                    </CardTitle>
                  </div>
                  <Badge variant="secondary" className="no-default-hover-elevate no-default-active-elevate shrink-0" data-testid={`badge-cs-duration-${cs.id}`}>
                    <Clock className="h-3 w-3 mr-1" />
                    {cs.duration}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {cs.results.map((r, i) => (
                    <Card key={r.label}>
                      <CardContent className="p-3 text-center">
                        <p className="text-[10px] text-muted-foreground">{r.label}</p>
                        <p className="text-xl font-bold font-mono mt-0.5" data-testid={`text-cs-result-value-${cs.id}-${i}`}>{r.value}</p>
                        <p className="text-xs text-primary font-medium font-mono" data-testid={`text-cs-result-change-${cs.id}-${i}`}>{r.improvement}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Challenge</p>
                    <p className="text-sm text-muted-foreground leading-relaxed" data-testid={`text-cs-challenge-${cs.id}`}>{cs.challenge}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Solution</p>
                    <p className="text-sm text-muted-foreground leading-relaxed" data-testid={`text-cs-solution-${cs.id}`}>{cs.solution}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground">Services:</span>
                  {cs.services.map((svc, svcIdx) => (
                    <Badge key={svc} variant="outline" className="no-default-hover-elevate no-default-active-elevate text-[10px]" data-testid={`badge-cs-service-${cs.id}-${svcIdx}`}>
                      {svc}
                    </Badge>
                  ))}
                </div>

                {cs.testimonial && (
                  <div className="border-l-2 border-primary/30 pl-4 py-1">
                    <p className="text-sm italic text-muted-foreground" data-testid={`text-cs-testimonial-${cs.id}`}>
                      "{cs.testimonial}"
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">-- {cs.client}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}
