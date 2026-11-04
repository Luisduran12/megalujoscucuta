/**
 * Megalujos Cúcuta - Integración Directa con la API de WhatsApp
 * Teléfono oficial: 320-3031735 (Colombia: +57)
 */

export const MEGALUJOS_WHATSAPP_PHONE = "573203031735";
export const MEGALUJOS_DISPLAY_PHONE = "320-3031735";

/**
 * Genera la URL directa de la API de WhatsApp para abrir el chat de inmediato sin pantallas intermedias.
 */
export function getWhatsAppUrl(text: string, phone: string = MEGALUJOS_WHATSAPP_PHONE): string {
  const cleanPhone = phone.replace(/\D/g, "");
  const encodedText = encodeURIComponent(text);
  // api.whatsapp.com/send con type=phone_number va directo a la conversación
  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}&type=phone_number&app_absent=0`;
}

/**
 * Abre directamente la aplicación de WhatsApp (en celular) o WhatsApp Web (en computador)
 * con el mensaje pre-llenado listo para enviar.
 */
export function openDirectWhatsApp(text: string, phone: string = MEGALUJOS_WHATSAPP_PHONE): void {
  if (typeof window === "undefined") return;

  const cleanPhone = phone.replace(/\D/g, "");
  const encodedText = encodeURIComponent(text);
  const directUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}&type=phone_number&app_absent=0`;

  // En dispositivos móviles (Android / iOS), invocar el protocolo nativo whatsapp:// abre la app instantáneamente
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (isMobile) {
    const nativeUri = `whatsapp://send?phone=${cleanPhone}&text=${encodedText}`;
    // Intentar abrir app nativa
    window.location.href = nativeUri;
    // Respaldo en caso de que no tenga la app instalada
    setTimeout(() => {
      window.open(directUrl, "_blank");
    }, 800);
  } else {
    // En escritorio abre WhatsApp Web / Desktop directamente en una pestaña
    window.open(directUrl, "_blank");
  }
}
