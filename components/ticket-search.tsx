"use client";

import { useState, useEffect } from "react";
import {
  Search,
  FileText,
  Hash,
  Calendar,
  MapPin,
  User,
  XCircle,
  AlertCircle,
  Loader2,
  X,
  Snowflake,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatsDashboard } from "@/components/stats-dashboard";
import { Ticket } from "@/lib/mock-data";
import { fetchServerTickets, getStoredTickets } from "@/lib/local-storage";

const statusColors: Record<string, string> = {
  Утвержден: "bg-green-100 text-green-700 border-green-300",
  "В работе": "bg-cyan-100 text-cyan-700 border-cyan-300",
  Регистрация: "bg-yellow-100 text-yellow-700 border-yellow-300",
  "Ожидание запчастей": "bg-orange-100 text-orange-700 border-orange-300",
};

function mergeUnique(a: Ticket[], b: Ticket[]): Ticket[] {
  const seen = new Set<string>();
  const result: Ticket[] = [];
  for (const t of [...a, ...b]) {
    const key = `${t.ticketNumber}||${t.serialNumber}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(t);
  }
  return result;
}

function ResultCard({ ticket }: { ticket: Ticket }) {
  const statusClass =
    statusColors[ticket.status] ||
    "bg-slate-50 text-slate-700 border-slate-200";

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 rounded-2xl">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-mono-num tracking-tight">
                {ticket.ticketNumber}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {ticket.itemName}
              </p>
            </div>
          </div>
          <Badge className={`${statusClass} shrink-0 rounded-full px-3 py-1`}>{ticket.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start gap-3 rounded-xl bg-muted p-3">
          <div className="mt-0.5 shrink-0">
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Адрес</p>
            <p className="text-sm font-medium">{ticket.address}</p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl bg-muted p-3">
          <div className="mt-0.5 shrink-0">
            <Hash className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Серийный номер</p>
            <p className="text-sm font-medium font-mono-num">{ticket.serialNumber}</p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl bg-muted p-3">
          <div className="mt-0.5 shrink-0">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Исполнитель</p>
            <p className="text-sm font-medium">{ticket.performer}</p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl bg-muted p-3">
          <div className="mt-0.5 shrink-0">
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Дата заявки</p>
            <p className="text-sm font-medium">{ticket.date}</p>
          </div>
        </div>
        {ticket.completionDate && (
          <div className="flex items-start gap-3 rounded-xl bg-green-50 p-3 border border-green-200">
            <div className="mt-0.5 shrink-0">
              <Calendar className="h-4 w-4 text-green-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-green-600 font-medium">
                Дата выполнения ремонта
              </p>
              <p className="text-sm font-medium text-green-700">
                {ticket.completionDate}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function TicketSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Ticket[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    // Prefer this browser's local cache first — instant and reliable even if the
    // server's in-memory store was reset (serverless functions don't share memory).
    const local = getStoredTickets();
    if (local.length > 0) {
      setAllTickets(local);
      setInitialLoading(false);
    }

    fetchServerTickets()
      .then((data) => {
        if (data.tickets.length > 0) {
          setAllTickets((prev) => (prev.length > 0 ? mergeUnique(prev, data.tickets) : data.tickets));
        }
      })
      .catch(() => {})
      .finally(() => setInitialLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setError(null);
    setResults([]);
    setNotFound(false);
    setShowStats(false);
    setLoading(true);

    if (trimmed === "2218") {
      setShowStats(true);
      setLoading(false);
      return;
    }

    try {
      const tickets = allTickets;
      const q = trimmed.toLowerCase();

      const matched = tickets.filter(
        (t: Ticket) =>
          t.ticketNumber.toLowerCase() === q ||
          t.serialNumber.toLowerCase() === q ||
          t.performer.toLowerCase().includes(q)
      );

      if (matched.length > 0) {
        setResults(matched);
      } else {
        setNotFound(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Неизвестная ошибка");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setNotFound(false);
    setError(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto text-center space-y-6 px-4 py-12">
      {initialLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : showStats ? (
        <StatsDashboard
          onBackToSearch={() => {
            setShowStats(false);
            setQuery("");
            setResults([]);
            setNotFound(false);
            setError(null);
          }}
        />
      ) : (
        <>
          <div className="flex items-center justify-center gap-2">
            <Snowflake className="h-4 w-4 text-primary" />
            <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              Отслеживание заявок на ремонт оборудования
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Номер заявки или серийный номер"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    handleClear();
                  }
                }}
                className="h-14 text-base pl-5 pr-12 rounded-2xl shadow-sm"
              />
              {query && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  aria-label="Очистить поиск"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="h-14 px-8 gap-2 text-base font-medium shrink-0 rounded-2xl"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Search className="h-5 w-5" />
              )}
              {loading ? "Поиск..." : "Найти"}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground -mt-4">
            Введите номер заявки или серийный номер оборудования для получения
            информации
          </p>

          {error && (
            <div className="flex flex-col items-center gap-3 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <p className="text-destructive font-medium">{error}</p>
            </div>
          )}

          {notFound && (
            <div className="flex flex-col items-center gap-3 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <XCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">
                Ничего не найдено
              </p>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-4">
              {results.map((ticket) => (
                <ResultCard
                  key={`${ticket.ticketNumber}-${ticket.serialNumber}`}
                  ticket={ticket}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
