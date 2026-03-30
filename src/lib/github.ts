import { Octokit } from "@octokit/rest";
import { Task, Board, BoardConfig, GitHubContent, Repository, TaskComment } from "./types";

/** Normalize legacy status values written by older agent versions. */
function normalizeTask(task: Task): Task {
  if ((task.status as string) === "in_progress") {
    return { ...task, status: "inprogress" };
  }
  return task;
}

const AGENT_WORKFLOW_PATH = ".github/workflows/hlavi-agent.yml";

const AGENT_WORKFLOW_CONTENT = `name: Hlavi Agent

on:
  # Run every 30 minutes
  schedule:
    - cron: '*/30 * * * *'
  # Allow manual trigger with model override from the Actions tab
  workflow_dispatch:
    inputs:
      model:
        description: 'AI model to use for this run'
        required: false
        default: 'claude-opus-4-6'
        type: choice
        options:
          - claude-opus-4-6
          - claude-sonnet-4-6
          - claude-haiku-4-5
          - gpt-4o
          - gpt-4o-mini
          - o3
          - o4-mini
          - gemini-2.0-flash
          - gemini-1.5-pro
      dry_run:
        description: 'Dry run — log planned actions without writing files or committing'
        required: false
        default: 'false'
        type: choice
        options:
          - 'false'
          - 'true'

permissions:
  contents: write   # needed to commit task status updates and code changes

jobs:
  agent:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          token: \${{ secrets.GITHUB_TOKEN }}

      - name: Run Hlavi Agent
        uses: mmuhlariholdings/hlavi-agent-action@v1
        with:
          # Add secrets for whichever providers you want to use.
          # The action auto-detects which key to use from the model name.
          # If the required key is missing the task will be skipped with an explanatory comment.
          anthropic_api_key: \${{ secrets.ANTHROPIC_API_KEY }}
          openai_api_key: \${{ secrets.OPENAI_API_KEY }}
          google_api_key: \${{ secrets.GOOGLE_API_KEY }}

          model: \${{ inputs.model || 'claude-opus-4-6' }}
          dry_run: \${{ inputs.dry_run || 'false' }}

          # Optional: cap the number of agentic turns per task
          # max_iterations: '50'
`;

export class GitHubService {
  private octokit: Octokit;

  constructor(accessToken: string) {
    this.octokit = new Octokit({ auth: accessToken });
  }

  async getUserRepositories(): Promise<Repository[]> {
    const { data } = await this.octokit.repos.listForAuthenticatedUser({
      sort: "updated",
      per_page: 100,
    });
    return data as Repository[];
  }

  async getBranches(owner: string, repo: string): Promise<Array<{ name: string }>> {
    try {
      const { data } = await this.octokit.repos.listBranches({
        owner,
        repo,
        per_page: 100,
      });
      return data.map((branch) => ({ name: branch.name }));
    } catch (error) {
      console.error("Failed to get branches:", error);
      return [];
    }
  }

  async getDefaultBranch(owner: string, repo: string): Promise<string> {
    try {
      const { data } = await this.octokit.repos.get({ owner, repo });
      return data.default_branch;
    } catch (error) {
      console.error("Failed to get default branch:", error);
      return "main";
    }
  }

  async checkHlaviDirectory(owner: string, repo: string, branch?: string): Promise<boolean> {
    try {
      await this.octokit.repos.getContent({
        owner,
        repo,
        path: ".hlavi",
        ...(branch && { ref: branch }),
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async getTaskFiles(owner: string, repo: string, branch?: string): Promise<GitHubContent[]> {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path: ".hlavi/tasks",
        ...(branch && { ref: branch }),
      });

      if (!Array.isArray(data)) {
        throw new Error("Expected directory contents");
      }

      return data.filter((file) => file.name.endsWith(".json"));
    } catch (error) {
      console.error("Failed to get task files:", error);
      return [];
    }
  }

  async getTask(owner: string, repo: string, taskId: string, branch?: string): Promise<Task> {
    const { data } = await this.octokit.repos.getContent({
      owner,
      repo,
      path: `.hlavi/tasks/${taskId}.json`,
      ...(branch && { ref: branch }),
    });

    if ("content" in data && data.content) {
      const content = Buffer.from(data.content, "base64").toString("utf-8");
      return normalizeTask(JSON.parse(content));
    }

    throw new Error("Failed to fetch task");
  }

  async getAllTasks(owner: string, repo: string, branch?: string): Promise<Task[]> {
    const files = await this.getTaskFiles(owner, repo, branch);

    const results = await Promise.allSettled(
      files.map(async (file) => {
        if (!file.download_url) throw new Error(`No download URL for ${file.name}`);
        const res = await fetch(file.download_url);
        if (!res.ok) throw new Error(`Failed to fetch ${file.name}: ${res.status}`);
        return res.json().then(normalizeTask) as Promise<Task>;
      })
    );

    return results
      .filter((r): r is PromiseFulfilledResult<Task> => r.status === "fulfilled")
      .map((r) => r.value);
  }

  async getBoardConfig(owner: string, repo: string, branch?: string): Promise<Board | null> {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path: ".hlavi/board.json",
        ...(branch && { ref: branch }),
      });

