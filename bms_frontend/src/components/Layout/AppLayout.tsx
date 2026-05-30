import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

interface Props {
  children: ReactNode;
}

export default function AppLayout({ children }: Props) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-950">
      {/* Left Panel */}
      <Sidebar />

      {/* Main Area */}
      <div className="flex min-w-0 flex-1 flex-col bg-slate-950">
        <Topbar />

        <main className="min-w-0 flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}