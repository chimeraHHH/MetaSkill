"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { NextPage } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { HeartIcon, Squares2X2Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useSkillFavorites } from "~~/hooks/useSkillFavorites";
import { useSearchHistory } from "~~/hooks/useSearchHistory";
import { SkillItem, useSkillsData } from "~~/hooks/useSkillsData";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

const CATEGORY_LABELS: Record<string, string> = {
  tools: "Tools",
  creative: "Creative",
  analytics: "Analytics",
  assistant: "Assistant",
  education: "Education",
  entertainment: "Entertainment",
  others: "Others",
};

type SortOption = "relevance" | "popular" | "priceLow" | "priceHigh" | "createdNewest" | "createdOldest";
type StatusFilter = "all" | "listed" | "unlisted";

const formatPrice = (value: number) => {
  if (!value) return "Free";
  const precision = value >= 1 ? 3 : 4;
  const trimmed = Number(value.toFixed(precision)).toString();
  return `${trimmed} ETH`;
};

const sortSkills = (skills: SkillItem[], sort: SortOption) => {
  if (sort === "relevance") {
    return skills;
  }
  const sorted = [...skills];
  switch (sort) {
    case "popular":
      return sorted.sort((a, b) => b.popularityScore - a.popularityScore);
    case "priceLow":
      return sorted.sort((a, b) => a.priceEth - b.priceEth);
    case "priceHigh":
      return sorted.sort((a, b) => b.priceEth - a.priceEth);
    case "createdNewest":
      return sorted.sort((a, b) => {
        const aTs = a.createdTimestamp ?? 0;
        const bTs = b.createdTimestamp ?? 0;
        if (aTs === bTs) {
          return Number(b.tokenId - a.tokenId);
        }
        return bTs - aTs;
      });
    case "createdOldest":
      return sorted.sort((a, b) => {
        const aTs = a.createdTimestamp ?? 0;
        const bTs = b.createdTimestamp ?? 0;
        if (aTs === bTs) {
          return Number(a.tokenId - b.tokenId);
        }
        return aTs - bTs;
      });
    default:
      return sorted;
  }
};

const matchesSearchTerms = (skill: SkillItem, terms: string[]) => {
  if (terms.length === 0) return true;
  const parts: string[] = [];
  if (skill.metadata?.name) parts.push(skill.metadata.name);
  if (skill.metadata?.description) parts.push(skill.metadata.description);
  if (skill.metadata?.license) parts.push(skill.metadata.license);
  if (skill.category) parts.push(skill.category);
  if (skill.tags?.length) parts.push(skill.tags.join(" "));
  if (skill.keywords?.length) parts.push(skill.keywords.join(" "));
  parts.push(skill.creator);
  const haystack = parts.join(" ").toLowerCase();
  return terms.every(term => haystack.includes(term));
};

