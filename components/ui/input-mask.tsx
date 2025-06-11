import * as React from "react";
import { IMaskInput } from "react-imask";
import { cn } from "@/lib/utils";

export interface InputMaskProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  mask: string;
  unmask?: boolean;
  onAccept?: (value: string) => void;
}

const InputMask = React.forwardRef<HTMLInputElement, InputMaskProps>(
  ({ className, type, mask, unmask = true, onAccept, ...props }, ref) => {
    return (
      <IMaskInput
        mask={mask}
        unmask={unmask}
        onAccept={onAccept}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    );
  }
);

InputMask.displayName = "InputMask";

export { InputMask }; 