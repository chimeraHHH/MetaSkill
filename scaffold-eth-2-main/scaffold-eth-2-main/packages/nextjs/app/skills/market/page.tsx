"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { TagIcon } from "@heroicons/react/24/outline";
import { EtherInput, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useSkillFavorites } from "~~/hooks/useSkillFavorites";
import { SkillItem, useSkillsData } from "~~/hooks/useSkillsData";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

const formatPrice = (value: number) => {
  if (!value) return "Free";
  const precision = value >= 1 ? 3 : 4;
  const trimmed = Number(value.toFixed(precision)).toString();
  return `${trimmed} ETH`;
};

const MarketPage: NextPage = () => {
  const { address } = useAccount();
  const { skills, loading, refresh } = useSkillsData();
  const { isFavorite, toggleFavorite } = useSkillFavorites();
  const { writeContractAsync, isPending } = useScaffoldWriteContract("SkillNFT");
  const [showListedOnly, setShowListedOnly] = useState(false);

  const filtered = useMemo(() => {
    if (!showListedOnly) return skills;
    return skills.filter(skill => skill.listed && skill.price > 0n);
  }, [skills, showListedOnly]);

  const handlePurchase = async (skill: SkillItem) => {
    if (!skill.listed || skill.price <= 0n) {
      notification.info("This skill is not listed right now");
      return;
    }
    try {
      const tx = await writeContractAsync({ functionName: "purchaseSkill", args: [skill.tokenId], value: skill.price });
      notification.success(`Transaction submitted: ${tx}`);
      refresh();
    } catch (error: any) {
      notification.error(error?.shortMessage ?? error?.message ?? "Purchase failed");
    }
  };

  const handleList = async (tokenId: bigint, etherPrice: string) => {
    try {
      const [whole, frac = ""] = etherPrice.split(".");
      const fracPadded = (frac + "000000000000000000").slice(0, 18);
      const wei = BigInt(whole || "0") * 10n ** 18n + BigInt(fracPadded || "0");
      const tx = await writeContractAsync({ functionName: "listSkill", args: [tokenId, wei] });
      notification.success(`Listing transaction submitted: ${tx}`);
      refresh();
    } catch (error: any) {
      notification.error(error?.shortMessage ?? error?.message ?? "Listing failed");
    }
  };

  const handleUnlist = async (tokenId: bigint) => {
    try {
      const tx = await writeContractAsync({ functionName: "unlistSkill", args: [tokenId] });
      notification.success(`Unlist transaction submitted: ${tx}`);
      refresh();
    } catch (error: any) {
      notification.error(error?.shortMessage ?? error?.message ?? "Unlist failed");
    }
  };

  return (
    <div className="min-h-screen bg-base-200">
      <header className="border-b border-base-300 bg-base-100/70 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Skill marketplace</h1>
            <p className="text-sm opacity-70">Browse, collect and trade on-chain skills.</p>
          </div>
          <RainbowKitCustomConnectButton />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="bg-base-100 rounded-2xl shadow-sm p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xl font-semibold mb-1">On-chain trading hub</h2>
            <p className="text-sm opacity-70">Collect favourites, buy instantly and let creators set the price.</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="label cursor-pointer gap-2">
              <span className="label-text">Only listed</span>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={showListedOnly}
                onChange={event => setShowListedOnly(event.target.checked)}
              />
            </label>
            <Link href="/search" className="btn btn-outline btn-sm">
              Advanced search
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <span className="loading loading-lg loading-spinner" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-base-100 border border-dashed border-base-300 rounded-2xl py-16 text-center">
            <p className="text-base font-medium mb-2">No skills found</p>
            <p className="text-sm opacity-70">Create a new skill or adjust your filters.</p>
            <Link href="/skills/create" className="btn btn-primary btn-sm mt-4">
              Create a skill
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map(skill => {
              const mediaUrl = skill.metadata?.mediaUrl;
              const isVideo = mediaUrl ? mediaUrl.startsWith("data:video") || mediaUrl.includes(".mp4") : false;
              const isOwner = address && skill.owner?.toLowerCase() === address.toLowerCase();
              const isCreator = address && skill.creator?.toLowerCase() === address.toLowerCase();
              return (
                <article key={skill.tokenId.toString()} className="card bg-base-100 shadow-md hover:shadow-xl transition">
                  <figure className="h-48 overflow-hidden bg-base-200">
                    <Link href={`/skills/${skill.tokenId.toString()}`} className="block w-full h-full">
                      {mediaUrl ? (
                        isVideo ? (
                          <video src={mediaUrl} className="w-full h-full object-cover" autoPlay loop muted />
                        ) : (
                          <img src={mediaUrl} alt={skill.metadata?.name ?? "Skill preview"} className="w-full h-full object-cover" />
                        )
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-sm opacity-70">
                          <TagIcon className="w-8 h-8" />
                          No preview
                        </div>
                      )}
                    </Link>
                  </figure>
                  <div className="card-body gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="card-title text-lg">{skill.metadata?.name ?? `Skill #${skill.tokenId.toString()}`}</h3>
                        <p className="text-sm opacity-70 line-clamp-2">
                          {skill.metadata?.description ?? "Creator has not provided a description yet."}
                        </p>
                      </div>
                      <button
                        className={`btn btn-ghost btn-sm ${isFavorite(skill.tokenId) ? "text-error" : ""}`}
                        onClick={() => toggleFavorite(skill.tokenId)}
                        type="button"
                        aria-label="Toggle favourite"
                      >
                        ❤
                      </button>
                    </div>

                    {skill.tags?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {skill.tags.slice(0, 4).map(tag => (
                          <span key={tag} className="badge badge-ghost badge-sm">#{tag}</span>
                        ))}
                      </div>
                    ) : null}

                    <div className="flex items-center justify-between text-xs opacity-70">
                      <span>Creator: {`${skill.creator.slice(0, 6)}...${skill.creator.slice(-4)}`}</span>
                      <span>Owner: {`${skill.owner.slice(0, 6)}...${skill.owner.slice(-4)}`}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className={`badge ${skill.listed ? "badge-primary" : "badge-ghost"}`}>
                        {skill.listed ? formatPrice(skill.priceEth) : "Not listed"}
                      </div>
                      <Link href={`/skills/${skill.tokenId.toString()}`} className="btn btn-link btn-xs">
                        View details
                      </Link>
                    </div>

                    {isOwner ? (
                      skill.listed ? (
                        <button className="btn btn-warning btn-sm" type="button" disabled={isPending} onClick={() => handleUnlist(skill.tokenId)}>
                          {isPending ? "Processing..." : "Unlist"}
                        </button>
                      ) : (
                        <ListControl tokenId={skill.tokenId} onList={handleList} disabled={isPending} />
                      )
                    ) : (
                      <button
                        className="btn btn-secondary btn-sm"
                        type="button"
                        disabled={isPending || !skill.listed || skill.price <= 0n}
                        onClick={() => handlePurchase(skill)}
                      >
                        {isPending ? "Processing..." : skill.listed && skill.price > 0n ? "Buy now" : "Awaiting listing"}
                      </button>
                    )}

                    {isCreator && !isOwner && (
                      <p className="text-[10px] text-info mt-1">Note: you created this skill but it is owned by another account.</p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

const ListControl = ({ tokenId, onList, disabled }: { tokenId: bigint; onList: (id: bigint, price: string) => void; disabled?: boolean }) => {
  const [value, setValue] = useState("0.05");
  return (
    <div className="flex items-center gap-3">
      <div className="w-40">
        <EtherInput name="listPrice" value={value} onChange={setValue} placeholder="0.00" />
      </div>
      <button className="btn btn-primary btn-sm" type="button" disabled={disabled} onClick={() => onList(tokenId, value)}>
        {disabled ? "Processing" : "List"}
      </button>
    </div>
  );
};

export default MarketPage;

