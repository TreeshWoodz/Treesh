import { useState } from "react";

const FALLBACK = "data:image/svg+xml;utf8," + encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><rect width='100%' height='100%' fill='#161618'/><text x='50%' y='52%' font-size='120' text-anchor='middle' fill='#3a3a40' font-family='sans-serif'>\u266A</text></svg>`
);

export function CoverArt({ src, alt, className = "", ...rest }) {
  const [err, setErr] = useState(false);
  return (
    <img
      src={err || !src ? FALLBACK : src}
      alt={alt || "cover art"}
      loading="lazy"
      onError={() => setErr(true)}
      className={className}
      {...rest}
    />
  );
}
