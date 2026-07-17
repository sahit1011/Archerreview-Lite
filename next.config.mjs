/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production build/start use a separate dir (NEXT_DIST_DIR=.next-prod) so
  // `npm run build` can never overwrite the `.next` a running `npm run dev`
  // is serving from. Dev keeps the default `.next`.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  typescript: {
    // Gate ON — the codebase is tsc-clean (was 283 errors; fixed via framer-motion v11,
    // typed model casts, and targeted service/route typing).
    ignoreBuildErrors: false,
  },
  eslint: {
    // Gate ON — `next lint` reports 0 errors.
    ignoreDuringBuilds: false,
  },
  // Native/CommonJS server deps must NOT be bundled by Turbopack/webpack — bundling
  // jsonwebtoken under Turbopack throws "Cannot read properties of undefined (reading
  // 'prototype')" at import. Externalizing loads them as real Node modules server-side.
  serverExternalPackages: ['mongoose', 'jsonwebtoken', 'bcryptjs'],
  webpack: (config) => {
    config.experiments = { ...config.experiments, topLevelAwait: true };
    return config;
  },
  output: 'standalone',
};

export default nextConfig;
