import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Check,
  Edit2,
  Image,
  KeyRound,
  Layers,
  LayoutTemplate,
  Loader2,
  LogOut,
  Package,
  Palette,
  Percent,
  Plus,
  QrCode,
  Save,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Tag,
  Trash2,
  Upload,
  UserPlus,
  X,
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  builtInImages,
  fallbackProducts,
  formatCOP,
  productImage,
  useCategoriesList,
  saveStoredCategories,
  type CategoryItem,
  type ProductColor,
  type ProductRow,
} from "@/lib/catalog";
import { getSiteConfig, saveSiteConfig, type SiteConfig } from "@/lib/site-config";
import {
  serverGetAdminStatus,
  serverRegisterAdmin,
  serverLoginAdmin,
  serverGenerateTotp,
  serverVerifyAndEnrollTotp,
  serverVerifyTotpLogin,
} from "@/lib/auth.functions";
import { Button } from "@/components/ui/button";

const COLOR_PRESETS = [
  { name: "Negro", hex: "#18181b" },
  { name: "Rojo", hex: "#ef4444" },
  { name: "Azul", hex: "#3b82f6" },
  { name: "Dorado", hex: "#eab308" },
  { name: "Tornasol", hex: "linear-gradient(135deg, #ec4899, #8b5cf6, #06b6d4)" },
  { name: "Titanio", hex: "#71717a" },
  { name: "Verde Flúor", hex: "#84cc16" },
  { name: "Blanco", hex: "#ffffff" },
  { name: "Naranja", hex: "#f97316" },
  { name: "Morado", hex: "#a855f7" },
];

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Administración | Megalujos Cúcuta" },
      { name: "description", content: "Panel de administración del catálogo de Megalujos Cúcuta." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Administración | Megalujos Cúcuta" },
      { property: "og:description", content: "Acceso privado." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

type Stage = "loading" | "login" | "enroll" | "verify" | "denied" | "panel";
type Tab = "products" | "categories" | "design";

function AdminPage() {
  const [stage, setStage] = useState<Stage>("loading");
  const [session, setSession] = useState<Session | null>(null);
  const [currentEmail, setCurrentEmail] = useState<string>("admin@megalujoscucuta.com");
  const [isDemo, setIsDemo] = useState(false);
  const [tab, setTab] = useState<Tab>("products");
  const categoriesList = useCategoriesList();

  const evaluate = useCallback(async () => {
    // 1. Verificación de sesión de administrador autenticado con 2FA
    if (typeof window !== "undefined") {
      const savedToken = localStorage.getItem("megalujos_admin_token");
      const savedEmail = localStorage.getItem("megalujos_admin_email");
      if (savedToken && savedEmail) {
        setIsDemo(false);
        setCurrentEmail(savedEmail);
        setSession({ user: { email: savedEmail } } as unknown as Session);
        setStage("panel");
        return;
      }

      if (localStorage.getItem("moto_admin_demo") === "true") {
        setIsDemo(true);
        setCurrentEmail("admin@motoruta.com");
        setSession({ user: { email: "admin@motoruta.com" } } as unknown as Session);
        setStage("panel");
        return;
      }
    }

    // 2. Verificación de Supabase si está disponible
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { data: s } = await supabase.auth.getSession();
      setSession(s.session);
      if (!userData.user) return setStage("login");

      setCurrentEmail(userData.user.email || "admin@megalujoscucuta.com");

      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal?.currentLevel !== "aal2") {
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const verified = factors?.totp?.length ?? 0;
        return setStage(verified > 0 ? "verify" : "enroll");
      }
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id)
        .eq("role", "admin");
      setStage(roles && roles.length > 0 ? "panel" : "denied");
    } catch {
      setStage("login");
    }
  }, []);

  useEffect(() => {
    evaluate();
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "MFA_CHALLENGE_VERIFIED") {
        setTimeout(evaluate, 0);
      }
    });
    return () => data.subscription.unsubscribe();
  }, [evaluate]);

  const signOut = async () => {
    localStorage.removeItem("moto_admin_demo");
    localStorage.removeItem("megalujos_admin_token");
    localStorage.removeItem("megalujos_admin_email");
    setIsDemo(false);
    try {
      await supabase.auth.signOut();
    } catch {}
    setSession(null);
    setStage("login");
  };

  const handleLoginSuccess = (email: string, needs2FA: boolean, is2FAEnrolled: boolean) => {
    setCurrentEmail(email);
    if (needs2FA) {
      setStage(is2FAEnrolled ? "verify" : "enroll");
    } else {
      localStorage.setItem("megalujos_admin_token", "admin_tok_" + Date.now());
      localStorage.setItem("megalujos_admin_email", email);
      setSession({ user: { email } } as unknown as Session);
      setStage("panel");
    }
  };

  const handleAuthCompleted = (email: string) => {
    localStorage.setItem("megalujos_admin_token", "admin_tok_" + Date.now());
    localStorage.setItem("megalujos_admin_email", email);
    setSession({ user: { email } } as unknown as Session);
    setStage("panel");
  };

  return (
    <div className="min-h-screen bg-secondary">
      <header className="bg-ink text-ink-foreground">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2 font-display text-lg uppercase tracking-wide">
            <ShieldCheck className="h-5 w-5 text-primary" /> Megalujos Cúcuta | Administración
            {isDemo && (
              <span className="ml-2 rounded bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400 font-sans normal-case">
                Modo Prueba Local
              </span>
            )}
            {!isDemo && session?.user?.email && (
              <span className="ml-2 rounded bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400 font-sans normal-case">
                2FA Activo ({session.user.email})
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/" className="hover:text-primary">Ver tienda</Link>
            {session && (
              <button onClick={signOut} className="flex items-center gap-1 hover:text-primary cursor-pointer">
                <LogOut className="h-4 w-4" /> Salir
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {stage === "loading" && <Loader2 className="mx-auto h-8 w-8 animate-spin" />}
        {stage === "login" && (
          <LoginForm
            onDemoLogin={evaluate}
            onLoginSuccess={handleLoginSuccess}
          />
        )}
        {stage === "enroll" && (
          <EnrollTotp
            email={currentEmail}
            onDone={() => handleAuthCompleted(currentEmail)}
          />
        )}
        {stage === "verify" && (
          <VerifyTotp
            email={currentEmail}
            onDone={() => handleAuthCompleted(currentEmail)}
          />
        )}
        {stage === "denied" && (
          <Card title="Sin acceso">
            <p className="text-sm text-muted-foreground">
              Esta cuenta no tiene permisos de administrador.
            </p>
          </Card>
        )}

        {stage === "panel" && (
          <div>
            {/* Navigation Tabs */}
            <div className="mb-8 flex flex-wrap gap-3 border-b border-border pb-4">
              <button
                onClick={() => setTab("products")}
                className={`flex items-center gap-2 border px-5 py-2.5 font-display text-sm uppercase tracking-wide transition-colors ${
                  tab === "products"
                    ? "border-primary bg-primary text-primary-foreground font-semibold"
                    : "border-input bg-background hover:border-primary text-foreground"
                }`}
              >
                <Package className="h-4 w-4" /> Catálogo de Productos
              </button>
              <button
                onClick={() => setTab("categories")}
                className={`flex items-center gap-2 border px-5 py-2.5 font-display text-sm uppercase tracking-wide transition-colors ${
                  tab === "categories"
                    ? "border-primary bg-primary text-primary-foreground font-semibold"
                    : "border-input bg-background hover:border-primary text-foreground"
                }`}
              >
                <Tag className="h-4 w-4" /> Categorías ({categoriesList.length})
              </button>
              <button
                onClick={() => setTab("design")}
                className={`flex items-center gap-2 border px-5 py-2.5 font-display text-sm uppercase tracking-wide transition-colors ${
                  tab === "design"
                    ? "border-primary bg-primary text-primary-foreground font-semibold"
                    : "border-input bg-background hover:border-primary text-foreground"
                }`}
              >
                <Palette className="h-4 w-4" /> Banners, Portada y Descuentos
              </button>
            </div>

            {tab === "products" && (
              <ProductsPanel isDemo={isDemo} categoriesList={categoriesList} />
            )}
            {tab === "categories" && (
              <CategoriesPanel isDemo={isDemo} categoriesList={categoriesList} />
            )}
            {tab === "design" && <DesignPanel />}
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md border bg-background p-8 shadow-card">
      <h1 className="mb-6 text-3xl font-bold">{title}</h1>
      {children}
    </div>
  );
}

const inputCls = "h-11 w-full border border-input bg-background px-3 outline-none focus:border-primary text-sm";

function LoginForm({
  onDemoLogin,
  onLoginSuccess,
}: {
  onDemoLogin: () => void;
  onLoginSuccess: (email: string, needs2FA: boolean, is2FAEnrolled: boolean) => void;
}) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("admin@megalujoscucuta.com");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [msgType, setMsgType] = useState<"error" | "success">("error");
  const [busy, setBusy] = useState(false);

  const handleDemo = () => {
    localStorage.setItem("moto_admin_demo", "true");
    onDemoLogin();
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);

    const cleanEmail = email.trim().toLowerCase();

    // Acceso de prueba rápida si coincide
    if (cleanEmail === "admin@motoruta.com" && password === "admin1234") {
      handleDemo();
      setBusy(false);
      return;
    }

    if (mode === "signin") {
      try {
        const res = await serverLoginAdmin({ data: { email: cleanEmail, password } });
        if (res.success) {
          if (res.isDemo) {
            handleDemo();
          } else {
            onLoginSuccess(cleanEmail, Boolean(res.needs2FA), Boolean(res.is2FAEnrolled));
          }
          setBusy(false);
          return;
        }

        // Si falla la verificación interna, intentar con Supabase
        const { data: suData, error: suError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (!suError && suData.user) {
          onLoginSuccess(cleanEmail, true, true);
          setBusy(false);
          return;
        }

        setMsg(res.error || suError?.message || "Correo o contraseña incorrectos.");
        setMsgType("error");
      } catch {
        setMsg("Error al iniciar sesión. Verifica tus datos o usa la cuenta de prueba.");
        setMsgType("error");
      }
    } else {
      // Registro de cuenta de administrador
      try {
        const res = await serverRegisterAdmin({ data: { email: cleanEmail, password } });
        if (!res.success) {
          setMsg(res.error || "No se pudo registrar.");
          setMsgType("error");
          setBusy(false);
          return;
        }

        // Intentar registrar en Supabase en paralelo
        try {
          await supabase.auth.signUp({
            email: cleanEmail,
            password,
            options: { emailRedirectTo: `${window.location.origin}/admin` },
          });
        } catch {}

        setMsg("¡Cuenta creada! Redirigiendo a configurar el doble paso...");
        setMsgType("success");
        setTimeout(() => {
          onLoginSuccess(cleanEmail, true, false);
        }, 800);
      } catch {
        setMsg("Error de conexión al registrar administrador.");
        setMsgType("error");
      }
    }
    setBusy(false);
  };

  return (
    <Card title="Panel Administrativo">
      {/* Selector de modo: Iniciar Sesión / Crear Administrador */}
      <div className="mb-6 grid grid-cols-2 gap-1 rounded bg-secondary p-1 border">
        <button
          type="button"
          onClick={() => {
            setMode("signin");
            setMsg(null);
          }}
          className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
            mode === "signin"
              ? "bg-primary text-primary-foreground shadow"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <KeyRound className="h-3.5 w-3.5" /> Iniciar Sesión
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("signup");
            setMsg(null);
          }}
          className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
            mode === "signup"
              ? "bg-primary text-primary-foreground shadow"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <UserPlus className="h-3.5 w-3.5" /> Crear Administrador
        </button>
      </div>

      {/* Demo Credentials Alert */}
      <div className="mb-5 rounded-md border border-primary/30 bg-primary/5 p-3.5 text-xs">
        <div className="flex items-center justify-between font-semibold text-primary">
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> Cuenta de prueba rápida:
          </span>
          <button
            type="button"
            onClick={handleDemo}
            className="rounded bg-primary px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-primary-foreground hover:opacity-90"
          >
            Entrar directo
          </button>
        </div>
        <div className="mt-1.5 text-muted-foreground">
          <code>admin@motoruta.com</code> / <code>admin1234</code>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="text-xs font-medium block mb-1">Correo electrónico</label>
          <input
            className={inputCls}
            type="email"
            required
            placeholder="ej. contacto@megalujoscucuta.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        <div>
          <label className="text-xs font-medium block mb-1">Contraseña</label>
          <input
            className={inputCls}
            type="password"
            required
            minLength={8}
            placeholder="Mínimo 8 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
          />
        </div>

        {msg && (
          <p
            className={`text-xs p-2 rounded ${
              msgType === "success" ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"
            }`}
          >
            {msg}
          </p>
        )}

        <Button type="submit" disabled={busy} className="w-full font-display uppercase tracking-wide gap-2">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === "signin" ? "Ingresar al Panel" : "Registrar Administrador"}
        </Button>
      </form>
    </Card>
  );
}

function EnrollTotp({ email, onDone }: { email: string; onDone: () => void }) {
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // 1. Intentar con servidor interno (genera QR estándar para Google Authenticator)
        const res = await serverGenerateTotp({ data: { email } });
        if (res && res.qrCodeUrl && res.secret) {
          setQr(res.qrCodeUrl);
          setSecret(res.secret);
          return;
        }

        // 2. Fallback a Supabase MFA si está disponible
        const { data: factors } = await supabase.auth.mfa.listFactors();
        for (const f of factors?.all ?? []) {
          if (f.status === "unverified") await supabase.auth.mfa.unenroll({ factorId: f.id });
        }
        const { data, error } = await supabase.auth.mfa.enroll({
          factorType: "totp",
          friendlyName: `Megalujos Admin ${Date.now()}`,
        });
        if (error) return setMsg(error.message);
        setQr(data.totp.qr_code);
        setSecret(data.totp.secret);
      } catch (e: any) {
        setMsg(e.message || "Error al generar código 2FA.");
      }
    })();
  }, [email]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!secret) return;
    setBusy(true);
    setMsg(null);

    try {
      // 1. Verificación en el backend interno
      const res = await serverVerifyAndEnrollTotp({ data: { email, secret, code: code.trim() } });
      if (res.success) {
        setBusy(false);
        onDone();
        return;
      }

      // 2. Fallback a Supabase MFA
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const factor = factors?.totp?.[0];
      if (factor) {
        const { error } = await supabase.auth.mfa.challengeAndVerify({
          factorId: factor.id,
          code: code.trim(),
        });
        if (!error) {
          setBusy(false);
          onDone();
          return;
        }
      }

      setMsg(res.error || "Código incorrecto. Revisa los 6 dígitos en tu app.");
    } catch {
      setMsg("Error al validar el código 2FA.");
    }
    setBusy(false);
  };

  const copySecret = () => {
    if (!secret) return;
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card title="Activa la Verificación de 2 Pasos (2FA)">
      <div className="mb-4 space-y-2 text-xs text-muted-foreground border-b pb-3">
        <p className="flex items-start gap-2">
          <span className="font-bold text-primary">1.</span>
          Instala <strong>Google Authenticator</strong> o <strong>Microsoft Authenticator</strong> en tu celular.
        </p>
        <p className="flex items-start gap-2">
          <span className="font-bold text-primary">2.</span>
          Escanea este código QR con la cámara de la aplicación:
        </p>
      </div>

      <div className="my-4 flex flex-col items-center justify-center p-3 bg-white rounded border">
        {qr ? (
          <img
            src={qr}
            alt="Código QR para Google Authenticator"
            className="h-48 w-48 object-contain"
          />
        ) : (
          <div className="flex h-48 w-48 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {secret && (
        <div className="mb-4 rounded bg-secondary p-2.5 text-center text-xs">
          <span className="text-muted-foreground block mb-1">Clave de configuración manual:</span>
          <div className="flex items-center justify-center gap-2">
            <code className="font-mono font-bold tracking-widest text-foreground">{secret}</code>
            <button
              type="button"
              onClick={copySecret}
              className="text-[11px] text-primary hover:underline font-semibold"
            >
              {copied ? "¡Copiada!" : "Copiar"}
            </button>
          </div>
        </div>
      )}

      <form onSubmit={submit} className="space-y-3">
        <label className="text-xs font-medium block">
          3. Escribe los 6 dígitos que muestra tu celular:
        </label>
        <input
          autoFocus
          className={inputCls + " text-center text-lg tracking-[0.4em] font-mono"}
          inputMode="numeric"
          maxLength={6}
          required
          placeholder="000000"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        {msg && <p className="text-xs text-destructive text-center">{msg}</p>}
        <Button type="submit" disabled={busy || code.length < 6} className="w-full font-display uppercase tracking-wide gap-2">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Confirmar y Activar 2FA
        </Button>
      </form>
    </Card>
  );
}

