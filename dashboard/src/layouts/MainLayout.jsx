import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Activity, Sun, Moon } from "lucide-react";

export default function MainLayout() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "dark";
  });

  useEffect(() => {
    if (theme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col font-sans transition-colors duration-200">
      {/* Vercel Style Header */}
      <header className="border-b border-[var(--border-primary)] bg-[var(--bg-card)] px-6 py-4 flex items-center justify-between transition-colors duration-200">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border border-[var(--text-primary)] rounded-full flex items-center justify-center">
            <Activity className="w-3 h-3 text-[var(--text-primary)]" />
          </div>
          <h1 className="text-sm font-semibold text-[var(--text-primary)] tracking-wide">
            AI Providers Monitor
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
            title="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>
          <div className="text-[11px] uppercase tracking-widest text-[var(--text-secondary)] font-semibold border border-[var(--border-primary)] px-2 py-1 rounded">
            Production
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-12">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
