import { useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { stats } from "@/data/stats";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// Tunable motion constants
const MOTION = {
  scrollLength: 3.2, // scroll track length in viewport heights
  scrub: 1,
  carStart: -0.3, // car start x as fraction of car width (partially off-stage)
  carEndMargin: 0.04, // final gap from right edge, fraction of stage width
  carLift: -6, // px vertical drift
  carScale: 1.05,
  statTimes: [0.18, 0.36, 0.54, 0.7],
};

const CAR_SRC = "/assets/car.png";
const WORDS = ["WELCOME", "ITZ", "FIZZ"];

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const [carFailed, setCarFailed] = useState(false);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();

      mm.add(
        {
          reduce: "(prefers-reduced-motion: reduce)",
          motion: "(prefers-reduced-motion: no-preference)",
          mobile: "(max-width: 767px)",
        },
        (ctx) => {
          const { reduce, mobile } = ctx.conditions as Record<string, boolean>;

          if (reduce) {
            gsap.set(q(".js-letter"), { color: "var(--foreground)" });
            gsap.set(q(".js-stat"), { opacity: 1, y: 0 });
            gsap.set(q(".js-final"), { opacity: 1, y: 0 });
            gsap.set(q(".js-trail"), { scaleX: 0.7 });
            return;
          }

          // ---- Intro (time-based, plays once, never moves the car) ----
          const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
          intro
            .from(q(".js-letter-inner"), { yPercent: 110, duration: 0.9, stagger: 0.035 })
            .from(q(".js-fade"), { y: 16, opacity: 0, duration: 0.7, stagger: 0.08 }, 0.25)
            .from(q(".js-stat-frame"), { scaleX: 0, transformOrigin: "left", duration: 0.6, stagger: 0.08 }, 0.4)
            .from(q(".js-glow"), { opacity: 0, duration: 1.2 }, 0.2)
            .from(q(".js-car-img"), { opacity: 0, x: -40, filter: "brightness(0.2)", duration: 1.1 }, 0.35);

          // ---- Scroll timeline (single coordinated sequence) ----
          const stage = q(".js-stage")[0] as HTMLElement;
          const car = q(".js-car")[0] as HTMLElement;
          const startX = () => car.offsetWidth * MOTION.carStart;
          const endX = () =>
            stage.offsetWidth - car.offsetWidth - stage.offsetWidth * MOTION.carEndMargin;
          const travelFactor = mobile ? 0.85 : 1;
          const carX = (p: number) => startX() + (endX() - startX()) * p * travelFactor;

          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: stage,
              start: "top top",
              end: () => `+=${window.innerHeight * MOTION.scrollLength}`,
              pin: true,
              scrub: MOTION.scrub,
              invalidateOnRefresh: true,
            },
          });

          gsap.set(car, { x: startX });

          // Car + trail share timing so they stay locked together
          tl.fromTo(car, { x: startX }, { x: () => carX(1), duration: 1 }, 0)
            .to(car, { y: MOTION.carLift, scale: MOTION.carScale, duration: 1 }, 0)
            .fromTo(
              q(".js-trail"),
              { scaleX: () => Math.max(0, (startX() + car.offsetWidth * 0.15) / stage.offsetWidth) },
              { scaleX: () => (carX(1) + car.offsetWidth * 0.15) / stage.offsetWidth, duration: 1 },
              0,
            )
            .to(q(".js-grid"), { xPercent: mobile ? -4 : -12, duration: 1 }, 0)
            .to(q(".js-glow"), { xPercent: mobile ? 8 : 25, duration: 1 }, 0)
            .to(q(".js-shadow"), { opacity: 0, duration: 0.4 }, 0);

          // Letters light up when the car's nose passes them
          const stageRect = stage.getBoundingClientRect();
          const span = carX(1) - startX();
          q(".js-letter").forEach((el: HTMLElement) => {
            const r = el.getBoundingClientRect();
            const center = r.left - stageRect.left + r.width / 2;
            const t = gsap.utils.clamp(0.02, 0.92, (center - car.offsetWidth - startX()) / span);
            tl.to(el, { color: "var(--foreground)", duration: 0.04 }, t);
          });

          // Performance signals at deliberate points
          q(".js-stat").forEach((el: HTMLElement, i: number) => {
            const num = el.querySelector(".js-num") as HTMLElement;
            const target = Number(num.dataset.value);
            const counter = { v: 0 };
            const at = MOTION.statTimes[i];
            tl.fromTo(el, { opacity: 0.15, y: 18 }, { opacity: 1, y: 0, duration: 0.08 }, at).fromTo(
              counter,
              { v: 0 },
              {
                v: target,
                duration: 0.1,
                onUpdate: () => (num.textContent = String(Math.round(counter.v))),
              },
              at,
            );
          });

          // Final reveal
          tl.to(q(".js-letter"), { color: "var(--accent-lime)", duration: 0.06, stagger: 0.004 }, 0.9)
            .fromTo(q(".js-final"), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.08 }, 0.9)
            .to(q(".js-cue"), { opacity: 0, duration: 0.05 }, 0.02)
            .to({}, { duration: 0.06 }); // hold

          return () => intro.kill();
        },
      );
    },
    { scope: root },
  );

  return (
    <section ref={root} aria-label="Welcome ITZ FIZZ" className="relative">
      <div className="js-stage relative h-svh w-full overflow-hidden bg-background">
        {/* Environment */}
        <div aria-hidden className="js-grid absolute inset-y-0 -left-[5%] w-[130%] bg-grid opacity-60" />
        <div aria-hidden className="js-glow absolute -left-[10%] top-[35%] h-[45vh] w-[60vw] bg-lime-haze" />
        <div aria-hidden className="absolute inset-0 bg-grain pointer-events-none" />

        {/* Top bar */}
        <header className="absolute inset-x-0 top-0 z-20 flex items-start justify-between px-5 pt-5 md:px-10 md:pt-8">
          <div className="js-fade">
            <p className="font-display text-lg font-bold tracking-[0.18em] text-foreground">
              ITZ<span className="text-lime">·</span>FIZZ
            </p>
            <p className="mt-1 font-mono text-[10px] tracking-[0.25em] text-muted-foreground">
              MOTION STUDY / 001
            </p>
          </div>
          <p className="js-fade hidden font-mono text-[10px] tracking-[0.25em] text-muted-foreground md:block">
            THE MOTION OF PERFORMANCE
          </p>
        </header>

        {/* Headline */}
        <div className="absolute inset-x-0 top-[17%] z-10 px-5 md:top-[20%] md:px-10">
          <h1
            aria-label="Welcome ITZ FIZZ"
            className="font-display flex flex-wrap gap-x-[0.6em] gap-y-1 text-[11vw] font-extrabold leading-[0.95] md:text-[6.6vw]"
          >
            {WORDS.map((word, wi) => (
              <span key={word} aria-hidden className="inline-flex">
                {word.split("").map((ch, ci) => (
                  <span
                    key={`${wi}-${ci}`}
                    className="js-letter inline-block overflow-hidden pr-[0.18em] text-headline-dim"
                  >
                    <span className="js-letter-inner inline-block">{ch}</span>
                  </span>
                ))}
              </span>
            ))}
          </h1>
          <p className="js-fade mt-4 font-mono text-[11px] tracking-[0.3em] text-muted-foreground md:mt-6 md:text-xs">
            BUILT FOR THE FEELING OF MOVING FORWARD.
          </p>
        </div>

        {/* Stats — editorial index */}
        <ol className="absolute inset-x-0 top-[48%] z-10 grid grid-cols-2 gap-x-6 gap-y-4 px-5 md:left-auto md:right-10 md:top-[50%] md:w-[46vw] md:grid-cols-4 md:gap-6 md:px-0">
          {stats.map((s, i) => (
            <li key={s.label} className="js-stat">
              <div className="js-stat-frame h-px w-full bg-border-strong" />
              <p className="mt-2 font-mono text-[10px] tracking-[0.25em] text-muted-foreground">
                0{i + 1} — {s.label.toUpperCase()}
              </p>
              <p className="font-display text-3xl font-bold text-foreground md:text-4xl">
                <span className="js-num" data-value={s.value}>
                  {s.value}
                </span>
                <span className="text-lime">%</span>
              </p>
              <p className="hidden text-xs text-muted-foreground md:block">{s.note}</p>
            </li>
          ))}
        </ol>

        {/* Road */}
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-[16vh] bg-road" />
        <div aria-hidden className="absolute inset-x-0 bottom-[16vh] h-px bg-border-strong" />
        <div
          aria-hidden
          className="js-trail absolute bottom-[16vh] left-0 h-[3px] w-full origin-left bg-trail"
          style={{ transform: "scaleX(0)" }}
        />

        {/* Car */}
        <div className="js-car absolute bottom-[calc(16vh-2%)] left-0 z-10 w-[78vw] max-w-[860px] md:w-[46vw]">
          <div aria-hidden className="js-shadow absolute inset-0 bg-car-shadow" />
          {carFailed ? (
            <div className="flex aspect-[5/2] items-center justify-center border border-dashed border-border-strong font-mono text-xs text-muted-foreground">
              CAR IMAGE MISSING — add public/assets/car.png
            </div>
          ) : (
            <img
              src={CAR_SRC}
              alt="ITZ FIZZ graphite sports coupe in side profile"
              width={1600}
              height={640}
              onError={() => setCarFailed(true)}
              className="js-car-img relative block h-auto w-full drop-shadow-car"
            />
          )}
        </div>

        {/* Final statement */}
        <p className="js-final absolute bottom-[5vh] left-5 z-20 font-display text-xl font-bold tracking-[0.12em] text-foreground opacity-0 md:left-10 md:text-3xl">
          MOTION IS A STATE OF <span className="text-lime">MIND.</span>
        </p>

        {/* Scroll cue */}
        <div className="js-cue js-fade absolute bottom-[5vh] right-5 z-20 flex items-center gap-3 md:right-10">
          <span className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground">SCROLL TO DRIVE</span>
          <span className="relative h-8 w-px overflow-hidden bg-border-strong">
            <span className="absolute inset-x-0 top-0 h-3 bg-lime animate-cue" />
          </span>
        </div>
      </div>
    </section>
  );
}
