import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { GitHubService } from "@/lib/github";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { owner, repo, title, description, status, start_date, end_date } = body;

    if (!owner || !repo || !title) {
      return Response.json(
        { error: "Missing required parameters: owner, repo, title" },
        { status: 400 }
      );
    }

    const github = new GitHubService(session.accessToken);

    const task = await github.createTask(owner, repo, {
      title,
      description,
      status,
      start_date,
      end_date,
    });

    return Response.json({ task }, { status: 201 });
  } catch (error) {
    console.error("Failed to create task:", error);
    return Response.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
