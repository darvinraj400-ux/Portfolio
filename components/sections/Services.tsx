import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Reveal from "@/components/layout/Reveal";

const SERVICES = [
  {
    title: "Full-stack development",
    body: "End-to-end product engineering: schema, API, front-end, deployment. Next.js, TypeScript, Postgres, Vercel.",
  },
  {
    title: "AI integration",
    body: "RAG pipelines, structured extraction, streaming chat. The LLM where it earns its place, plain code everywhere else.",
  },
  {
    title: "API & backend",
    body: "REST and GraphQL services, auth, rate limiting, job queues. Designed for the failure cases, not the happy path.",
  },
  {
    title: "Technical consulting",
    body: "Short engagements: architecture review, code audit, migration planning. Fixed scope, fixed fee.",
  },
] as const;

export default function Services() {
  return (
    <section
      id="services"
      aria-label="Services"
      className="scroll-mt-14 px-6 py-24 sm:py-32"
    >
      <Reveal className="mx-auto w-full max-w-5xl">
        <h2
          data-reveal
          className="text-sm font-medium tracking-widest text-muted-foreground uppercase"
        >
          Services
        </h2>
        <p data-reveal className="mt-4 text-lg text-muted-foreground">
          How I work with teams.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {SERVICES.map((service) => (
            <Card key={service.title} data-reveal>
              <CardHeader>
                <CardTitle>{service.title}</CardTitle>
                <CardDescription>{service.body}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
