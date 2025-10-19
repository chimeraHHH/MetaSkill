"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "skillchain:search-history";
const MAX_HISTORY = 10;

const readHistory = (): string[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map(item => item?.toString()).filter(Boolean) as string[];
    }
  } catch (error) {
    console.warn("Failed to parse search history", error);
  }
  return [];
};

export const useSearchHistory = () => {
  const [history, setHistory] = useState<string[]>(() => readHistory());

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.warn("Failed to persist search history", error);
    }
  }, [history]);

  const addSearchTerm = useCallback((term: string) => {
    const normalized = term.trim();
    if (!normalized) return;
    setHistory(prev => {
      const existing = prev.filter(item => item.toLowerCase() !== normalized.toLowerCase());
      return [normalized, ...existing].slice(0, MAX_HISTORY);
    });
  }, []);

  const removeHistoryItem = useCallback((term: string) => {
    setHistory(prev => prev.filter(item => item !== term));
  }, []);

  const clearHistory = useCallback(() => setHistory([]), []);

  return {
    history,
    addSearchTerm,
    removeHistoryItem,
    clearHistory,
  };
};

