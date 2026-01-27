'use client'

import { useEffect } from 'react'

export default function SuppressSourceMapErrors() {
  useEffect(() => {
    // Suppress "Invalid source map" errors in development
    // This is a known issue with Turbopack on Windows
    if (process.env.NODE_ENV === 'development') {
      const originalError = console.error;
      const originalWarn = console.warn;
      
      console.error = (...args: any[]) => {
        // Filter out source map related errors (both client and server-side)
        // Check all arguments for source map related content
        const allArgs = args.map(arg => {
          if (typeof arg === 'string') return arg;
          if (arg && typeof arg === 'object') {
            try {
              return JSON.stringify(arg);
            } catch {
              return String(arg);
            }
          }
          return String(arg);
        }).join(' ').toLowerCase();
        
        const isSourceMapError = 
          allArgs.includes('invalid source map') ||
          allArgs.includes('sourcemapurl could not be parsed') ||
          allArgs.includes('only conformant source maps') ||
          allArgs.includes('sourcemapurl') ||
          (allArgs.includes('server') && allArgs.includes('source map')) ||
          (allArgs.includes('intercept-console-error') && allArgs.includes('source map')) ||
          allArgs.includes('could not be parsed') && allArgs.includes('sourcemap');
        
        if (!isSourceMapError) {
          originalError.apply(console, args);
        }
      };
      
      console.warn = (...args: any[]) => {
        // Also filter source map warnings (both client and server-side)
        const warnMessage = args[0]?.toString() || '';
        const secondArg = args[1]?.toString() || '';
        const combinedMessage = (warnMessage + ' ' + secondArg).toLowerCase();
        
        const isSourceMapWarning = 
          combinedMessage.includes('invalid source map') ||
          combinedMessage.includes('sourcemapurl') ||
          (combinedMessage.includes('server') && combinedMessage.includes('source map'));
        
        if (!isSourceMapWarning) {
          originalWarn.apply(console, args);
        }
      };
    }
  }, []);

  return null; // This component doesn't render anything
}

