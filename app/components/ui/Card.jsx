// "use client";

// export default function Card({ children, className = "" }) {
//   return (
//     <div className={`bg-white shadow-md rounded-2xl p-4 ${className}`}>
//       {children}
//     </div>
//   );
// }
import * as React from "react";
import { cn } from "@/lib/utils"; // helper for combining Tailwind classes (we’ll define it below if missing)

/**
 * A simple reusable Card component (shadcn/ui style)
 */

const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border bg-white text-gray-900 shadow-sm transition hover:shadow-md",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-4 border-b bg-gray-50", className)} {...props} />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-4", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-4 border-t bg-gray-50", className)} {...props} />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardTitle, CardContent, CardFooter };

