"use client";

import { useRepository } from "@/contexts/RepositoryContext";
import { useBranches } from "@/hooks/useBranches";
import { GitBranch, FolderGit2, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";

export function RepositoryBreadcrumb() {
  const { owner, repo, branch, setBranch } = useRepository();
  const { data: branchesData } = useBranches(owner || "", repo || "");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!owner || !repo) {
    return null;
  }

  const branches = branchesData?.branches || [];
  const hasBranches = branches.length > 0;

  const handleBranchChange = (newBranch: string) => {
    setBranch(newBranch);
    setIsDropdownOpen(false);
  };

  return (
    <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center gap-3 text-sm">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
          title="Go to dashboard"
        >
          <FolderGit2 className="w-4 h-4 text-gray-500" />
          <span className="font-medium">{owner}</span>
          <span className="text-gray-400">/</span>
          <span className="font-medium">{repo}</span>
        </Link>

        {branch && (
          <>
            <span className="text-gray-400">@</span>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => hasBranches && setIsDropdownOpen(!isDropdownOpen)}
                disabled={!hasBranches}
                className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors disabled:cursor-not-allowed"
                title={hasBranches ? "Switch branch" : "Loading branches..."}
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span className="font-medium">{branch}</span>
                {hasBranches && <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {isDropdownOpen && hasBranches && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[200px] max-h-[300px] overflow-y-auto">
                  {branches.map((b) => (
                    <button
                      key={b.name}
                      onClick={() => handleBranchChange(b.name)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${
                        b.name === branch ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700"
                      }`}
                    >
                      <span>{b.name}</span>
                      {b.name === branchesData?.defaultBranch && (
                        <span className="text-xs text-gray-500">(default)</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
