import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";

export const LoadingState = () => (
  <main className="flex min-h-screen items-center justify-center bg-[#fff9df] p-6" data-testid="loading-state">
    <div className="border-2 border-black bg-white p-8 text-center shadow-[8px_8px_0_#111]">
      <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-[#0b6b3a]" aria-hidden="true" />
      <p data-testid="loading-state-text" className="font-black uppercase tracking-[0.12em] text-black">Loading live tracker data</p>
    </div>
  </main>
);

export const ErrorState = ({ message, onRetry }) => (
  <main className="flex min-h-screen items-center justify-center bg-[#fff9df] p-6" data-testid="error-state">
    <div className="max-w-lg border-2 border-black bg-white p-8 shadow-[8px_8px_0_#b91c1c]">
      <AlertTriangle className="mb-4 h-10 w-10 text-red-700" aria-hidden="true" />
      <h1 data-testid="error-state-heading" className="font-display text-3xl font-black text-black">Tracker data could not load</h1>
      <p data-testid="error-state-message" className="mt-3 text-sm leading-6 text-zinc-800">{message || "The dashboard could not read the public Google Sheet right now."}</p>
      <Button data-testid="retry-load-button" onClick={onRetry} className="mt-5 border-2 border-black bg-[#f8c400] font-black text-black shadow-[3px_3px_0_#111] hover:bg-[#ffe26a]">Try again</Button>
    </div>
  </main>
);