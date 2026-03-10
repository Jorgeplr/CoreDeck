import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { useUiStore } from "@/store/uiStore";

export default function AppShell() {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-900 overflow-hidden">
      <Sidebar />
      <div
        className={`flex flex-col flex-1 overflow-hidden transition-all duration-200 ${
          sidebarOpen ? "ml-64" : "ml-16"
        }`}
      >
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
