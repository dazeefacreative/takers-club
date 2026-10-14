import { ReactNode } from "react";
import { SiteHeader } from "@/app/components/layout/SiteHeader";
import { SiteFooter } from "@/app/components/layout/SiteFooter";
import { Reveal } from "@/app/components/motion/Reveal";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

interface Section {
  heading: string;
  body: ReactNode;
}

export function StaticInfoPage({ title, intro, sections, description }: {
  title: string;
  intro?: string;
  sections: Section[];
  description?: string;
}) {
  useDocumentTitle(title, description);

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "var(--font-sans)" }}>
      <SiteHeader />

      <div className="border-b border-border px-6 md:px-12 py-14">
        <div className="max-w-[800px] mx-auto">
          <h1 className="text-4xl md:text-5xl font-normal tracking-tight leading-tight" style={{ fontFamily: "var(--font-display)" }}>
            {title}
          </h1>
          {intro && <p className="text-muted-foreground text-sm leading-relaxed mt-4 max-w-md">{intro}</p>}
        </div>
      </div>

      <Reveal>
        <div className="max-w-[800px] mx-auto px-6 md:px-12 py-16 space-y-10">
          {sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-sm font-bold tracking-wide uppercase mb-3 border-b border-border pb-3">
                {section.heading}
              </h2>
              <div className="text-sm text-muted-foreground leading-relaxed font-light space-y-3">
                {section.body}
              </div>
            </section>
          ))}
        </div>
      </Reveal>

      <SiteFooter />
    </div>
  );
}
