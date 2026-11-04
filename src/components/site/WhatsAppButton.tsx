import { MessageCircle } from "lucide-react";
import { getWhatsAppUrl, openDirectWhatsApp } from "@/lib/whatsapp";

export function WhatsAppButton() {
  const defaultText = "Hola Megalujos Cúcuta, quiero más información sobre lujos y accesorios para mi moto";

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    openDirectWhatsApp(defaultText);
  };

  return (
    <a
      href={getWhatsAppUrl(defaultText)}
      onClick={handleClick}
      target="_blank"
      rel="noreferrer"
      aria-label="Escríbenos directamente por WhatsApp a Megalujos Cúcuta"
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp text-whatsapp-foreground shadow-card transition-transform hover:scale-110 cursor-pointer"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}
