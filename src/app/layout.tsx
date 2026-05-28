import type { Metadata, Viewport } from "next";
import { Montserrat, Cormorant } from "next/font/google";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/auth-context";
import { RegisterSW } from "@/components/pwa/RegisterSW";
import "./globals.css";

/* ProMax Luxury Serif — Cormorant títulos, Montserrat cuerpo */
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-montserrat",
  display: "swap",
});

const cormorant = Cormorant({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#CA8A04",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Mibarberia — El sistema para tu barbería",
    template: "%s | Mibarberia",
  },
  description:
    "Agenda online, automatización de WhatsApp y gestión de clientes — todo lo que tu barbería necesita en una sola plataforma.",
  keywords: ["barbería", "reservas online", "agenda barbería", "WhatsApp", "automatización", "gestión clientes"],
  authors: [{ name: "Mibarberia" }],
  // PWA
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Mibarberia",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/api/pwa/icon?size=192", sizes: "192x192", type: "image/png" },
      { url: "/api/pwa/icon?size=512", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.svg",
    apple: [
      { url: "/api/pwa/icon?size=192", sizes: "192x192", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "es_419",
    title: "Mibarberia",
    description: "Reservas online, automatización de WhatsApp y gestión de clientes para barberías modernas.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CL" suppressHydrationWarning>
      {/* Script anti-flash: aplica el tema guardado ANTES del primer render */}
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('barber-theme');if(t==='light')document.documentElement.setAttribute('data-theme','light');}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${montserrat.variable} ${cormorant.variable} font-body antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <RegisterSW />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#111111",
              border: "1px solid rgba(202,138,4,0.2)",
              color: "#FFFFFF",
              fontFamily: "Montserrat, sans-serif",
              fontSize: "0.875rem",
            },
          }}
        />
      </body>
    </html>
  );
}
