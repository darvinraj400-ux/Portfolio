import { ArrowUpRight } from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PRODUCT_PROJECTS as products } from "@/lib/constants";
import Reveal from "@/components/layout/Reveal";

export default function Products() {
  return (
    <section
      id="products"
      aria-label="Selected work"
      className="scroll-mt-14 px-6 py-24 sm:py-32"
    >
      <Reveal className="mx-auto w-full max-w-5xl">
        <h2 data-reveal className="font-serif text-3xl tracking-tight text-foreground sm:text-4xl">
          Selected work
        </h2>
        <div className="mt-10 flex flex-col gap-6">
          {products.map((project) => (
            <div
              key={project.slug}
              data-palette={project.palette}
              className="w-full"
            >
              <Card data-reveal>
                <CardHeader>
                  <CardTitle>{project.name}</CardTitle>
                  <CardDescription>{project.oneLiner}</CardDescription>
                </CardHeader>
                <div className="flex flex-wrap items-center gap-4 px-6 pb-6">
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    Live site
                    <ArrowUpRight className="size-4" aria-hidden="true" />
                  </a>
                  {project.caseStudy ? (
                    <a
                      href={project.caseStudy}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    >
                      Case study
                      <ArrowUpRight className="size-4" aria-hidden="true" />
                    </a>
                  ) : null}
                  {project.repo ? (
                    <a
                      href={project.repo}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    >
                      Repo
                      <ArrowUpRight className="size-4" aria-hidden="true" />
                    </a>
                  ) : null}
                </div>
              </Card>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
