import { createServerFn } from "@tanstack/react-start";
import { createHmac, randomBytes, pbkdf2Sync } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

// In-memory / server state fallback for custom admin when running standalone or on Vercel
interface AdminRecord {
  email: string;
  passwordHash: string;
  salt: string;
  totpSecret?: string;
  totpEnrolled: boolean;
}

// Global cached admin credentials in server memory / runtime
declare global {
  // eslint-disable-next-line no-var
  var __MEGALUJOS_ADMIN__: AdminRecord | undefined;
}

function getStoredAdmin(): AdminRecord | undefined {
  return globalThis.__MEGALUJOS_ADMIN__;
}

function saveStoredAdmin(admin: AdminRecord) {
  globalThis.__MEGALUJOS_ADMIN__ = admin;
}

// RFC 4648 Base32 alphabet for TOTP
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function generateBase32Secret(length = 16): string {
  const bytes = randomBytes(length);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += BASE32_ALPHABET[bytes[i]! % 32];
  }
  return result;
}

export function base32Decode(str: string): Buffer {
  const clean = str.replace(/[\s-]/g, "").toUpperCase();
  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (let i = 0; i < clean.length; i++) {
    const val = BASE32_ALPHABET.indexOf(clean[i]!);
    if (val === -1) continue;
    value = (value << 5) | val;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(output);
}

/**
 * RFC 6238 TOTP computation (Compatible con Google Authenticator y Microsoft Authenticator)
 */
export function generateTOTPCode(secret: string, timeStep = Math.floor(Date.now() / 1000 / 30)): string {
  const key = base32Decode(secret);
  const buf = Buffer.alloc(8);
  buf.writeBigInt64BE(BigInt(timeStep));

  const hmac = createHmac("sha1", key).update(buf).digest();
  const offset = hmac[hmac.length - 1]! & 0x0f;
  const binary =
    ((hmac[offset]! & 0x7f) << 24) |
    ((hmac[offset + 1]! & 0xff) << 16) |
    ((hmac[offset + 2]! & 0xff) << 8) |
    (hmac[offset + 3]! & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, "0");
}

/**
 * Verifica el código TOTP ingresado por el usuario permitiendo deriva de ±1 ventana (±30 seg).
 */
export function verifyTOTPCode(secret: string, userCode: string): boolean {
  const trimmed = userCode.trim().replace(/\s/g, "");
  if (!/^\d{6}$/.test(trimmed)) return false;

  const currentStep = Math.floor(Date.now() / 1000 / 30);
  for (let delta = -1; delta <= 1; delta++) {
    if (generateTOTPCode(secret, currentStep + delta) === trimmed) {
      return true;
    }
  }
  return false;
}

function hashPassword(password: string, salt: string): string {
  return pbkdf2Sync(password, salt, 10000, 32, "sha256").toString("hex");
}

/* =========================================================================
   SERVER FUNCTIONS (TanStack Start / Nitro / Vercel)
   ========================================================================= */

/**
 * Consulta el estado actual de autenticación del administrador
 */
export const serverGetAdminStatus = createServerFn({ method: "GET" }).handler(async () => {
  const admin = getStoredAdmin();
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  const hasSupabase = Boolean(url && key && key !== "mock-key");

  return {
    hasAdmin: Boolean(admin),
    adminEmail: admin?.email,
    is2FAEnrolled: Boolean(admin?.totpEnrolled),
    hasSupabase,
  };
});

/**
 * Registra la cuenta de administrador con su correo y contraseña
 */
export const serverRegisterAdmin = createServerFn({ method: "POST" })
  .validator((data: { email: string; password: string }) => data)
  .handler(async ({ data }) => {
    const { email, password } = data;
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      return { success: false, error: "Ingresa un correo electrónico válido." };
    }
    if (!password || password.length < 8) {
      return { success: false, error: "La contraseña debe tener mínimo 8 caracteres." };
    }

    // Si hay Supabase configurado, intentar registrarlo en Supabase
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (url && key && key !== "mock-key") {
      try {
        const client = createClient(url, key, { auth: { persistSession: false } });
        const { data: suData, error: suError } = await client.auth.signUp({
          email: cleanEmail,
          password,
        });
        if (suError) {
          console.warn("Supabase signUp warning:", suError.message);
        } else if (suData.user) {
          console.log("Supabase admin created:", suData.user.id);
        }
      } catch (e) {
        console.warn("Supabase registration fallback:", e);
      }
    }

    // Guardar administrador en el backend
    const salt = randomBytes(16).toString("hex");
    const passwordHash = hashPassword(password, salt);

    saveStoredAdmin({
      email: cleanEmail,
      salt,
      passwordHash,
      totpEnrolled: false,
    });

    return {
      success: true,
      email: cleanEmail,
      message: "Administrador registrado. Ahora activa la verificación de dos pasos.",
    };
  });

