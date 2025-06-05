import { cn } from "@/lib/utils";

interface FooterProps extends React.HTMLAttributes<HTMLElement> {}

export function Footer({ className, ...props }: FooterProps) {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className={cn("py-6 md:px-8 md:py-0", className)} {...props}>
      <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
          © {currentYear} Sistema de Gestión de Residentes. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
} 