import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { GitHubService } from "@/lib/github";

// POST - Add new acceptance criteria
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { owner, repo, description } = await request.json();
    const { taskId } = await params;

    if (!owner || !repo || !description) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const github = new GitHubService(session.accessToken);
    const task = await github.addAcceptanceCriteria(
      owner,
      repo,
      taskId,
      description
    );

    return Response.json({ task }, { status: 200 });
  } catch (error) {
    console.error("Failed to add acceptance criteria:", error);
    return Response.json(
      { error: "Failed to add acceptance criteria" },
      { status: 500 }
    );
  }
}
