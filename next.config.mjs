/** @type {import('next').NextConfig} */
const nextConfig = {
  // build/start use the default `.next` so Vercel (which runs `next build` and
  // reads `.next`) works natively. Local `npm run dev` sets NEXT_DIST_DIR=.next-dev
  // so a local prod build can never overwrite the `.next` a dev server is serving.
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
