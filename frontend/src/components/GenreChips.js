import { cn } from "@/lib/utils";

function slug(g) { return g.replace(/[^a-z0-9]+/gi, "-"); }

export function GenreChips({ genres, active, onChange }) {
  const all = ["all", ...genres];
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar" data-testid="genre-chips">
      {all.map((g) => {
        const isActive = active === g;
        return (
          <button
            key={g}
            onClick={() => onChange(g)}
            data-testid={g === "all" ? "genre-chip-all" : `genre-chip-${slug(g)}`}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium capitalize transition-[background-color,border-color,box-shadow]",
              isActive
                ? "border-white/25 bg-white/10 text-white glow-purple"
                : "border-white/10 bg-white/[0.03] text-white/65 hover:bg-white/[0.07]"
            )}
          >
            {g}
          </button>
        );
      })}
    </div>
  );
}
