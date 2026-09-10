/**** Next.js config ****/
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      '@radix-ui/react-separator',
      '@radix-ui/react-slot',
    ],
  },
};

export default nextConfig;