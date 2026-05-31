/** @type {import('next').NextConfig} */
const nextConfig = {};

if (process.platform !== "win32") {
  nextConfig.outputFileTracingRoot = "/home/adixonclinicos/htdocs/adixonclinicos.info/admin-panel";
}

export default nextConfig;
