"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { BookOpenIcon, HeartIcon } from "@heroicons/react/24/outline";
import { Address, BlockieAvatar, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useSkillFavorites } from "~~/hooks/useSkillFavorites";
import { SkillItem, useSkillsData } from "~~/hooks/useSkillsData";

const formatPrice = (value: number) => {
  if (!value) return "Free";
  const precision = value >= 1 ? 3 : 4;
  const trimmed = Number(value.toFixed(precision)).toString();
  return `${trimmed} ETH`;
};

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

  const favourites = useMemo(() => {
    const map = new Map(skills.map(skill => [skill.tokenId.toString(), skill]));
    return favoriteIds
      .map(id => map.get(id))
      .filter((item): item is SkillItem => !!item);
  }, [skills, favoriteIds]);

  if (!address) {
    return (
      <div className="min-h-screen bg-base-200 flex flex-col items-center justify-center gap-6">
        <h1 className="text-3xl font-bold">Connect your wallet</h1>
        <p className="text-sm opacity-70">Your wallet address becomes your SkillChain profile.</p>
        <RainbowKitCustomConnectButton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200">
      <header className="border-b border-base-300 bg-base-100/70 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">My profile</h1>
            <p className="text-sm opacity-70">Manage created, collected and favourite skills.</p>
          </div>
          <RainbowKitCustomConnectButton />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        <section className="bg-base-100 rounded-3xl shadow p-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <BlockieAvatar address={address} size={64} />
            <div>
              <h2 className="text-2xl font-semibold">Welcome back</h2>
              <Address address={address} format="short" />
              <p className="text-sm opacity-70">Showcase your on-chain skills and collections.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/skills/create" className="btn btn-primary btn-sm">
              Create a skill
            </Link>
            <Link href="/skills/market" className="btn btn-outline btn-sm">
              Browse marketplace
            </Link>
            <button className="btn btn-ghost btn-sm" type="button" onClick={clearFavorites}>
              Clear favourites
            </button>
          </div>
        </section>

        <SectionBlock
          title="Created skills"
          subtitle="Everything you have published on-chain"
          emptyText="You have not published any skills yet."
          loading={loading}
          skills={uploads}
          isFavorite={isFavorite}
          toggleFavorite={toggleFavorite}
        />

        <SectionBlock
          title="Favourites"
          subtitle="Quick access to skills you liked"
          emptyText="You have not favourited any skills yet."
          loading={loading}
          skills={favourites}
          isFavorite={isFavorite}
          toggleFavorite={toggleFavorite}
        />

        <SectionBlock
          title="Purchased"
          subtitle="Skills currently owned by your wallet"
          emptyText="No purchases yet. Visit the marketplace to get started."
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
          {skills.map(skill => (
            <article key={skill.tokenId.toString()} className="card bg-base-200/60 border border-base-300">
              <Link href={`/skills/${skill.tokenId.toString()}`} className="block">
                <figure className="h-40 overflow-hidden bg-base-200">
                  {skill.metadata?.mediaUrl ? (
                    skill.metadata.mediaUrl.startsWith("data:video") || skill.metadata.mediaUrl.includes(".mp4") ? (
                      <video src={skill.metadata.mediaUrl} className="w-full h-full object-cover" autoPlay loop muted />
                    ) : (
                      <img src={skill.metadata.mediaUrl} alt={skill.metadata?.name ?? "Skill preview"} className="w-full h-full object-cover" />
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs opacity-60">No preview</div>
                  )}
                </figure>
              </Link>
              <div className="card-body gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="card-title text-base">{skill.metadata?.name ?? `Skill #${skill.tokenId.toString()}`}</h4>
                    <p className="text-xs opacity-70 line-clamp-2">
                      {skill.metadata?.description ?? "Creator has not provided extra details."}
                    </p>
                  </div>
                  <button
                    className={`btn btn-ghost btn-xs ${isFavorite(skill.tokenId) ? "text-error" : ""}`}
                    onClick={() => toggleFavorite(skill.tokenId)}
                    type="button"
                    aria-label="Toggle favourite"
                  >
                    <HeartIcon className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between text-xs opacity-70">
                  <span>Creator: {`${skill.creator.slice(0, 6)}...${skill.creator.slice(-4)}`}</span>
                  <span>Owner: {`${skill.owner.slice(0, 6)}...${skill.owner.slice(-4)}`}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`badge ${skill.listed ? "badge-primary" : "badge-ghost"}`}>
                    {skill.listed ? formatPrice(skill.priceEth) : "Not listed"}
                  </span>
                  <Link href={`/skills/${skill.tokenId.toString()}`} className="btn btn-link btn-xs">
                    View details
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default ProfilePage;

