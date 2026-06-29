import type { NextConfig } from "next";
import path from "node:path";

const API_INTERNAL_URL = process.env.API_INTERNAL_URL || "http://localhost:8901";

const nextConfig: NextConfig = {
  // Lean container output (server.js + traced deps) for the Docker image.
  output: "standalone",
  // Pin the workspace root to this app — a stray lockfile in the home dir was
  // being inferred as the root, which Turbopack warns about.
  turbopack: { root: path.resolve(__dirname) },
  outputFileTracingRoot: path.resolve(__dirname),
  // Proxy /api/* to the FastAPI backend (loopback in prod via nginx).
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_INTERNAL_URL}/api/:path*` }];
  },
};

export default nextConfig;
