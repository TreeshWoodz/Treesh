import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { PageHeader, Empty } from "@/components/PageHeader";
import CourtDiagram from "@/components/CourtDiagram";
import { TERMS, TERM_CATS } from "@/data/terms";

const Legend = () => (
  <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11.5px] font-semibold text-[#B7BBCB]" data-testid="dictionary-legend">
    <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-[#FF3EA5]" /> Offense</span>
    <span className="inline-flex items-center gap-1.5"><span className="font-black text-[#F5F6F8]">✕</span> Defense</span>
    <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-[#FF9A3C]" /> Ball</span>
    <span className="inline-flex items-center gap-1.5"><svg width="22" height="8"><line x1="0" y1="4" x2="22" y2="4" stroke="#F5F6F8" strokeWidth="1.6" /></svg> Cut</span>
    <span className="inline-flex items-center gap-1.5"><svg width="22" height="8"><line x1="0" y1="4" x2="22" y2="4" stroke="#FF9A3C" strokeWidth="1.6" strokeDasharray="3 2" /></svg> Pass</span>
    <span className="inline-flex items-center gap-1.5"><svg width="22" height="8"><path d="M0 4 L3 1 L6 7 L9 1 L12 7 L15 1 L18 7 L22 4" fill="none" stroke="#F5F6F8" strokeWidth="1.3" /></svg> Dribble</span>
    <span className="inline-flex items-center gap-1.5"><svg width="18" height="10"><line x1="0" y1="5" x2="15" y2="5" stroke="#F5F6F8" strokeWidth="1.6" /><line x1="15" y1="0" x2="15" y2="10" stroke="#F5F6F8" strokeWidth="2" /></svg> Screen</span>
    <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm border border-[#FF3EA5] bg-[#FF3EA5]/25" /> Zone</span>
  </div>
);

export default function Dictionary() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [openIdx, setOpenIdx] = useState(-1);
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return TERMS.filter((t) => (cat === "All" || t.cat === cat) && (!s || t.term.toLowerCase().includes(s) || t.def.toLowerCase().includes(s))).sort((a, b) => a.term.localeCompare(b.term));
  }, [q, cat]);
  const open = openIdx >= 0 ? list[openIdx] : null;

  return (
    <div data-testid="dictionary-page">
      <PageHeader eyebrow={`${TERMS.length} terms`} title="Dictionary" sub="Talk the game. Every term comes with a court diagram so you can see exactly what it means." testid="dictionary-title" />
      <div className="relative mb-3">
        <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8B90A6]" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search terms or definitions" data-testid="dictionary-search-input" className="h-12 w-full rounded-full border border-[#25273a] bg-[#0f1015] pl-11 pr-4 text-[15px] placeholder:text-[#6f7489] focus:border-[#FF3EA5] focus:outline-none" />
      </div>
      <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:px-0">
        {["All", ...TERM_CATS].map((c) => (
          <button key={c} className="hp-chip shrink-0" data-active={cat === c} onClick={() => setCat(c)} data-testid={`dictionary-cat-${c.toLowerCase().replace(/[^a-z]+/g, "-")}`}>
            {c}
          </button>
        ))}
      </div>
      <div className="mb-3 text-xs font-semibold text-[#8B90A6]" data-testid="dictionary-count">{list.length} term{list.length === 1 ? "" : "s"}</div>
      {list.length === 0 ? (
        <Empty icon={BookOpen} title="No terms found" text="Try a different word or category." testid="dictionary-empty" />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {list.map((t, i) => (
            <motion.button key={t.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: Math.min(i, 16) * 0.015 }} whileHover={{ y: -2 }} onClick={() => setOpenIdx(i)} data-testid="dictionary-term-card" className="hp-card hp-card-hover overflow-hidden text-left">
              <div className="border-b border-[#1d1f2c] bg-[#101117] p-2">
                <CourtDiagram ops={t.ops} minimal className="block h-auto w-full rounded-lg" />
              </div>
              <div className="p-3">
                <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#FF3EA5]">{t.cat}</div>
                <div className="mt-1 text-[15px] font-extrabold leading-tight text-[#F5F6F8]">{t.term}</div>
                <p className="mt-1 line-clamp-2 text-[12px] text-[#9DA2B6]">{t.def}</p>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpenIdx(-1)}>
        <DialogContent className="max-h-[92vh] w-[calc(100%-16px)] max-w-xl overflow-y-auto rounded-[22px] border-[#25273a] bg-[#0f1015] p-4 sm:p-6" data-testid="dictionary-term-dialog">
          {open && (
            <>
              <div className="pr-8">
                <div className="hp-eyebrow">{open.cat}</div>
                <DialogTitle className="font-display mt-1.5 text-[28px] leading-tight text-[#F5F6F8]" data-testid="dictionary-dialog-term">{open.term}</DialogTitle>
              </div>
              <div className="overflow-hidden rounded-2xl border border-[#222433]">
                <CourtDiagram ops={open.ops} className="block h-auto w-full" />
              </div>
              <DialogDescription className="text-[15.5px] leading-relaxed text-[#E6E8EF]">{open.def}</DialogDescription>
              <Legend />
              <div className="flex items-center justify-between border-t border-[#1d1f2c] pt-3">
                <button disabled={openIdx <= 0} onClick={() => setOpenIdx((i) => i - 1)} className="press inline-flex h-10 items-center gap-1 rounded-full px-3 text-sm font-bold text-[#B7BBCB] hover:bg-white/5 disabled:opacity-30" data-testid="dictionary-prev-button">
                  <ChevronLeft size={16} /> {openIdx > 0 ? list[openIdx - 1].term : "Prev"}
                </button>
                <button disabled={openIdx >= list.length - 1} onClick={() => setOpenIdx((i) => i + 1)} className="press inline-flex h-10 items-center gap-1 rounded-full px-3 text-sm font-bold text-[#B7BBCB] hover:bg-white/5 disabled:opacity-30" data-testid="dictionary-next-button">
                  {openIdx < list.length - 1 ? list[openIdx + 1].term : "Next"} <ChevronRight size={16} />
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
