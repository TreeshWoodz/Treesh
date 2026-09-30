import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const variants = {
  primary: "bg-[#FF3EA5] text-[#0A0A0D] hover:bg-[#FF66BE] shadow-[0_8px_24px_-10px_rgba(255,62,165,.7)]",
  secondary: "bg-[#171923] text-[#F5F6F8] border border-[#25273a] hover:bg-[#1c1f2c] hover:border-[#34374d]",
  ghost: "text-[#B7BBCB] hover:text-[#F5F6F8] hover:bg-white/5",
  danger: "bg-[#2a1216] text-[#FF7A7A] border border-[#4a1f26] hover:bg-[#35161b]",
};
const sizes = { sm: "h-9 px-3.5 text-[13px]", md: "h-11 px-5 text-sm", lg: "h-13 px-6 text-[15px] py-3.5", icon: "h-11 w-11" };

export const Btn = forwardRef(({ variant = "primary", size = "md", className, children, ...p }, ref) => (
  <button
    ref={ref}
    className={cn(
      "press inline-flex items-center justify-center gap-2 rounded-full font-bold transition-colors disabled:pointer-events-none disabled:opacity-50",
      variants[variant],
      sizes[size],
      className
    )}
    {...p}
  >
    {children}
  </button>
));
Btn.displayName = "Btn";
