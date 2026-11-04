import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Edit2,
  Film,
  Image,
  KeyRound,
  Layers,
  LayoutTemplate,
  Loader2,
  LogOut,
  Maximize2,
  Move,
  Package,
  Palette,
  Percent,
  Plus,
  QrCode,
  RotateCcw,
  Save,
  ShieldAlert,
  ShieldCheck,
  Tag,
  Trash2,
  Upload,
  UserPlus,
  Video,
  X,
  ZoomIn,
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

type Stage = "loading" | "login" | "enroll" | "verify" | "reset" | "denied" | "panel";
type Tab = "products" | "categories" | "design";

function AdminPage() {
  const [stage, setStage] = useState<Stage>("loading");
  const [session, setSession] = useState<Session | null>(null);
  const [currentEmail, setCurrentEmail] = useState<string>("");
  const [tab, setTab] = useState<Tab>("products");
  const categoriesList = useCategoriesList();

  // Every access decision comes from the real Supabase session:
  // no localStorage token, no demo shortcut, no in-memory "admin" record.
  const evaluate = useCallback(async () => {
    const { data: s } = await supabase.auth.getSession();
    const sess = s.session;

    if (!sess) {
      setSession(null);
      return setStage("login");
    }

    setSession(sess);
    setCurrentEmail(sess.user.email || "");

    // If we arrived through the "forgot password" email link, ask for the new password first
    if ((sess.user as { recovery_session?: boolean }).recovery_session || sess.user.aud === "recover") {
      return setStage("reset");
    }

    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    // aal2 = logged in with password + 2FA: verify the admin role in the database
    if (aal?.currentLevel === "aal2") {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", sess.user.id)
        .eq("role", "admin");
      return setStage(roles && roles.length > 0 ? "panel" : "denied");
    }

    // aal1 (password only): ask for the code if 2FA is enrolled; otherwise set it up
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const verified = factors?.totp?.length ?? 0;
    return setStage(verified > 0 ? "verify" : "enroll");
  }, []);

  useEffect(() => {
    evaluate();
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (
        event === "SIGNED_IN" ||
        event === "SIGNED_OUT" ||
        event === "PASSWORD_RECOVERY" ||
        event === "MFA_CHALLENGE_VERIFIED"
      ) {
        setTimeout(evaluate, 0);
      }
    });
    return () => data.subscription.unsubscribe();
  }, [evaluate]);

  const signOut = async () => {
    // Clean up keys left behind by the old demo version
    localStorage.removeItem("moto_admin_demo");
    localStorage.removeItem("megalujos_admin_token");
    localStorage.removeItem("megalujos_admin_email");
    try {
      await supabase.auth.signOut();
    } catch {}
    setSession(null);
    setStage("login");
  };

  return (
    <div className="min-h-screen bg-secondary">
      <header className="bg-ink text-ink-foreground">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2 font-display text-lg uppercase tracking-wide">
            <ShieldCheck className="h-5 w-5 text-primary" /> Megalujos Cúcuta | Administración
            {stage === "panel" && session?.user?.email && (
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
        {stage === "login" && <LoginForm onDone={evaluate} />}
        {stage === "enroll" && <EnrollTotp email={currentEmail} onDone={evaluate} />}
        {stage === "verify" && <VerifyTotp email={currentEmail} onDone={evaluate} />}
        {stage === "reset" && <ResetPasswordForm onDone={evaluate} />}
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

            {tab === "products" && <ProductsPanel categoriesList={categoriesList} />}
            {tab === "categories" && <CategoriesPanel categoriesList={categoriesList} />}
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

// Único acceso posible al panel: estos dos correos. La regla real la impone la
// base de datos (trigger en supabase/schema.sql): cualquier otra cuenta que
// lograra registrarse queda sin rol de admin y no puede editar nada.
const ADMIN_EMAILS = ["jose13.jm446@gmail.com", "luisduran-1210@outlook.com"];

function LoginForm({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [msgType, setMsgType] = useState<"error" | "success">("error");
  const [busy, setBusy] = useState(false);

  const askRecovery = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setMsg("Primero escribe tu correo arriba y luego pulsa el enlace de recuperación.");
      setMsgType("error");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${window.location.origin}/admin`,
    });
    setBusy(false);
    if (error) {
      setMsg(error.message);
      setMsgType("error");
    } else {
      setMsg(
        `Te enviamos un enlace para crear una nueva contraseña a ${cleanEmail}. Revisa tu bandeja de entrada (y la carpeta de spam) y ábrelo en este mismo navegador.`
      );
      setMsgType("success");
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);

    const cleanEmail = email.trim().toLowerCase();

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      setBusy(false);
      if (error) {
        if (error.message.includes("Email not confirmed")) {
          setMsg(
            "Tu correo aún no está confirmado. Revisa tu bandeja de entrada (y la carpeta de spam), abre el enlace de confirmación que te enviamos y luego inicia sesión."
          );
        } else if (error.message.includes("Invalid login credentials")) {
          setMsg(
            "Correo o contraseña incorrectos. Si no la recuerdas, usa el enlace de '¿Olvidaste tu contraseña?'."
          );
        } else {
          setMsg(error.message);
        }
        setMsgType("error");
        return;
      }
      onDone();
      return;
    }

    // Registro: solo los correos autorizados de la tienda (la lista no se muestra
    // en pantalla; el candado real es el trigger de la base de datos).
    if (!ADMIN_EMAILS.includes(cleanEmail)) {
      setBusy(false);
      setMsg("Ese correo no está autorizado para administrar la tienda.");
      setMsgType("error");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: { emailRedirectTo: `${window.location.origin}/admin` },
    });
    setBusy(false);
    if (error) {
      setMsg(error.message);
      setMsgType("error");
      return;
    }
    if (data.session) {
      // Sin confirmación de correo exigida: pasar directo a configurar el 2FA
      onDone();
      return;
    }
    setMsg(
      `Cuenta creada. Te enviamos un correo de confirmación a ${cleanEmail}: ábrelo (puede caer en spam) y luego inicia sesión con la misma contraseña.`
    );
    setMsgType("success");
    setMode("signin");
  };

  return (
    <Card title="Panel Administrativo">
      {/* Selector de modo: el registro solo acepta los dos correos autorizados */}
      <div className="mb-2 grid grid-cols-2 gap-1 rounded bg-secondary p-1 border">
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
      <p className="mb-6 text-center text-[11px] text-muted-foreground">
        Acceso exclusivo del administrador. Ningún otro correo puede registrarse.
      </p>

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

        {mode === "signin" && (
          <button
            type="button"
            onClick={askRecovery}
            disabled={busy}
            className="block text-xs text-primary hover:underline cursor-pointer"
          >
            ¿Olvidaste tu contraseña? Te enviamos un enlace de recuperación a tu correo
          </button>
        )}

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
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // Limpia factores sin verificar y enrolla uno nuevo.
        // Supabase genera el QR internamente (data URI): el secreto nunca sale del navegador.
        const { data: factors } = await supabase.auth.mfa.listFactors();
        for (const f of factors?.all ?? []) {
          if (f.status === "unverified") await supabase.auth.mfa.unenroll({ factorId: f.id });
        }
        const { data, error } = await supabase.auth.mfa.enroll({
          factorType: "totp",
          friendlyName: "Megalujos Admin",
        });
        if (error) return setMsg(error.message);
        if (!data) return setMsg("No se pudo crear el factor de 2FA. Intenta de nuevo.");
        setFactorId(data.id);
        setQr(data.totp.qr_code);
        setSecret(data.totp.secret);
      } catch (e: any) {
        setMsg(e.message || "Error al generar código 2FA.");
      }
    })();
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!factorId) return;
    setBusy(true);
    setMsg(null);

    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: code.trim(),
    });
    setBusy(false);
    if (error) {
      setMsg("Código incorrecto. Revisa los 6 dígitos en tu app de autenticación.");
      return;
    }
    onDone();
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

    const { data: factors } = await supabase.auth.mfa.listFactors();
    const factor = factors?.totp?.[0];
    if (!factor) {
      setBusy(false);
      setMsg("No se encontró tu factor de 2FA en esta cuenta. Cierra sesión e inténtalo de nuevo.");
      return;
    }

    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId: factor.id,
      code: code.trim(),
    });
    setBusy(false);
    if (error) {
      setMsg("Código incorrecto. Revisa el código actual (6 dígitos) en tu aplicación de autenticación.");
      return;
    }
    onDone();
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

/**
 * Etapa que aparece al abrir el ENLACE DE RECUPERACIÓN enviado por correo.
 * Define la nueva contraseña y cierra la sesión de recuperación para volver al login normal.
 */
function ResetPasswordForm({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setMsg("La nueva contraseña debe tener mínimo 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setMsg("Las contraseñas no coinciden.");
      return;
    }
    setBusy(true);
    setMsg(null);

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setBusy(false);
      setMsg(error.message);
      return;
    }
    // La sesión de recuperación es de un solo uso: se cierra y se vuelve al login normal (con 2FA)
    await supabase.auth.signOut();
    setBusy(false);
    onDone();
  };

  return (
    <Card title="Crea tu nueva contraseña">
      <p className="mb-4 text-xs text-muted-foreground">
        Entraste desde el enlace de recuperación que te enviamos por correo. Define una nueva contraseña;
        luego inicia sesión con ella en el panel.
      </p>
      <form onSubmit={submit} className="space-y-4">
        <label className="text-xs font-medium block">
          Nueva contraseña
          <input
            className={inputCls}
            type="password"
            required
            minLength={8}
            placeholder="Mínimo 8 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </label>
        <label className="text-xs font-medium block">
          Repite la nueva contraseña
          <input
            className={inputCls}
            type="password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
          />
        </label>
        {msg && <p className="text-xs text-destructive">{msg}</p>}
        <Button type="submit" disabled={busy} className="w-full font-display uppercase tracking-wide gap-2">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Guardar nueva contraseña
        </Button>
      </form>
    </Card>
  );
}

function ProductsPanel({ categoriesList }: { categoriesList: CategoryItem[] }) {
  const [rows, setRows] = useState<ProductRow[] | null>(null);
  const [q, setQ] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("todos");
  const queryClient = useQueryClient();

  const load = useCallback(async () => {
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
  }, [queryClient]);

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
            Cambia nombre, precio, categoría, colores o foto y presiona Guardar. Los cambios se ven en la tienda al instante.
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
  categoriesList,
  onSaved,
}: {
  row: ProductRow;
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

    const { error } = await supabase
      .from("products")
      .update({ name: name.trim(), ref: ref.trim(), price: p, old_price: op, category, colors })
      .eq("id", row.id);
    setBusy(false);
    if (error) return setStatus("Error: " + error.message);
    setStatus("Guardado ✓");
    onSaved();
  };

  const upload = async (file: File) => {
    setBusy(true);
    setStatus("Subiendo foto...");

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
    const { error } = await supabase.from("products").update({ image_key: key, image_url: null }).eq("id", row.id);
    if (error) return setStatus("Error: " + error.message);
    onSaved();
  };

  const remove = async () => {
    if (!confirm(`¿Eliminar "${row.name}"?`)) return;

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

function CategoriesPanel({ categoriesList }: { categoriesList: CategoryItem[] }) {
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

function BannerMediaAdjuster({
  label,
  mediaType,
  image,
  videoUrl,
  posX,
  posY,
  scale,
  fit,
  onChange,
  onUploadImage,
  onUploadVideo,
}: {
  label: string;
  mediaType: "image" | "video";
  image: string;
  videoUrl?: string | undefined;
  posX: number;
  posY: number;
  scale: number;
  fit: "cover" | "contain";
  onChange: (updates: {
    mediaType?: "image" | "video" | undefined;
    image?: string | undefined;
    videoUrl?: string | undefined;
    posX?: number | undefined;
    posY?: number | undefined;
    scale?: number | undefined;
    fit?: "cover" | "contain" | undefined;
  }) => void;
  onUploadImage: (file: File) => void;
  onUploadVideo: (file: File) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ clientX: 0, clientY: 0, startPosX: posX, startPosY: posY });

  const handlePointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
    setDragStart({
      clientX: e.clientX,
      clientY: e.clientY,
      startPosX: posX ?? 50,
      startPosY: posY ?? 50,
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStart.clientX;
    const deltaY = e.clientY - dragStart.clientY;
    // Arrastrar a la izquierda revela el lado derecho y viceversa
    const newX = Math.min(100, Math.max(0, dragStart.startPosX - deltaX * 0.35));
    const newY = Math.min(100, Math.max(0, dragStart.startPosY - deltaY * 0.35));
    onChange({ posX: Math.round(newX), posY: Math.round(newY) });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    setIsDragging(false);
  };

  const resetPosition = () => {
    onChange({ posX: 50, posY: 50, scale: 100 });
  };

  return (
    <div className="space-y-4 rounded border border-border/80 bg-muted/20 p-4">
      {/* Selector de Tipo: Imagen o Video */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-foreground">
          {label}
        </span>
        <div className="flex rounded border bg-background p-0.5">
          <button
            type="button"
            onClick={() => onChange({ mediaType: "image" })}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded transition-colors ${
              mediaType === "image"
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Image className="h-3.5 w-3.5" /> Imagen
          </button>
          <button
            type="button"
            onClick={() => onChange({ mediaType: "video" })}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded transition-colors ${
              mediaType === "video"
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Video className="h-3.5 w-3.5" /> Video
          </button>
        </div>
      </div>

      {/* Recuadro de Vista Previa Interactivo con Arrastre Manual */}
      <div>
        <div className="flex items-center justify-between mb-1.5 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Move className="h-3 w-3 text-primary" />
            Haz clic y <strong>arrastra la imagen/video</strong> para cuadrar la posición
          </span>
          <span className="font-mono text-foreground font-semibold">
            X: {posX}% | Y: {posY}% | Zoom: {scale}%
          </span>
        </div>

        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`relative aspect-video w-full overflow-hidden rounded border bg-ink select-none ${
            isDragging ? "cursor-grabbing" : "cursor-grab"
          }`}
          title="Arrastra para mover la imagen o video en cualquier dirección"
        >
          {mediaType === "video" && videoUrl ? (
            <video
              src={videoUrl}
              autoPlay
              loop
              muted
              playsInline
              className="pointer-events-none h-full w-full"
              style={{
                objectFit: fit,
                objectPosition: `${posX}% ${posY}%`,
                transform: `scale(${scale / 100})`,
                transformOrigin: `${posX}% ${posY}%`,
              }}
            />
          ) : (
            <img
              src={image}
              alt="Vista previa de encuadre"
              className="pointer-events-none h-full w-full"
              style={{
                objectFit: fit,
                objectPosition: `${posX}% ${posY}%`,
                transform: `scale(${scale / 100})`,
                transformOrigin: `${posX}% ${posY}%`,
              }}
            />
          )}

          {/* Mira o cruz central tenue para facilitar el encuadre */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-30">
            <div className="h-4 w-4 rounded-full border border-white" />
          </div>

          <div className="pointer-events-none absolute bottom-2 right-2 rounded bg-ink/80 px-2 py-0.5 text-[10px] text-white">
            {fit === "cover" ? "Ajuste: Llenar pantalla" : "Ajuste: Completo"}
          </div>
        </div>
      </div>

      {/* Subida o selección de archivo */}
      {mediaType === "video" ? (
        <div className="space-y-2 border-t pt-3">
          <label className="text-xs font-medium block">
            URL del Video (MP4 / WebM / Enlace directo)
            <input
              className={inputCls + " mt-1"}
              placeholder="https://servidor.com/video-moto.mp4"
              value={videoUrl || ""}
              onChange={(e) => onChange({ videoUrl: e.target.value })}
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <label className="flex cursor-pointer items-center justify-center gap-1.5 border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors rounded">
              <Upload className="h-3.5 w-3.5" /> Subir archivo de video (.mp4)
              <input
                type="file"
                accept="video/mp4,video/webm,video/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && onUploadVideo(e.target.files[0])}
              />
            </label>

            {/* Videos de muestra rápida */}
            <span className="text-[11px] text-muted-foreground">Probar demo:</span>
            <button
              type="button"
              onClick={() =>
                onChange({
                  videoUrl:
                    "https://assets.mixkit.co/videos/preview/mixkit-motorcyclist-racing-on-a-track-40763-large.mp4",
                })
              }
              className="text-[11px] underline text-primary hover:text-primary/80"
            >
              Pista de carreras
            </button>
            <button
              type="button"
              onClick={() =>
                onChange({
                  videoUrl:
                    "https://assets.mixkit.co/videos/preview/mixkit-motorcycle-rider-on-a-road-42617-large.mp4",
                })
              }
              className="text-[11px] underline text-primary hover:text-primary/80"
            >
              Carretera
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2 border-t pt-3">
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex cursor-pointer items-center justify-center gap-1.5 border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors rounded">
              <Upload className="h-3.5 w-3.5" /> Subir foto desde el equipo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && onUploadImage(e.target.files[0])}
              />
            </label>
            <select
              className="border border-input bg-background px-2 py-1.5 text-xs rounded"
              value=""
              onChange={(e) => e.target.value && onChange({ image: builtInImages[e.target.value] || image })}
            >
              <option value="">O elegir foto existente del sitio…</option>
              {Object.keys(builtInImages).map((k) => (
                <option key={k} value={k}>
                  Foto: {k}
                </option>
              ))}
            </select>
          </div>

          <label className="text-xs font-medium block">
            O escribe la URL de una imagen en internet
            <input
              className={inputCls + " mt-1"}
              placeholder="https://..."
              value={image.startsWith("data:") ? "(Imagen subida en base64)" : image}
              onChange={(e) => !e.target.value.startsWith("(") && onChange({ image: e.target.value })}
            />
          </label>
        </div>
      )}

      {/* Controles de Encuadre Manual: Deslizar a los lados, arriba, abajo y Zoom */}
      <div className="border-t pt-3 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-foreground">
            Ajustes de Encuadre Manual
          </span>
          <button
            type="button"
            onClick={resetPosition}
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary font-medium"
          >
            <RotateCcw className="h-3 w-3" /> Reestablecer al centro
          </button>
        </div>

        {/* 1. Mover Horizontalmente (A un lado / Al otro) */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <Move className="h-3 w-3" /> Mover Horizontalmente (Lados):
            </span>
            <span className="font-mono text-foreground font-semibold">{posX}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={posX}
            onChange={(e) => onChange({ posX: Number(e.target.value) })}
            className="w-full accent-primary cursor-pointer"
          />
          <div className="flex justify-between gap-1 text-[10px]">
            <button
              type="button"
              onClick={() => onChange({ posX: 0 })}
              className="rounded border px-2 py-0.5 hover:bg-muted"
            >
              ⬅ Izquierda (0%)
            </button>
            <button
              type="button"
              onClick={() => onChange({ posX: 50 })}
              className="rounded border px-2 py-0.5 hover:bg-muted font-bold text-primary"
            >
              🎯 Centro (50%)
            </button>
            <button
              type="button"
              onClick={() => onChange({ posX: 100 })}
              className="rounded border px-2 py-0.5 hover:bg-muted"
            >
              Derecha (100%) ➡
            </button>
          </div>
        </div>

        {/* 2. Mover Verticalmente (Arriba / Abajo) */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <Move className="h-3 w-3" /> Mover Verticalmente (Arriba / Abajo):
            </span>
            <span className="font-mono text-foreground font-semibold">{posY}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={posY}
            onChange={(e) => onChange({ posY: Number(e.target.value) })}
            className="w-full accent-primary cursor-pointer"
          />
          <div className="flex justify-between gap-1 text-[10px]">
            <button
              type="button"
              onClick={() => onChange({ posY: 0 })}
              className="rounded border px-2 py-0.5 hover:bg-muted"
            >
              ⬆ Arriba (0%)
            </button>
            <button
              type="button"
              onClick={() => onChange({ posY: 50 })}
              className="rounded border px-2 py-0.5 hover:bg-muted font-bold text-primary"
            >
              🎯 Centro (50%)
            </button>
            <button
              type="button"
              onClick={() => onChange({ posY: 100 })}
              className="rounded border px-2 py-0.5 hover:bg-muted"
            >
              Abajo (100%) ⬇
            </button>
          </div>
        </div>

        {/* 3. Escala / Zoom y Modo de Ajuste a la Resolución */}
        <div className="grid gap-3 sm:grid-cols-2 pt-1">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground flex items-center gap-1">
                <ZoomIn className="h-3 w-3" /> Zoom / Tamaño:
              </span>
              <span className="font-mono text-foreground font-semibold">{scale}%</span>
            </div>
            <input
              type="range"
              min={100}
              max={200}
              value={scale}
              onChange={(e) => onChange({ scale: Number(e.target.value) })}
              className="w-full accent-primary cursor-pointer"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Modo de Ajuste a la Resolución
            </label>
            <select
              className="h-8 w-full border border-input bg-background px-2 text-xs rounded"
              value={fit}
              onChange={(e) => onChange({ fit: e.target.value as "cover" | "contain" })}
            >
              <option value="cover">Llenar toda la pantalla (Cover, recomendado)</option>
              <option value="contain">Ajustar completo sin recortar (Contain)</option>
            </select>
          </div>
        </div>
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
        hero: { ...prev.hero, mediaType: "image", image: reader.result as string },
      }));
    };
    reader.readAsDataURL(file);
  };

  const uploadHeroVideo = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setConfig((prev) => ({
        ...prev,
        hero: { ...prev.hero, mediaType: "video", videoUrl: reader.result as string },
      }));
    };
    reader.readAsDataURL(file);
  };

  const uploadPromoImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setConfig((prev) => ({
        ...prev,
        promoBanner: { ...prev.promoBanner, mediaType: "image", image: reader.result as string },
      }));
    };
    reader.readAsDataURL(file);
  };

  const uploadPromoVideo = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setConfig((prev) => ({
        ...prev,
        promoBanner: { ...prev.promoBanner, mediaType: "video", videoUrl: reader.result as string },
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
            Puedes montar <strong>videos o fotos</strong>, ajustar automáticamente a la resolución o cuadrarlo manualmente deslizándolo hacia arriba, abajo y los lados.
          </p>
        </div>

        <BannerMediaAdjuster
          label="Fondo de la Portada Principal"
          mediaType={config.hero.mediaType || "image"}
          image={config.hero.image}
          videoUrl={config.hero.videoUrl}
          posX={config.hero.posX ?? 50}
          posY={config.hero.posY ?? 50}
          scale={config.hero.scale ?? 100}
          fit={config.hero.fit || "cover"}
          onChange={(updates) =>
            setConfig((prev) => ({
              ...prev,
              hero: {
                ...prev.hero,
                ...updates,
                image: updates.image ?? prev.hero.image,
              },
            }))
          }
          onUploadImage={uploadHeroImage}
          onUploadVideo={uploadHeroVideo}
        />

        <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t">
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

      {/* SECCIÓN 2: BANNER INTERMEDIO (LIMPIA, LUBRICA Y PROTEGE) */}
      <div className="border bg-background p-6 shadow-sm space-y-6">
        <div className="border-b pb-3">
          <h2 className="text-xl font-bold font-display uppercase tracking-wide flex items-center gap-2">
            <LayoutTemplate className="h-5 w-5 text-primary" /> 2. Banner Intermedio Promocional («Limpia, lubrica y protege»)
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Sube video o imagen y ajusta el encuadre horizontal y vertical para que se vea nítido en cualquier resolución.
          </p>
        </div>

        <BannerMediaAdjuster
          label="Fondo del Banner Promocional"
          mediaType={config.promoBanner.mediaType || "image"}
          image={config.promoBanner.image}
          videoUrl={config.promoBanner.videoUrl}
          posX={config.promoBanner.posX ?? 50}
          posY={config.promoBanner.posY ?? 50}
          scale={config.promoBanner.scale ?? 100}
          fit={config.promoBanner.fit || "cover"}
          onChange={(updates) =>
            setConfig((prev) => ({
              ...prev,
              promoBanner: {
                ...prev.promoBanner,
                ...updates,
                image: updates.image ?? prev.promoBanner.image,
              },
            }))
          }
          onUploadImage={uploadPromoImage}
          onUploadVideo={uploadPromoVideo}
        />

        <div className="grid gap-4 sm:grid-cols-3 pt-2 border-t">
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
