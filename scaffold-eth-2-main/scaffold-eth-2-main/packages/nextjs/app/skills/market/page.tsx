"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { TagIcon } from "@heroicons/react/24/outline";
import { EtherInput, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useSkillFavorites } from "~~/hooks/useSkillFavorites";
import { SkillItem, useSkillsData } from "~~/hooks/useSkillsData";
import { SkillCard } from "~~/components/SkillCard";
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
              const isOwner = address && skill.owner?.toLowerCase() === address.toLowerCase();
              const isCreator = address && skill.creator?.toLowerCase() === address.toLowerCase();
              return (
                <SkillCard
                  key={skill.tokenId.toString()}
                  skill={skill}
                  href={`/skills/${skill.tokenId.toString()}`}
                  isFavorite={isFavorite(skill.tokenId)}
                  onToggleFavorite={() => toggleFavorite(skill.tokenId)}
                  showCreator={true}
                  showPrice={true}
                  extra={(
                    <div className="space-y-2">
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
                  )}
                />
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

