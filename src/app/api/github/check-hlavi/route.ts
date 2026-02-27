import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { GitHubService } from "@/lib/github";

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
    const hasHlavi = await github.checkHlaviDirectory(owner, repo, branch || undefined);

    return NextResponse.json({ hasHlavi });
  } catch (error) {
    console.error("Failed to check .hlavi directory:", error);
    return NextResponse.json(
      { error: "Failed to check .hlavi directory" },
      { status: 500 }
    );
  }
}
