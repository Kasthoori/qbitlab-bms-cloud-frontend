import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";


interface Props {

    children: ReactNode;
}

export default function AppLayout({children}: Props) {

    return (
        <div className="h-screen flex overflow-hidden">
            {/* Left Panel */}
            <Sidebar />

            {/* Main Area */}
            <div className="flex-1 flex flex-col bg-slate-50">
                <Topbar />

                <main className="flex-1 overflow-auto p-6">

                    {children}  
                </main>
            </div>

        </div>
    );
}