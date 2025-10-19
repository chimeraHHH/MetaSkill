"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useScaffoldContract, useScaffoldEventHistory } from "~~/hooks/scaffold-eth";

export type SkillMetadataFile = {
  name?: string;
  type?: string;
  size?: number;
  base64?: string;
};

export type SkillMetadata = {
  name?: string;
  description?: string;
  license?: string;
  category?: string;
  tags?: string[] | string;
  keywords?: string[] | string;
  createdAt?: string;
  skill?: SkillMetadataFile;
  image?: string;
  animation_url?: string;
  mediaUrl?: string;
  [key: string]: unknown;
};

export type SkillItem = {
  tokenId: bigint;
  tokenURI: string;
  listed: boolean;
  price: bigint;
  priceEth: number;
  creator: string;
  owner: string;
  metadata?: SkillMetadata;
  category?: string;
  tags?: string[];
  keywords?: string[];
  createdTimestamp?: number;
  popularityScore: number;
};

const resolveIpfsUrl = (uri: string) => {
  if (!uri) return uri;
  return uri.startsWith("ipfs://") ? `https://ipfs.io/ipfs/${uri.replace("ipfs://", "")}` : uri;
};

const parseDataUriJson = (uri: string): Record<string, unknown> | undefined => {
  try {
    const [meta, data] = uri.split(",", 2);
    if (!data) return undefined;
    if (meta.includes(";base64")) {
      if (typeof atob !== "undefined") {
        return JSON.parse(atob(data));
      }
      return undefined;
    }
    return JSON.parse(decodeURIComponent(data));
  } catch (error) {
    console.warn("Failed to parse data URI metadata", error);
    return undefined;
  }
};

const loadMetadata = async (tokenURI: string): Promise<SkillMetadata | undefined> => {
  try {
    if (!tokenURI) return undefined;
    if (tokenURI.startsWith("data:")) {
      return parseDataUriJson(tokenURI) as SkillMetadata | undefined;
    }

    const resolved = resolveIpfsUrl(tokenURI);
    const res = await fetch(resolved);
    if (!res.ok) throw new Error(`Failed to fetch metadata ${res.status}`);
    return (await res.json()) as SkillMetadata;
  } catch (error) {
    console.warn("Unable to load metadata", tokenURI, error);
    return undefined;
  }
};

const buildMediaUrl = (metadata?: SkillMetadata) => {
  if (!metadata) return undefined;
  if (metadata.mediaUrl) return metadata.mediaUrl;

  if (metadata.animation_url) {
    return resolveIpfsUrl(metadata.animation_url);
  }
  if (metadata.image) {
    return resolveIpfsUrl(metadata.image);
  }
  if (metadata.skill?.base64 && metadata.skill?.type) {
    return `data:${metadata.skill.type};base64,${metadata.skill.base64}`;
  }
  return undefined;
};

const normalizeStringArray = (value: SkillMetadata["tags"] | SkillMetadata["keywords"]): string[] | undefined => {
  if (!value) return undefined;
  if (Array.isArray(value)) {
    return value.map(item => item?.toString().trim()).filter(Boolean) as string[];
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map(part => part.trim())
      .filter(Boolean);
  }
  return undefined;
};

export const useSkillsData = () => {
  const { data: contract } = useScaffoldContract({ contractName: "SkillNFT" });
  const { data: mintEvents, isLoading: loadingEvents } = useScaffoldEventHistory({
    contractName: "SkillNFT",
    eventName: "SkillMinted",
    fromBlock: 0n,
    filters: {},
  });

  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  const tokenIds = useMemo(() => {
    const ids = new Map<string, bigint>();
    (mintEvents || []).forEach(event => {
      const tokenId = event.args?.tokenId as bigint | undefined;
      if (typeof tokenId === "bigint") {
        ids.set(tokenId.toString(), tokenId);
      }
    });
    // Latest minted first
    return Array.from(ids.values()).sort((a, b) => Number(b - a));
  }, [mintEvents]);

  const refresh = useCallback(async () => {
    if (!contract || tokenIds.length === 0) {
      setSkills([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const items: SkillItem[] = await Promise.all(
        tokenIds.map(async tokenId => {
          try {
            const res = await (contract as any).read.getSkill([tokenId]);
            const tokenURI = res[0] as string;
            const listed = res[1] as boolean;
            const price = res[2] as bigint;
            const creator = res[3] as string;
            const owner = res[4] as string;

            const metadata = await loadMetadata(tokenURI);
            let category: string | undefined;
            let tags: string[] | undefined;
            let keywords: string[] | undefined;
            let createdTimestamp: number | undefined;
            if (metadata) {
              metadata.mediaUrl = buildMediaUrl(metadata);
              if (metadata.category && typeof metadata.category === "string") {
                category = metadata.category.trim();
              }
              tags = normalizeStringArray(metadata.tags);
              keywords = normalizeStringArray(metadata.keywords);
              if (metadata.createdAt) {
                const ts = Date.parse(metadata.createdAt);
                if (!Number.isNaN(ts)) {
                  createdTimestamp = ts;
                }
              }
            }

            const priceEth = Number(price) / 1e18;
            const popularityScore =
              (listed ? 100 : 0) +
              (tags?.length ?? 0) * 10 +
              (keywords?.length ?? 0) * 5 +
              (metadata?.description ? Math.min(metadata.description.length, 600) / 20 : 0);

            return {
              tokenId,
              tokenURI,
              listed,
              price,
              priceEth,
              creator,
              owner,
              metadata,
              category,
              tags,
              keywords,
              createdTimestamp,
              popularityScore,
            } satisfies SkillItem;
          } catch (innerError) {
            console.warn(`Failed to hydrate token ${tokenId.toString()}`, innerError);
            return {
              tokenId,
              tokenURI: "",
              listed: false,
              price: 0n,
              priceEth: 0,
              creator: "",
              owner: "",
              metadata: undefined,
              category: undefined,
              tags: undefined,
              keywords: undefined,
              createdTimestamp: undefined,
              popularityScore: 0,
            } satisfies SkillItem;
          }
        }),
      );

      setSkills(items);
      setError(undefined);
    } catch (err) {
      console.error("Failed to refresh skills", err);
      setError((err as Error)?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [contract, tokenIds]);

  useEffect(() => {
    let cancelled = false;
    const execute = async () => {
      if (!contract) {
        setSkills([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      await refresh();
      if (!cancelled) {
        setLoading(false);
      }
    };
    execute();
    return () => {
      cancelled = true;
    };
  }, [contract, tokenIds, refresh]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    skills.forEach(skill => {
      if (skill.category) {
        set.add(skill.category);
      }
    });
    return Array.from(set.values());
  }, [skills]);

  return {
    skills,
    loading: loading || loadingEvents,
    error,
    refresh,
    hasSkills: tokenIds.length > 0,
    categories,
  };
};
