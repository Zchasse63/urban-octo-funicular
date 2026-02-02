import { Sidebar } from "./sidebar";
import { ToastProvider } from "@/components/ui/toast";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <ToastProvider>
      <div className="min-h-screen" style={{ backgroundColor: "var(--bg-base)" }}>
        <Sidebar />
        <main
          className="ml-[240px] min-h-screen"
          style={{ backgroundColor: "var(--bg-base)" }}
        >
          <div className="mx-auto max-w-[1400px] px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}
