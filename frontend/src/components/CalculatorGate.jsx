import React, { useState } from "react";
import axios from "axios";
import { Lock, ArrowRight } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const STORAGE_KEY = "calc_access_granted";

export default function CalculatorGate({ children }) {
const [authorized, setAuthorized] = useState(() => {
try {
return localStorage.getItem(STORAGE_KEY) === "true";
} catch (e) {
return false;
}
});
const [username, setUsername] = useState("");
const [password, setPassword] = useState("");
const [error, setError] = useState("");
const [loading, setLoading] = useState(false);

const handleSubmit = async (e) => {
e.preventDefault();
setError("");
setLoading(true);
try {
await axios.post(`${API}/auth/login`, { username, password });
try {
localStorage.setItem(STORAGE_KEY, "true");
} catch (e2) {}
setAuthorized(true);
} catch (err) {
setError(err?.response?.data?.detail || "Usuário ou senha inválidos.");
} finally {
setLoading(false);
}
};

if (authorized) return children;

return (
<div className="min-h-screen flex items-center justify-center px-4 py-16 relative">
<div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
<div className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 sm:p-8 relative z-10">
<div className="w-12 h-12 rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center mb-5 mx-auto">
<Lock size={22} weight="duotone" className="text-primary" />
</div>
<h1 className="font-display font-black text-2xl text-center tracking-tight mb-2">Acesso à calculadora</h1>
<p className="text-sm text-muted-foreground text-center mb-6">
Informe seu usuário e senha para continuar o diagnóstico.
</p>
<form onSubmit={handleSubmit} className="space-y-4" data-testid="login-form">
<div>
<Label className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-1.5 block">
Usuário
</Label>
<Input
data-testid="login-username"
value={username}
onChange={(e) => setUsername(e.target.value)}
autoFocus
autoComplete="username"
className="bg-muted border-border h-11"
required
/>
</div>
<div>
<Label className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-1.5 block">
Senha
</Label>
<Input
data-testid="login-password"
type="password"
value={password}
onChange={(e) => setPassword(e.target.value)}
autoComplete="current-password"
className="bg-muted border-border h-11"
required
/>
</div>
{error && <p className="text-xs text-destructive" data-testid="login-error">{error}</p>}
<Button type="submit" disabled={loading} data-testid="login-submit" className="w-full h-12 font-bold">
{loading ? "Entrando..." : "Entrar"}
{!loading && <ArrowRight size={16} weight="bold" className="ml-1" />}
</Button>
</form>
</div>
</div>
);
}
