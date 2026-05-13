/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // Allow access from local network IP for mobile testing
  allowedDevOrigins: ["192.168.1.25"],
};

export default nextConfig;
