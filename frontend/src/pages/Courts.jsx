import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Crosshair, Loader2, MapPin, Search, Star, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Empty } from "@/components/PageHeader";
import { Btn } from "@/components/PinkButton";
import CourtMap from "@/components/CourtMap";
import { CourtRow, FavoritesIO, useFavorites } from "@/components/CourtBits";
import { Skeleton } from "@/components/ui/skeleton";
import { findCourts, geocode, reverse } from "@/lib/api";
import { getSettings, KEYS, LS } from "@/lib/storage";

const RADII = [
  { m: 2000, imp: "1 mi", met: "2 km" },
  { m: 5000, imp: "3 mi", met: "5 km" },
  { m: 10000, imp: "6 mi", met: "10 km" },
  { m: 20000, imp: "12 mi", met: "20 km" },
];
const FILTERS = [
  ["all", "All"],
  ["outdoor", "Outdoor"],
  ["indoor", "Indoor"],
  ["lit", "Lit at night"],
  ["named", "Named spots"],
];

export default function Courts() {
  const units = getSettings().units;
  const nav = useNavigate();
  const { favs, isFav, toggle } = useFavorites();
  const last = LS.get(KEYS.lastSearch, null);
  const [q, setQ] = useState(last?.label || "");
  const [sugs, setSugs] = useState([]);
  const [sugOpen, setSugOpen] = useState(false);
  const [sugLoading, setSugLoading] = useState(false);
  const [place, setPlace] = useState(last);
  const [radius, setRadius] = useState(last?.radius || 5000);
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const reqId = useRef(0);
  const sugTimer = useRef(null);
  const sugSeq = useRef(0);

  const search = useCallback(async (p, r) => {
    if (!p) return;
    const my = ++reqId.current;
    setLoading(true);
    setError("");
    setSelectedId(null);
    try {
      const list = await findCourts(p.lat, p.lon, r);
      if (my !== reqId.current) return;
      setCourts(list);
      LS.set(KEYS.lastSearch, { ...p, radius: r });
    } catch (e) {
      if (my !== reqId.current) return;
      setCourts([]);
      setError(e.message || "Couldn't load courts. Try again.");
    } finally {
      if (my === reqId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (last) search(last, last.radius || 5000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onType = (v) => {
    setQ(v);
    clearTimeout(sugTimer.current);
    if (v.trim().length < 3) {
      setSugs([]);
      setSugOpen(false);
      return;
    }
    sugTimer.current = setTimeout(async () => {
      const mySeq = ++sugSeq.current;
      setSugLoading(true);
      try {
        const results = await geocode(v.trim(), 5);
        if (mySeq !== sugSeq.current) return;
        setSugs(results);
        setSugOpen(true);
      } catch (e) {
        setSugs([]);
      } finally {
        setSugLoading(false);
      }
    }, 500);
  };

  const choose = (s) => {
    clearTimeout(sugTimer.current);
    sugSeq.current++;
    const p = { lat: s.lat, lon: s.lon, label: s.name && s.short && !s.short.startsWith(s.name) ? `${s.name}, ${s.short}` : s.short || s.label };
    setQ(p.label);
    setSugOpen(false);
    setPlace(p);
    search(p, radius);
  };

  const submit = async (e) => {
    e?.preventDefault();
    if (!q.trim()) return;
    if (sugs.length) return choose(sugs[0]);
    setLoading(true);
    try {
      const results = await geocode(q.trim(), 1);
      if (!results.length) {
        setLoading(false);
        setError("We couldn't find that address. Try a city, street or park name.");
        return;
      }
      choose(results[0]);
    } catch (err) {
      setLoading(false);
      setError("Address lookup is unavailable right now. Try again.");
    }
  };

  const locate = () => {
    if (!navigator.geolocation) return toast.error("Location isn't available on this device.");
    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const p = { lat: pos.coords.latitude, lon: pos.coords.longitude, label: "Your location" };
        setPlace(p);
        setQ("Your location");
        setLocating(false);
        search(p, radius);
        try {
          const data = await reverse(p.lat, p.lon);
          const labeled = { ...p, label: data.short || "Your location" };
          setPlace(labeled);
          setQ(labeled.label);
          LS.set(KEYS.lastSearch, { ...labeled, radius });
        } catch (e) {}
      },
      (err) => {
        setLocating(false);
        setError(err.code === 1 ? "Location permission was denied. Enter an address instead." : "Couldn't get your location. Enter an address instead.");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  };

  const changeRadius = (r) => {
    setRadius(r);
    if (place) search(place, r);
  };

  const shown = useMemo(
    () =>
      courts.filter((c) => {
        if (filter === "outdoor") return !c.indoor;
        if (filter === "indoor") return c.indoor;
        if (filter === "lit") return c.lit;
        if (filter === "named") return c.has_name;
        return true;
      }),
    [courts, filter]
  );

  return (
    <div data-testid="courts-page">
      <PageHeader eyebrow="Find a run" title="Courts near you" sub="Live lookup from OpenStreetMap. Search an address or use your location, then save the spots you love." testid="courts-title" right={<FavoritesIO compact />} />

      <div className="hp-card hp-hero-glow relative z-[30] p-3 sm:p-4">
        <form onSubmit={submit} className="flex flex-col gap-2.5 sm:flex-row">
          <div className="relative flex-1">
            <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8B90A6]" />
            <input
              value={q}
              onChange={(e) => onType(e.target.value)}
              onFocus={() => sugs.length && setSugOpen(true)}
              onBlur={() => setTimeout(() => setSugOpen(false), 180)}
              placeholder="Address, park, city or zip"
              data-testid="courts-search-input"
              className="h-12 w-full rounded-full border border-[#25273a] bg-[#0f1015] pl-11 pr-11 text-[15px] text-[#F5F6F8] placeholder:text-[#6f7489] focus:border-[#FF3EA5] focus:outline-none"
            />
            {sugLoading ? (
              <Loader2 size={16} className="hp-spin absolute right-4 top-1/2 -translate-y-1/2 text-[#8B90A6]" />
            ) : q ? (
              <button type="button" onClick={() => { setQ(""); setSugs([]); }} className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-[#8B90A6] hover:bg-white/5" aria-label="Clear" data-testid="courts-search-clear">
                <X size={15} />
              </button>
            ) : null}
            {sugOpen && sugs.length > 0 && (
              <div className="absolute left-0 right-0 top-[54px] z-[600] overflow-hidden rounded-2xl border border-[#2a2c40] bg-[#121319] shadow-[0_20px_50px_rgba(0,0,0,.6)]" data-testid="courts-suggestions">
                {sugs.map((s, i) => (
                  <button type="button" key={i} onMouseDown={() => choose(s)} data-testid="courts-suggestion-item" className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-white/[.04]">
                    <MapPin size={16} className="mt-0.5 shrink-0 text-[#FF3EA5]" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-[#F5F6F8]">{s.name}</span>
                      <span className="block truncate text-xs text-[#8B90A6]">{s.label}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Btn type="submit" className="flex-1 sm:flex-none" data-testid="courts-search-button" disabled={loading}>
              <Search size={16} /> Search
            </Btn>
            <Btn type="button" variant="secondary" onClick={locate} className="flex-1 sm:flex-none" data-testid="courts-use-location-button" disabled={locating}>
              {locating ? <Loader2 size={16} className="hp-spin" /> : <Crosshair size={16} />} Near me
            </Btn>
          </div>
        </form>
        <div className="mt-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="hp-eyebrow mr-1 shrink-0">Radius</span>
          {RADII.map((r) => (
            <button key={r.m} className="hp-chip !h-8 shrink-0" data-active={radius === r.m} onClick={() => changeRadius(r.m)} data-testid={`courts-radius-${r.m}`}>
              {units === "metric" ? r.met : r.imp}
            </button>
          ))}
        </div>
      </div>

      {!place && !loading && (
        <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <Empty icon={MapPin} title="Where are you hooping today?" text="Search any address or tap Near me. We'll pull every mapped court around you, with distance and directions." action={<Btn onClick={locate} data-testid="courts-empty-locate-button"><Crosshair size={16} /> Use my location</Btn>} testid="courts-empty" />
          <div className="hp-card p-5">
            <div className="hp-eyebrow mb-3">Your saved courts</div>
            {favs.length ? (
              <div className="space-y-2">
                {favs.slice(0, 4).map((f) => (
                  <div key={f.id} className="flex items-center gap-3 rounded-xl border border-[#1f2130] bg-[#0f1015] px-3 py-2.5">
                    <Star size={15} className="text-[#FF3EA5]" fill="#FF3EA5" />
                    <span className="truncate text-sm font-semibold">{f.name}</span>
                  </div>
                ))}
                <Btn variant="ghost" size="sm" onClick={() => nav("/favorites")} data-testid="courts-view-favorites">View all favorites</Btn>
              </div>
            ) : (
              <p className="text-sm text-[#8B90A6]">Saved courts show up here. Your save file travels with you: export it from Favorites and import it on any device.</p>
            )}
          </div>
        </div>
      )}

      {(place || loading) && (
        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1.05fr]">
          <div className="order-1 lg:order-2 lg:sticky lg:top-6 lg:self-start">
            <CourtMap center={place} courts={shown} selectedId={selectedId} onSelect={(id) => { setSelectedId(id); document.getElementById(`court-${id.replace("/", "-")}`)?.scrollIntoView({ behavior: "smooth", block: "center" }); }} height={typeof window !== "undefined" && window.innerWidth >= 1024 ? 560 : 280} />
          </div>
          <div className="order-2 lg:order-1">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[13px] text-[#8B90A6]">Near <span className="font-semibold text-[#E6E8EF]" data-testid="courts-place-label">{place?.label}</span></div>
                {!loading && !error && <div className="text-sm font-bold text-[#F5F6F8]" data-testid="courts-count">{shown.length} court{shown.length === 1 ? "" : "s"} found</div>}
              </div>
            </div>
            <div className="mb-3 flex gap-2 overflow-x-auto no-scrollbar">
              {FILTERS.map(([k, label]) => (
                <button key={k} className="hp-chip !h-8 shrink-0" data-active={filter === k} onClick={() => setFilter(k)} data-testid={`courts-filter-${k}`}>
                  {label}
                </button>
              ))}
            </div>
            {loading ? (
              <div className="space-y-2.5" data-testid="courts-loading">
                <div className="flex items-center gap-2 text-[13px] font-semibold text-[#B7BBCB]"><Loader2 size={14} className="hp-spin text-[#FF3EA5]" /> Scanning OpenStreetMap for courts… big cities can take a few seconds.</div>
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-[118px] rounded-[18px] bg-[#14151d]" />
                ))}
              </div>
            ) : error ? (
              <Empty icon={MapPin} title="Lookup hiccup" text={error} action={<Btn onClick={() => search(place, radius)} data-testid="courts-retry-button">Try again</Btn>} testid="courts-error" />
            ) : shown.length === 0 ? (
              <Empty icon={MapPin} title="No courts mapped here" text="Try a bigger radius or a different filter. Courts come from OpenStreetMap volunteers." action={<Btn onClick={() => changeRadius(20000)} data-testid="courts-widen-button">Widen search</Btn>} testid="courts-no-results" />
            ) : (
              <div className="space-y-2.5" data-testid="courts-results">
                {shown.map((c, i) => (
                  <div key={c.id} id={`court-${c.id.replace("/", "-")}`}>
                    <CourtRow c={c} index={i} units={units} fav={isFav(c.id)} onFav={() => toggle(c)} selected={selectedId === c.id} onSelect={() => setSelectedId(c.id)} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