function VerifyTotp({ email, onDone }: { email: string; onDone: () => void }) {
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);

    try {
      // 1. Verificación interna con algoritmo RFC 6238 TOTP
      const res = await serverVerifyTotpLogin({ data: { email, code: code.trim() } });
      if (res.success) {
        setBusy(false);
        onDone();
        return;
      }

      // 2. Fallback a Supabase MFA
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const factor = factors?.totp?.[0];
      if (factor) {
        const { error } = await supabase.auth.mfa.challengeAndVerify({
          factorId: factor.id,
          code: code.trim(),
        });
        if (!error) {
          setBusy(false);
          onDone();
          return;
        }
      }

      setMsg(res.error || "Código incorrecto. Revisa el código actual en tu aplicación.");
    } catch {
      setMsg("Error al verificar el código.");
    }
    setBusy(false);
  };

  return (
    <Card title="Segundo Paso: Código 2FA">
      <div className="mb-4 text-xs text-muted-foreground">
        Ingresa el código de 6 dígitos generado en tu aplicación de autenticación (Google Authenticator) para <strong>{email}</strong>.
      </div>
      <form onSubmit={submit} className="space-y-3">
        <input
          autoFocus
          className={inputCls + " text-center text-lg tracking-[0.4em] font-mono"}
          inputMode="numeric"
          maxLength={6}
          required
          placeholder="000000"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        {msg && <p className="text-xs text-destructive text-center">{msg}</p>}
        <Button type="submit" disabled={busy || code.length < 6} className="w-full font-display uppercase tracking-wide gap-2">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Verificar y Entrar
        </Button>
      </form>
    </Card>
  );
}

