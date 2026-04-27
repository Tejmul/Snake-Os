import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Asteroid Serpent",
  description: "Navigate the void. Devour the cosmos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
