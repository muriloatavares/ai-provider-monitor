/**
 * @file Navbar.jsx
 * @description Barra de navegação global.
 *
 * Apresenta o branding e controles globais como a alternância de tema.
 *
 * @author Murilo A. Tavares (muriloatavares)
 */

import { Activity, Sun, Moon } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <header
        className="w-full max-w-4xl pointer-events-auto backdrop-blur-xl border rounded-full px-6 h-14 flex items-center justify-between shadow-lg transition-colors duration-500"
        style={{
          backgroundColor:
            theme === "dark"
              ? "rgba(10, 10, 10, 0.45)"
              : "rgba(255, 255, 255, 0.45)",
          borderColor:
            theme === "dark"
              ? "rgba(255, 255, 255, 0.05)"
              : "rgba(0, 0, 0, 0.05)",
        }}
      >
        {/* Left: Branding */}
        <div className="flex items-center gap-3 select-none">
          <div className="w-6 h-6 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-full flex items-center justify-center">
            <Activity className="w-3.5 h-3.5" strokeWidth={2.5} />
          </div>
          <h1 className="text-[14px] font-semibold text-[var(--text-primary)] tracking-tight">
            AI Providers Monitor
          </h1>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center">
          <button
            onClick={toggleTheme}
            className="relative p-2 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all duration-300 active:scale-95 flex items-center justify-center overflow-hidden group"
            title="Toggle theme"
          >
            <div className="relative w-5 h-5 flex items-center justify-center">
              <Sun
                className={`absolute transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                  theme === "dark"
                    ? "rotate-0 scale-100 opacity-100 group-hover:rotate-90 group-hover:text-yellow-400"
                    : "-rotate-[180deg] scale-0 opacity-0"
                }`}
                strokeWidth={2}
                size={18}
              />
              <Moon
                className={`absolute transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                  theme === "dark"
                    ? "rotate-[180deg] scale-0 opacity-0"
                    : "rotate-0 scale-100 opacity-100 group-hover:-rotate-12 group-hover:text-indigo-400"
                }`}
                strokeWidth={2}
                size={18}
              />
            </div>
          </button>
        </div>
      </header>
    </div>
  );
}
