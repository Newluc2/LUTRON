import { FormEvent, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { user, loading, login } = useAuth();
  const [email, setEmail] = useState('owner@lutron.local');
  const [password, setPassword] = useState('owner123');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connexion impossible');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-full items-center justify-center bg-lutron-bg p-4">
      <div className="w-full max-w-md rounded-[24px] border border-lutron-border bg-lutron-surface p-8 shadow-2xl shadow-black/40">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-xl font-bold">
            L
          </div>
          <h1 className="text-2xl font-semibold">LUTRON</h1>
          <p className="mt-1 text-sm text-lutron-muted">Plateforme de supervision technique</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm text-zinc-400">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-lutron-border bg-lutron-card px-4 py-2.5 text-sm focus:border-violet-500/50 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-zinc-400">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-lutron-border bg-lutron-card px-4 py-2.5 text-sm focus:border-violet-500/50 focus:outline-none"
              required
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-violet-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
          >
            {submitting ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-zinc-600">
          Démo : owner@lutron.local / owner123
        </p>
      </div>
    </div>
  );
}
