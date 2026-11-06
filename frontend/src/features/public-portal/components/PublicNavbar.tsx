import { Link } from "react-router-dom";
import { LogIn, ArrowLeft } from "lucide-react";
import type { PublicSection } from "../types";
interface PublicNavbarProps {
  activeSection: PublicSection;
  onSelectSection: (section: PublicSection) => void;
  onOpenMethodology: () => void;
  onOpenExport: () => void;
}
export default function PublicNavbar(_props: PublicNavbarProps) {
  return (
    <header
      className="sticky top-0 z-40 border-b border-emerald-100 bg-white/95 shadow-sm backdrop-blur-md"
      aria-label="Public portal header"
    >
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:px-6">
        <Link
          to="/"
          aria-label="AgriLens Rwanda home"
          className="flex min-w-0 items-center gap-2"
        >
          <img
            src="/logo.png?v=2"
            alt=""
            className="h-8 w-8 shrink-0 object-contain"
          />
          <div className="min-w-0">
            <div className="text-sm font-extrabold leading-tight tracking-tight text-emerald-950 sm:text-lg">
              AgriLens{" "}
              <span className="font-normal text-emerald-700">Rwanda</span>
            </div>
            <div className="hidden text-[10px] font-semibold uppercase tracking-widest text-slate-500 min-[380px]:block">
              Public portal
            </div>
          </div>
        </Link>
        <nav
          aria-label="Public portal account and home"
          className="flex shrink-0 items-center gap-1.5 sm:gap-3"
        >
          <Link
            to="/"
            aria-label="Back to home"
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-emerald-600 sm:px-4 sm:text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="sm:hidden">Home</span>
            <span className="hidden sm:inline">Back to home</span>
          </Link>
          <Link
            to="/login"
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-emerald-900 px-2.5 text-xs font-semibold text-white hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-emerald-600 sm:px-4 sm:text-sm"
          >
            <LogIn className="h-4 w-4" />
            Login
          </Link>
        </nav>
      </div>
    </header>
  );
}
