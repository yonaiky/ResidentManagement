"use client";

import type { ReactNode } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  CalendarIcon,
  Filter,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  DATE_FIELDS,
  DATE_PRESETS,
  MONTH_OPTIONS,
  PAYMENT_STATUSES,
  REPORT_TYPES,
  RESIDENT_STATUSES,
  SORT_OPTIONS,
  TOKEN_STATUSES,
} from "@/lib/reports/constants";
import type { ReportsFilters } from "@/lib/reports/types";

type ReportsFiltersPanelProps = {
  draft: ReportsFilters;
  onChange: <K extends keyof ReportsFilters>(key: K, value: ReportsFilters[K]) => void;
  onApply: () => void;
  onReset: () => void;
  hasActiveFilters: boolean;
};

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => currentYear - i);

export function ReportsFiltersPanel({
  draft,
  onChange,
  onApply,
  onReset,
  hasActiveFilters,
}: ReportsFiltersPanelProps) {
  const showPaymentFilters =
    draft.reportType === "payments" || draft.reportType === "arrears";
  const showTokenFilters = draft.reportType === "tokens";
  const showAmountRange =
    draft.reportType === "payments" || draft.reportType === "arrears";
  const isCustomRange = draft.datePreset === "custom";

  const fromDate = draft.from ? new Date(draft.from) : undefined;
  const toDate = draft.to ? new Date(draft.to) : undefined;

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Filtros del reporte</h2>
            <p className="text-xs text-muted-foreground">
              Refina por período, estado, montos y búsqueda
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={onReset}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Limpiar
            </Button>
          )}
          <Button size="sm" onClick={onApply}>
            <Filter className="mr-2 h-4 w-4" />
            Aplicar filtros
          </Button>
        </div>
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4 sm:p-6">
        <FilterField label="Tipo de reporte">
          <Select
            value={draft.reportType}
            onValueChange={(v) => onChange("reportType", v as ReportsFilters["reportType"])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REPORT_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="Período">
          <Select
            value={draft.datePreset}
            onValueChange={(v) => onChange("datePreset", v as ReportsFilters["datePreset"])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_PRESETS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="Campo de fecha">
          <Select
            value={draft.dateField}
            onValueChange={(v) => onChange("dateField", v as ReportsFilters["dateField"])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_FIELDS.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="Búsqueda">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Nombre, cédula, registro..."
              value={draft.search}
              onChange={(e) => onChange("search", e.target.value)}
            />
          </div>
        </FilterField>

        {showPaymentFilters && (
          <FilterField label="Estado de pago">
            <Select
              value={draft.paymentStatus}
              onValueChange={(v) => onChange("paymentStatus", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>
        )}

        <FilterField label="Estado del residente">
          <Select
            value={draft.residentStatus}
            onValueChange={(v) => onChange("residentStatus", v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RESIDENT_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        {showTokenFilters && (
          <FilterField label="Estado del token">
            <Select
              value={draft.tokenStatus}
              onValueChange={(v) => onChange("tokenStatus", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TOKEN_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>
        )}

        <FilterField label="Mes específico">
          <Select value={draft.month} onValueChange={(v) => onChange("month", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTH_OPTIONS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="Año">
          <Select value={draft.year} onValueChange={(v) => onChange("year", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {YEAR_OPTIONS.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="Ordenar por">
          <Select
            value={draft.sortBy}
            onValueChange={(v) => onChange("sortBy", v as ReportsFilters["sortBy"])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="Dirección">
          <Select
            value={draft.sortOrder}
            onValueChange={(v) => onChange("sortOrder", v as "asc" | "desc")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Descendente</SelectItem>
              <SelectItem value="asc">Ascendente</SelectItem>
            </SelectContent>
          </Select>
        </FilterField>
      </div>

      {(isCustomRange || showAmountRange) && (
        <Collapsible defaultOpen>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center justify-between border-t border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/50 sm:px-6"
            >
              Opciones avanzadas
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="grid gap-4 border-t border-border p-4 sm:grid-cols-2 lg:grid-cols-4 sm:p-6">
              {isCustomRange && (
                <>
                  <FilterField label="Desde">
                    <DatePickerButton
                      date={fromDate}
                      placeholder="Fecha inicio"
                      onSelect={(d) =>
                        onChange("from", d ? format(d, "yyyy-MM-dd") : undefined)
                      }
                    />
                  </FilterField>
                  <FilterField label="Hasta">
                    <DatePickerButton
                      date={toDate}
                      placeholder="Fecha fin"
                      onSelect={(d) =>
                        onChange("to", d ? format(d, "yyyy-MM-dd") : undefined)
                      }
                    />
                  </FilterField>
                </>
              )}

              {showAmountRange && (
                <>
                  <FilterField label="Monto mínimo">
                    <Input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={draft.minAmount}
                      onChange={(e) => onChange("minAmount", e.target.value)}
                    />
                  </FilterField>
                  <FilterField label="Monto máximo">
                    <Input
                      type="number"
                      min={0}
                      placeholder="Sin límite"
                      value={draft.maxAmount}
                      onChange={(e) => onChange("maxAmount", e.target.value)}
                    />
                  </FilterField>
                </>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function DatePickerButton({
  date,
  placeholder,
  onSelect,
}: {
  date?: Date;
  placeholder: string;
  onSelect: (date: Date | undefined) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP", { locale: es }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={date} onSelect={onSelect} initialFocus />
      </PopoverContent>
    </Popover>
  );
}
