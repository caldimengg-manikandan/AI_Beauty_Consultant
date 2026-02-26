import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { Outlet } from "react-router-dom";
import ConsultantChat from "../features/chat/ConsultantChat";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

const DashboardLayout = () => {
  const { i18n } = useTranslation();

  return (
    <div className={`flex h-screen bg-gradient-to-br from-purple-50 via-teal-50 to-blue-50 relative overflow-hidden ${i18n.language === 'ar' ? 'font-arabic' : ''}`} dir={document.documentElement.dir}>

      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-20 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 -right-20 w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-20 left-1/2 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Sidebar */}
      <Sidebar />

      {/* Main area */}
      <div className="flex flex-col flex-1 relative z-10">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <Outlet />
        </main>
      </div>

      {/* AI Chatbot Widget - Floats on top */}
      <ConsultantChat />

    </div>
  );
};

export default DashboardLayout;
