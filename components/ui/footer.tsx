import { cn } from "@/lib/utils";

interface FooterProps extends React.HTMLAttributes<HTMLElement> {}

export function Footer({ className, ...props }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={cn("w-full min-w-0 px-4 py-4 sm:px-6 lg:px-8", className)}
      {...props}
    >
      <div className="mx-auto flex w-full min-w-0 max-w-[min(100rem,100%)] flex-col items-center justify-between gap-2 sm:flex-row">
        <p className="text-center text-xs text-muted-foreground sm:text-left">
          © {currentYear} Sistema de Gestión de Residentes. Todos los derechos
          reservados.
        </p>
      </div>
    </footer>
  );
}
