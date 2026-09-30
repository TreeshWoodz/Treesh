import { useEffect } from "react";

export default function App() {
  useEffect(() => {
    window.location.replace("/songcoder.html");
  }, []);
  return null;
}
