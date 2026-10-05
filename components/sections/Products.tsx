"use client";

import { useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Reveal from "@/components/layout/Reveal";
import { PRODUCT_PROJECTS as products } from "@/lib/constants";
import { useHorizontalFlip } from "@/lib/use-horizontal-flip";

export default function Products() {
  const pinRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  useHorizontalFlip(pinRef, trackRef);

  return (
    <section
      id="products"
      aria-label="Selected work"
      ref={pinRef}
      className="flip-stage scroll-mt-14 px-6 py-24 sm:py-32"
    >
      <Reveal className="w-full">
        <div className="flip-heading mx-auto w-full max-w-5xl">
          <h2
            data-reveal
            className="font-serif text-3xl tracking-tight text-foreground sm:text-4xl"
          >
            Selected work
          </h2>
        </div>
        <div
          ref={trackRef}
          className="flip-track mt-10 flex w-full flex-col gap-6"
        >
          {products.map((project, index) => (
            <div
              key={project.slug}
              data-card
              data-centered={index === 0 ? "true" : "false"}
              data-palette={project.palette}
              className="flip-card w-full"
            >
              <Card data-reveal className="h-full">
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
                </div>
                {project.caseStudy || project.repo ? (
                  <div className="card-detail flex flex-wrap items-center gap-4 px-6 pb-6">
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
                ) : null}
              </Card>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
