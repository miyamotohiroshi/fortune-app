import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // /Users/admin/package-lock.json が存在するため Turbopack がルートを誤検知する問題を修正
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
