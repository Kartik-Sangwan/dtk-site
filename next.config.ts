/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  outputFileTracingIncludes: {
    "/*": ["./data/Inventory.csv", "./data/inventory.csv"],
  },
};

module.exports = nextConfig;
