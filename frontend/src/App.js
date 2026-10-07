import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import Home from "@/pages/Home";
import SonokoGame from "@/pages/SonokoGame";
import SudokuGame from "@/pages/SudokuGame";
import UnoGame from "@/pages/UnoGame";
import Trophies from "@/pages/Trophies";
import Leaderboard from "@/pages/Leaderboard";
import HowToPlay from "@/pages/HowToPlay";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/play/sonoko" element={<SonokoGame key="sonoko" />} />
          <Route path="/play/daily" element={<SonokoGame key="daily" daily />} />
          <Route path="/play/sudoku" element={<SudokuGame />} />
          <Route path="/play/uno" element={<UnoGame />} />
          <Route path="/trophies" element={<Trophies />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/how-to-play" element={<HowToPlay />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" theme="dark" richColors closeButton duration={2600} />
    </div>
  );
}

export default App;
