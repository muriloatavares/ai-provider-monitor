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
        className="w-full max-w-4xl pointer-events-auto backdrop-blur-xl border rounded-full px-6 h-14 flex items-center justify-between shadow-xl shadow-black/5 transition-colors duration-200"
        style={{
          backgroundColor:
            theme === "dark"
              ? "rgba(10, 10, 10, 0.65)"
              : "rgba(255, 255, 255, 0.65)",
          borderColor:
            theme === "dark"
              ? "rgba(255, 255, 255, 0.08)"
              : "rgba(0, 0, 0, 0.08)",
        }}
      >
        {/* Left: Branding */}
        <div className="flex items-center gap-3 select-none">
          <div className="w-6 h-6 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded flex items-center justify-center">
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
            className="relative p-2 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/10 transition-all duration-200 active:scale-90 flex items-center justify-center overflow-hidden group"
            title="Toggle theme"
          >
            <div className="relative w-[18px] h-[18px]">
              <Sun
                className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                  theme === "dark"
                    ? "rotate-0 group-hover:rotate-90 scale-100 opacity-100"
                    : "-rotate-90 scale-50 opacity-0"
                }`}
                strokeWidth={2}
              />
              <Moon
                className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                  theme === "dark"
                    ? "rotate-90 scale-50 opacity-0"
                    : "rotate-0 group-hover:rotate-90 scale-100 opacity-100"
                }`}
                strokeWidth={2}
              />
            </div>
          </button>
        </div>
      </header>
    </div>
  );
}
