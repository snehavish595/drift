"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";

const Scene = dynamic(() => import("@/components/Scene"), { ssr: false });

type Pri = "high" | "mid" | "low";
type Task = { id: string; title: string; pri: Pri; done: boolean };
const PRI: Record<Pri, { label: string; c: string }> = {
  high: { label: "Urgent", c: "#FFB48A" },
  mid: { label: "Normal", c: "#8F9BFF" },
  low: { label: "Someday", c: "#7CF0C9" },
};
const SEED: Task[] = [
  { id: "1", title: "Send the launch brief to design", pri: "high", done: false },
  { id: "2", title: "Book flights for the offsite", pri: "mid", done: false },
  { id: "3", title: "Reply to Meera about the invoice", pri: "mid", done: true },
  { id: "4", title: "Sketch ideas for the new onboarding", pri: "low", done: false },
];
const uid = () => Math.random().toString(36).slice(2, 9);

function Row({ t, onToggle, onDelete }: { t: Task; onToggle: () => void; onDelete: () => void }) {
  const ref = useRef<HTMLLIElement>(null);
  useEffect(() => {
    const tw = gsap.from(ref.current, { y: 28, opacity: 0, scale: 0.96, duration: 0.7, ease: "back.out(1.5)" });
    return () => { tw.revert(); };
  }, []);
  const remove = () =>
    gsap.to(ref.current, { x: 70, opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0, marginBottom: 0, duration: 0.4, ease: "power2.in", onComplete: onDelete });
  return (
    <li ref={ref} className="group mb-2 flex items-center gap-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 transition-colors hover:bg-white/[0.08]">
      <button
        onClick={onToggle}
        aria-label={t.done ? "Mark as open" : "Mark as done"}
        className="relative grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition-all duration-300"
        style={{ borderColor: PRI[t.pri].c, background: t.done ? PRI[t.pri].c : "transparent" }}
      >
        <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 text-ink transition-transform duration-300 ${t.done ? "scale-100" : "scale-0"}`} fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-10" /></svg>
      </button>
      <span className={`flex-1 text-[15px] leading-snug transition-all duration-300 ${t.done ? "text-bone/40 line-through decoration-bone/30" : ""}`}>{t.title}</span>
      <span className="hidden text-xs text-bone/40 sm:block">{PRI[t.pri].label}</span>
      <button onClick={remove} aria-label="Delete task" className="rounded-full p-1 text-bone/30 opacity-0 transition hover:text-peach focus-visible:opacity-100 group-hover:opacity-100">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>
    </li>
  );
}

export default function Page() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ready, setReady] = useState(false);
  const [filter, setFilter] = useState<"all" | "open" | "done">("all");
  const [title, setTitle] = useState("");
  const [pri, setPri] = useState<Pri>("mid");
  const [pulse, setPulse] = useState(0);
  const btn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    try { const s = localStorage.getItem("drift-tasks"); setTasks(s ? JSON.parse(s) : SEED); } catch { setTasks(SEED); }
    setReady(true);
  }, []);
  useEffect(() => { if (ready) localStorage.setItem("drift-tasks", JSON.stringify(tasks)); }, [tasks, ready]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".hero-line", { yPercent: 115, rotate: 3, duration: 1.2, stagger: 0.14, ease: "expo.out", delay: 0.15 });
      gsap.from(".panel", { x: 60, opacity: 0, duration: 1.1, ease: "expo.out", delay: 0.35 });
    });
    return () => ctx.revert();
  }, []);

  const done = tasks.filter((t) => t.done).length;
  const pct = tasks.length ? done / tasks.length : 0;
  const open = tasks.length - done;
  const shown = useMemo(() => tasks.filter((t) => (filter === "all" ? true : filter === "done" ? t.done : !t.done)), [tasks, filter]);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setTasks((s) => [{ id: uid(), title: title.trim(), pri, done: false }, ...s]);
    setTitle("");
    setPulse((p) => p + 1);
  };
  const toggle = (id: string) => {
    const t = tasks.find((x) => x.id === id)!;
    if (!t.done) setPulse((p) => p + 1);
    setTasks((s) => s.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));
  };
  const magnet = (e: React.MouseEvent) => {
    const r = btn.current!.getBoundingClientRect();
    gsap.to(btn.current, { x: (e.clientX - r.left - r.width / 2) * 0.3, y: (e.clientY - r.top - r.height / 2) * 0.4, duration: 0.3 });
  };
  const unmagnet = () => gsap.to(btn.current, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1,0.4)" });

  const C = 2 * Math.PI * 28;
  return (
    <main className="relative min-h-screen">
      <Scene progress={pct} pulse={pulse} />
      <div className="relative z-10 mx-auto grid min-h-screen max-w-7xl gap-10 px-5 py-8 md:grid-cols-[1fr_minmax(380px,520px)] md:px-10 md:py-12">
        <section className="flex flex-col justify-between md:py-6">
          <p className="font-display text-xl font-semibold tracking-tight">drift</p>
          <div className="my-24 md:my-0">
            <h1 className="font-display text-[clamp(3.2rem,9vw,8rem)] font-extrabold leading-[0.9] tracking-[-0.04em]">
              <span className="block overflow-hidden pb-2"><span className="hero-line block">Clear the</span></span>
              <span className="block overflow-hidden pb-2"><span className="hero-line block text-periwinkle">orbit.</span></span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90" aria-hidden>
              <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(237,234,255,.15)" strokeWidth="4" />
              <circle cx="32" cy="32" r="28" fill="none" stroke="#7CF0C9" strokeWidth="4" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct)} style={{ transition: "stroke-dashoffset .9s cubic-bezier(.2,.8,.2,1)" }} />
            </svg>
            <p className="max-w-[16rem] text-sm text-bone/70">
              {tasks.length === 0 ? "Nothing in orbit. Add your first task." : open === 0 ? "All clear. The orb is fully charged." : `${done} of ${tasks.length} done. Finish tasks to charge the orb.`}
            </p>
          </div>
        </section>

        <section className="panel glass self-center rounded-[2rem] p-5 md:p-7">
          <form onSubmit={add} className="mb-5">
            <div className="flex items-center gap-2 rounded-2xl border border-white/15 bg-ink/40 p-2 pl-4 focus-within:border-mint/60">
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs doing?" aria-label="New task" className="min-w-0 flex-1 bg-transparent py-2 text-[15px] outline-none placeholder:text-bone/35" />
              <button ref={btn} onMouseMove={magnet} onMouseLeave={unmagnet} type="submit" className="rounded-xl bg-mint px-5 py-2.5 text-sm font-semibold text-ink">Add task</button>
            </div>
            <div className="mt-3 flex items-center gap-2" role="radiogroup" aria-label="Priority">
              {(Object.keys(PRI) as Pri[]).map((k) => (
                <button type="button" key={k} role="radio" aria-checked={pri === k} onClick={() => setPri(k)}
                  className="flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition"
                  style={{ borderColor: pri === k ? PRI[k].c : "rgba(237,234,255,.15)", background: pri === k ? PRI[k].c + "26" : "transparent" }}>
                  <i className="h-2 w-2 rounded-full" style={{ background: PRI[k].c }} />{PRI[k].label}
                </button>
              ))}
            </div>
          </form>

          <div className="mb-3 flex gap-1 rounded-full bg-white/5 p-1 text-sm" role="tablist">
            {(["all", "open", "done"] as const).map((f) => (
              <button key={f} role="tab" aria-selected={filter === f} onClick={() => setFilter(f)}
                className={`flex-1 rounded-full py-1.5 capitalize transition ${filter === f ? "bg-bone text-ink" : "text-bone/60 hover:text-bone"}`}>
                {f === "open" ? `Open · ${open}` : f === "done" ? `Done · ${done}` : "All"}
              </button>
            ))}
          </div>

          <ul className="max-h-[48vh] overflow-y-auto pr-1">
            {shown.map((t) => (
              <Row key={t.id} t={t} onToggle={() => toggle(t.id)} onDelete={() => setTasks((s) => s.filter((x) => x.id !== t.id))} />
            ))}
            {ready && shown.length === 0 && <li className="py-10 text-center text-sm text-bone/50">{filter === "done" ? "Nothing finished yet. Tick a task to charge the orb." : "No tasks here. Add one above."}</li>}
          </ul>
        </section>
      </div>
    </main>
  );
}