function ProductsPanel({ isDemo, categoriesList }: { isDemo: boolean; categoriesList: CategoryItem[] }) {
  const [rows, setRows] = useState<ProductRow[] | null>(null);
  const [q, setQ] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("todos");
  const queryClient = useQueryClient();

  const load = useCallback(async () => {
    if (isDemo || localStorage.getItem("moto_admin_demo") === "true") {
      const stored = localStorage.getItem("moto_demo_products_v3");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setRows(parsed);
          queryClient.setQueryData(["products"], parsed);
          return;
        } catch {}
      }
      setRows(fallbackProducts);
      localStorage.setItem("moto_demo_products_v3", JSON.stringify(fallbackProducts));
      queryClient.setQueryData(["products"], fallbackProducts);
      return;
    }

    try {
      const { data, error } = await supabase.from("products").select("*").order("sort_order");
      if (error || !data) {
        setRows(fallbackProducts);
      } else {
        setRows(data as ProductRow[]);
      }
    } catch {
      setRows(fallbackProducts);
    }
  }, [isDemo, queryClient]);

  useEffect(() => {
    load();
  }, [load]);

  const refreshStore = () => queryClient.invalidateQueries({ queryKey: ["products"] });

  const addProduct = async () => {
    const maxOrder = Math.max(0, ...(rows ?? []).map((r) => r.sort_order));
    const firstCategory = categoriesList[0]?.id || "cascos";
    const newProd: ProductRow = {
      id: "prod-" + Date.now(),
      ref: "REF-" + Math.floor(1000 + Math.random() * 9000),
      name: "Nuevo producto",
      price: 180000,
      old_price: null,
      category: firstCategory,
      image_key: "tienda",
      image_url: null,
      sort_order: maxOrder + 1,
      colors: [],
    };

    if (isDemo || localStorage.getItem("moto_admin_demo") === "true") {
      const updated = [newProd, ...(rows ?? [])];
      setRows(updated);
      localStorage.setItem("moto_demo_products_v3", JSON.stringify(updated));
      queryClient.setQueryData(["products"], updated);
      refreshStore();
      return;
    }

    const { error } = await supabase.from("products").insert({
      name: newProd.name,
      ref: newProd.ref,
      price: newProd.price,
      category: newProd.category,
      image_key: newProd.image_key,
      sort_order: newProd.sort_order,
    });
    if (error) return alert("No se pudo crear: " + error.message);
    await load();
    refreshStore();
  };

  if (!rows) return <Loader2 className="mx-auto h-8 w-8 animate-spin" />;

  const list = rows.filter((r) => {
    const matchesQ = (r.name + r.ref).toLowerCase().includes(q.toLowerCase());
    const matchesCat = categoryFilter === "todos" || r.category === categoryFilter;
    return matchesQ && matchesCat;
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">Catálogo de Productos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isDemo
              ? "Modo demo: los cambios que hagas se guardan localmente y se reflejan al instante en la tienda."
              : "Cambia nombre, precio, categoría o foto y presiona Guardar. Los cambios se ven en la tienda al instante."}
          </p>
        </div>
        <Button onClick={addProduct} className="font-display uppercase tracking-wide gap-2">
          <Plus className="h-4 w-4" /> Nuevo producto
        </Button>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <input
          className={inputCls + " flex-1"}
          placeholder="Buscar por nombre o referencia..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className={inputCls + " sm:w-60"}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="todos">Todas las categorías ({rows.length})</option>
          {categoriesList.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({rows.filter((p) => p.category === c.id).length})
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        {list.length === 0 ? (
          <div className="border bg-background p-8 text-center text-sm text-muted-foreground">
            No se encontraron productos con los filtros seleccionados.
          </div>
        ) : (
          list.map((r) => (
            <ProductEditor
              key={r.id}
              row={r}
              isDemo={isDemo}
              categoriesList={categoriesList}
              onSaved={() => {
                load();
                refreshStore();
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ProductEditor({
  row,
  isDemo,
  categoriesList,
  onSaved,
}: {
  row: ProductRow;
  isDemo: boolean;
  categoriesList: CategoryItem[];
  onSaved: () => void;
}) {
  const [name, setName] = useState(row.name);
  const [ref, setRef] = useState(row.ref);
  const [price, setPrice] = useState(String(row.price));
  const [oldPrice, setOldPrice] = useState(row.old_price ? String(row.old_price) : "");
  const [category, setCategory] = useState(row.category);
  const [colors, setColors] = useState<ProductColor[]>(row.colors || []);
  const [customName, setCustomName] = useState("");
  const [customHex, setCustomHex] = useState("#ef4444");
  const [customImage, setCustomImage] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  // Quick inline category creator
  const [showNewCatInput, setShowNewCatInput] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  useEffect(() => {
    setColors(row.colors || []);
  }, [row.colors]);

  const dirty =
    name !== row.name ||
    ref !== row.ref ||
    price !== String(row.price) ||
    oldPrice !== (row.old_price ? String(row.old_price) : "") ||
    category !== row.category ||
    JSON.stringify(colors) !== JSON.stringify(row.colors || []);

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const slug = newCatName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const exists = categoriesList.some((c) => c.id === slug);
    if (!exists) {
      const updated = [...categoriesList, { id: slug, name: newCatName.trim() }];
      saveStoredCategories(updated);
    }
    setCategory(slug);
    setNewCatName("");
    setShowNewCatInput(false);
  };

  const addPreset = (p: { name: string; hex: string }) => {
    if (colors.some((c) => c.name.toLowerCase() === p.name.toLowerCase())) return;
    setColors([...colors, { name: p.name, hex: p.hex }]);
  };

  const addCustomColor = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customName.trim()) return;
    if (colors.some((c) => c.name.toLowerCase() === customName.trim().toLowerCase())) return;
    setColors([
      ...colors,
      {
        name: customName.trim(),
        hex: customHex,
        ...(customImage.trim() ? { image: customImage.trim() } : {}),
      },
    ]);
    setCustomName("");
    setCustomImage("");
  };

  const removeColor = (index: number) => {
    setColors(colors.filter((_, i) => i !== index));
  };

  const save = async () => {
    const p = Number(price.replace(/\D/g, ""));
    const op = oldPrice ? Number(oldPrice.replace(/\D/g, "")) : null;
    if (!name.trim()) return setStatus("El nombre no puede estar vacío.");
    setBusy(true);

    if (isDemo || localStorage.getItem("moto_admin_demo") === "true") {
      const stored = localStorage.getItem("moto_demo_products_v3");
      let list: ProductRow[] = stored ? JSON.parse(stored) : fallbackProducts;
      list = list.map((item) =>
        item.id === row.id
          ? {
              ...item,
              name: name.trim(),
              ref: ref.trim(),
              price: p,
              old_price: op,
              category,
              colors,
            }
          : item
      );
      localStorage.setItem("moto_demo_products_v3", JSON.stringify(list));
      setBusy(false);
      setStatus("Guardado ✓");
      onSaved();
      return;
    }

    const { error } = await supabase
      .from("products")
      .update({ name: name.trim(), ref: ref.trim(), price: p, old_price: op, category })
      .eq("id", row.id);
    setBusy(false);
    if (error) return setStatus("Error: " + error.message);
    setStatus("Guardado ✓");
    onSaved();
  };

  const upload = async (file: File) => {
    setBusy(true);
    setStatus("Subiendo foto...");

    if (isDemo || localStorage.getItem("moto_admin_demo") === "true") {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const stored = localStorage.getItem("moto_demo_products_v3");
        let list: ProductRow[] = stored ? JSON.parse(stored) : fallbackProducts;
        list = list.map((item) =>
          item.id === row.id ? { ...item, image_url: dataUrl, image_key: null } : item
        );
        localStorage.setItem("moto_demo_products_v3", JSON.stringify(list));
        setBusy(false);
        setStatus("Foto actualizada ✓");
        onSaved();
      };
      reader.readAsDataURL(file);
      return;
    }

    const ext = file.name.split(".").pop() || "jpg";
    const path = `${row.id}/${Date.now()}.${ext}`;
    const up = await supabase.storage.from("product-images").upload(path, file, { upsert: true, contentType: file.type });
    if (up.error) {
      setBusy(false);
      return setStatus("Error al subir: " + up.error.message);
    }
    const signed = await supabase.storage.from("product-images").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
    if (signed.error) {
      setBusy(false);
      return setStatus("Error: " + signed.error.message);
    }
    const { error } = await supabase.from("products").update({ image_url: signed.data.signedUrl }).eq("id", row.id);
    setBusy(false);
    if (error) return setStatus("Error: " + error.message);
    setStatus("Foto actualizada ✓");
    onSaved();
  };

  const useBuiltIn = async (key: string) => {
    if (isDemo || localStorage.getItem("moto_admin_demo") === "true") {
      const stored = localStorage.getItem("moto_demo_products_v3");
      let list: ProductRow[] = stored ? JSON.parse(stored) : fallbackProducts;
      list = list.map((item) =>
        item.id === row.id ? { ...item, image_key: key, image_url: null } : item
      );
      localStorage.setItem("moto_demo_products_v3", JSON.stringify(list));
      onSaved();
      return;
    }

    const { error } = await supabase.from("products").update({ image_key: key, image_url: null }).eq("id", row.id);
    if (error) return setStatus("Error: " + error.message);
    onSaved();
  };

  const remove = async () => {
    if (!confirm(`¿Eliminar "${row.name}"?`)) return;

    if (isDemo || localStorage.getItem("moto_admin_demo") === "true") {
      const stored = localStorage.getItem("moto_demo_products_v3");
      let list: ProductRow[] = stored ? JSON.parse(stored) : fallbackProducts;
      list = list.filter((item) => item.id !== row.id);
      localStorage.setItem("moto_demo_products_v3", JSON.stringify(list));
      onSaved();
      return;
    }

    const { error } = await supabase.from("products").delete().eq("id", row.id);
    if (error) return setStatus("Error: " + error.message);
    onSaved();
  };

  return (
    <div className="grid gap-4 border bg-background p-4 md:grid-cols-[130px_1fr_auto]">
      <div className="flex flex-col gap-2">
        <img src={productImage(row)} alt={row.name} className="aspect-square w-full border object-contain p-1" />
        <label className="flex cursor-pointer items-center justify-center gap-1 border py-1 text-xs hover:bg-ink hover:text-ink-foreground">
          <Upload className="h-3 w-3" /> Cambiar foto
          <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        </label>
        <select className="border py-1 text-xs" value="" onChange={(e) => e.target.value && useBuiltIn(e.target.value)}>
          <option value="">Usar foto del sitio…</option>
          {Object.keys(builtInImages).map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-medium sm:col-span-2">
          Nombre del producto
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
        </label>

        <label className="text-xs font-medium">
          Referencia
          <input className={inputCls} value={ref} onChange={(e) => setRef(e.target.value)} />
        </label>

        <div className="text-xs font-medium">
          <div className="flex items-center justify-between pb-1">
            <span>Categoría</span>
            <button
              type="button"
              onClick={() => setShowNewCatInput(!showNewCatInput)}
              className="text-xs text-primary hover:underline font-normal flex items-center gap-1"
            >
              {showNewCatInput ? "Cerrar" : "+ Nueva categoría"}
            </button>
          </div>

          {showNewCatInput ? (
            <div className="flex gap-2">
              <input
                className={inputCls}
                placeholder="Nombre de la nueva categoría"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                autoFocus
              />
              <button
                type="button"
                onClick={handleCreateCategory}
                className="bg-primary text-primary-foreground px-3 text-xs font-semibold uppercase tracking-wider rounded"
              >
                Crear
              </button>
            </div>
          ) : (
            <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
              {categoriesList.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
              {!categoriesList.some((c) => c.id === category) && (
                <option value={category}>{category}</option>
              )}
            </select>
          )}
        </div>

        <label className="text-xs font-medium">
          Precio (COP)
          <input className={inputCls} inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} />
          <span className="text-muted-foreground">{formatCOP(Number(price.replace(/\D/g, "")) || 0)}</span>
        </label>

        <label className="text-xs font-medium">
          Precio antes (opcional, para Outlet)
          <input className={inputCls} inputMode="numeric" value={oldPrice} onChange={(e) => setOldPrice(e.target.value)} />
        </label>

        {/* Color Variants Section */}
        <div className="sm:col-span-2 border-t border-border pt-3">
          <div className="mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Variantes de Color ({colors.length})
            </span>
            <p className="text-[11px] text-muted-foreground">
              Permite al cliente escoger el color (el casco o accesorio cambia de color y se envía en el pedido de WhatsApp).
            </p>
          </div>

          {/* Current colors list */}
          <div className="flex flex-wrap gap-2 mb-3">
            {colors.length === 0 ? (
              <span className="text-xs italic text-muted-foreground">
                Sin colores definidos (se muestra como producto único).
              </span>
            ) : (
              colors.map((c, idx) => (
                <div
                  key={c.name + idx}
                  className="flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs"
                >
                  <span
                    className="h-3.5 w-3.5 rounded-full border border-black/20 shrink-0"
                    style={{
                      background: c.hex?.includes("gradient") ? c.hex : c.hex || "#71717a",
                    }}
                  />
                  <span className="font-medium text-foreground">{c.name}</span>
                  {c.image && (
                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.2 rounded font-semibold">
                      con foto
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeColor(idx)}
                    className="ml-1 text-muted-foreground hover:text-destructive hover:scale-110 transition-transform"
                    title={`Eliminar ${c.name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Quick presets buttons */}
          <div className="mb-2.5">
            <span className="text-[11px] font-medium text-muted-foreground block mb-1">
              + Agregar rápido por color típico:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {COLOR_PRESETS.map((p) => {
                const already = colors.some((c) => c.name.toLowerCase() === p.name.toLowerCase());
                return (
                  <button
                    key={p.name}
                    type="button"
                    disabled={already}
                    onClick={() => addPreset(p)}
                    className={`flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] transition-colors ${
                      already
                        ? "opacity-40 cursor-not-allowed border-border"
                        : "hover:border-primary border-input bg-background cursor-pointer"
                    }`}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ background: p.hex }}
                    />
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom color input */}
          <div className="flex flex-wrap items-center gap-2 rounded border border-border/80 bg-muted/20 p-2">
            <input
              className="h-8 border border-input bg-background px-2 text-xs flex-1 min-w-[130px]"
              placeholder="Color personalizado (ej. Azul Mate)"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
            />
            <div className="flex items-center gap-1 text-xs">
              <span className="text-[11px] text-muted-foreground">Tono:</span>
              <input
                type="color"
                className="h-8 w-8 cursor-pointer rounded border border-input p-0.5"
                value={customHex.startsWith("#") ? customHex : "#ef4444"}
                onChange={(e) => setCustomHex(e.target.value)}
                title="Elegir tono"
              />
            </div>
            <select
              className="h-8 border border-input bg-background px-2 text-xs max-w-[180px]"
              value={customImage}
              onChange={(e) => setCustomImage(e.target.value)}
            >
              <option value="">(Opcional) Foto de la variante…</option>
              {Object.keys(builtInImages).map((k) => (
                <option key={k} value={builtInImages[k]}>
                  Foto: {k}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addCustomColor}
              className="h-8 text-xs font-semibold uppercase tracking-wider"
            >
              + Agregar color
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-row items-start gap-2 md:flex-col justify-between">
        <div className="flex flex-row md:flex-col gap-2 w-full">
          <Button onClick={save} disabled={busy || !dirty} className="font-display uppercase tracking-wide w-full">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Guardar
          </Button>
          <Button variant="outline" onClick={remove} disabled={busy} aria-label="Eliminar producto" className="w-full">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        {status && <p className="text-xs text-muted-foreground text-center w-full">{status}</p>}
      </div>
    </div>
  );
}

function CategoriesPanel({ isDemo, categoriesList }: { isDemo: boolean; categoriesList: CategoryItem[] }) {
  const [newCatName, setNewCatName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const queryClient = useQueryClient();

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const slug = newCatName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    if (categoriesList.some((c) => c.id === slug)) {
      alert("Ya existe una categoría con este nombre o identificador.");
      return;
    }

    const updated = [...categoriesList, { id: slug, name: newCatName.trim() }];
    saveStoredCategories(updated);
    setNewCatName("");
    queryClient.invalidateQueries({ queryKey: ["products"] });
  };

  const startEdit = (cat: CategoryItem) => {
    setEditingId(cat.id);
    setEditingName(cat.name);
  };

  const handleSaveEdit = (id: string) => {
    if (!editingName.trim()) return;
    const updated = categoriesList.map((c) => (c.id === id ? { ...c, name: editingName.trim() } : c));
    saveStoredCategories(updated);
    setEditingId(null);
    queryClient.invalidateQueries({ queryKey: ["products"] });
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`¿Estás seguro de eliminar la categoría "${name}"?`)) {
      const updated = categoriesList.filter((c) => c.id !== id);
      saveStoredCategories(updated);
      queryClient.invalidateQueries({ queryKey: ["products"] });
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">Gestión de Categorías</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Crea o edita las categorías del catálogo. Las categorías aparecerán de inmediato en los filtros de la tienda y en la página principal.
          </p>
        </div>
      </div>

      {/* Formulario para agregar nueva categoría */}
      <div className="mb-8 border bg-background p-6 shadow-sm">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary" /> Agregar nueva categoría
        </h2>
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
          <input
            className={inputCls + " flex-1"}
            placeholder="Ejemplo: Impermeables, Botas, Iluminación LED..."
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
          />
          <Button type="submit" className="font-display uppercase tracking-wide gap-2 shrink-0">
            <Plus className="h-4 w-4" /> Agregar categoría
          </Button>
        </form>
      </div>

      {/* Listado de categorías */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categoriesList.map((cat) => {
          const isEditing = editingId === cat.id;

          return (
            <div key={cat.id} className="border bg-background p-4 flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-primary" />
                    <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      slug: {cat.id}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {!isEditing && (
                      <button
                        type="button"
                        onClick={() => startEdit(cat)}
                        className="p-1 text-muted-foreground hover:text-primary transition-colors"
                        title="Editar nombre"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(cat.id, cat.name)}
                      className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                      title="Eliminar categoría"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input
                        className={inputCls}
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(cat.id)}
                        className="p-2 bg-primary text-primary-foreground rounded hover:opacity-90"
                        title="Guardar"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="p-2 border rounded hover:bg-muted"
                        title="Cancelar"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <h3 className="text-lg font-bold">{cat.name}</h3>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DesignPanel() {
  const [config, setConfig] = useState<SiteConfig>(() => getSiteConfig());
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    saveSiteConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const uploadHeroImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setConfig((prev) => ({
        ...prev,
        hero: { ...prev.hero, image: reader.result as string },
      }));
    };
    reader.readAsDataURL(file);
  };

  const uploadPromoImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setConfig((prev) => ({
        ...prev,
        promoBanner: { ...prev.promoBanner, image: reader.result as string },
      }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-4xl font-bold font-display uppercase tracking-wide">
            Banners, Portada y Descuentos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Personaliza la imagen principal donde está la moto, los textos de la tienda, el banner de promociones y la sección de descuentos.
          </p>
        </div>
        <Button onClick={handleSave} className="font-display uppercase tracking-wide gap-2">
          {saved ? <Check className="h-4 w-4 text-green-300" /> : <Save className="h-4 w-4" />}
          {saved ? "¡Cambios Guardados! ✓" : "Guardar Cambios"}
        </Button>
      </div>

      {/* SECCIÓN 1: HERO / PORTADA PRINCIPAL (DONDE ESTÁ LA MOTO) */}
      <div className="border bg-background p-6 shadow-sm space-y-6">
        <div className="border-b pb-3">
          <h2 className="text-xl font-bold font-display uppercase tracking-wide flex items-center gap-2">
            <Image className="h-5 w-5 text-primary" /> 1. Portada Principal (Fondo de Pantalla &amp; Moto)
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Es la primera sección de impacto que ven tus clientes al entrar a la página.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-[280px_1fr]">
          <div className="space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
              Imagen de fondo actual
            </span>
            <div className="relative aspect-video w-full overflow-hidden border bg-ink rounded">
              <img
                src={config.hero.image}
                alt="Vista previa fondo hero"
                className="h-full w-full object-cover"
              />
            </div>
            <label className="flex cursor-pointer items-center justify-center gap-2 border py-2 text-xs font-medium hover:bg-ink hover:text-ink-foreground transition-colors">
              <Upload className="h-3.5 w-3.5" /> Subir nueva foto de fondo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && uploadHeroImage(e.target.files[0])}
              />
            </label>
            <p className="text-[11px] text-muted-foreground text-center">
              Recomendado: imagen horizontal de alta resolución
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-medium">
              Etiqueta superior pequeña
              <input
                className={inputCls}
                value={config.hero.badge}
                onChange={(e) =>
                  setConfig({ ...config, hero: { ...config.hero, badge: e.target.value } })
                }
              />
            </label>

            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs font-medium">
                Título blanco
                <input
                  className={inputCls}
                  value={config.hero.title}
                  onChange={(e) =>
                    setConfig({ ...config, hero: { ...config.hero, title: e.target.value } })
                  }
                />
              </label>
              <label className="text-xs font-medium">
                Palabra roja destacada
                <input
                  className={inputCls}
                  value={config.hero.highlight}
                  onChange={(e) =>
                    setConfig({ ...config, hero: { ...config.hero, highlight: e.target.value } })
                  }
                />
              </label>
            </div>

            <label className="text-xs font-medium sm:col-span-2">
              Descripción o frase llamativa
              <textarea
                rows={3}
                className="w-full border border-input bg-background p-3 outline-none focus:border-primary text-sm"
                value={config.hero.description}
                onChange={(e) =>
                  setConfig({ ...config, hero: { ...config.hero, description: e.target.value } })
                }
              />
            </label>

            <label className="text-xs font-medium">
              Texto Botón 1 (Tienda)
              <input
                className={inputCls}
                value={config.hero.btn1Text}
                onChange={(e) =>
                  setConfig({ ...config, hero: { ...config.hero, btn1Text: e.target.value } })
                }
              />
            </label>

            <label className="text-xs font-medium">
              Texto Botón 2 (WhatsApp)
              <input
                className={inputCls}
                value={config.hero.btn2Text}
                onChange={(e) =>
                  setConfig({ ...config, hero: { ...config.hero, btn2Text: e.target.value } })
                }
              />
            </label>
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: BANNER INTERMEDIO (LIMPIA, LUBRICA Y PROTEGE) */}
      <div className="border bg-background p-6 shadow-sm space-y-6">
        <div className="border-b pb-3">
          <h2 className="text-xl font-bold font-display uppercase tracking-wide flex items-center gap-2">
            <LayoutTemplate className="h-5 w-5 text-primary" /> 2. Banner Intermedio Promocional («Limpia, lubrica y protege»)
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Banner grande ubicado en la parte media de la página principal.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-[280px_1fr]">
          <div className="space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
              Imagen del banner
            </span>
            <div className="relative aspect-video w-full overflow-hidden border bg-ink rounded">
              <img
                src={config.promoBanner.image}
                alt="Vista previa banner intermedio"
                className="h-full w-full object-cover"
              />
            </div>
            <label className="flex cursor-pointer items-center justify-center gap-2 border py-2 text-xs font-medium hover:bg-ink hover:text-ink-foreground transition-colors">
              <Upload className="h-3.5 w-3.5" /> Subir nueva foto para este banner
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && uploadPromoImage(e.target.files[0])}
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="text-xs font-medium">
              Línea 1 del título
              <input
                className={inputCls}
                value={config.promoBanner.line1}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    promoBanner: { ...config.promoBanner, line1: e.target.value },
                  })
                }
              />
            </label>

            <label className="text-xs font-medium">
              Línea 2 del título
              <input
                className={inputCls}
                value={config.promoBanner.line2}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    promoBanner: { ...config.promoBanner, line2: e.target.value },
                  })
                }
              />
            </label>

            <label className="text-xs font-medium">
              Palabra roja destacada
              <input
                className={inputCls}
                value={config.promoBanner.highlight}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    promoBanner: { ...config.promoBanner, highlight: e.target.value },
                  })
                }
              />
            </label>

            <label className="text-xs font-medium sm:col-span-2">
              Descripción del banner
              <textarea
                rows={2}
                className="w-full border border-input bg-background p-3 outline-none focus:border-primary text-sm"
                value={config.promoBanner.description}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    promoBanner: { ...config.promoBanner, description: e.target.value },
                  })
                }
              />
            </label>

            <label className="text-xs font-medium">
              Texto del Botón
              <input
                className={inputCls}
                value={config.promoBanner.btnText}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    promoBanner: { ...config.promoBanner, btnText: e.target.value },
                  })
                }
              />
            </label>
          </div>
        </div>
      </div>

      {/* SECCIÓN 3: SECCIÓN DE DESCUENTOS / OUTLET */}
      <div className="border bg-background p-6 shadow-sm space-y-6">
        <div className="border-b pb-3">
          <h2 className="text-xl font-bold font-display uppercase tracking-wide flex items-center gap-2">
            <Percent className="h-5 w-5 text-primary" /> 3. Sección de Descuentos &amp; Outlet
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configura el texto del cartel de descuentos y ofertas de la tienda.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-medium">
            Título principal (ej: Outlet, Rebajas, Ofertas de la Semana)
            <input
              className={inputCls}
              value={config.outlet.title}
              onChange={(e) =>
                setConfig({ ...config, outlet: { ...config.outlet, title: e.target.value } })
              }
            />
          </label>

          <label className="text-xs font-medium">
            Porcentaje o texto destacado (ej: Hasta 60%, 20% OFF, Precios Especiales)
            <input
              className={inputCls}
              value={config.outlet.badge}
              onChange={(e) =>
                setConfig({ ...config, outlet: { ...config.outlet, badge: e.target.value } })
              }
            />
          </label>

          <label className="text-xs font-medium">
            Descripción corta de las ofertas
            <input
              className={inputCls}
              value={config.outlet.description}
              onChange={(e) =>
                setConfig({ ...config, outlet: { ...config.outlet, description: e.target.value } })
              }
            />
          </label>

          <label className="text-xs font-medium">
            Texto del botón de ofertas
            <input
              className={inputCls}
              value={config.outlet.btnText}
              onChange={(e) =>
                setConfig({ ...config, outlet: { ...config.outlet, btnText: e.target.value } })
              }
            />
          </label>
        </div>
      </div>

      {/* Floating Save Button */}
      <div className="sticky bottom-6 flex justify-end">
        <Button onClick={handleSave} size="lg" className="font-display uppercase tracking-wider text-base gap-2 shadow-2xl">
          {saved ? <Check className="h-5 w-5 text-green-300" /> : <Save className="h-5 w-5" />}
          {saved ? "¡Cambios guardados con éxito! ✓" : "Guardar Todos los Cambios"}
        </Button>
      </div>
    </div>
  );
}
