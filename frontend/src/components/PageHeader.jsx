import { motion } from "framer-motion";

export const PageHeader = ({ eyebrow, title, sub, right, testid }) => (
  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }} className="mb-5 flex flex-wrap items-end justify-between gap-4">
    <div className="min-w-0">
      {eyebrow && <div className="hp-eyebrow mb-2">{eyebrow}</div>}
      <h1 data-testid={testid || "page-title"} className="font-display text-[30px] leading-[1.05] text-[#F5F6F8] sm:text-[40px]">{title}</h1>
      {sub && <p className="mt-2 max-w-xl text-sm text-[#B7BBCB] sm:text-[15px]">{sub}</p>}
    </div>
    {right && <div className="flex flex-wrap items-center gap-2">{right}</div>}
  </motion.div>
);

export const Empty = ({ icon: Icon, title, text, action, testid }) => (
  <div data-testid={testid} className="hp-card flex flex-col items-center px-6 py-12 text-center">
    {Icon && (
      <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-[#25273a] bg-[#171923] text-[#FF3EA5]">
        <Icon size={24} />
      </span>
    )}
    <div className="text-base font-bold text-[#F5F6F8]">{title}</div>
    {text && <p className="mt-1.5 max-w-sm text-sm text-[#B7BBCB]">{text}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export const LevelBadge = ({ level }) => {
  const map = {
    beginner: ["Beginner", "#2EE59D"],
    intermediate: ["Intermediate", "#6AA8FF"],
    advanced: ["Advanced", "#FFCC66"],
    professional: ["Pro", "#FF3EA5"],
  };
  const [label, c] = map[level] || [level, "#B7BBCB"];
  return (
    <span className="inline-flex h-6 items-center gap-1.5 rounded-full border border-[#25273a] bg-[#171923] px-2.5 text-[11px] font-bold text-[#E6E8EF]">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />
      {label}
    </span>
  );
};
