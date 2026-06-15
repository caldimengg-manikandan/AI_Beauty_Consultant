import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { Outlet } from "react-router-dom";
import ConsultantChat from "../features/chat/ConsultantChat";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const DashboardLayout = () => {
  const { i18n } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, []);

  return (
    <div
      className={`flex h-screen relative overflow-hidden ${i18n.language === "ar" ? "font-arabic" : ""}`}
      dir={document.documentElement.dir}
      style={{ background: "var(--surface-base)" }}
    >
      {/* ── Subtle ambient glow — purely decorative ─────── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
        <div
          className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full animate-blob opacity-[0.04]"
          style={{ background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)" }}
        />
        <div
          className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full animate-blob animation-delay-2000 opacity-[0.03]"
          style={{ background: "radial-gradient(circle, #0d9488 0%, transparent 70%)" }}
        />
      </div>

      {/* ── Mobile Sidebar Overlay ────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 md:hidden"
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────── */}
      <div
        className={`fixed md:relative inset-y-0 left-0 z-40 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] shrink-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* ── Main ─────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 relative z-10 min-w-0 overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen((p) => !p)} />
        <main
          className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 custom-scrollbar"
          style={{ background: "var(--surface-base)" }}
        >
          <Outlet />
        </main>
      </div>

      {/* ── AI Consultant Chat ────────────────────────────── */}
      <ConsultantChat />
    </div>
  );
};

export default DashboardLayout;
