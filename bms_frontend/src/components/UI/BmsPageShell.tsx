import { cn } from "@/lib/cn";

type BmsPageShellProps = {
    children: React.ReactNode;
    className?: string;
    contentClassName?: string;
}



export function BmsPageShell({
    children,
    className,
    contentClassName,
}: BmsPageShellProps) {

    return (
        <main className={cn("bms-page", className)}>
           <div className={cn("bms-page-content", contentClassName)}>
             {children}
           </div>
        </main>
    );
}