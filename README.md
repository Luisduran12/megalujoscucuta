# MEGALUJOS CÚCUTA - Tuning y Accesorios

Tienda virtual oficial de **Megalujos Cúcuta**, especializada en lujos, iluminación LED, espejos CNC, sliders, manubrios, cascos y accesorios para motocicletas en Cúcuta, Colombia.

- **WhatsApp / Celular:** 320-3031735 (Colombia +57)
- **Instagram:** [@megalujoscucuta](https://www.instagram.com/megalujoscucuta)
- **Ubicación:** Cúcuta, Colombia ([Google Maps](https://maps.app.goo.gl/ki7SJXgUVrnAWctw9))
- **Horario:** Lunes a Sábado: 9:00 a.m. – 1:00 p.m. / 2:00 p.m. – 6:30 p.m.

---

## Características Principales

1. **Catálogo con Variantes de Color**:
   - Selección interactiva de tonos (Negro, Rojo, Azul, Dorado, Tornasol, Titanio, Verde Flúor, etc.).
   - Cambio dinámico de imagen según el color seleccionado.
   - El color elegido se envía automáticamente en el pedido de WhatsApp y en el carrito de compras.

2. **API Directa de WhatsApp**:
   - Envío directo a WhatsApp sin pantallas intermedias.
   - Detección automática de móvil (app nativa `whatsapp://`) y escritorio (`https://api.whatsapp.com/send`).
   - Carrito con resumen detallado del pedido y cálculo de envío gratis.

3. **Panel Administrativo con 2FA (Doble Factor de Autenticación)**:
   - Registro de correo real y contraseña de administrador.
   - Doble factor de autenticación TOTP (RFC 6238) compatible con **Google Authenticator** y **Microsoft Authenticator** con código QR escaneable.
   - Gestión completa de productos, precios normales y precios de Outlet.
   - Editor de categorías en tiempo real.
   - Editor de banners, portada de la moto, textos promocionales y descuentos.

---

## Despliegue en Vercel

1. Sube o conecta este repositorio `megalujoscucuta` en tu cuenta de [Vercel](https://vercel.com).
2. Vercel detectará automáticamente la configuración lista en `vercel.json`.
3. (Opcional) En **Project Settings -> Environment Variables** agrega las variables de Supabase si deseas conectar base de datos en la nube:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY`
4. Haz clic en **Deploy**.

---

## Configuración de Base de Datos (Supabase)

Si deseas sincronizar los productos en la nube con Supabase:
1. Crea un proyecto gratuito en [Supabase](https://supabase.com).
2. Entra en el **SQL Editor** de Supabase.
3. Abre el archivo `supabase/schema.sql` de este repositorio, cópialo y presiona **Run**.
4. En **Authentication -> Multi-Factor (MFA)** de Supabase, activa la opción **App Authenticator (TOTP)**.
5. Copia tu `URL` y `Anon Public Key` desde **Project Settings -> API** y colócalas en tu archivo `.env` o en las variables de entorno de Vercel.

---

## Desarrollo Local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo (puerto 8080)
npm run dev

# Compilar para producción (Vercel Build Output)
npm run build
```
