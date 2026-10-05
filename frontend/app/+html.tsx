// @ts-nocheck
import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en" style={{ height: "100%" }}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover, shrink-to-fit=no"
        />
        {/*
          Disable body scrolling on web to make ScrollView components work correctly.
          If you want to enable scrolling, remove `ScrollViewStyleReset` and
          set `overflow: auto` on the body style below.
        */}
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              body > div:first-child { position: fixed !important; top: 0; left: 0; right: 0; bottom: 0; }
              [role="tablist"] [role="tab"] * { overflow: visible !important; }
              [role="heading"], [role="heading"] * { overflow: visible !important; }
              /* App-like feel: no text selection, no drag-to-highlight, no callout (hardened for iOS Safari). */
              html, body, #root, * { -webkit-user-select: none !important; -moz-user-select: none !important; -ms-user-select: none !important; user-select: none !important; -webkit-touch-callout: none !important; -webkit-tap-highlight-color: rgba(0,0,0,0) !important; -webkit-user-drag: none; }
              img { -webkit-user-drag: none; -khtml-user-drag: none; -moz-user-drag: none; -o-user-drag: none; user-drag: none; pointer-events: none; }
              /* Play surfaces: no browser gestures (double-tap zoom, pan, long-press loupe). */
              [data-testid="gameplay-screen"], [data-testid="gameplay-screen"] *, [data-testid="editor-board"], [data-testid="editor-board"] * { touch-action: none !important; }
              input, textarea, [contenteditable="true"] { -webkit-user-select: text !important; user-select: text !important; }
            `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `document.addEventListener('contextmenu', function (e) { e.preventDefault(); }, { capture: true });
              document.addEventListener('dragstart', function (e) { e.preventDefault(); }, { capture: true });
              document.addEventListener('selectstart', function (e) { e.preventDefault(); }, { capture: true });
              /* iOS Safari shows its magnifier loupe on long presses (e.g. holding long notes) unless the touch's
                 default action is cancelled. Do that on the play surfaces only; buttons keep native behaviour. */
              var PLAY = '[data-testid="gameplay-screen"], [data-testid="editor-board"]';
              var block = function (e) {
                var t = e.target; if (!t || !t.closest || !t.closest(PLAY)) return;
                if (t.closest('[role="button"], a, input, textarea')) return;
                if (e.cancelable) e.preventDefault();
              };
              document.addEventListener('touchstart', block, { passive: false, capture: true });
              document.addEventListener('touchmove', block, { passive: false, capture: true });
              document.addEventListener('gesturestart', function (e) { e.preventDefault(); }, { passive: false });`,
          }}
        />
      </head>
      <body
        style={{
          margin: 0,
          height: "100%",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </body>
    </html>
  );
}
