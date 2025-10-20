import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  typescript: {
    ignoreBuildErrors: process.env.NEXT_PUBLIC_IGNORE_BUILD_ERROR === "true",
  },
  eslint: {
    ignoreDuringBuilds: process.env.NEXT_PUBLIC_IGNORE_BUILD_ERROR === "true",
  },
  webpack: config => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
};

const isIpfs = process.env.NEXT_PUBLIC_IPFS_BUILD === "true";

if (isIpfs) {
  nextConfig.output = "export";
  nextConfig.trailingSlash = true;
  nextConfig.images = {
    unoptimized: true,
  };
}

// 统一配置远程图片域名与 IPFS 网关，避免 ORB 问题并允许 Next/Image 加载
nextConfig.images = {
  ...(nextConfig.images ?? {}),
  remotePatterns: [
    { protocol: "https", hostname: "images.unsplash.com" },
    { protocol: "https", hostname: "ipfs.io", pathname: "/ipfs/**" },
    { protocol: "https", hostname: "gateway.pinata.cloud", pathname: "/ipfs/**" },
    { protocol: "https", hostname: "cloudflare-ipfs.com", pathname: "/ipfs/**" },
    { protocol: "https", hostname: "nftstorage.link", pathname: "/ipfs/**" },
  ],
};

module.exports = nextConfig;
