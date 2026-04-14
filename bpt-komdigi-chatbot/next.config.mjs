/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  // WAJIB untuk deployment Docker (menghasilkan server.js standalone)
  output: "standalone",
};

export default nextConfig;
