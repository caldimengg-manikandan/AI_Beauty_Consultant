import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { Outlet } from "react-router-dom";
import ConsultantChat from "../features/chat/ConsultantChat";
import BeautyChatbot from "../components/BeautyChatbot";
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
      className={`flex h-screen bg-gradient-to-br from-purple-50 via-teal-50 to-blue-50 relative overflow-hidden ${i18n.language === 'ar' ? 'font-arabic' : ''}`}
      dir={document.documentElement.dir}
    >
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-20 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
        <div className="absolute top-40 -right-20 w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-20 left-1/2 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — always in DOM, slides in/out on mobile */}
      <div className={`fixed md:relative inset-y-0 left-0 z-40 transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main area */}
      <div className="flex flex-col flex-1 relative z-10 min-w-0 overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen(prev => !prev)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 custom-scrollbar">
          <Outlet />
        </main>
      </div>

      {/* AI Chatbot Widget */}
      <BeautyChatbot />
    </div>
  );
};

export default DashboardLayout;
