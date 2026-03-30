import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { GitHubService } from "@/lib/github";

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { owner, repo, branch } = await request.json();

  if (!owner || !repo) {
    return NextResponse.json({ error: "Missing owner or repo" }, { status: 400 });
  }

  try {
    const github = new GitHubService(session.accessToken);
    await github.addAgentWorkflow(owner, repo, branch ?? undefined);
    return NextResponse.json({ message: "Workflow created successfully" });
  } catch (error) {
    console.error("Failed to create workflow:", error);
    return NextResponse.json({ error: "Failed to create workflow" }, { status: 500 });
  }
}
