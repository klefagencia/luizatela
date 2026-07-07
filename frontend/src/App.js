import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import LandingPage from "@/pages/LandingPage";
import CalculatorPage from "@/pages/CalculatorPage";
import { CalculatorProvider } from "@/contexts/CalculatorContext";
import CalculatorGate from "@/components/CalculatorGate";

function App() {
  return (
    <div className="App noise">
    <CalculatorProvider>
    <BrowserRouter>
    <Routes>
    <Route path="/" element={<LandingPage />} />
<Route path="/calculadora" element={<CalculatorGate><CalculatorPage /></CalculatorGate>} />
  </Routes>
  </BrowserRouter>
<Toaster theme="dark" position="top-right" richColors />
  </CalculatorProvider>
  </div>
);
}

export default App;
