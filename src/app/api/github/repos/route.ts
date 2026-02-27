import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { GitHubService } from "@/lib/github";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const github = new GitHubService(session.accessToken);
    const repos = await github.getUserRepositories();

    // Filter repos with .hlavi directory
    const hlaviRepos = [];
    for (const repo of repos) {
      const hasHlavi = await github.checkHlaviDirectory(
        repo.owner.login,
        repo.name
      );
      if (hasHlavi) {
        hlaviRepos.push(repo);
      }
    }

    return NextResponse.json({ repositories: hlaviRepos });
  } catch (error) {
    console.error("Failed to fetch repositories:", error);
    return NextResponse.json(
      { error: "Failed to fetch repositories" },
      { status: 500 }
    );
  }
}
