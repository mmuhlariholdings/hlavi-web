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
}