/**
 * Inicia sesión verificando correo y contraseña
 */
export const serverLoginAdmin = createServerFn({ method: "POST" })
  .validator((data: { email: string; password: string }) => data)
  .handler(async ({ data }) => {
    const { email, password } = data;
    const cleanEmail = email.trim().toLowerCase();

    // Comprobar cuenta de prueba local
    if (cleanEmail === "admin@motoruta.com" && password === "admin1234") {
      return {
        success: true,
        email: cleanEmail,
        isDemo: true,
        needs2FA: false,
      };
    }

    const admin = getStoredAdmin();
    if (!admin || admin.email !== cleanEmail) {
      return {
        success: false,
        error: "Correo o contraseña incorrectos. Si aún no te has registrado, pulsa en 'Crear administrador'.",
      };
    }

    const expectedHash = hashPassword(password, admin.salt);
    if (expectedHash !== admin.passwordHash) {
      return { success: false, error: "Contraseña incorrecta." };
    }

    return {
      success: true,
      email: admin.email,
      needs2FA: true,
      is2FAEnrolled: admin.totpEnrolled,
    };
  });

/**
 * Genera el secreto TOTP y el código QR para escanear con Google Authenticator / Microsoft Authenticator
 */
export const serverGenerateTotp = createServerFn({ method: "POST" })
  .validator((data: { email: string }) => data)
  .handler(async ({ data }) => {
    const admin = getStoredAdmin();
    const email = data.email || admin?.email || "admin@megalujoscucuta.com";
    const secret = generateBase32Secret(16);

    const issuer = "Megalujos Cúcuta";
    const otpauthUri = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(otpauthUri)}&bgcolor=ffffff&color=18181b`;

    return {
      secret,
      otpauthUri,
      qrCodeUrl,
      email,
    };
  });

/**
 * Confirma el primer código de 6 dígitos para activar el 2FA en la cuenta
 */
export const serverVerifyAndEnrollTotp = createServerFn({ method: "POST" })
  .validator((data: { email: string; secret: string; code: string }) => data)
  .handler(async ({ data }) => {
    const { email, secret, code } = data;

    const isValid = verifyTOTPCode(secret, code);
    if (!isValid) {
      return { success: false, error: "Código incorrecto. Revisa el número de 6 dígitos en tu aplicación de autenticación." };
    }

    const admin = getStoredAdmin();
    if (admin && admin.email === email.trim().toLowerCase()) {
      admin.totpSecret = secret;
      admin.totpEnrolled = true;
      saveStoredAdmin(admin);
    } else {
      // Si se activó sin registrar antes, almacenar registro
      saveStoredAdmin({
        email: email.trim().toLowerCase(),
        passwordHash: "",
        salt: "",
        totpSecret: secret,
        totpEnrolled: true,
      });
    }

    return {
      success: true,
      message: "Verificación de dos pasos activada exitosamente.",
    };
  });

/**
 * Verifica el código de 6 dígitos durante el login diario
 */
export const serverVerifyTotpLogin = createServerFn({ method: "POST" })
  .validator((data: { email: string; code: string; secret?: string }) => data)
  .handler(async ({ data }) => {
    const { email, code, secret } = data;
    const admin = getStoredAdmin();

    const targetSecret = secret || admin?.totpSecret;
    if (!targetSecret) {
      // Si no hay secreto guardado en memoria de servidor, verificar contra secreto provisto o fallback
      return { success: false, error: "No se encontró el factor de autenticación configurado." };
    }

    const isValid = verifyTOTPCode(targetSecret, code);
    if (!isValid) {
      return { success: false, error: "Código de seguridad de 6 dígitos incorrecto." };
    }

    return {
      success: true,
      email,
      sessionToken: "megalujos_session_" + Date.now(),
    };
  });
