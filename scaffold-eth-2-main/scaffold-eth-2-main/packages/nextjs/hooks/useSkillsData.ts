import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useScaffoldContract, useScaffoldEventHistory } from "~~/hooks/scaffold-eth";

export interface SkillMetadataFile {
  name?: string;
  description?: string;
  image?: string;
  external_url?: string;
  animation_url?: string;
  background_color?: string;
  youtube_url?: string;
  category?: string;
  tags?: string | string[];
  keywords?: string | string[];
  createdAt?: string;
  [key: string]: any;
}

export interface SkillMetadata extends SkillMetadataFile {
  mediaUrl?: string;
}

export interface SkillItem {
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
  isDemo: boolean;
}

function resolveIpfsUrl(url: string): string {
  if (url.startsWith("ipfs://")) {
    return `https://ipfs.io/ipfs/${url.slice(7)}`;
  }
  return url;
}

function parseDataUriJson(uri: string): any {
  if (uri.startsWith("data:application/json;base64,")) {
    const base64 = uri.slice("data:application/json;base64,".length);
    const json = atob(base64);
    return JSON.parse(json);
  }
  if (uri.startsWith("data:application/json,")) {
    const json = decodeURIComponent(uri.slice("data:application/json,".length));
    return JSON.parse(json);
  }
  return null;
}

async function loadMetadata(tokenURI: string): Promise<SkillMetadata | undefined> {
  if (!tokenURI) return undefined;

  try {
    const dataUriJson = parseDataUriJson(tokenURI);
    if (dataUriJson) {
      return dataUriJson as SkillMetadata;
    }

    const url = resolveIpfsUrl(tokenURI);
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Failed to fetch metadata from ${url}: ${response.status}`);
      return undefined;
    }
    return (await response.json()) as SkillMetadata;
  } catch (error) {
    console.warn(`Failed to load metadata from ${tokenURI}:`, error);
    return undefined;
  }
}

function buildMediaUrl(metadata: SkillMetadata): string | undefined {
  if (metadata.animation_url) {
    return resolveIpfsUrl(metadata.animation_url);
  }
  if (metadata.image) {
    return resolveIpfsUrl(metadata.image);
  }
  return undefined;
}

function normalizeStringArray(value: string | string[] | undefined): string[] | undefined {
  if (!value) return undefined;
  if (typeof value === "string") {
    return value.split(",").map(s => s.trim()).filter(Boolean);
  }
  if (Array.isArray(value)) {
    return value.map(s => String(s).trim()).filter(Boolean);
  }
  return undefined;
}

export const useSkillsData = () => {
  const { data: contract } = useScaffoldContract({
    contractName: "SkillNFT",
  });

  const { data: mintEvents, isLoading: loadingEvents } = useScaffoldEventHistory({
    contractName: "SkillNFT",
    eventName: "SkillMinted",
    fromBlock: 0n,
    filters: {},
  });

  // 新增：稳定的地址字符串与contract引用
  const contractAddress = useMemo(() => {
    try {
      const addr = (contract as any)?.address ?? "";
      return typeof addr === "string" ? addr.toLowerCase() : String(addr ?? "");
    } catch {
      return "";
    }
  }, [contract]);
  const contractRef = useRef<any>(contract);
  useEffect(() => {
    contractRef.current = contract;
  }, [contract]);

  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);

  const tokenIds = useMemo(() => {
    const ids = new Map<string, bigint>();
    (mintEvents || []).forEach(event => {
      const tokenId = event.args?.tokenId as bigint | undefined;
      if (typeof tokenId === "bigint") {
        ids.set(tokenId.toString(), tokenId);
      }
    });
    return Array.from(ids.values()).sort((a, b) => Number(b - a));
  }, [mintEvents]);

  const tokenIdsKey = useMemo(() => tokenIds.map(id => id.toString()).join(","), [tokenIds]);

  // 修改：loadSkillsData依赖稳定的contractAddress与tokenIdsKey
  const loadSkillsData = useCallback(async () => {
    const c = contractRef.current;
    if (!c || tokenIds.length === 0) {
      setSkills([]);
      return;
    }

    setIsLoadingSkills(true);
    setError(undefined);

    try {
      const items: SkillItem[] = await Promise.all(
        tokenIds.map(async tokenId => {
          try {
            const res = await (c as any).read.getSkill([tokenId]);
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
              isDemo: false,
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
              isDemo: false,
            } satisfies SkillItem;
          }
        }),
      );

      setSkills(items);
    } catch (err) {
      console.error("Failed to load skills", err);
      setError((err as Error)?.message ?? "Unknown error");
    } finally {
      setIsLoadingSkills(false);
    }
  }, [contractAddress, tokenIdsKey]);

  useEffect(() => {
    loadSkillsData();
  }, [loadSkillsData]);

  const refresh = useCallback(() => {
    loadSkillsData();
  }, [loadSkillsData]);

  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    skills.forEach(skill => {
      if (skill.category) {
        categorySet.add(skill.category);
      }
    });
    return Array.from(categorySet).sort();
  }, [skills]);

  return {
    skills,
    loading: loadingEvents || isLoadingSkills,
    error,
    refresh,
    hasSkills: tokenIds.length > 0,
    categories,
  };
};
