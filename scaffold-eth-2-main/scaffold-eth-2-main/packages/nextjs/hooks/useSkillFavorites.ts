"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "metaskill:favorites";

const loadInitial = (): string[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch (error) {
    console.warn("Failed to load favorites", error);
    return [];
  }
};

export const useSkillFavorites = () => {
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => loadInitial());

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(favoriteIds));
  }, [favoriteIds]);

  const isFavorite = useCallback(
    (tokenId: bigint | string) => {
      const id = tokenId.toString();
      return favoriteIds.includes(id);
    },
    [favoriteIds],
  );

  const toggleFavorite = useCallback((tokenId: bigint | string) => {
    const id = tokenId.toString();
    setFavoriteIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      }
      return [...prev, id];
    });
  }, []);

  const clearFavorites = useCallback(() => setFavoriteIds([]), []);

  return {
    favoriteIds,
    isFavorite,
    toggleFavorite,
    clearFavorites,
  };
};

