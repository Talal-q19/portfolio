import { GoogleTagManager } from "@next/third-parties/google";
import { Space_Grotesk, Inter } from "next/font/google";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PortfolioLayout from "./components/portfolio-layout";
import Preloader from "./components/helper/preloader";
import ParticlesBackground from "./components/helper/particles-background";
import "./css/card.scss";
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

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "Portfolio",
  icons: { icon: "/favicon.svg", apple: "/favicon.svg" },
};

export default function RootLayout({ children }) {
  const mediaOrigin = new URL(process.env.CMS_MEDIA_PUBLIC_URL || "http://localhost:1337").origin;
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} ${inter.variable} overflow-x-clip`}>
        <ToastContainer />
        <Preloader />
        <ParticlesBackground />
        <PortfolioLayout mediaOrigin={mediaOrigin}>
          {children}
        </PortfolioLayout>
      </body>
      <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM} />
    </html>
  );
}
