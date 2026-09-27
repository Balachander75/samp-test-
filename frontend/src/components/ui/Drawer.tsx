import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  width?: string;
  footer?: React.ReactNode;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  width = "max-w-xl",
  footer,
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Esc key closes drawer
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Mount/unmount with pointer-events guard
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 dark:bg-black/65 backdrop-blur-[2px] animate-smooth-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out Panel */}
      <div className="fixed inset-y-0 right-0 flex max-w-full">
        <div
          ref={drawerRef}
          className={`w-screen ${width} bg-white dark:bg-[#0f1118] border-l border-zinc-200 dark:border-white/[0.08] shadow-2xl flex flex-col h-full animate-smooth-drawer`}
        >
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-white/[0.08] flex items-center justify-between gap-3 bg-white dark:bg-[#0f1118] shrink-0">
            <div className="min-w-0 flex-1">
              {typeof title === "string" ? (
                <h3 className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  {title}
                </h3>
              ) : (
                title
              )}
              {subtitle && (
                <div className="mt-0.5 text-[11px] font-mono text-zinc-500 dark:text-zinc-500">
                  {subtitle}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 rounded-md flex items-center justify-center border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors duration-150 cursor-pointer shrink-0"
              aria-label="Close panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="px-5 py-3 border-t border-zinc-200 dark:border-white/[0.08] bg-zinc-50/80 dark:bg-[#161822] shrink-0 flex items-center justify-end gap-2">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Drawer;