      if ("content" in data && data.content) {
        const content = Buffer.from(data.content, "base64").toString("utf-8");
        return JSON.parse(content);
      }
    } catch (error) {
      console.error("Failed to get board config:", error);
      return null;
    }
    return null;
  }

  async updateTask(
    owner: string,
    repo: string,
    taskId: string,
    updates: Partial<Task>,
    branch?: string
  ): Promise<Task> {
    // Get current file to retrieve SHA (required for updates)
    const { data: currentFile } = await this.octokit.repos.getContent({
      owner,
      repo,
      path: `.hlavi/tasks/${taskId}.json`,
      ...(branch && { ref: branch }),
    });

    if (!("sha" in currentFile)) {
      throw new Error("File not found");
    }

    // Get current task data
    const currentTask = await this.getTask(owner, repo, taskId, branch);

    // Merge updates with current task data
    const updatedTask: Task = {
      ...currentTask,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    // Write back to GitHub
    await this.octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: `.hlavi/tasks/${taskId}.json`,
      message: `Update task ${taskId}`,
      content: Buffer.from(JSON.stringify(updatedTask, null, 2)).toString(
        "base64"
      ),
      sha: currentFile.sha,
      ...(branch && { branch }),
    });

    return updatedTask;
  }

  async addAcceptanceCriteria(
    owner: string,
    repo: string,
    taskId: string,
    description: string,
    branch?: string
  ): Promise<Task> {
    const currentTask = await this.getTask(owner, repo, taskId, branch);

    // Find next ID
    const nextId =
      currentTask.acceptance_criteria.length > 0
        ? Math.max(...currentTask.acceptance_criteria.map((ac) => ac.id)) + 1
        : 1;

    // Add new acceptance criteria
    const newCriteria = {
      id: nextId,
      description,
      completed: false,
      created_at: new Date().toISOString(),
      completed_at: null,
    };

    const updatedTask = {
      ...currentTask,
      acceptance_criteria: [...currentTask.acceptance_criteria, newCriteria],
      updated_at: new Date().toISOString(),
    };

    // Update the task
    return this.updateTask(owner, repo, taskId, {
      acceptance_criteria: updatedTask.acceptance_criteria,
    }, branch);
  }

  async toggleAcceptanceCriteria(
    owner: string,
    repo: string,
    taskId: string,
    criteriaId: number,
    branch?: string
  ): Promise<Task> {
    const currentTask = await this.getTask(owner, repo, taskId, branch);

    // Toggle the specific criteria
    const updatedCriteria = currentTask.acceptance_criteria.map((ac) =>
      ac.id === criteriaId
        ? {
            ...ac,
            completed: !ac.completed,
            completed_at: !ac.completed ? new Date().toISOString() : null,
          }
        : ac
    );

    return this.updateTask(owner, repo, taskId, {
      acceptance_criteria: updatedCriteria,
    }, branch);
  }

  async deleteAcceptanceCriteria(
    owner: string,
    repo: string,
    taskId: string,
    criteriaId: number,
    branch?: string
  ): Promise<Task> {
    const currentTask = await this.getTask(owner, repo, taskId, branch);

    // Remove the specific criteria
    const updatedCriteria = currentTask.acceptance_criteria.filter(
      (ac) => ac.id !== criteriaId
    );

    return this.updateTask(owner, repo, taskId, {
      acceptance_criteria: updatedCriteria,
    }, branch);
  }

  async createTask(
    owner: string,
    repo: string,
    taskData: {
      title: string;
      description?: string;
      status?: string;
      start_date?: string;
      end_date?: string;
    },
    branch?: string
  ): Promise<Task> {
    // Get current board config to determine next task ID
    const board = await this.getBoardConfig(owner, repo, branch);
    if (!board) {
      throw new Error("Board configuration not found");
    }

    const taskId = `HLA${board.next_task_number}`;
    const now = new Date().toISOString();

    // Create new task object
    const newTask: Task = {
      id: taskId,
      title: taskData.title,
      description: taskData.description || null,
      status: (taskData.status as any) || "new",
      acceptance_criteria: [],
      created_at: now,
      updated_at: now,
      agent_assigned: false,
      autonomous: false,
      rejection_reason: null,
      start_date: taskData.start_date || null,
      end_date: taskData.end_date || null,
      blocks: [],
    };

    // Update board config
    const updatedBoard: Board = {
      ...board,
      tasks: {
        ...board.tasks,
        [taskId]: newTask.status,
      },
      next_task_number: board.next_task_number + 1,
    };

    // Get current board.json file SHA
    const { data: currentBoardFile } = await this.octokit.repos.getContent({
      owner,
      repo,
      path: ".hlavi/board.json",
      ...(branch && { ref: branch }),
    });

    if (!("sha" in currentBoardFile)) {
      throw new Error("Board file not found");
    }

    try {
      // Check if task file already exists (get SHA if it does)
      let existingFileSha: string | undefined;
      try {
        const { data: existingFile } = await this.octokit.repos.getContent({
          owner,
          repo,
          path: `.hlavi/tasks/${taskId}.json`,
          ...(branch && { ref: branch }),
        });
        if ("sha" in existingFile) {
          existingFileSha = existingFile.sha;
        }
      } catch (error) {
        // File doesn't exist, which is expected for new tasks
      }

      // Create task file
      await this.octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: `.hlavi/tasks/${taskId}.json`,
        message: `Create task ${taskId}: ${taskData.title}`,
        content: Buffer.from(JSON.stringify(newTask, null, 2)).toString("base64"),
        ...(existingFileSha && { sha: existingFileSha }),
        ...(branch && { branch }),
      });

      // Update board.json
      await this.octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: ".hlavi/board.json",
        message: `Update board: Add task ${taskId}`,
        content: Buffer.from(JSON.stringify(updatedBoard, null, 2)).toString("base64"),
        sha: currentBoardFile.sha,
        ...(branch && { branch }),
      });

      return newTask;
    } catch (error) {
      console.error("Failed to create task:", error);
      throw new Error("Failed to create task");
    }
  }

  async addComment(
    owner: string,
    repo: string,
    taskId: string,
    comment: TaskComment,
    branch?: string
  ): Promise<Task> {
    const currentTask = await this.getTask(owner, repo, taskId, branch);
    const updatedComments = [...(currentTask.comments ?? []), comment];
    return this.updateTask(owner, repo, taskId, { comments: updatedComments }, branch);
  }

  async updateBoardConfig(
    owner: string,
    repo: string,
    configUpdates: Partial<BoardConfig>,
    branch?: string
  ): Promise<Board> {
    const currentBoard = await this.getBoardConfig(owner, repo, branch);
    if (!currentBoard) {
      throw new Error("Board configuration not found");
    }

    const updatedBoard: Board = {
      ...currentBoard,
      config: { ...currentBoard.config, ...configUpdates },
    };

    const { data: currentFile } = await this.octokit.repos.getContent({
      owner,
      repo,
      path: ".hlavi/board.json",
      ...(branch && { ref: branch }),
    });

    if (!("sha" in currentFile)) {
      throw new Error("Board file not found");
    }

    await this.octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: ".hlavi/board.json",
      message: "Update board configuration",
      content: Buffer.from(JSON.stringify(updatedBoard, null, 2)).toString("base64"),
      sha: currentFile.sha,
      ...(branch && { branch }),
    });

    return updatedBoard;
  }

  async initializeHlavi(owner: string, repo: string, branch?: string): Promise<void> {
    const now = new Date().toISOString();
    const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // Example task with all fields populated
    const exampleTask: Task = {
      id: "HLA1",
      title: "Welcome to Hlavi",
      description: "This is an example task to help you get started with Hlavi. You can edit or delete this task, and create new ones using the dashboard.",
      status: "open",
      acceptance_criteria: [
        {
          id: 1,
          description: "Explore the dashboard and different views (Timeline, Board, Agenda)",
          completed: false,
          created_at: now,
          completed_at: null,
        },
        {
          id: 2,
          description: "Try editing this task to understand the workflow",
          completed: false,
          created_at: now,
          completed_at: null,
        },
        {
          id: 3,
          description: "Create your first real task for your project",
          completed: false,
          created_at: now,
          completed_at: null,
        },
      ],
      created_at: now,
      updated_at: now,
      agent_assigned: false,
      autonomous: false,
      rejection_reason: null,
      start_date: now,
      end_date: weekFromNow,
      blocks: [],
    };

    // Setup task: configure the Hlavi agent
    const agentSetupTask: Task = {
      id: "HLA2",
      title: "Set up Hlavi Agent",
      description: `## Hlavi Agent Setup

The Hlavi Agent workflow has been added to your repository at \`.github/workflows/hlavi-agent.yml\`. It will autonomously work on any task with \`autonomous: true\` and \`status: open\`.

To activate it, you need to add an API key for your chosen AI provider as a **repository secret**.

Go to: **Settings → Secrets and variables → Actions → New repository secret**

### Anthropic (Claude) — recommended
- Secret name: \`ANTHROPIC_API_KEY\`
- Get your key: https://console.anthropic.com/settings/keys
- Default model: \`claude-opus-4-6\`

### OpenAI (GPT / o-series)
- Secret name: \`OPENAI_API_KEY\`
- Get your key: https://platform.openai.com/api-keys
- Update \`model\` in the workflow to e.g. \`gpt-4o\`

### Google (Gemini)
- Secret name: \`GOOGLE_API_KEY\`
- Get your key: https://aistudio.google.com/app/apikey
- Update \`model\` in the workflow to e.g. \`gemini-2.0-flash\`

Once a secret is added, the workflow will run every 30 minutes automatically. You can also trigger it manually from the **Actions** tab.`,
      status: "open",
      acceptance_criteria: [
        {
          id: 1,
          description: "Choose an AI provider (Anthropic, OpenAI, or Google)",
          completed: false,
          created_at: now,
          completed_at: null,
        },
        {
          id: 2,
          description: "Add the provider API key as a repository secret (ANTHROPIC_API_KEY, OPENAI_API_KEY, or GOOGLE_API_KEY)",
          completed: false,
          created_at: now,
          completed_at: null,
        },
        {
          id: 3,
          description: "Trigger the Hlavi Agent workflow manually from the Actions tab to verify it runs successfully",
          completed: false,
          created_at: now,
          completed_at: null,
        },
      ],
      created_at: now,
      updated_at: now,
      agent_assigned: false,
      autonomous: false,
      rejection_reason: null,
      start_date: now,
      end_date: weekFromNow,
      blocks: [],
    };

    // Board configuration with both tasks
    const defaultBoard: Board = {
      config: {
        name: "Default Board",
        columns: [
          { name: "New", status: "new", agent_enabled: false, agent_mode: null },
          { name: "Open", status: "open", agent_enabled: false, agent_mode: null },
          { name: "In Progress", status: "inprogress", agent_enabled: false, agent_mode: null },
          { name: "Review", status: "review", agent_enabled: false, agent_mode: null },
          { name: "Done", status: "done", agent_enabled: false, agent_mode: null },
        ],
      },
      tasks: {
        "HLA1": "open",
        "HLA2": "open",
      },
      next_task_number: 3,
    };


    try {
      // Check if board.json already exists
      let boardFileSha: string | undefined;
      try {
        const { data: existingBoardFile } = await this.octokit.repos.getContent({
          owner,
          repo,
          path: ".hlavi/board.json",
          ...(branch && { ref: branch }),
        });
        if ("sha" in existingBoardFile) {
          boardFileSha = existingBoardFile.sha;
        }
      } catch (error) {
        // File doesn't exist, which is expected for new initialization
      }

      // Create board.json
      await this.octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: ".hlavi/board.json",
        message: "Initialize Hlavi: Add board configuration",
        content: Buffer.from(JSON.stringify(defaultBoard, null, 2)).toString("base64"),
        ...(boardFileSha && { sha: boardFileSha }),
        ...(branch && { branch }),
      });

      // Check if example task already exists
      let exampleTaskSha: string | undefined;
      try {
        const { data: existingTaskFile } = await this.octokit.repos.getContent({
          owner,
          repo,
          path: ".hlavi/tasks/HLA1.json",
          ...(branch && { ref: branch }),
        });
        if ("sha" in existingTaskFile) {
          exampleTaskSha = existingTaskFile.sha;
        }
      } catch (error) {
        // File doesn't exist, which is expected for new initialization
      }

      // Create example task (HLA1)
      await this.octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: ".hlavi/tasks/HLA1.json",
        message: "Initialize Hlavi: Add example task",
        content: Buffer.from(JSON.stringify(exampleTask, null, 2)).toString("base64"),
        ...(exampleTaskSha && { sha: exampleTaskSha }),
        ...(branch && { branch }),
      });

      // Check if agent setup task already exists
      let agentSetupTaskSha: string | undefined;
      try {
        const { data: existingSetupFile } = await this.octokit.repos.getContent({
          owner,
          repo,
          path: ".hlavi/tasks/HLA2.json",
          ...(branch && { ref: branch }),
        });
        if ("sha" in existingSetupFile) {
          agentSetupTaskSha = existingSetupFile.sha;
        }
      } catch (error) {
        // File doesn't exist, expected
      }

      // Create agent setup task (HLA2)
      await this.octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: ".hlavi/tasks/HLA2.json",
        message: "Initialize Hlavi: Add agent setup task",
        content: Buffer.from(JSON.stringify(agentSetupTask, null, 2)).toString("base64"),
        ...(agentSetupTaskSha && { sha: agentSetupTaskSha }),
        ...(branch && { branch }),
      });

      // Check if workflow file already exists
      let workflowFileSha: string | undefined;
      try {
        const { data: existingWorkflow } = await this.octokit.repos.getContent({
          owner,
          repo,
          path: ".github/workflows/hlavi-agent.yml",
          ...(branch && { ref: branch }),
        });
        if ("sha" in existingWorkflow) {
          workflowFileSha = existingWorkflow.sha;
        }
      } catch (error) {
        // File doesn't exist, expected
      }

      // Create the default agent workflow
      await this.octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: ".github/workflows/hlavi-agent.yml",
        message: "Initialize Hlavi: Add agent workflow",
        content: Buffer.from(AGENT_WORKFLOW_CONTENT).toString("base64"),
        ...(workflowFileSha && { sha: workflowFileSha }),
        ...(branch && { branch }),
      });
    } catch (error) {
      console.error("Failed to initialize Hlavi:", error);
      throw new Error("Failed to initialize Hlavi directory structure");
    }
  }

  async checkAgentWorkflow(owner: string, repo: string, branch?: string): Promise<boolean> {
    try {
      await this.octokit.repos.getContent({
        owner,
        repo,
        path: AGENT_WORKFLOW_PATH,
        ...(branch && { ref: branch }),
      });
      return true;
    } catch {
      return false;
    }
  }

  async addAgentWorkflow(owner: string, repo: string, branch?: string): Promise<void> {
    let sha: string | undefined;
    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path: AGENT_WORKFLOW_PATH,
        ...(branch && { ref: branch }),
      });
      if ("sha" in data) sha = data.sha;
    } catch {
      // doesn't exist yet
    }

    try {
      await this.octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: AGENT_WORKFLOW_PATH,
        message: "Add Hlavi agent workflow",
        content: Buffer.from(AGENT_WORKFLOW_CONTENT).toString("base64"),
        ...(sha && { sha }),
        ...(branch && { branch }),
      });
    } catch (error: unknown) {
      const status = (error as { status?: number }).status;
      if (status === 404 || status === 403) {
        throw new Error(
          `Insufficient permissions to write to ${owner}/${repo}. ` +
          `Ensure your GitHub token has write access and, if this is an organization repository, ` +
          `that the organization has approved the Hlavi OAuth app under Settings → Third-party Access.`
        );
      }
      throw error;
    }
  }
}
