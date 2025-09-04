import { useState, useEffect } from 'react';

interface BreakpointConfig {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
}

const defaultBreakpoints: BreakpointConfig = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export const useResponsive = (breakpoints: Partial<BreakpointConfig> = {}) => {
  const bp = { ...defaultBreakpoints, ...breakpoints };
  
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowSize.width < bp.sm;
  const isTablet = windowSize.width >= bp.sm && windowSize.width < bp.lg;
  const isDesktop = windowSize.width >= bp.lg;
  
  const breakpoint = {
    xs: windowSize.width < bp.sm,
    sm: windowSize.width >= bp.sm && windowSize.width < bp.md,
    md: windowSize.width >= bp.md && windowSize.width < bp.lg,
    lg: windowSize.width >= bp.lg && windowSize.width < bp.xl,
    xl: windowSize.width >= bp.xl && windowSize.width < bp['2xl'],
    '2xl': windowSize.width >= bp['2xl'],
  };

  const getCurrentBreakpoint = () => {
    if (breakpoint['2xl']) return '2xl';
    if (breakpoint.xl) return 'xl';
    if (breakpoint.lg) return 'lg';
    if (breakpoint.md) return 'md';
    if (breakpoint.sm) return 'sm';
    return 'xs';
  };

  return {
    windowSize,
    isMobile,
    isTablet,
    isDesktop,
    breakpoint,
    currentBreakpoint: getCurrentBreakpoint(),
  };
};

export default useResponsive;
