import React from "react";

const CLASSIC_VIDEO = "https://va.media.tumblr.com/tumblr_t8dojqOe5i1alwcq6.mp4";

export const Arena = ({ id = "arena_aurora", mini = false, dim = false }) => {
  const k = id.replace("arena_", "");
  const style = mini ? { position: "absolute" } : undefined;
  return (
    <div className={`arena arena-${k}`} style={style} aria-hidden="true" data-testid={mini ? undefined : "arena-bg"}>
      {k === "classic" && !mini ? <video autoPlay loop muted playsInline src={CLASSIC_VIDEO} /> : null}
      {k === "classic" && mini ? <div className="absolute inset-0" style={{ background: "linear-gradient(135deg,#1b0a33,#050510 60%,#0e2a2a)" }} /> : null}
      <div className="blob b1" /><div className="blob b2" /><div className="blob b3" />
      {k === "grid" ? (<><div className="grid-sun" /><div className="grid-floor" /></>) : null}
      {k === "stars" ? (<><div className="starlayer s1" /><div className="starlayer s2" /></>) : null}
      {!mini ? <div className="vignette" /> : null}
      {dim ? <div className="tint" /> : null}
    </div>
  );
};
