"use client";

import { usePathname } from "next/navigation";
import PortfolioLayout from "./portfolio-layout";
import Appearance from "./public/appearance";
import "./public/portfolio.css";

export default function SiteFrame({ children, mediaOrigin }) {
  const pathname = usePathname();
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return children;
  return (
    <Appearance>
      <PortfolioLayout mediaOrigin={mediaOrigin}>{children}</PortfolioLayout>
    </Appearance>
  );
}
