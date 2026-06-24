/**
 * @file MainLayout.jsx
 * @description Layout base da aplicação.
 *
 * Define a estrutura padrão de todas as páginas, incluindo a Navbar
 * flutuante e o container principal de conteúdo.
 *
 * @author Murilo A. Tavares (muriloatavares)
 */

import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col font-sans transition-colors duration-700 ease-in-out">
      <Navbar />

      <main className="flex-1 p-6 lg:p-12 pt-20 lg:pt-24">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
