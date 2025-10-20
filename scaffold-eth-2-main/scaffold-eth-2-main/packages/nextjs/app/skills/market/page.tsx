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
import { SAMPLE_SKILLS } from "~~/data/sampleSkills";
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

  const filtered = useMemo(() => curatedSkills.slice(0, 6), [curatedSkills]);

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
            <div className="flex items-center gap-3 mb-6">
          <img src="/logo.svg" alt="MetaSkill" className="h-28 w-auto" />
          <span className="text-2xl font-bold">灵感广场</span>
        </div>
          </div>
          <RainbowKitCustomConnectButton />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">


        {loading ? (
          <div className="flex justify-center py-20">
            <span className="loading loading-lg loading-spinner" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-base-300 py-16 text-center text-sm opacity-70">
            还没有技能被发布，快去创建一个吧~
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

