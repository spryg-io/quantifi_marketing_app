/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    serverComponentsExternalPackages: ["pg", "better-sqlite3"],
  },
};

export default nextConfig;
