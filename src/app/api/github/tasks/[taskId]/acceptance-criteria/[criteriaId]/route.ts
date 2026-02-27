import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { GitHubService } from "@/lib/github";

// PATCH - Toggle acceptance criteria completion
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string; criteriaId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { owner, repo, branch } = await request.json();
    const { taskId, criteriaId } = await params;

    if (!owner || !repo) {
      return Response.json(
        { error: "Missing owner or repo" },
        { status: 400 }
      );
    }

    const github = new GitHubService(session.accessToken);
    const task = await github.toggleAcceptanceCriteria(
      owner,
      repo,
      taskId,
      parseInt(criteriaId),
      branch
    );

    return Response.json({ task }, { status: 200 });
  } catch (error) {
    console.error("Failed to toggle acceptance criteria:", error);
    return Response.json(
      { error: "Failed to toggle acceptance criteria" },
      { status: 500 }
    );
  }
}

// DELETE - Remove acceptance criteria
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string; criteriaId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const owner = searchParams.get("owner");
    const repo = searchParams.get("repo");
    const branch = searchParams.get("branch");
    const { taskId, criteriaId } = await params;

    if (!owner || !repo) {
      return Response.json(
        { error: "Missing owner or repo" },
        { status: 400 }
      );
    }

    const github = new GitHubService(session.accessToken);
    const task = await github.deleteAcceptanceCriteria(
      owner,
      repo,
      taskId,
      parseInt(criteriaId),
      branch || undefined
    );

    return Response.json({ task }, { status: 200 });
  } catch (error) {
    console.error("Failed to delete acceptance criteria:", error);
    return Response.json(
      { error: "Failed to delete acceptance criteria" },
      { status: 500 }
    );
  }
}
