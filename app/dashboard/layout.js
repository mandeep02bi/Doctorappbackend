"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import api from "@/utils/api";
import { 
  Home, 
  Users, 
  UserSquare2, 
  HeartPulse,
  Palette, 
  Briefcase, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Bell, 
  ChevronLeft, 
  ChevronRight, 
  Activity, 
  AlertCircle,
  HelpCircle
} from "lucide-react";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { 
    primaryColor, 
    typography, 
    buttonStyle, 
    appbarStyle, 
    iconStyle 
  } = useTheme();

  // Component states
  const [mounted, setMounted] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [user, setUser] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);

  // Setup client checks and load session
  useEffect(() => {
    let active = true;
    const accessToken = localStorage.getItem("accesstoken");

    if (!accessToken) {
      // Redirect back to login if no session is active
      router.push("/");
    } else {
      const validateSession = async () => {
        try {
          const { data } = await api.get("/auth/me");

          if (data?.status === false) {
            throw new Error(data.message || "Session expired");
          }

          if (!active) return;
          const profile = data?.data || null;
          if (profile) {
            localStorage.setItem("user", JSON.stringify(profile));
          }
          setUser(profile);
          setMounted(true);
        } catch {
          localStorage.removeItem("accesstoken");
          localStorage.removeItem("refreshtoken");
          localStorage.removeItem("user");
          localStorage.removeItem("aurahealth_session");
          if (active) router.push("/");
        }
      };

      validateSession();
    }

    return () => {
      active = false;
    };
  }, [router]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Sidebar Menu configuration
  const menuItems = [
    { name: "Home Dashboard", path: "/dashboard", icon: Home },
    { name: "Doctors Registry", path: "/dashboard/doctors", icon: Users },
    { name: "Staff Directory", path: "/dashboard/staff", icon: UserSquare2 },
    { name: "Patients Registry", path: "/dashboard/patients", icon: HeartPulse },
    { name: "Theme Customizer", path: "/dashboard/theme", icon: Palette },
    { name: "Business Settings", path: "/dashboard/business", icon: Briefcase },
    { name: "Admin Settings", path: "/dashboard/settings", icon: Settings },
  ];

  // Helper for determining dynamic page titles
  const getPageTitle = () => {
    if (pathname === "/dashboard") return "Operations Home Dashboard";
    if (pathname === "/dashboard/doctors") return "Doctors Registry Directory";
    if (pathname === "/dashboard/staff") return "Nurses & Support Staff";
    if (pathname === "/dashboard/patients") return "Patients Registry";
    if (pathname?.startsWith("/dashboard/patients/")) return "Patient Clinical Record";
    if (pathname === "/dashboard/create-certificate") return "Create Templates";
    if (pathname === "/dashboard/theme") return "Visual Theme Customizer";
    if (pathname === "/dashboard/business") return "Clinical Business Settings";
    if (pathname === "/dashboard/settings") return "Administrator Configuration";
    return "Clinical Management Control";
  };

  // Logout handler
  const handleLogout = async() => {
   try {
    await api.post("/auth/logout");
    localStorage.removeItem("accesstoken");
    localStorage.removeItem("refreshtoken");
    localStorage.removeItem("user");
    localStorage.removeItem("aurahealth_session");
    router.push("/");
   } catch (error) {
    console.error("Logout failed", error); 
   }
   
  };

  // Determine Appbar styles based on selected custom theme
  const getAppbarClass = () => {
    switch (appbarStyle) {
      case "solid":
        return "bg-white border-b border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-sm";
      case "minimal":
        return "bg-transparent border-none";
      case "glass":
      default:
        return "glass-panel bg-white/75 border-b border-slate-200/50 shadow-sm backdrop-blur-md";
    }
  };

  return (
    <div className={`min-h-screen flex flex-row bg-slate-50 text-slate-800 transition-all font-outfit duration-300`}>
      {/* 1. Desktop Sidebar Navigation */}
      <aside 
        className={`hidden md:flex flex-col border-r border-slate-200/60 bg-slate-900 text-white relative transition-all duration-300 z-20 shrink-0 ${
          sidebarExpanded ? "w-64" : "w-20"
        }`}
      >
        {/* Sidebar Header Title */}
        <div className="min-h-20 flex items-center justify-between px-5 py-3 border-b border-slate-800/80">
          {sidebarExpanded ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2"
            >
              <div className="bg-primary/20 border border-primary/45 rounded-xl px-2 py-2">
                <Image src="/image_44ed8e77-Photoroom.png" alt="ADIXON Logo" width={200} height={200} className="h-11 w-36 rounded-sm object-contain" />
              </div>
              
            </motion.div>
          ) : (
            <div className="mx-auto p-2 bg-primary/20 border border-primary/45 rounded-xl">
              <Activity className="h-5 w-5 text-primary animate-pulse" />
            </div>
          )}
        </div>

        {/* Navigation Link list */}
        <nav className="flex-1 px-3 py-5 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            const IconComponent = item.icon;
            
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`w-full relative flex items-center gap-3.5 py-3 px-4 rounded-xl text-sm font-medium transition-all group focus:outline-none cursor-pointer ${
                  isActive 
                    ? "text-white" 
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                {/* Active Background Pill (Framer Motion) */}
                {isActive && (
                  <motion.div
                    layoutId="activeSidePill"
                    className="absolute inset-0 bg-primary shadow-lg shadow-primary/20 rounded-xl z-0"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}

                <div className="relative z-10 shrink-0">
                  <IconComponent 
                    className={`h-5 w-5 transition-transform duration-300 group-hover:scale-110 ${
                      isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                    }`} 
                    fill={iconStyle === "filled" && isActive ? "currentColor" : "none"}
                  />
                </div>

                {sidebarExpanded && (
                  <motion.span 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="relative z-10 font-light truncate"
                  >
                    {item.name}
                  </motion.span>
                )}

                {/* Tooltip for collapsed mode */}
                {!sidebarExpanded && (
                  <div className="absolute left-24 bg-slate-950 text-white text-xs px-2.5 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl border border-slate-800 z-30 font-light">
                    {item.name}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer Logout Button */}
        <div className="p-4 border-t border-slate-800/80">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-3.5 py-3 px-4 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 text-sm font-medium transition-all focus:outline-none cursor-pointer group"
          >
            <div className="shrink-0">
              <LogOut className="h-5 w-5 group-hover:rotate-12 transition-transform text-slate-400 group-hover:text-rose-400" />
            </div>
            {sidebarExpanded && (
              <span className="font-light truncate">Secure Sign Out</span>
            )}
          </button>
        </div>

        {/* Toggle Collapse Arrow Button */}
        <button
          onClick={() => setSidebarExpanded(!sidebarExpanded)}
          className="absolute bottom-20 -right-3.5 bg-slate-900 border border-slate-700 h-7 w-7 rounded-full flex items-center justify-center text-slate-400 hover:text-white focus:outline-none cursor-pointer hover:border-slate-500 shadow-md"
        >
          {sidebarExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </aside>

      {/* 2. Mobile Drawer Navigation Overlay */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
              className="fixed inset-0 bg-black z-30 md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed inset-y-0 left-0 w-64 bg-slate-900 text-white z-40 flex flex-col md:hidden border-r border-slate-800"
            >
              <div className="min-h-20 flex items-center justify-between px-5 py-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/20 border border-primary/45 rounded-xl px-2 py-2">
                    <Image src="/image_44ed8e77-Photoroom.png" alt="ADIXON Logo" width={200} height={200} className="h-11 w-36 rounded-sm object-contain" />
                  </div>
                </div>
                <button 
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white focus:outline-none"
                >
                  <X className="h-5.5 w-5.5" />
                </button>
              </div>

              <nav className="flex-1 px-3 py-5 space-y-2 overflow-y-auto">
                {menuItems.map((item) => {
                  const isActive = pathname === item.path;
                  const IconComponent = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        router.push(item.path);
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full relative flex items-center gap-3.5 py-3 px-4 rounded-xl text-sm font-medium transition-all focus:outline-none cursor-pointer ${
                        isActive ? "text-white bg-primary" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <IconComponent className="h-5 w-5 shrink-0" fill={iconStyle === "filled" && isActive ? "currentColor" : "none"} />
                      <span className="font-light">{item.name}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-slate-800">
                <button
                  onClick={() => {
                    setMobileSidebarOpen(false);
                    setShowLogoutConfirm(true);
                  }}
                  className="w-full flex items-center gap-3.5 py-3 px-4 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 text-sm font-medium transition-all focus:outline-none cursor-pointer"
                >
                  <LogOut className="h-5 w-5 shrink-0" />
                  <span className="font-light">Secure Sign Out</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* 3. Main Frame Workspace */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Dynamic Header / AppBar */}
        <header className={`h-16 flex items-center justify-between px-6 md:px-8 z-10 shrink-0 sticky top-0 transition-all ${getAppbarClass()}`}>
          {/* Left Section: Page name & hamburger */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white/80 hover:bg-slate-100 text-slate-700 md:hidden focus:outline-none cursor-pointer shadow-sm"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg md:text-xl font-bold text-slate-800 font-outfit tracking-tight">
              {getPageTitle()}
            </h1>
          </div>

          {/* Right Section: Alerts & Administrator Details */}
          
        </header>

        {/* 4. Active Sub-page content */}
        <main className="flex-1 p-5 sm:p-6 md:p-8 overflow-y-auto w-full max-w-7xl mx-auto flex flex-col gap-6">
          {children}
        </main>
      </div>

      {/* 5. Secure Logout Confirmation Overlay Dialog */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="fixed inset-0 bg-slate-950"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-6 shadow-2xl z-10 relative overflow-hidden"
            >
              {/* Highlight header accent */}
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-rose-500" />
              
              <h3 className="text-lg font-bold text-slate-800 font-outfit mb-2">Secure Sign Out</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Are you absolutely sure you want to log out of your AuraHealth clinical portal? You will need to verify your credentials again.
              </p>
              
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 border border-slate-200 hover:bg-slate-50 rounded-xl transition-all cursor-pointer focus:outline-none"
                >
                  Cancel and Stay
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white rounded-xl shadow-md shadow-rose-500/10 hover:shadow-rose-600/20 transition-all cursor-pointer focus:outline-none"
                >
                  Sign Out Securely
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
