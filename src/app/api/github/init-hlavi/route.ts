import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { GitHubService } from "@/lib/github";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { owner, repo, branch } = await request.json();

    if (!owner || !repo) {
      return Response.json(
        { error: "Missing owner or repo parameter" },
        { status: 400 }
      );
    }

    const github = new GitHubService(session.accessToken);

    // Check if .hlavi already exists
    const hasHlavi = await github.checkHlaviDirectory(owner, repo, branch);
    if (hasHlavi) {
      return Response.json(
        { error: "Hlavi directory already exists" },
        { status: 400 }
      );
    }

    // Initialize the directory structure
    await github.initializeHlavi(owner, repo, branch);

    return Response.json(
      { message: "Hlavi initialized successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to initialize Hlavi:", error);
    return Response.json(
      { error: "Failed to initialize Hlavi" },
      { status: 500 }
    );
  }
}
