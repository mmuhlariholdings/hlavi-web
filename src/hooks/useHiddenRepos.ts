"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "hlavi_hidden_repos";

function readFromStorage(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function writeToStorage(hidden: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...hidden]));
}

export function useHiddenRepos() {
  const [hiddenRepos, setHiddenReposState] = useState<Set<string>>(new Set());

  useEffect(() => {
    setHiddenReposState(readFromStorage());
  }, []);

  const toggleRepo = (fullName: string) => {
    setHiddenReposState((prev) => {
      const next = new Set(prev);
      if (next.has(fullName)) {
        next.delete(fullName);
      } else {
        next.add(fullName);
      }
      writeToStorage(next);
      return next;
    });
  };

  const isHidden = (fullName: string) => hiddenRepos.has(fullName);

  return { hiddenRepos, toggleRepo, isHidden };
}
