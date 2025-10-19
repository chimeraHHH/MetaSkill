"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import { BookOpenIcon, HeartIcon } from "@heroicons/react/24/outline";
import { Address, BlockieAvatar, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useSkillFavorites } from "~~/hooks/useSkillFavorites";
import { SkillItem, useSkillsData } from "~~/hooks/useSkillsData";

const ProfilePage: NextPage = () => {
  const { address } = useAccount();
  const { skills, loading } = useSkillsData();
  const { favoriteIds, isFavorite, toggleFavorite, clearFavorites } = useSkillFavorites();

  const uploads = useMemo(() => {
    if (!address) return [] as SkillItem[];
    return skills.filter(skill => skill.creator?.toLowerCase() === address.toLowerCase());
  }, [skills, address]);

  const purchases = useMemo(() => {
    if (!address) return [] as SkillItem[];
    return skills.filter(skill => skill.owner?.toLowerCase() === address.toLowerCase());
  }, [skills, address]);

  const favorites = useMemo(() => {
    const map = new Map(skills.map(skill => [skill.tokenId.toString(), skill]));
    return favoriteIds
      .map(id => map.get(id))
      .filter((item): item is SkillItem => !!item);
  }, [favoriteIds, skills]);

  if (!address) {
    return (
      <div className="min-h-screen bg-base-200 flex flex-col items-center justify-center gap-6">
        <h1 className="text-3xl font-bold">连接钱包以查看个人主页</h1>
        <p className="text-sm opacity-70">SkillChain 通过钱包地址识别你的创作、收藏与购买记录。</p>
        <RainbowKitCustomConnectButton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200">
      <header className="border-b border-base-300 bg-base-100/70 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">我的主页</h1>
            <p className="text-sm opacity-70">管理创作、收藏与购买记录</p>
          </div>
          <RainbowKitCustomConnectButton />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        <section className="bg-base-100 rounded-3xl shadow p-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <BlockieAvatar address={address} size={64} />
            <div>
              <h2 className="text-2xl font-semibold">欢迎回到 SkillChain</h2>
              <Address address={address} format="short" />
              <p className="text-sm opacity-70">展示你的技能资产与收藏作品，打造链上名片。</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/skills/create" className="btn btn-primary btn-sm">
              上传技能包
            </Link>
            <Link href="/skills/market" className="btn btn-outline btn-sm">
              浏览市场
            </Link>
            <button className="btn btn-ghost btn-sm" type="button" onClick={clearFavorites}>
              清空收藏
            </button>
          </div>
        </section>

        <SectionBlock
          title="我的上传"
          subtitle="展示你发布到链上的技能包，随时查看持有人与售价"
          emptyText="还没有上传技能，快去发布第一个吧！"
          loading={loading}
          skills={uploads}
          isFavorite={isFavorite}
          toggleFavorite={toggleFavorite}
        />

        <SectionBlock
          title="我的收藏"
          subtitle="你标记为收藏的技能包，会在这里快速找到"
          emptyText="收藏夹还是空的，去灵感广场看看吧~"
          loading={loading}
          skills={favorites}
          isFavorite={isFavorite}
          toggleFavorite={toggleFavorite}
        />

        <SectionBlock
          title="我的购买"
          subtitle="你已经购买的技能包，可随时下载资源或再次转售"
          emptyText="还未购买任何技能，去市场逛逛~"
          loading={loading}
          skills={purchases}
          isFavorite={isFavorite}
          toggleFavorite={toggleFavorite}
        />
      </main>
    </div>
  );
};

type SectionBlockProps = {
  title: string;
  subtitle: string;
  emptyText: string;
  loading: boolean;
  skills: SkillItem[];
  isFavorite: (tokenId: bigint | string) => boolean;
  toggleFavorite: (tokenId: bigint | string) => void;
};

const SectionBlock = ({ title, subtitle, emptyText, loading, skills, isFavorite, toggleFavorite }: SectionBlockProps) => {
  return (
    <section className="bg-base-100 rounded-3xl shadow p-7 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold">{title}</h3>
          <p className="text-sm opacity-70">{subtitle}</p>
        </div>
        <BookOpenIcon className="w-6 h-6 opacity-40" />
      </div>
      {loading ? (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-md" />
        </div>
      ) : skills.length === 0 ? (
        <div className="py-10 text-center text-sm opacity-70">{emptyText}</div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {skills.map(skill => {
            const mediaUrl = skill.metadata?.mediaUrl;
            const isVideo = mediaUrl ? mediaUrl.startsWith("data:video") || mediaUrl.includes(".mp4") : false;
            return (
              <article key={skill.tokenId.toString()} className="card bg-base-200/60 border border-base-300">
                <Link href={`/skills/${skill.tokenId.toString()}`} className="block">
                  <figure className="h-40 overflow-hidden bg-base-200">
                    {mediaUrl ? (
                      isVideo ? (
                        <video src={mediaUrl} className="w-full h-full object-cover" autoPlay loop muted />
                      ) : (
                        <img src={mediaUrl} alt={skill.metadata?.name ?? "Skill preview"} className="w-full h-full object-cover" />
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs opacity-60">暂无预览</div>
                    )}
                  </figure>
                </Link>
                <div className="card-body gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="card-title text-base">{skill.metadata?.name ?? `Skill #${skill.tokenId.toString()}`}</h4>
                      <p className="text-xs opacity-70 line-clamp-2">
                        {skill.metadata?.description ?? "暂无描述"}
                      </p>
                    </div>
                    <button
                      className={`btn btn-ghost btn-xs ${isFavorite(skill.tokenId) ? "text-error" : ""}`}
                      onClick={() => toggleFavorite(skill.tokenId)}
                      type="button"
                    >
                      <HeartIcon className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-xs opacity-70">
                    <span>创作者：{`${skill.creator.slice(0, 6)}...${skill.creator.slice(-4)}`}</span>
                    <span>持有人：{`${skill.owner.slice(0, 6)}...${skill.owner.slice(-4)}`}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`badge ${skill.listed ? "badge-primary" : "badge-ghost"}`}>
                      {skill.listed && skill.price > 0n ? `${formatEther(skill.price)} ETH` : "未上架"}
                    </span>
                    <Link href={`/skills/${skill.tokenId.toString()}`} className="btn btn-link btn-xs">
                      查看详情
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default ProfilePage;

