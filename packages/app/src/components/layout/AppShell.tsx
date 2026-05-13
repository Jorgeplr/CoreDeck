import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { useUiStore } from "@/store/uiStore";

export default function AppShell() {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);

  return (
    <div className="relative flex h-screen overflow-hidden">
      <div className="pointer-events-none absolute -top-40 right-[-10%] h-96 w-96 rounded-full bg-[var(--app-accent)]/20 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 left-[-10%] h-[28rem] w-[28rem] rounded-full bg-[var(--app-accent-2)]/20 blur-[140px]" />
      <Sidebar />
      <div
        className={`relative flex flex-col flex-1 overflow-hidden transition-all duration-200 ${
          sidebarOpen ? "ml-72" : "ml-20"
        }`}
      >
        <TopBar />
        <main className="flex-1 overflow-y-auto px-6 pb-10 pt-6 lg:px-10">
          <div className="mx-auto w-full max-w-screen-xl">
            <div className="rounded-[28px] bg-[var(--app-panel)]/90 ring-1 ring-[var(--app-border)] shadow-[var(--app-shadow)] backdrop-blur-xl">
              <div className="p-6 lg:p-8">
                <Outlet />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
