import { Octokit } from "@octokit/rest";
import { Task, Board, GitHubContent, Repository } from "./types";

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

  async checkHlaviDirectory(owner: string, repo: string): Promise<boolean> {
    try {
      await this.octokit.repos.getContent({
        owner,
        repo,
        path: ".hlavi",
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async getTaskFiles(owner: string, repo: string): Promise<GitHubContent[]> {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path: ".hlavi/tasks",
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

  async getTask(owner: string, repo: string, taskId: string): Promise<Task> {
    const { data } = await this.octokit.repos.getContent({
      owner,
      repo,
      path: `.hlavi/tasks/${taskId}.json`,
    });

    if ("content" in data && data.content) {
      const content = Buffer.from(data.content, "base64").toString("utf-8");
      return JSON.parse(content);
    }

    throw new Error("Failed to fetch task");
  }

  async getAllTasks(owner: string, repo: string): Promise<Task[]> {
    const files = await this.getTaskFiles(owner, repo);
    const tasks: Task[] = [];

    for (const file of files) {
      const taskId = file.name.replace(".json", "");
      try {
        const task = await this.getTask(owner, repo, taskId);
        tasks.push(task);
      } catch (error) {
        console.error(`Failed to fetch task ${taskId}:`, error);
      }
    }

    return tasks;
  }

  async getBoardConfig(owner: string, repo: string): Promise<Board | null> {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path: ".hlavi/board.json",
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
    updates: Partial<Task>
  ): Promise<Task> {
    // Get current file to retrieve SHA (required for updates)
    const { data: currentFile } = await this.octokit.repos.getContent({
      owner,
      repo,
      path: `.hlavi/tasks/${taskId}.json`,
    });

    if (!("sha" in currentFile)) {
      throw new Error("File not found");
    }

    // Get current task data
    const currentTask = await this.getTask(owner, repo, taskId);

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
    });

    return updatedTask;
  }

  async addAcceptanceCriteria(
    owner: string,
    repo: string,
    taskId: string,
    description: string
  ): Promise<Task> {
    const currentTask = await this.getTask(owner, repo, taskId);

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
    });
  }

  async toggleAcceptanceCriteria(
    owner: string,
    repo: string,
    taskId: string,
    criteriaId: number
  ): Promise<Task> {
    const currentTask = await this.getTask(owner, repo, taskId);

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
    });
  }

  async deleteAcceptanceCriteria(
    owner: string,
    repo: string,
    taskId: string,
    criteriaId: number
  ): Promise<Task> {
    const currentTask = await this.getTask(owner, repo, taskId);

    // Remove the specific criteria
    const updatedCriteria = currentTask.acceptance_criteria.filter(
      (ac) => ac.id !== criteriaId
    );

    return this.updateTask(owner, repo, taskId, {
      acceptance_criteria: updatedCriteria,
    });
  }

  async initializeHlavi(owner: string, repo: string): Promise<void> {
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
      rejection_reason: null,
      start_date: now,
      end_date: weekFromNow,
    };

    // Board configuration with the example task
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
      },
      next_task_number: 2,
    };

    try {
      // Create board.json
      await this.octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: ".hlavi/board.json",
        message: "Initialize Hlavi: Add board configuration",
        content: Buffer.from(JSON.stringify(defaultBoard, null, 2)).toString("base64"),
      });

      // Create example task
      await this.octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: ".hlavi/tasks/HLA1.json",
        message: "Initialize Hlavi: Add example task",
        content: Buffer.from(JSON.stringify(exampleTask, null, 2)).toString("base64"),
      });
    } catch (error) {
      console.error("Failed to initialize Hlavi:", error);
      throw new Error("Failed to initialize Hlavi directory structure");
    }
  }
}
