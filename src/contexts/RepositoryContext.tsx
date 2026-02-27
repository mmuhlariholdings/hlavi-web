"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface RepositoryContextType {
  owner: string | null;
  repo: string | null;
  setRepository: (owner: string, repo: string) => void;
  clearRepository: () => void;
}

const RepositoryContext = createContext<RepositoryContextType | undefined>(
  undefined
);

export function RepositoryProvider({ children }: { children: ReactNode }) {
  const [owner, setOwner] = useState<string | null>(null);
  const [repo, setRepo] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  const setRepository = (newOwner: string, newRepo: string) => {
    setOwner(newOwner);
    setRepo(newRepo);
    // Store in localStorage for persistence
    if (typeof window !== "undefined") {
      localStorage.setItem("hlavi_owner", newOwner);
      localStorage.setItem("hlavi_repo", newRepo);
    }
  };

  const clearRepository = () => {
    setOwner(null);
    setRepo(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("hlavi_owner");
      localStorage.removeItem("hlavi_repo");
    }
  };

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedOwner = localStorage.getItem("hlavi_owner");
      const savedRepo = localStorage.getItem("hlavi_repo");
      if (savedOwner && savedRepo) {
        setOwner(savedOwner);
        setRepo(savedRepo);
      }
      setIsHydrated(true);
    }
  }, []);

  // Don't render children until hydrated to avoid hydration mismatch
  if (!isHydrated) {
    return null;
  }

  return (
    <RepositoryContext.Provider
      value={{ owner, repo, setRepository, clearRepository }}
    >
      {children}
    </RepositoryContext.Provider>
  );
}

export function useRepository() {
  const context = useContext(RepositoryContext);
  if (context === undefined) {
    throw new Error("useRepository must be used within a RepositoryProvider");
  }
  return context;
}
