import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  children: React.ReactNode;
  className?: string;
}

export default function SectionHeading({ children, className }: SectionHeadingProps) {
  return (
    <h2
      className={cn(
        "text-sm font-semibold uppercase tracking-wider text-text-tertiary font-mono",
        className
      )}
    >
      {children}
    </h2>
  );
}
