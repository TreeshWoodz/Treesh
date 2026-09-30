import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Star, Trash2 } from "lucide-react";
import { PageHeader, Empty } from "@/components/PageHeader";
import { Btn } from "@/components/PinkButton";
import CourtMap from "@/components/CourtMap";
import { CourtRow, FavoritesIO, useFavorites } from "@/components/CourtBits";
import { getSettings } from "@/lib/storage";

export default function Favorites() {
  const nav = useNavigate();
  const units = getSettings().units;
  const { favs, setFavs, toggle } = useFavorites();
  const [sel, setSel] = useState(null);
  const center = useMemo(() => (favs.length ? { lat: favs.reduce((a, b) => a + b.lat, 0) / favs.length, lon: favs.reduce((a, b) => a + b.lon, 0) / favs.length } : null), [favs]);
  const setNote = (id, note) => setFavs((cur) => cur.map((f) => (f.id === id ? { ...f, note } : f)));

  return (
    <div data-testid="favorites-page">
      <PageHeader eyebrow="Your spots" title="Favorites" sub="Every court you've saved. Export a save file to back them up or move them to another device, then import it anytime." testid="favorites-title" right={<FavoritesIO />} />
      {favs.length === 0 ? (
        <Empty icon={Star} title="No saved courts yet" text="Find a court and tap Save. Already have a Hoop save file? Import it above." action={<Btn onClick={() => nav("/courts")} data-testid="favorites-find-courts-button"><MapPin size={16} /> Find courts</Btn>} testid="favorites-empty" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="lg:order-2 lg:sticky lg:top-6 lg:self-start">
            <CourtMap center={center} courts={favs} selectedId={sel} onSelect={setSel} height={300} />
            <div className="mt-3 flex items-center justify-between text-xs text-[#8B90A6]">
              <span data-testid="favorites-count">{favs.length} saved court{favs.length === 1 ? "" : "s"}</span>
              <button onClick={() => window.confirm("Remove all saved courts from this device?") && setFavs([])} className="inline-flex items-center gap-1 font-semibold text-[#FF7A7A] hover:underline" data-testid="favorites-clear-all">
                <Trash2 size={12} /> Clear all
              </button>
            </div>
          </div>
          <div className="space-y-2.5 lg:order-1" data-testid="favorites-list">
            {favs.map((c, i) => (
              <CourtRow
                key={c.id}
                c={c}
                index={i}
                units={units}
                fav
                onFav={() => toggle(c)}
                selected={sel === c.id}
                onSelect={() => setSel(c.id)}
                extra={
                  <input
                    value={c.note || ""}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setNote(c.id, e.target.value)}
                    placeholder="Add a note: best times, rims, who runs here…"
                    data-testid="favorite-note-input"
                    className="mt-2.5 h-9 w-full rounded-lg border border-[#22243a] bg-[#0f1015] px-3 text-[13px] text-[#E6E8EF] placeholder:text-[#6f7489] focus:border-[#FF3EA5] focus:outline-none"
                  />
                }
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
