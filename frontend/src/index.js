import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import "leaflet/dist/leaflet.css";
import App from "@/App";

// Hoop lives under /hoop (treesh.app/hoop). Normalise any other entry path.
if (!window.location.pathname.startsWith("/hoop")) {
  window.history.replaceState(null, "", "/hoop" + (window.location.pathname === "/" ? "" : window.location.pathname) + window.location.search + window.location.hash);
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
