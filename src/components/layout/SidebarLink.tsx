import { SidebarLinkProps } from "@/types";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export function SidebarLink({ href, label, icon: Icon, isActive, isLoading, onClick }: SidebarLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-[10px] transition-all duration-200 font-bold text-sm
        ${isActive 
          ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm' 
          : 'text-muted-foreground hover:text-foreground hover:bg-surface-2 border border-transparent'} 
        ${isLoading ? 'opacity-70 pointer-events-none' : ''}
      `}
    >
      {isLoading ? (
        <Loader2 size={18} strokeWidth={2.5} className="animate-spin text-primary" />
      ) : (
        <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
      )}
      <span>{label}</span>
    </Link>
  );
}