import { useEffect } from "react";

function App() {
  useEffect(() => {
    window.location.replace("/nects.html");
  }, []);
  return null;
}

export default App;
