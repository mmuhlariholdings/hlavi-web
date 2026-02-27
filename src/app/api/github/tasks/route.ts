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
  const taskId = searchParams.get("taskId");

  if (!owner || !repo) {
    return NextResponse.json(
      { error: "Missing owner or repo parameter" },
      { status: 400 }
    );
  }

  try {
    const github = new GitHubService(session.accessToken);

    if (taskId) {
      // Fetch single task
      const task = await github.getTask(owner, repo, taskId, branch || undefined);
      return NextResponse.json({ task });
    } else {
      // Fetch all tasks
      const tasks = await github.getAllTasks(owner, repo, branch || undefined);
      return NextResponse.json({ tasks });
    }
  } catch (error) {
    console.error("Failed to fetch tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}
