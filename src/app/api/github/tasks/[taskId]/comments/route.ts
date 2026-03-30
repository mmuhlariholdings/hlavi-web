import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { GitHubService } from "@/lib/github";
import { TaskComment } from "@/lib/types";
import { randomUUID } from "crypto";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { owner, repo, branch, body } = await request.json();
    const { taskId } = await params;

    if (!owner || !repo || !body?.trim()) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const author = session.githubLogin ?? session.user?.name ?? "unknown";

    const comment: TaskComment = {
      id: randomUUID(),
      author,
      author_type: "user",
      body: body.trim(),
      created_at: new Date().toISOString(),
    };

    const github = new GitHubService(session.accessToken);
    const task = await github.addComment(owner, repo, taskId, comment, branch);

    return Response.json({ task }, { status: 200 });
  } catch (error) {
    console.error("Failed to add comment:", error);
    return Response.json({ error: "Failed to add comment" }, { status: 500 });
  }
}
