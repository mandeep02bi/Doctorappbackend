"use client";

import React, { useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Palette, 
  Type, 
  MousePointerClick, 
  Layout, 
  Sparkles, 
  Check, 
  Eye,
  Activity,
  Heart,
  Droplet,
  ChevronRight,
  Plus
} from "lucide-react";

export default function ThemeCustomizer() {
  const {
    primaryColor,
    setPrimaryColor,
    typography,
    setTypography,
    buttonStyle,
    setButtonStyle,
    appbarStyle,
    setAppbarStyle,
    iconStyle,
    setIconStyle,
  } = useTheme();

  // Active Category selection tab
  const [activeCategory, setActiveCategory] = useState("colors"); // colors, typography, buttons, appbar, icons

  // Categories definition
  const categories = [
    { id: "colors", name: "Primary Colors", icon: Palette, desc: "Curated HSL accents" },
    { id: "typography", name: "Typography", icon: Type, desc: "Font family profiles" },
    { id: "buttons", name: "Buttons Style", icon: MousePointerClick, desc: "Border corners & curves" },
    { id: "appbar", name: "AppBar Layout", icon: Layout, desc: "Translucency & frames" },
    { id: "icons", name: "Icon Weight", icon: Sparkles, desc: "Visual shape styles" },
  ];

  // Options configuration
  const colorOptions = [
    { id: "indigo", name: "Indigo Glow", desc: "Classic trustworthy clinical tone", hex: "#6366f1", bgClass: "bg-indigo-500" },
    { id: "emerald", name: "Emerald Forest", desc: "Organic health and wellness theme", hex: "#10b981", bgClass: "bg-emerald-500" },
    { id: "velvet", name: "Velvet Midnight", desc: "Premium neurology or surgery violet", hex: "#8b5cf6", bgClass: "bg-violet-500" },
    { id: "rose", name: "Warm Rose", desc: "Soft emergency or pediatric warmth", hex: "#f43f5e", bgClass: "bg-rose-500" },
    { id: "amber", name: "Cyber Amber", desc: "High-contrast clinical alert yellow", hex: "#f59e0b", bgClass: "bg-amber-500" },
  ];

  const typographyOptions = [
    { id: "sans", name: "Clean Sans", fontClass: "font-sans", desc: "Modern neutral system styling (Geist Sans)" },
    { id: "outfit", name: "Premium Outfit", fontClass: "font-outfit", desc: "Curated geometric medical branding (Outfit)" },
    { id: "serif", name: "Editorial Serif", fontClass: "font-serif", desc: "Classic medical journal research (Playfair)" },
    { id: "mono", name: "Technical Mono", fontClass: "font-mono", desc: "Clinical laboratory diagnostic logs (Geist Mono)" },
  ];

  const buttonOptions = [
    { id: "rounded", name: "Classic Rounded", radius: "8px", desc: "Subtle borders providing a classic look", roundedClass: "rounded-lg" },
    { id: "pill", name: "Modern Pill", radius: "9999px", desc: "Fully rounded borders for a friendly look", roundedClass: "rounded-full" },
    { id: "sharp", name: "Sharp Edge", radius: "0px", desc: "Right-angled boxes for high-end minimalism", roundedClass: "rounded-none" },
  ];

  const appbarOptions = [
    { id: "glass", name: "Frosted Glass", desc: "Modern translucent background blur", styleClass: "bg-white/70 backdrop-blur border-b border-white/20" },
    { id: "solid", name: "Solid Clean", desc: "High-contrast crisp white background border", styleClass: "bg-white border-b border-slate-200" },
    { id: "minimal", name: "Borderless", desc: "Minimal border-free background style", styleClass: "bg-transparent border-none" },
  ];

  const iconOptions = [
    { id: "outline", name: "Thin Outline", desc: "Clean default outline weight shapes" },
    { id: "filled", name: "Solid Filled", desc: "High contrast solid filled accent icons" },
  ];

  // Dynamic preview border radius style
  const getButtonRadiusClass = () => {
    if (buttonStyle === "pill") return "rounded-full";
    if (buttonStyle === "sharp") return "rounded-none";
    return "rounded-xl";
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-800 font-outfit">Visual Customizer</h2>
        <p className="text-sm text-slate-500 font-light">
          Design your clinic layout. Modifications will update the CSS properties in real-time across all pages.
        </p>
      </div>

      {/* Main Dual Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT: Category Navigation (Card) */}
        <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-1">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-3">Settings Categories</h3>
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = activeCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`w-full flex items-center gap-3.5 p-3 rounded-xl text-left transition-all cursor-pointer focus:outline-none ${
                  isSelected
                    ? "bg-primary/10 border border-primary/20 text-primary font-bold shadow-sm"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-transparent"
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${
                  isSelected ? "bg-primary text-white" : "bg-slate-100 text-slate-400"
                }`}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div>
                  <span className="text-xs font-semibold block">{cat.name}</span>
                  <span className={`text-[10px] font-light block ${isSelected ? "text-primary/80" : "text-slate-400"}`}>
                    {cat.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* RIGHT: Choices Pane & Live Preview Box */}
        <div className="lg:col-span-8 space-y-6">
          {/* Choices Selection Area */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm min-h-[300px] flex flex-col justify-between">
            <div>
              <div className="pb-4 mb-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 font-outfit text-base">
                  Configure {categories.find(c => c.id === activeCategory)?.name}
                </h3>
                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-semibold uppercase tracking-wider">
                  Live Sync
                </span>
              </div>

              {/* DYNAMIC FORM CHOICE GRID */}
              <div className="space-y-3.5">
                {/* 1. COLORS SELECTION */}
                {activeCategory === "colors" && colorOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setPrimaryColor(opt.id)}
                    className={`w-full flex items-center justify-between p-3.5 border rounded-2xl text-left transition-all cursor-pointer focus:outline-none ${
                      primaryColor === opt.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`h-8 w-8 rounded-full border border-slate-200/50 shadow-inner shrink-0 ${opt.bgClass}`} />
                      <div>
                        <span className="text-xs font-semibold text-slate-700 block">{opt.name}</span>
                        <span className="text-[10px] text-slate-400 font-light block mt-0.5">{opt.desc}</span>
                      </div>
                    </div>
                    {primaryColor === opt.id && (
                      <div className="h-5 w-5 bg-primary text-white rounded-full flex items-center justify-center">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </button>
                ))}

                {/* 2. TYPOGRAPHY SELECTION */}
                {activeCategory === "typography" && typographyOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setTypography(opt.id)}
                    className={`w-full flex items-center justify-between p-3.5 border rounded-2xl text-left transition-all cursor-pointer focus:outline-none ${
                      typography === opt.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <span className={`h-8 w-8 bg-slate-100 text-slate-600 border border-slate-200 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${opt.fontClass}`}>
                        Aa
                      </span>
                      <div>
                        <span className={`text-xs font-semibold text-slate-700 block ${opt.fontClass}`}>{opt.name}</span>
                        <span className="text-[10px] text-slate-400 font-light block mt-0.5">{opt.desc}</span>
                      </div>
                    </div>
                    {typography === opt.id && (
                      <div className="h-5 w-5 bg-primary text-white rounded-full flex items-center justify-center">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </button>
                ))}

                {/* 3. BUTTONS ROUNDING SELECTION */}
                {activeCategory === "buttons" && buttonOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setButtonStyle(opt.id)}
                    className={`w-full flex items-center justify-between p-3.5 border rounded-2xl text-left transition-all cursor-pointer focus:outline-none ${
                      buttonStyle === opt.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <span className={`px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold shrink-0 ${opt.roundedClass}`}>
                        Action
                      </span>
                      <div>
                        <span className="text-xs font-semibold text-slate-700 block">{opt.name}</span>
                        <span className="text-[10px] text-slate-400 font-light block mt-0.5">{opt.desc}</span>
                      </div>
                    </div>
                    {buttonStyle === opt.id && (
                      <div className="h-5 w-5 bg-primary text-white rounded-full flex items-center justify-center">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </button>
                ))}

                {/* 4. APPBAR LAYOUT SELECTION */}
                {activeCategory === "appbar" && appbarOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setAppbarStyle(opt.id)}
                    className={`w-full flex items-center justify-between p-3.5 border rounded-2xl text-left transition-all cursor-pointer focus:outline-none ${
                      appbarStyle === opt.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div>
                      <span className="text-xs font-semibold text-slate-700 block">{opt.name}</span>
                      <span className="text-[10px] text-slate-400 font-light block mt-0.5">{opt.desc}</span>
                    </div>
                    {appbarStyle === opt.id && (
                      <div className="h-5 w-5 bg-primary text-white rounded-full flex items-center justify-center">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </button>
                ))}

                {/* 5. ICONS STYLE SELECTION */}
                {activeCategory === "icons" && iconOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setIconStyle(opt.id)}
                    className={`w-full flex items-center justify-between p-3.5 border rounded-2xl text-left transition-all cursor-pointer focus:outline-none ${
                      iconStyle === opt.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 shrink-0">
                        <Activity className="h-4.5 w-4.5" fill={opt.id === "filled" ? "currentColor" : "none"} />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-700 block">{opt.name}</span>
                        <span className="text-[10px] text-slate-400 font-light block mt-0.5">{opt.desc}</span>
                      </div>
                    </div>
                    {iconStyle === opt.id && (
                      <div className="h-5 w-5 bg-primary text-white rounded-full flex items-center justify-center">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="text-[10px] text-slate-400 mt-6 border-t border-slate-100 pt-3 flex items-center gap-1">
              <span>Theme changes are managed using React Context and injected in document body.</span>
            </div>
          </div>

          {/* DYNAMIC LIVE UI PREVIEW MODULE */}
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 text-white shadow-xl relative overflow-hidden space-y-4">
            <div className="absolute top-0 right-0 h-24 w-24 bg-primary/10 rounded-bl-full pointer-events-none" />

            <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-2 shrink-0">
              <Eye className="h-4.5 w-4.5 text-primary shrink-0 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Live Active System Preview</span>
            </div>

            {/* Mini Dashboard Component */}
            <div className="space-y-4 font-sans">
              {/* Top Mini Header */}
              <div className="flex items-center justify-between p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-primary/20 rounded">
                    <Activity className="h-4 w-4 text-primary" fill={iconStyle === "filled" ? "currentColor" : "none"} />
                  </div>
                  <span className="text-xs font-bold font-outfit text-white">Clinical Panel</span>
                </div>
                <span className="text-[9px] text-slate-500 font-light">Status: Online</span>
              </div>

              {/* Sample Card */}
              <div className="bg-slate-950/40 border border-slate-800/60 p-4 rounded-xl flex flex-col justify-between gap-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">Dr. Sarah Jenkins</h4>
                    <p className="text-[10px] text-slate-400 font-light mt-0.5">Clinical Cardiologist</p>
                  </div>
                  <span className="inline-flex items-center gap-0.5 text-[8px] font-bold bg-primary/20 text-primary border border-primary/20 px-2 py-0.5 rounded uppercase">
                    <Droplet className="h-2.5 w-2.5 text-rose-500 fill-current" /> O Rh+
                  </span>
                </div>

                {/* Micro Input Field */}
                <div>
                  <label className="block text-[8px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Enter clinical checkup notes
                  </label>
                  <input
                    type="text"
                    disabled
                    placeholder="e.g. Stage 1 Hypertension stable"
                    className="block w-full px-2.5 py-1.5 bg-slate-950/60 border border-slate-800 rounded-lg text-[10px] placeholder-slate-600 focus:outline-none"
                  />
                </div>

                {/* Submitting Button previews */}
                <div className="flex gap-2">
                  <button
                    disabled
                    className={`px-3 py-1.5 border border-slate-800 text-slate-500 text-[9px] font-bold bg-slate-950/30 cursor-not-allowed ${getButtonRadiusClass()}`}
                  >
                    Cancel
                  </button>
                  <button
                    disabled
                    className={`px-3 py-1.5 bg-primary text-white text-[9px] font-bold shadow-md shadow-primary/10 flex items-center gap-0.5 cursor-not-allowed ${getButtonRadiusClass()}`}
                  >
                    <Plus className="h-3 w-3 shrink-0" /> Add case record
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
