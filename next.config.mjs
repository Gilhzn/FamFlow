/** @type {import('next').NextConfig} */
const staticExport = process.env.STATIC_EXPORT === "1";

const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  // Static export mode for GitHub Pages: no server, no API routes (the scan
  // page falls back to its labeled client-side mock), assets under basePath.
  ...(staticExport && {
    output: "export",
    basePath: process.env.BASE_PATH || "",
    images: { unoptimized: true },
  }),
};

export default nextConfig;
