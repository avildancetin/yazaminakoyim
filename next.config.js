/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fxhqhqquafkdrvyvwzeb.supabase.co',
      },
    ],
  },
  
  // Bu ayar production build içindir, kalsın zararı yok.
  productionBrowserSourceMaps: false,

  // Webpack uyarılarını bastırmak için bu bloğu ekle (--webpack flag ile kullanıldığında):
  webpack: (config) => {
    config.ignoreWarnings = [
      // Node_modules içinden gelen source map hatalarını görmezden gel
      { module: /node_modules/ },
      (warning) => warning.message.includes('Source map'),
    ];
    return config;
  },

  // Turbopack için boş config (Turbopack default olarak kullanılıyor)
  turbopack: {},
}

module.exports = nextConfig