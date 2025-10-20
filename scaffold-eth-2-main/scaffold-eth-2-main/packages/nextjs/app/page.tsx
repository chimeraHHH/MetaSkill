"use client";

import { useMemo, useState } from "react";
import type { NextPage } from "next";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import { BookmarkIcon, HeartIcon, LanguageIcon, MagnifyingGlassIcon, PlayIcon } from "@heroicons/react/24/outline";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useSkillFavorites } from "~~/hooks/useSkillFavorites";
import { useSkillsData } from "~~/hooks/useSkillsData";
import type { SkillItem } from "~~/hooks/useSkillsData";
import { SAMPLE_SKILLS } from "~~/data/sampleSkills";
import { SkillCard } from "~~/components/SkillCard";

const Home: NextPage = () => {
  const router = useRouter();
  const { address } = useAccount();
  const [searchTerm, setSearchTerm] = useState("");
  const [language, setLanguage] = useState<"zh" | "en">("zh");
  const { skills, loading } = useSkillsData();
  const { isFavorite, toggleFavorite } = useSkillFavorites();

  const curatedSkills = useMemo(() => {
    const map = new Map<string, SkillItem>();
    [...skills, ...SAMPLE_SKILLS].forEach(skill => {
      const key = skill.tokenId.toString();
      if (!map.has(key)) {
        map.set(key, skill);
      }
    });
    return Array.from(map.values());
  }, [skills]);

  const inspiration = useMemo(() => curatedSkills.slice(0, 6), [curatedSkills]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
  };

  return (
    <div className="min-h-screen bg-base-200">
      <header className="border-b border-base-300 bg-base-100/60 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">MetaSkill</h1>
            <p className="text-sm opacity-70">去中心化 AI 技能市场</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setLanguage(prev => (prev === "zh" ? "en" : "zh"))}
              type="button"
            >
              <LanguageIcon className="w-4 h-4" />
              <span>{language === "zh" ? "中文" : "English"}</span>
            </button>
            <RainbowKitCustomConnectButton />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <section className="text-center space-y-6 mb-12">
          <div className="flex justify-center">
            <span className="badge badge-secondary badge-outline">区块链钱包快速访问</span>
          </div>
          <h2 className="text-4xl font-bold">发现、收藏、交易 AI 技能包</h2>
          <p className="text-base opacity-80 max-w-2xl mx-auto">
            MetaSkill 让每个创作者把 AI 能力资产化，用户可以随时浏览灵感广场，搜索想要的技能包，或通过链上交易快速获取。
          </p>

        </section>

        <section className="mb-16">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-semibold">灵感广场</h3>
            <button className="btn btn-link" type="button" onClick={() => router.push("/skills/market")}>前往市场</button>
          </div>
          {loading && skills.length === 0 ? (
            <div className="flex justify-center py-16">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : inspiration.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-base-300 py-16 text-center text-sm opacity-70">
              还没有技能被发布，快去创建一个吧~
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {inspiration.map(skill => (
                <SkillCard
                  key={skill.tokenId.toString()}
                  skill={skill}
                  href={`/skills/${skill.tokenId.toString()}`}
                  isFavorite={isFavorite(skill.tokenId)}
                  onToggleFavorite={() => toggleFavorite(skill.tokenId)}
                />
              ))}
            </div>
          )}
        </section>

        <section className="mb-16">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-2xl font-semibold">SkillChain 功能中心</h3>
              <p className="text-sm opacity-70 mt-1">在这里管理技能包的全流程：创建、上链、浏览、交易与收藏</p>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div
              className="card bg-base-100 shadow hover:shadow-lg transition cursor-pointer"
              role="button"
              tabIndex={0}
              onClick={() => router.push("/skills/create")}
              onKeyDown={e => {
                if (e.key === "Enter" || e.key === " ") router.push("/skills/create");
              }}
            >
              <div className="card-body">
                <h4 className="card-title text-lg">创建技能包</h4>
                <p className="text-sm opacity-70">上传技能说明与资源并设置价格，铸造为链上 NFT。</p>
                <button
                  className="btn btn-primary btn-sm mt-4"
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    console.log("创建技能包按钮被点击");
                    router.push("/skills/create");
                  }}
                >
                  立即创建
                </button>
              </div>
            </div>
            <div className="card bg-base-100 shadow hover:shadow-lg transition">
              <div className="card-body">
                <h4 className="card-title text-lg">浏览市场</h4>
                <p className="text-sm opacity-70">逛逛灵感广场，快速收藏或购买热门技能包。</p>
                <button className="btn btn-secondary btn-sm mt-4" type="button" onClick={() => router.push("/skills/market")}>进入市场</button>
              </div>
            </div>
            <div className="card bg-base-100 shadow hover:shadow-lg transition">
              <div className="card-body">
                <h4 className="card-title text-lg">技能搜索</h4>
                <p className="text-sm opacity-70">按关键词、热度或价格排序，精准定位你想要的技能。</p>
                <button className="btn btn-outline btn-sm mt-4" type="button" onClick={() => router.push("/search")}>开始搜索</button>
              </div>
            </div>
            <div className="card bg-base-100 shadow hover:shadow-lg transition">
              <div className="card-body">
                <h4 className="card-title text-lg">个人主页</h4>
                <p className="text-sm opacity-70">管理你的创作、收藏与购买记录，打造链上名片。</p>
                <button className="btn btn-outline btn-sm mt-4" type="button" onClick={() => router.push("/profile")}>查看主页</button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-base-300 bg-base-100/70 mt-16">
        <div className="max-w-6xl mx-auto px-6 py-6 text-sm flex flex-col md:flex-row items-center justify-between gap-3">
          <span>© {new Date().getFullYear()} SkillChain. All rights reserved.</span>
          <span className="opacity-70">当前登录：{address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "未连接"}</span>
        </div>
      </footer>
    </div>
  );
};

export default Home;
