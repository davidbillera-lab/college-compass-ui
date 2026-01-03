import { BrowserRouter, Routes, Route } from "react-router-dom";
import Scholarships from "./pages/Scholarships";
import AssemblyDemo from "./pages/AssemblyDemo";
import HighFidelityDemo from "./pages/HighFidelityDemo";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AssemblyDemo />} />
        <Route path="/hifi" element={<HighFidelityDemo />} />
        <Route path="/scholarships" element={<Scholarships />} />
      </Routes>
    </BrowserRouter>
  );
}
