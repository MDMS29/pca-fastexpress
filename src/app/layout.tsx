import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FastExpress | Operaciones",
  description: "Panel operativo para la cotización y gestión de envíos.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
