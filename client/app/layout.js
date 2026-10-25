import { GoogleTagManager } from "@next/third-parties/google";
import {
  Space_Grotesk,
  Inter,
  Inter_Tight,
  JetBrains_Mono,
} from "next/font/google";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SiteFrame from "./components/site-frame";
import { THEME_SCRIPT } from "../utils/appearance.mjs";
import "./css/globals.scss";
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["300", "400", "500", "600"],
});
const portfolioFont = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-portfolio",
  weight: ["400", "500", "600"],
});
const portfolioMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-portfolio-mono",
  weight: ["400"],
});

export const metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  title: "Portfolio",
  icons: { icon: "/favicon.svg", apple: "/favicon.svg" },
};

export default function RootLayout({ children }) {
  const mediaOrigin = new URL(
    process.env.CMS_MEDIA_PUBLIC_URL || "http://localhost:1337",
  ).origin;
  return (
    <html lang="en" data-portfolio-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body
        className={`${spaceGrotesk.variable} ${inter.variable} ${portfolioFont.variable} ${portfolioMono.variable} overflow-x-clip`}
      >
        <ToastContainer />
        <SiteFrame mediaOrigin={mediaOrigin}>{children}</SiteFrame>
      </body>
      <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM} />
    </html>
  );
}
