import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack handles WASM natively
  turbopack: {
    root: '.',
  },

  // Allow camera access
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(self)',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
