import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { GitHubService } from "@/lib/github";
import { Task } from "@/lib/types";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { owner, repo, branch, updates } = await request.json();

    if (!owner || !repo) {
      return Response.json(
        { error: "Missing owner or repo" },
        { status: 400 }
      );
    }

    const { taskId } = await params;
    const github = new GitHubService(session.accessToken);
    const task = await github.updateTask(owner, repo, taskId, updates, branch);

    return Response.json({ task }, { status: 200 });
  } catch (error) {
    console.error("Failed to update task:", error);
    return Response.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}
