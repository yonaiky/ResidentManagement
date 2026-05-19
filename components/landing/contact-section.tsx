"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

export function ContactSection() {
  const { toast } = useToast();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    toast({
      title: "Mensaje enviado",
      description: "Gracias por tu interés. Nos pondremos en contacto contigo pronto.",
    });
    (e.target as HTMLFormElement).reset();
  }

  return (
    <section id="contacto" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="landing-glow landing-glass overflow-hidden rounded-3xl border border-white/10">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-0">
            <div className="p-8 sm:p-12 lg:p-14">
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Moderniza la gestión de tu comunidad residencial
              </h2>
              <p className="mt-4 text-slate-400 leading-relaxed">
                Solicita una demo y descubre cómo Resident Management puede ayudarte a
                automatizar procesos, reducir errores y mejorar la experiencia de tus
                residentes.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-violet-600 shadow-lg shadow-violet-500/25"
                >
                  <Link href="/register">
                    Solicitar demo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/15 bg-transparent text-white hover:bg-white/10"
                >
                  <Link href="/login">Iniciar sesión</Link>
                </Button>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="border-t border-white/10 bg-white/[0.02] p-8 sm:p-12 lg:border-l lg:border-t-0"
            >
              <p className="mb-6 text-sm font-medium text-slate-300">Escríbenos</p>
              <div className="space-y-4">
                <Input
                  name="name"
                  placeholder="Nombre completo"
                  required
                  className="h-11 border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                />
                <Input
                  name="email"
                  type="email"
                  placeholder="Email"
                  required
                  className="h-11 border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                />
                <Input
                  name="phone"
                  placeholder="Teléfono"
                  className="h-11 border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                />
                <textarea
                  name="message"
                  placeholder="Mensaje"
                  rows={4}
                  className="flex w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                />
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-violet-600"
                >
                  Enviar mensaje
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
