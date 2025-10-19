"use client";

import Link from "next/link";

const SkillsIndex = () => {
  return (
    <div className="max-w-3xl mx-auto p-8 space-y-6">
      <h1 className="text-4xl font-bold">SkillChain 功能中心</h1>
      <p className="opacity-80">在这里管理技能包的全流程：创建、上链、浏览、交易与收藏。</p>
      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/skills/create" className="card bg-base-100 shadow hover:shadow-lg transition">
          <div className="card-body">
            <h2 className="card-title">创建技能包</h2>
            <p className="text-sm opacity-70">上传技能说明与资源并设置价格，铸造为链上 NFT。</p>
            <span className="btn btn-primary btn-sm mt-4 w-fit">立即创建</span>
          </div>
        </Link>
        <Link href="/skills/market" className="card bg-base-100 shadow hover:shadow-lg transition">
          <div className="card-body">
            <h2 className="card-title">浏览市场</h2>
            <p className="text-sm opacity-70">逛逛灵感广场，快速收藏或购买热门技能包。</p>
            <span className="btn btn-secondary btn-sm mt-4 w-fit">进入市场</span>
          </div>
        </Link>
        <Link href="/search" className="card bg-base-100 shadow hover:shadow-lg transition">
          <div className="card-body">
            <h2 className="card-title">技能搜索</h2>
            <p className="text-sm opacity-70">按关键词、热度或价格排序，精准定位你想要的技能。</p>
            <span className="btn btn-outline btn-sm mt-4 w-fit">开始搜索</span>
          </div>
        </Link>
        <Link href="/profile" className="card bg-base-100 shadow hover:shadow-lg transition">
          <div className="card-body">
            <h2 className="card-title">个人主页</h2>
            <p className="text-sm opacity-70">管理你的创作、收藏与购买记录，打造链上名片。</p>
            <span className="btn btn-outline btn-sm mt-4 w-fit">查看主页</span>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default SkillsIndex;

