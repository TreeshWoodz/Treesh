import { useRef } from "react";
import { motion } from "framer-motion";
import { Download, Lightbulb, MapPin, Navigation, Star, Upload, Warehouse } from "lucide-react";
import { toast } from "sonner";
import { Btn } from "@/components/PinkButton";
import { exportFavorites, fmtDistance, KEYS, mergeFavorites, parseFavoritesFile, readJSONFile, useStored } from "@/lib/storage";

export function useFavorites() {
  const [favs, setFavs] = useStored(KEYS.favorites, []);
  const isFav = (id) => favs.some((f) => f.id === id);
  const toggle = (c) => {
    if (isFav(c.id)) {
      setFavs((cur) => cur.filter((f) => f.id !== c.id));
      toast("Removed from favorites", { description: c.name });
    } else {
      const { id, name, lat, lon, address, indoor, lit, surface, hoops, kind, access, opening_hours } = c;
      setFavs((cur) => [{ id, name, lat, lon, address, indoor, lit, surface, hoops, kind, access, opening_hours, savedAt: new Date().toISOString(), note: "" }, ...cur]);
      toast.success("Saved to favorites", { description: "Export a save file from Favorites to keep it safe." });
    }
  };
  return { favs, setFavs, isFav, toggle };
}

export function directionsUrl(c) {
  const isApple = /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent) && "ontouchend" in document;
  return isApple ? `https://maps.apple.com/?daddr=${c.lat},${c.lon}` : `https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lon}`;
}

export function CourtTags({ c }) {
  const tags = [];
  tags.push(c.indoor ? ["Indoor", Warehouse] : ["Outdoor", MapPin]);
  if (c.lit) tags.push(["Lit at night", Lightbulb]);
  if (c.surface) tags.push([c.surface.replace(/_/g, " "), null]);
  if (c.hoops) tags.push([`${c.hoops} hoop${c.hoops === "1" ? "" : "s"}`, null]);
  if (c.access && c.access !== "yes") tags.push([c.access, null]);
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {tags.map(([label, Icon]) => (
        <span key={label} className="inline-flex h-6 items-center gap-1 rounded-full border border-[#25273a] bg-[#171923] px-2 text-[11px] font-semibold capitalize text-[#B7BBCB]">
          {Icon && <Icon size={11} />} {label}
        </span>
      ))}
    </div>
  );
}

export function CourtRow({ c, units, fav, onFav, selected, onSelect, index = 0, extra }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: Math.min(index, 10) * 0.025 }} data-testid="courts-result-row" onClick={onSelect} className={`hp-card hp-card-hover flex cursor-pointer items-start gap-3 p-3.5 ${selected ? "!border-[#FF3EA5]/60 !bg-[#17121a]" : ""}`}>
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[#25273a] bg-[#171923] font-num text-[13px] font-black text-[#FF3EA5]">{index + 1}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-[15px] font-bold text-[#F5F6F8]" data-testid="court-name">{c.name}</div>
            <div className="truncate text-xs text-[#8B90A6]">{c.address || c.operator || c.kind || "Basketball court"}</div>
          </div>
          {c.distance_m != null && <div className="shrink-0 font-num text-[15px] font-extrabold text-[#F5F6F8]" data-testid="court-distance">{fmtDistance(c.distance_m, units)}</div>}
        </div>
        <CourtTags c={c} />
        {extra}
        <div className="mt-3 flex gap-2">
          <a href={directionsUrl(c)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} data-testid="court-directions-link" className="press inline-flex h-9 items-center gap-1.5 rounded-full border border-[#25273a] bg-[#171923] px-3.5 text-[13px] font-bold text-[#F5F6F8] hover:border-[#34374d]">
            <Navigation size={14} /> Directions
          </a>
          <button onClick={(e) => { e.stopPropagation(); onFav(); }} data-testid="courts-save-favorite-button" className={`press inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-bold ${fav ? "bg-[#FF3EA5] text-[#0A0A0D]" : "border border-[#25273a] bg-[#171923] text-[#F5F6F8] hover:border-[#34374d]"}`}>
            <Star size={14} fill={fav ? "#0A0A0D" : "none"} /> {fav ? "Saved" : "Save"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export function FavoritesIO({ compact = false }) {
  const { favs, setFavs } = useFavorites();
  const ref = useRef(null);
  const onFile = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try {
      const data = await readJSONFile(f);
      const incoming = parseFavoritesFile(data);
      const { list, added } = mergeFavorites(favs, incoming);
      setFavs(list);
      toast.success(`Imported ${incoming.length} court${incoming.length === 1 ? "" : "s"}`, { description: `${added} new, ${incoming.length - added} updated.` });
    } catch (err) {
      toast.error(err.message || "Import failed");
    }
  };
  return (
    <>
      <input ref={ref} type="file" accept="application/json,.json" className="hidden" onChange={onFile} data-testid="favorites-import-input" />
      <Btn variant="secondary" size="sm" onClick={() => ref.current?.click()} data-testid={compact ? "courts-import-button" : "favorites-import-button"}>
        <Upload size={14} /> Import
      </Btn>
      <Btn variant="secondary" size="sm" onClick={() => (favs.length ? exportFavorites(favs) : toast("No saved courts yet", { description: "Save a court first, then export your file." }))} data-testid={compact ? "courts-export-button" : "favorites-export-button"}>
        <Download size={14} /> Export
      </Btn>
    </>
  );
}
