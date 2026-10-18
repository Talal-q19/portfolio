'use client';

import { usePathname } from 'next/navigation';
import PortfolioLayout from './portfolio-layout';
import Preloader from './helper/preloader';
import ParticlesBackground from './helper/particles-background';

export default function SiteFrame({ children, mediaOrigin }) {
  const pathname = usePathname();
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return children;
  return <><Preloader /><ParticlesBackground /><PortfolioLayout mediaOrigin={mediaOrigin}>{children}</PortfolioLayout></>;
}
