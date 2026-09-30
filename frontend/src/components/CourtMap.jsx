import { useEffect, useRef } from "react";
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from "react-leaflet";

function Fly({ center, selected, courts }) {
  const map = useMap();
  const lastCenter = useRef(null);
  useEffect(() => {
    if (!center) return;
    const key = `${center.lat},${center.lon}`;
    if (lastCenter.current === key) return;
    lastCenter.current = key;
    if (courts && courts.length) {
      const pts = [[center.lat, center.lon], ...courts.slice(0, 12).map((c) => [c.lat, c.lon])];
      map.fitBounds(pts, { padding: [30, 30], maxZoom: 15 });
    } else map.setView([center.lat, center.lon], 14);
  }, [center, courts, map]);
  useEffect(() => {
    if (selected) map.flyTo([selected.lat, selected.lon], Math.max(map.getZoom(), 16), { duration: 0.6 });
  }, [selected, map]);
  return null;
}

export default function CourtMap({ center, courts = [], selectedId, onSelect, height = 320 }) {
  const selected = courts.find((c) => c.id === selectedId);
  const start = center ? [center.lat, center.lon] : [40.7812, -73.9665];
  return (
    <div className="isolate overflow-hidden rounded-[18px] border border-[#222433]" style={{ height }} data-testid="courts-map">
      <MapContainer center={start} zoom={13} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }} attributionControl>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>' subdomains="abcd" maxZoom={19} />
        {center && <CircleMarker center={[center.lat, center.lon]} radius={7} pathOptions={{ color: "#F5F6F8", weight: 3, fillColor: "#0A0A0D", fillOpacity: 1 }} />}
        {courts.map((c) => (
          <CircleMarker key={c.id} center={[c.lat, c.lon]} radius={c.id === selectedId ? 10 : 6} eventHandlers={{ click: () => onSelect && onSelect(c.id) }} pathOptions={{ color: c.id === selectedId ? "#F5F6F8" : "#FF3EA5", weight: c.id === selectedId ? 3 : 1.5, fillColor: "#FF3EA5", fillOpacity: 0.85 }}>
            <Tooltip direction="top" offset={[0, -6]}>{c.name}</Tooltip>
          </CircleMarker>
        ))}
        <Fly center={center} selected={selected} courts={courts} />
      </MapContainer>
    </div>
  );
}
