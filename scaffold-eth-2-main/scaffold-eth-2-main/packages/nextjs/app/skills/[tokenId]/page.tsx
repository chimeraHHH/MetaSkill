"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { NextPage } from "next";
import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import { CheckBadgeIcon, HeartIcon, StarIcon } from "@heroicons/react/24/solid";
import { RainbowKitCustomConnectButton, Address, BlockieAvatar } from "~~/components/scaffold-eth";
import { useSkillFavorites } from "~~/hooks/useSkillFavorites";
import { useSkillsData } from "~~/hooks/useSkillsData";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { SAMPLE_SKILLS } from "~~/data/sampleSkills";
import { SkillPreview } from "~~/components/SkillPreview";
import type { SkillItem } from "~~/hooks/useSkillsData";

const SkillDetailPage: NextPage = () => {
  const params = useParams<{ tokenId: string }>();
  const tokenIdParam = params?.tokenId;
  const tokenId = useMemo(() => {
    try {
      return tokenIdParam ? BigInt(tokenIdParam) : undefined;
    } catch {
      return undefined;
    }
  }, [tokenIdParam]);

  const { address } = useAccount();
  const { skills, loading, refresh } = useSkillsData();
  const { isFavorite, toggleFavorite } = useSkillFavorites();
  const { writeContractAsync, isPending } = useScaffoldWriteContract("SkillNFT");

  const curatedSkills = useMemo(() => {
    const map = new Map<string, SkillItem>();
    [...skills, ...SAMPLE_SKILLS].forEach(item => {
      const key = item.tokenId.toString();
      if (!map.has(key)) map.set(key, item);
    });
    return Array.from(map.values());
  }, [skills]);

  const skill = useMemo(() => {
    if (!tokenId) return undefined;
    return curatedSkills.find(item => item.tokenId === tokenId || item.tokenId.toString() === tokenId.toString());
  }, [curatedSkills, tokenId]);

  const mediaUrl = skill?.metadata?.mediaUrl;
  const isVideo = mediaUrl ? mediaUrl.startsWith("data:video") || mediaUrl.includes(".mp4") : false;

  const isOwner = address && skill?.owner?.toLowerCase() === address.toLowerCase();

  const handlePurchase = async () => {
    if (!skill) return;
    if (!skill.listed || skill.price <= 0n) {
      notification.info("该技能包暂未上架");
      return;
    }
    try {
      const tx = await writeContractAsync({ functionName: "purchaseSkill", args: [skill.tokenId], value: skill.price });
      notification.success(`交易已提交：${tx}`);
      refresh();
    } catch (error: any) {
      notification.error(error?.shortMessage ?? error?.message ?? "购买失败");
    }
  };

  if (!tokenIdParam) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold">技能不存在</h1>
          <Link href="/skills/market" className="btn btn-primary">
            返回技能市场
          </Link>
        </div>
      </div>
    );
  }

  if (loading && !skill) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-lg loading-spinner" />
      </div>
    );
  }

  if (!skill) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold">未找到对应技能包</h1>
          <p className="opacity-70">可能已被下架或尚未发布。</p>
          <Link href="/skills/create" className="btn btn-primary">
            我要创建一个
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200">
      <header className="border-b border-base-300 bg-base-100/70 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">技能详情</h1>
            <p className="text-sm opacity-70">掌握全部信息再做决定</p>
          </div>
          <RainbowKitCustomConnectButton />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 grid gap-8 lg:grid-cols-[2fr,1fr]">
        <section className="space-y-6">
          <div className="bg-base-100 rounded-3xl overflow-hidden shadow">
            <div className="aspect-video bg-base-200 flex items-center justify-center">
              {mediaUrl ? (
                isVideo ? (
                  <video src={mediaUrl} controls className="w-full h-full object-cover" />
                ) : (
                  <img src={mediaUrl} alt={skill.metadata?.name ?? "Skill preview"} className="w-full h-full object-cover" />
                )
              ) : (
                <div className="text-center text-sm opacity-60">暂无预览媒体</div>
              )}
            </div>
            <div className="p-6 space-y-3">
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-semibold">{skill.metadata?.name ?? `Skill #${skill.tokenId.toString()}`}</h2>
                <button
                  className={`btn btn-sm ${isFavorite(skill.tokenId) ? "btn-error" : "btn-outline"}`}
                  onClick={() => toggleFavorite(skill.tokenId)}
                  type="button"
                >
                  <HeartIcon className="w-4 h-4" /> 收藏
                </button>
              </div>
              <p className="text-base opacity-80 leading-relaxed">
                {skill.metadata?.description ?? "创作者暂未提供详细介绍。"}
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="badge badge-outline">许可证：{skill.metadata?.license ?? "未注明"}</span>
                {skill.metadata?.createdAt && <span className="badge badge-outline">创建时间：{new Date(skill.metadata.createdAt).toLocaleString()}</span>}
              </div>
            </div>
          </div>

          {skill.metadata?.claude && (
            <div className="bg-base-100 rounded-2xl shadow p-6">
              <SkillPreview metadata={skill.metadata.claude} rawContent={skill.metadata.rawContent} />
            </div>
          )}

          {skill.metadata?.skill?.base64 && skill.metadata.skill.type && (
            <div className="bg-base-100 rounded-2xl shadow p-6 space-y-3">
              <h3 className="text-xl font-semibold">技能资源</h3>
              <p className="text-sm opacity-70">创作者上传的原始技能文件，可下载离线保存。</p>
              <a
                className="btn btn-outline btn-sm"
                href={`data:${skill.metadata.skill.type};base64,${skill.metadata.skill.base64}`}
                download={skill.metadata.skill.name ?? `skill-${skill.tokenId.toString()}`}
              >
                下载技能文件
              </a>
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <div className="bg-base-100 rounded-3xl shadow p-6 space-y-4">
            <div className="flex items-center gap-3">
              {skill.isDemo ? (
                <div className="w-12 h-12 rounded-full bg-base-200 flex items-center justify-center text-xs">DEMO</div>
              ) : (
                <BlockieAvatar address={skill.creator} size={48} />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">创作者</h3>
                  <CheckBadgeIcon className="w-5 h-5 text-primary" />
                </div>
                {skill.isDemo ? (
                  <span className="text-sm">Demo Creator</span>
                ) : (
                  <Address address={skill.creator} format="short" />
                )}
                <p className="text-xs opacity-70">链上发布者，信誉良好</p>
              </div>
            </div>
            <div className="bg-base-200 rounded-2xl p-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>当前持有人</span>
                {skill.isDemo ? (
                  <span>Demo Owner</span>
                ) : (
                  <Address address={skill.owner} format="short" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span>Token ID</span>
                <span>#{skill.tokenId.toString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>状态</span>
                <span className={skill.listed ? "text-success" : "opacity-70"}>{skill.listed ? "在售" : "未上架"}</span>
              </div>
            </div>

            <div className="space-y-3">
              {skill.isDemo ? (
                <div className="bg-base-200 rounded-2xl p-4 text-sm opacity-80">
                  此为演示技能包，前端展示内容与 Claude Skills 对齐，暂无链上购买功能。
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold">
                    {skill.listed && skill.price > 0n ? `${formatEther(skill.price)} ETH` : "免费"}
                  </div>
                  <button
                    className="btn btn-primary w-full"
                    type="button"
                    disabled={isPending || isOwner || !skill.listed || skill.price <= 0n}
                    onClick={handlePurchase}
                  >
                    {isOwner ? "你已拥有" : isPending ? "处理中..." : skill.listed && skill.price > 0n ? "立即购买" : "等待上架"}
                  </button>
                  <div className="flex items-center justify-between text-xs opacity-70">
                    <span>加入收藏</span>
                    <span>已有 {isFavorite(skill.tokenId) ? "1" : "0"} 人收藏</span>
                  </div>
                  <div className="flex items-center justify-between text-xs opacity-70">
                    <span>评分</span>
                    <button className="btn btn-xs" type="button" disabled>
                      <StarIcon className="w-4 h-4" /> 即将开放
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="bg-base-100 rounded-2xl shadow p-6 space-y-4 text-sm opacity-80">
            <h4 className="text-base font-semibold">交易提醒</h4>
            <ul className="list-disc list-inside space-y-2">
              <li>所有交易将通过连接的钱包签名并上链执行。</li>
              <li>MetaSkill 不收取额外手续费，款项直接进入创作者账户。</li>
              <li>购买后可在「个人主页 - 购买记录」中随时查看。</li>
            </ul>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default SkillDetailPage;

