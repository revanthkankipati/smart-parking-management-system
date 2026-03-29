import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import AdminPage from "./pages/AdminPage";
import BookSlotPage from "./pages/BookSlotPage";
import DashboardPage from "./pages/DashboardPage";
import HomePage from "./pages/HomePage";
import MyBookingsPage from "./pages/MyBookingsPage";

export type Page = "home" | "dashboard" | "book" | "bookings" | "admin";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [dashboardLevel, setDashboardLevel] = useState<string>("L1");

  function navigateTo(page: Page, level?: string) {
    setCurrentPage(page);
    if (level) setDashboardLevel(level);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar currentPage={currentPage} onNavigate={navigateTo} />
      <main className="flex-1">
        {currentPage === "home" && <HomePage onNavigate={navigateTo} />}
        {currentPage === "dashboard" && (
          <DashboardPage
            initialLevel={dashboardLevel}
            onNavigate={navigateTo}
          />
        )}
        {currentPage === "book" && <BookSlotPage onNavigate={navigateTo} />}
        {currentPage === "bookings" && <MyBookingsPage />}
        {currentPage === "admin" && <AdminPage onNavigate={navigateTo} />}
      </main>
      <Footer onNavigate={navigateTo} />
      <Toaster richColors position="top-right" />
    </div>
  );
}
