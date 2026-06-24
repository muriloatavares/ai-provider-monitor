/**
 * @file App.jsx
 * @description Raiz da árvore de componentes React.
 *
 * Define o mapeamento de rotas e provê contextos globais (como ThemeProvider).
 *
 * @author Murilo A. Tavares (muriloatavares)
 */

import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/Dashboard";
import { ThemeProvider } from "./contexts/ThemeContext";

function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
        </Route>
      </Routes>
    </ThemeProvider>
  );
}

export default App;
