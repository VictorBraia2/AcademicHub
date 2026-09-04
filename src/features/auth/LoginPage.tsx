import { useState, type FormEvent } from "react";
import { useAuth } from "./hooks/useAuth";

export function LoginPage() {
  const { signInWithMagicLink } = useAuth();
  const [email, setEmail] = useState("");
  const [magicLinkStatus, setMagicLinkStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [magicLinkError, setMagicLinkError] = useState<string | null>(null);
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMagicLinkStatus("sending");
    setMagicLinkError(null);
    try {
      await signInWithMagicLink(email.trim());
      setMagicLinkStatus("sent");
    } catch (err) {
      setMagicLinkError(err instanceof Error ? err.message : "Não foi possível enviar o link de acesso.");
      setMagicLinkStatus("error");
    }
  }
  return (
    <div className="max-w-sm mx-auto py-10">
      <h2 className="font-display text-2xl mb-2 text-center">Entrar no AcademicHub</h2>
      <p className="text-sm text-ink/60 mb-6 text-center">
        Enviamos um link de acesso para seu e-mail — sem senha para lembrar.
      </p>

      {magicLinkStatus === "sent" ? (
        <p className="text-sm text-library-dark bg-paper border border-rule rounded-card p-4 text-center">
          Link enviado para <strong>{email}</strong>. Verifique sua caixa de entrada.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu.email@exemplo.com"
            className="field-input w-full"
          />
          <button type="submit" disabled={magicLinkStatus === "sending"} className="btn-primary w-full">
            {magicLinkStatus === "sending" ? "Enviando…" : "Enviar link de acesso"}
          </button>
          {magicLinkError && <p className="text-stamp text-sm">{magicLinkError}</p>}
        </form>
      )}
    </div>
  );
}
