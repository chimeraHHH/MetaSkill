"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { NextPage } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { formatEther } from "viem";
import { HeartIcon, Squares2X2Icon } from "@heroicons/react/24/outline";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useSkillFavorites } from "~~/hooks/useSkillFavorites";
import { SkillItem, useSkillsData } from "~~/hooks/useSkillsData";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

type SortOption = "relevance" | "popular" | "latest" | "priceLow" | "priceHigh";

const sortSkills = (skills: SkillItem[], sort: SortOption) => {
  const sorted = [...skills];
  switch (sort) {
    case "popular":
      return sorted.sort((a, b) => {
        const listedDiff = Number(b.listed) - Number(a.listed);
        if (listedDiff !== 0) return listedDiff;
        return Number(b.price - a.price);
      });
    case "latest":
      return sorted.sort((a, b) => Number(b.tokenId - a.tokenId));
    case "priceLow":
      return sorted.sort((a, b) => Number(a.price - b.price));
    case "priceHigh":
      return sorted.sort((a, b) => Number(b.price - a.price));
    case "relevance":
    default:
      return sorted;
  }
};

const SearchPage: NextPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams?.get("q") ?? "";
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [sortOption, setSortOption] = useState<SortOption>("relevance");
  const { skills, loading, refresh } = useSkillsData();
  const { isFavorite, toggleFavorite } = useSkillFavorites();
  const { writeContractAsync, isPending } = useScaffoldWriteContract("SkillNFT");

  const normalizedKeyword = (initialQuery || "").trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!normalizedKeyword) return skills;
    return skills.filter(skill => {
      const metadata = skill.metadata;
      const name = metadata?.name?.toLowerCase() ?? "";
      const description = metadata?.description?.toLowerCase() ?? "";
      const license = metadata?.license?.toLowerCase() ?? "";
      const creatorMatch = skill.creator.toLowerCase().includes(normalizedKeyword);
      return (
        name.includes(normalizedKeyword) ||
        description.includes(normalizedKeyword) ||
        license.includes(normalizedKeyword) ||
        creatorMatch
      );
    });
  }, [skills, normalizedKeyword]);

  const displayed = useMemo(() => sortSkills(filtered, sortOption), [filtered, sortOption]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
  };

  const quickBuy = async (skill: SkillItem) => {
    if (!skill.listed || skill.price <= 0n) {
      notification.info("该技能包暂未上架或为免费资源");
      return;
    }
    try {
      const tx = await writeContractAsync({
        functionName: "purchaseSkill",
        args: [skill.tokenId],
        value: skill.price,
      });
      notification.success(`交易已提交：${tx}`);
      refresh();
    } catch (error: any) {
      notification.error(error?.shortMessage ?? error?.message ?? "购买失败");
    }
  };

  return (
    <div className="min-h-screen bg-base-200">
      <header className="border-b border-base-300 bg-base-100/60 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">技能搜索</h1>
            <p className="text-sm opacity-70">快速找到合适的技能包并完成链上交易</p>
          </div>
          <RainbowKitCustomConnectButton />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <form onSubmit={handleSearch} className="bg-base-100 rounded-2xl shadow-sm p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div className="flex-1 join">
            <input
              className="input input-bordered join-item w-full"
              placeholder="搜索技能包（例如：DeFi 分析）"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <button className="btn btn-primary join-item" type="submit">
              搜索
            </button>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm opacity-70">排序</label>
            <select
              className="select select-bordered select-sm"
              value={sortOption}
              onChange={e => setSortOption(e.target.value as SortOption)}
            >
              <option value="relevance">相关性</option>
              <option value="popular">最热</option>
              <option value="latest">最新</option>
              <option value="priceLow">价格低到高</option>
              <option value="priceHigh">价格高到低</option>
            </select>
          </div>
        </form>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Squares2X2Icon className="w-5 h-5" />
            <p className="text-sm">
              共找到 <span className="font-semibold">{displayed.length}</span> 个技能包
              {normalizedKeyword ? (
                <span className="opacity-70">（关键词：{normalizedKeyword}）</span>
              ) : (
                <span className="opacity-70">（推荐结果）</span>
              )}
            </p>
          </div>
          <Link href="/skills/market" className="btn btn-link btn-sm">
            浏览全部
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <span className="loading loading-lg loading-spinner" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="bg-base-100 rounded-2xl border border-dashed border-base-300 py-16 text-center">
            <p className="text-base font-medium mb-2">未找到匹配的技能包</p>
            <p className="text-sm opacity-70">试试更换关键词，或者探索灵感广场中的热门技能。</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {displayed.map(skill => {
              const mediaUrl = skill.metadata?.mediaUrl;
              const isVideo = mediaUrl ? mediaUrl.startsWith("data:video") || mediaUrl.includes(".mp4") : false;
              return (
                <div key={skill.tokenId.toString()} className="group card bg-base-100 shadow-md hover:shadow-xl transition">
                  <Link href={`/skills/${skill.tokenId.toString()}`} className="block">
                    <figure className="h-48 overflow-hidden bg-base-200">
                      {mediaUrl ? (
                        isVideo ? (
                          <video src={mediaUrl} className="w-full h-full object-cover" autoPlay loop muted />
                        ) : (
                          <img src={mediaUrl} alt={skill.metadata?.name ?? "Skill preview"} className="w-full h-full object-cover" />
                        )
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm opacity-70">
                          暂无预览
                        </div>
                      )}
                    </figure>
                  </Link>
                  <div className="card-body gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="card-title text-lg">{skill.metadata?.name ?? `Skill #${skill.tokenId.toString()}`}</h3>
                        <p className="text-sm opacity-70 line-clamp-2">
                          {skill.metadata?.description ?? "创作者还没有添加详细介绍。"}
                        </p>
                      </div>
                      <button
                        className={`btn btn-ghost btn-sm ${isFavorite(skill.tokenId) ? "text-error" : ""}`}
                        onClick={() => toggleFavorite(skill.tokenId)}
                        type="button"
                        aria-label="收藏技能包"
                      >
                        <HeartIcon className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="badge badge-primary badge-outline">
                        {skill.listed && skill.price > 0n ? `${formatEther(skill.price)} ETH` : "免费"}
                      </div>
                      <div className="text-xs opacity-60 flex flex-col items-end">
                        <span>创作者</span>
                        <span>{`${skill.creator.slice(0, 6)}...${skill.creator.slice(-4)}`}</span>
                      </div>
                    </div>
                    <button
                      className="btn btn-secondary btn-sm w-full transition group-hover:translate-y-0"
                      type="button"
                      onClick={() => quickBuy(skill)}
                      disabled={isPending}
                    >
                      {isPending ? "处理中..." : "快速购买"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default SearchPage;

