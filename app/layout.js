import { GoogleTagManager } from "@next/third-parties/google";
import { Space_Grotesk, Inter } from "next/font/google";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Footer from "./components/footer";
import Preloader from "./components/helper/preloader";
import ScrollToTop from "./components/helper/scroll-to-top";
import Navbar from "./components/navbar";
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
  title: "Portfolio of Talal Qasim - Software Engineer",
  description:
    "This is the portfolio of Talal Qasim, a software engineer focused on backend engineering for fintech, crypto trading platforms, secure services, and scalable system development.",
  icons: {
    icon: "/favicon.ico",
    apple: "/profilePic.jpeg",
  },
  openGraph: {
    title: "Portfolio of Talal Qasim - Software Engineer",
    description:
      "Software engineer focused on backend engineering for fintech, crypto trading platforms, secure services, and scalable system development.",
    images: [
      {
        url: "/profilePic.jpeg",
        width: 280,
        height: 280,
        alt: "Talal Qasim",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Portfolio of Talal Qasim - Software Engineer",
    description:
      "Software engineer focused on backend engineering for fintech, crypto trading platforms, secure services, and scalable system development.",
    images: ["/profilePic.jpeg"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} ${inter.variable} overflow-x-clip`}>
        <ToastContainer />
        <Preloader />
        <ParticlesBackground />
        <main className="min-h-screen relative mx-auto px-6 pt-[var(--nav-safe-top)] sm:px-12 lg:max-w-[70rem] xl:max-w-[76rem] 2xl:max-w-[92rem] text-white z-10 overflow-x-clip">
          <Navbar />
          {children}
          <ScrollToTop />
        </main>
        <Footer />
      </body>
      <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM} />
    </html>
  );
}