const SearchPage: NextPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams?.get("q") ?? "";

  const [searchTerm, setSearchTerm] = useState(initialQuery.trim());
  const [sortOption, setSortOption] = useState<SortOption>("relevance");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [createdStart, setCreatedStart] = useState("");
  const [createdEnd, setCreatedEnd] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const { history, addSearchTerm, removeHistoryItem, clearHistory } = useSearchHistory();
  const { skills, loading, refresh, categories } = useSkillsData();
  const { isFavorite, toggleFavorite } = useSkillFavorites();
  const { writeContractAsync, isPending } = useScaffoldWriteContract("SkillNFT");

  useEffect(() => {
    const trimmed = initialQuery.trim();
    setSearchTerm(trimmed);
    if (trimmed) {
      addSearchTerm(trimmed);
    }
  }, [initialQuery, addSearchTerm]);

  const searchTerms = useMemo(
    () =>
      searchTerm
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean),
    [searchTerm],
  );

  const minPriceValue = useMemo(() => {
    const parsed = parseFloat(minPrice);
    return Number.isFinite(parsed) ? parsed : undefined;
  }, [minPrice]);

  const maxPriceValue = useMemo(() => {
    const parsed = parseFloat(maxPrice);
    return Number.isFinite(parsed) ? parsed : undefined;
  }, [maxPrice]);

  const startTimestamp = useMemo(() => {
    if (!createdStart) return undefined;
    const parsed = Date.parse(createdStart);
    return Number.isNaN(parsed) ? undefined : parsed;
  }, [createdStart]);

  const endTimestamp = useMemo(() => {
    if (!createdEnd) return undefined;
    const parsed = Date.parse(createdEnd);
    if (Number.isNaN(parsed)) return undefined;
    return parsed + 24 * 60 * 60 * 1000 - 1;
  }, [createdEnd]);

  const availableCategories = useMemo(() => [...categories].sort((a, b) => a.localeCompare(b)), [categories]);

  const filtered = useMemo(() => {
    return skills.filter(skill => {
      if (!matchesSearchTerms(skill, searchTerms)) return false;

      if (statusFilter === "listed" && !skill.listed) return false;
      if (statusFilter === "unlisted" && skill.listed) return false;

      if (selectedCategories.length > 0) {
        if (!skill.category || !selectedCategories.includes(skill.category)) {
          return false;
        }
      }

      if (minPriceValue !== undefined && skill.priceEth < minPriceValue) return false;
      if (maxPriceValue !== undefined && skill.priceEth > maxPriceValue) return false;

      if (startTimestamp !== undefined) {
        if (!skill.createdTimestamp || skill.createdTimestamp < startTimestamp) {
          return false;
        }
      }

      if (endTimestamp !== undefined) {
        if (!skill.createdTimestamp || skill.createdTimestamp > endTimestamp) {
          return false;
        }
      }

      return true;
    });
  }, [skills, searchTerms, statusFilter, selectedCategories, minPriceValue, maxPriceValue, startTimestamp, endTimestamp]);

  const displayed = useMemo(() => sortSkills(filtered, sortOption), [filtered, sortOption]);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = searchTerm.trim();
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    } else {
      router.push("/search");
    }
  };

  const handleHistorySelect = (term: string) => {
    router.push(`/search?q=${encodeURIComponent(term)}`);
  };

  const toggleCategory = (value: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(value)) {
        return prev.filter(item => item !== value);
      }
      return [...prev, value];
    });
  };

  const resetFilters = () => {
    setMinPrice("");
    setMaxPrice("");
    setSelectedCategories([]);
    setCreatedStart("");
    setCreatedEnd("");
    setStatusFilter("all");
    setSortOption("relevance");
  };

  const quickBuy = async (skill: SkillItem) => {
    if (!skill.listed || skill.price <= 0n) {
      notification.info("This skill is not listed right now");
      return;
    }
    try {
      const tx = await writeContractAsync({
        functionName: "purchaseSkill",
        args: [skill.tokenId],
        value: skill.price,
      });
      notification.success(`Transaction submitted: ${tx}`);
      refresh();
    } catch (error: any) {
      notification.error(error?.shortMessage ?? error?.message ?? "Purchase failed");
    }
  };

  return (
    <div className="min-h-screen bg-base-200">
      <header className="border-b border-base-300 bg-base-100/60 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Skill Search</h1>
            <p className="text-sm opacity-70">Find the right skills and complete on-chain purchases in seconds.</p>
          </div>
          <RainbowKitCustomConnectButton />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-6">
        <form
          onSubmit={handleSearch}
          className="bg-base-100 rounded-2xl shadow-sm p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
        >
          <div className="flex-1 join">
            <input
              className="input input-bordered join-item w-full"
              placeholder="Search skills (e.g. DeFi analytics)"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <button className="btn btn-primary join-item" type="submit">
              Search
            </button>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm opacity-70">Sort</label>
            <select
              className="select select-bordered select-sm"
              value={sortOption}
              onChange={e => setSortOption(e.target.value as SortOption)}
            >
              <option value="relevance">Relevance</option>
              <option value="popular">Popularity</option>
              <option value="priceLow">Price: low to high</option>
              <option value="priceHigh">Price: high to low</option>
              <option value="createdNewest">Newest</option>
              <option value="createdOldest">Oldest</option>
            </select>
          </div>
        </form>

        {history.length > 0 && (
          <div className="bg-base-100 rounded-2xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Recent searches</span>
              <button className="btn btn-ghost btn-xs" type="button" onClick={clearHistory}>
                Clear
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {history.map(term => (
                <div key={term} className="join">
                  <button className="btn btn-outline btn-xs join-item" type="button" onClick={() => handleHistorySelect(term)}>
                    {term}
                  </button>
                  <button className="btn btn-ghost btn-xs join-item" type="button" onClick={() => removeHistoryItem(term)} aria-label={`remove ${term}`}>
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <section className="bg-base-100 rounded-2xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Filters</h2>
            <button className="btn btn-ghost btn-xs" type="button" onClick={resetFilters}>
              Reset
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="form-control">
              <label className="label"><span className="label-text">Min price (ETH)</span></label>
              <input
                className="input input-bordered input-sm"
                type="number"
                min={0}
                step={0.001}
                value={minPrice}
                onChange={e => setMinPrice(e.target.value)}
              />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Max price (ETH)</span></label>
              <input
                className="input input-bordered input-sm"
                type="number"
                min={0}
                step={0.001}
                value={maxPrice}
                onChange={e => setMaxPrice(e.target.value)}
              />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Created from</span></label>
              <input
                className="input input-bordered input-sm"
                type="date"
                value={createdStart}
                onChange={e => setCreatedStart(e.target.value)}
              />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Created to</span></label>
              <input
                className="input input-bordered input-sm"
                type="date"
                value={createdEnd}
                onChange={e => setCreatedEnd(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium">Listing status:</span>
            <div className="join">
              <button
                type="button"
                className={`btn btn-xs join-item ${statusFilter === "all" ? "btn-primary" : "btn-outline"}`}
                onClick={() => setStatusFilter("all")}
              >
                All
              </button>
              <button
                type="button"
                className={`btn btn-xs join-item ${statusFilter === "listed" ? "btn-primary" : "btn-outline"}`}
                onClick={() => setStatusFilter("listed")}
              >
                Listed
              </button>
              <button
                type="button"
                className={`btn btn-xs join-item ${statusFilter === "unlisted" ? "btn-primary" : "btn-outline"}`}
                onClick={() => setStatusFilter("unlisted")}
              >
                Unlisted
              </button>
            </div>
          </div>

          <div>
            <span className="text-sm font-medium">Categories:</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {availableCategories.length === 0 ? (
                <span className="text-xs opacity-60">No categories available yet. Add categories when creating skills.</span>
              ) : (
                availableCategories.map(value => {
                  const checked = selectedCategories.includes(value);
                  return (
                    <button
                      key={value}
                      type="button"
                      className={`btn btn-xs ${checked ? "btn-primary" : "btn-outline"}`}
                      onClick={() => toggleCategory(value)}
                    >
                      {CATEGORY_LABELS[value] ?? value}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </section>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Squares2X2Icon className="w-5 h-5" />
            <p className="text-sm">
              Found <span className="font-semibold">{displayed.length}</span> skills
              {searchTerms.length > 0 ? (
                <span className="opacity-70"> (keywords: {searchTerms.join(", ")})</span>
              ) : (
                <span className="opacity-70"> (recommended)</span>
              )}
            </p>
          </div>
          <Link href="/skills/market" className="btn btn-link btn-sm">
            Browse marketplace
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <span className="loading loading-lg loading-spinner" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="bg-base-100 rounded-2xl border border-dashed border-base-300 py-16 text-center">
            <p className="text-base font-medium mb-2">No skills matched your filters</p>
            <p className="text-sm opacity-70">Try updating the filters or using different keywords.</p>
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
                        <div className="w-full h-full flex items-center justify-center text-sm opacity-70">No preview</div>
                      )}
                    </figure>
                  </Link>
                  <div className="card-body gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="card-title text-lg">{skill.metadata?.name ?? `Skill #${skill.tokenId.toString()}`}</h3>
                          {skill.category && (
                            <span className="badge badge-outline">
                              {CATEGORY_LABELS[skill.category] ?? skill.category}
                            </span>
                          )}
                        </div>
                        <p className="text-sm opacity-70 line-clamp-2">
                          {skill.metadata?.description ?? "Creator has not provided additional details yet."}
                        </p>
                      </div>
                      <button
                        className={`btn btn-ghost btn-sm ${isFavorite(skill.tokenId) ? "text-error" : ""}`}
                        onClick={() => toggleFavorite(skill.tokenId)}
                        type="button"
                        aria-label="Toggle favourite"
                      >
                        <HeartIcon className="w-4 h-4" />
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
                      <span>
                        Created: {skill.createdTimestamp ? new Date(skill.createdTimestamp).toLocaleDateString() : "Unknown"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className={`badge ${skill.listed ? "badge-primary" : "badge-ghost"}`}>
                        {formatPrice(skill.priceEth)}
                      </div>
                      <span className="text-xs opacity-70">{skill.listed ? "Listed" : "Not listed"}</span>
                    </div>

                    <button
                      className="btn btn-secondary btn-sm w-full"
                      type="button"
                      onClick={() => quickBuy(skill)}
                      disabled={isPending || !skill.listed || skill.price <= 0n}
                    >
                      {isPending ? "Processing..." : skill.listed && skill.price > 0n ? "Quick buy" : "Awaiting listing"}
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
