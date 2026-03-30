import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { GitHubService } from "@/lib/github";

export async function PATCH(request: NextRequest) {
  const session = await auth();

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { owner, repo, branch, updates } = await request.json();

    if (!owner || !repo) {
      return NextResponse.json({ error: "Missing owner or repo" }, { status: 400 });
    }

    const github = new GitHubService(session.accessToken);
    const board = await github.updateBoardConfig(owner, repo, updates, branch ?? undefined);

    return NextResponse.json({ board });
  } catch (error) {
    console.error("Failed to update board config:", error);
    return NextResponse.json({ error: "Failed to update board config" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");
  const branch = searchParams.get("branch");

  if (!owner || !repo) {
    return NextResponse.json(
      { error: "Missing owner or repo parameter" },
      { status: 400 }
    );
  }

  try {
    const github = new GitHubService(session.accessToken);
    const board = await github.getBoardConfig(owner, repo, branch || undefined);

    return NextResponse.json({ board });
  } catch (error) {
    console.error("Failed to fetch board config:", error);
    return NextResponse.json(
      { error: "Failed to fetch board config" },
      { status: 500 }
    );
  }
}
