import "@/App.css";

/* FREA! is a self-contained single-file game living at /games/frea.html
   (repo: treesh / main / games/frea.html -> treesh.app/games/frea).
   The preview simply hosts it full-screen, like the Treesh parent app's game frame. */
function App() {
  return (
    <iframe
      title="FREA!"
      data-testid="frea-game-frame"
      src="/games/frea.html"
      allow="fullscreen; autoplay; gamepad; clipboard-write"
      style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", border: 0, background: "#05060f" }}
    />
  );
}

export default App;
