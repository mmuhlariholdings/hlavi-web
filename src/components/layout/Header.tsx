"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, CalendarCheck, Kanban, Menu, X, Plus } from "lucide-react";
import { useRepository } from "@/contexts/RepositoryContext";
import { CreateTaskModal } from "@/components/tasks/CreateTaskModal";

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const { owner, repo } = useRepository();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/agenda", label: "Agenda", icon: CalendarCheck },
    { href: "/board", label: "Board", icon: Kanban },
    { href: "/timeline", label: "Timeline", icon: Calendar },
  ];

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2" onClick={closeMobileMenu}>
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">H</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Hlavi</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-3">
              <nav className="flex gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              {/* New Task Button (Desktop) */}
              {owner && repo && (
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New Task
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-700" />
              ) : (
                <Menu className="w-6 h-6 text-gray-700" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <nav className="px-4 py-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobileMenu}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}

              {/* New Task Button (Mobile) */}
              {owner && repo && (
                <button
                  onClick={() => {
                    setCreateModalOpen(true);
                    closeMobileMenu();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-lg text-base font-medium hover:bg-blue-700 transition-colors mt-2"
                >
                  <Plus className="w-5 h-5" />
                  New Task
                </button>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-25 z-30 md:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </>
  );
}
