import React from "react";
import { LayoutDashboard } from "lucide-react";

export const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen w-full flex bg-white overflow-hidden">
      {/* Left Panel - Branding (Hidden on mobile/tablet) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-indigo-950 flex-col justify-between p-12 text-white overflow-hidden">
        {/* Abstract subtle background elements */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
          <div className="absolute top-40 -right-20 w-80 h-80 bg-fuchsia-600 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-40 left-20 w-80 h-80 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        {/* Logo area */}
        <div className="relative z-10 flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/30">
            <LayoutDashboard size={28} className="text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">AK Techs</span>
        </div>

        {/* Main messaging */}
        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl font-extrabold tracking-tight mb-6 leading-tight text-white">
            Catalog, staff, and permissions in one place.
          </h2>
          <p className="text-indigo-200/90 text-lg leading-relaxed font-normal">
            Manage departments, employees, categories, and products from a single dashboard.
          </p>
        </div>
        
        {/* Minimal Footer */}
        <div className="relative z-10 text-sm text-indigo-300/70 font-medium">
          &copy; {new Date().getFullYear()} AK Techs. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 md:p-16 lg:p-24 relative bg-slate-50 lg:bg-white transition-colors duration-300">
        {/* Mobile Logo (Visible only on small screens) */}
        <div className="absolute top-8 left-8 lg:hidden flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-600 rounded-lg">
            <LayoutDashboard size={22} className="text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">AK Techs</span>
        </div>
        
        <div className="w-full max-w-[420px]">
          {children}
        </div>
      </div>
    </div>
  );
};
