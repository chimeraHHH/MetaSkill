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

const Home: NextPage = () => {
  const router = useRouter();
  const { address } = useAccount();
  const [searchTerm, setSearchTerm] = useState("");
  const [language, setLanguage] = useState<"zh" | "en">("zh");
  const { skills, loading } = useSkillsData();
  const { isFavorite, toggleFavorite } = useSkillFavorites();

  const inspiration = useMemo(() => skills.slice(0, 6), [skills]);

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
          <form onSubmit={handleSearch} className="max-w-3xl mx-auto flex gap-3">
            <div className="flex-1 join">
              <span className="join-item btn btn-square btn-ghost pointer-events-none">
                <MagnifyingGlassIcon className="w-5 h-5" />
              </span>
              <input
                className="input input-bordered join-item w-full"
                placeholder="搜索 Meta Skill"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="btn btn-primary" type="submit">
              开始探索
            </button>
          </form>
        </section>

        <section className="mb-16">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-semibold">灵感广场</h3>
            <button className="btn btn-link" type="button" onClick={() => router.push("/skills/market")}>前往市场</button>
          </div>
          {loading ? (
            <div className="flex justify-center py-16">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : inspiration.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-base-300 py-16 text-center text-sm opacity-70">
              还没有技能被发布，快去创建一个吧~
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {inspiration.map(skill => {
                const mediaUrl = skill.metadata?.mediaUrl;
                const isVideo = mediaUrl ? mediaUrl.startsWith("data:video") || mediaUrl.includes(".mp4") : false;
                return (
                  <article
                    key={skill.tokenId.toString()}
                    className="card bg-base-100 shadow hover:shadow-xl transition cursor-pointer"
                    onClick={() => router.push(`/skills/${skill.tokenId.toString()}`)}
                  >
                  <figure className="h-48 overflow-hidden bg-base-200">
                    {mediaUrl ? (
                      isVideo ? (
                        <video src={mediaUrl} className="w-full h-full object-cover" autoPlay loop muted />
                      ) : (
                        <img src={mediaUrl} alt={skill.metadata?.name ?? "Skill preview"} className="w-full h-full object-cover" />
                      )
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-sm opacity-70">
                        <PlayIcon className="w-10 h-10" />
                        暂无预览
                      </div>
                    )}
                  </figure>
                  <div className="card-body gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="card-title text-lg">{skill.metadata?.name ?? `Skill #${skill.tokenId.toString()}`}</h4>
                        <p className="text-sm opacity-70 line-clamp-2">
                          {skill.metadata?.description ?? "创作者还没有添加描述。"}
                        </p>
                      </div>
                      <button
                        className={`btn btn-ghost btn-sm ${isFavorite(skill.tokenId) ? "text-error" : ""}`}
                        onClick={event => {
                          event.stopPropagation();
                          toggleFavorite(skill.tokenId);
                        }}
                        type="button"
                        aria-label="收藏技能包"
                      >
                        <HeartIcon className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="badge badge-outline">
                        {skill.listed && skill.price > 0n ? `${formatEther(skill.price)} ETH` : "自由体验"}
                      </div>
                      <div className="flex items-center gap-2 text-xs opacity-70">
                        <BookmarkIcon className="w-4 h-4" />
                        <span>创作者：{`${skill.creator.slice(0, 6)}...${skill.creator.slice(-4)}`}</span>
                      </div>
                    </div>
                  </div>
                </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h4 className="card-title">创建者中心</h4>
              <p className="text-sm opacity-80">把你的 AI 技能打包上链，立即开放售卖或免费分享，让更多人看到你的创意。</p>
              <button className="btn btn-primary btn-sm" type="button" onClick={() => router.push("/skills/create")}>上传技能包</button>
            </div>
          </div>
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h4 className="card-title">灵感探索</h4>
              <p className="text-sm opacity-80">逛逛灵感广场或搜索关键词，系统会自动推荐与你兴趣相关的技能包。</p>
              <button className="btn btn-outline btn-sm" type="button" onClick={() => router.push("/search")}>试一试搜索</button>
            </div>
          </div>
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h4 className="card-title">个人主页</h4>
              <p className="text-sm opacity-80">管理你的创作、收藏与购买记录，构建独一无二的区块链名片。</p>
              <button className="btn btn-outline btn-sm" type="button" onClick={() => router.push("/profile")}>前往主页</button>
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
