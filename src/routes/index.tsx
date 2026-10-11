import { createFileRoute } from "@tanstack/react-router";
import { Hero } from "@/components/Hero";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ITZ FIZZ — The Motion of Performance" },
      { name: "description", content: "A scroll-driven motion study for ITZ FIZZ. Scroll to drive." },
      { property: "og:title", content: "ITZ FIZZ — The Motion of Performance" },
      { property: "og:description", content: "A scroll-driven motion study for ITZ FIZZ. Scroll to drive." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="overflow-x-clip bg-background text-foreground">
      <Hero />
      <footer className="flex min-h-[60vh] flex-col justify-end gap-6 px-5 pb-10 md:px-10">
        <p className="font-display max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
          Performance is not a number. It is a <span className="text-lime">direction.</span>
        </p>
        <div className="flex justify-between border-t border-border-strong pt-4 font-mono text-[10px] tracking-[0.25em] text-muted-foreground">
          <span>ITZ FIZZ © 2026</span>
          <span>MOTION STUDY / 001</span>
        </div>
      </footer>
    </main>
  );
}
