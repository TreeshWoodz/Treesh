import React, { useState } from "react";
import { Delete, CornerDownLeft, Eraser } from "lucide-react";

const ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

export const Keyboard = ({ skin = "kb_glass", onKey, onBackspace, onEnter, onClear, disabled, busy, preview = false, highlight }) => {
  const [down, setDown] = useState(null);
  const cls = `kb kb-${skin.replace("kb_", "")}`;
  const press = (fn, id) => (e) => {
    e.preventDefault();
    if (disabled) return;
    setDown(id);
    setTimeout(() => setDown((d) => (d === id ? null : d)), 110);
    fn && fn();
  };
  if (preview) {
    return (
      <div className={`${cls} pointer-events-none grid grid-cols-5 gap-1.5`} style={{ "--key-h": "30px" }}>
        {"chain".split("").map((k) => <div key={k} className="key text-xs">{k}</div>)}
      </div>
    );
  }
  return (
    <div className={`${cls} select-none space-y-1.5 ${disabled ? "opacity-60" : ""}`} data-testid="custom-keyboard">
      {ROWS.map((row, ri) => (
        <div key={row} className="flex justify-center gap-1.5" style={{ paddingInline: ri === 1 ? "4.5%" : 0 }}>
          {ri === 2 ? (
            <button type="button" aria-label="Clear" data-testid="key-clear" onPointerDown={press(onClear, "clear")} className={`key special flex-[1.45] ${down === "clear" ? "is-down" : ""}`}>
              <Eraser size={18} />
            </button>
          ) : null}
          {row.split("").map((k) => (
            <button key={k} type="button" data-testid={`key-${k}`} onPointerDown={press(() => onKey(k), k)}
              className={`key flex-1 ${down === k ? "is-down" : ""}`} style={highlight === k ? { boxShadow: "0 0 0 2px var(--accent), 0 0 16px rgb(var(--accent-rgb) / .6)" } : undefined}>
              {k}
            </button>
          ))}
          {ri === 2 ? (
            <button type="button" aria-label="Backspace" data-testid="key-backspace" onPointerDown={press(onBackspace, "bk")} className={`key special flex-[1.45] ${down === "bk" ? "is-down" : ""}`}>
              <Delete size={20} />
            </button>
          ) : null}
        </div>
      ))}
      <div className="flex gap-1.5">
        <button type="button" data-testid="key-enter" onPointerDown={press(onEnter, "enter")} className={`key enter flex-1 gap-2 !text-base ${down === "enter" ? "is-down" : ""}`} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          {busy ? <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <CornerDownLeft size={18} />}
          <span className="font-extrabold tracking-[0.2em]">LINK</span>
        </button>
      </div>
    </div>
  );
};
