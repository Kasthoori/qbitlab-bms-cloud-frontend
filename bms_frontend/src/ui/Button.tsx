import * as React from "react";

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", ...props }, ref) => (
    <button
      ref={ref}
      className={`h-10 px-4 rounded-md font-medium transition ${className}`}
      {...props}
    />
  )
);

Button.displayName = "Button";
