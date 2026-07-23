import type { Metadata } from 'next'
import './globals.css'
import SuppressSourceMapErrors from '@/components/SuppressSourceMapErrors'

export const metadata: Metadata = {
  title: 'yazamınakoyim',
  description: 'Private social feed for friends',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="text-gray-900 font-sans" style={{ 
        fontFamily: "'VT323', Arial, sans-serif", 
        fontSize: '14px', 
        color: '#3D3D2A',
        WebkitFontSmoothing: 'none',
        MozOsxFontSmoothing: 'unset',
        textRendering: 'optimizeSpeed'
      }}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window !== 'undefined' && window.console) {
                  const originalError = console.error;
                  const originalWarn = console.warn;
                  
                  console.error = function(...args) {
                    const allArgs = args.map(arg => {
                      if (typeof arg === 'string') return arg;
                      if (arg && typeof arg === 'object') {
                        try { return JSON.stringify(arg); } catch { return String(arg); }
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
                      (allArgs.includes('could not be parsed') && allArgs.includes('sourcemap'));
                    
                    if (!isSourceMapError) {
                      originalError.apply(console, args);
                    }
                  };
                  
                  console.warn = function(...args) {
                    const allArgs = args.map(arg => {
                      if (typeof arg === 'string') return arg;
                      if (arg && typeof arg === 'object') {
                        try { return JSON.stringify(arg); } catch { return String(arg); }
                      }
                      return String(arg);
                    }).join(' ').toLowerCase();
                    
                    const isSourceMapWarning = 
                      allArgs.includes('invalid source map') ||
                      allArgs.includes('sourcemapurl') ||
                      (allArgs.includes('server') && allArgs.includes('source map'));
                    
                    if (!isSourceMapWarning) {
                      originalWarn.apply(console, args);
                    }
                  };
                }
              })();
            `,
          }}
        />
        <SuppressSourceMapErrors />
        {children}
      </body>
    </html>
  )
}

