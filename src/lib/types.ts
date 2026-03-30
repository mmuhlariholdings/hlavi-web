// Comment on a task, posted by a user or an AI agent
export interface TaskComment {
  id: string;
  author: string;      // GitHub username
  author_type: 'user' | 'agent';
  body: string;
  created_at: string;
  model?: string;      // Only set for agent comments
}

// Task Status enum matching Rust implementation
export type TaskStatus =
  | 'new'
  | 'open'
  | 'inprogress'
  | 'pending'
  | 'review'
  | 'done'
  | 'closed';

// Acceptance Criteria
export interface AcceptanceCriteria {
  id: number;
  description: string;
  completed: boolean;
  created_at: string;
  completed_at: string | null;
}

// Task structure (matches JSON)
export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  acceptance_criteria: AcceptanceCriteria[];
  created_at: string;
  updated_at: string;
  agent_assigned: boolean;
  autonomous: boolean;
  rejection_reason: string | null;
  start_date?: string | null;
  end_date?: string | null;
  parent?: string | null;
  blocks?: string[];
  rank?: number;
  effort?: number | null;
  /** AI model override for this task. Falls back to board config model, then workflow default. */
  model?: string | null;
  /** Comments from users and agents */
  comments?: TaskComment[];
}

// Board Configuration
export interface BoardColumn {
  name: string;
  status: TaskStatus;
  agent_enabled: boolean;
  agent_mode: 'attended' | 'unattended' | null;
}

export interface BoardConfig {
  name: string;
  /** Default AI model for autonomous tasks on this board. Overridden per-task via Task.model. */
  model?: string | null;
  columns: BoardColumn[];
}

export interface Board {
  config: BoardConfig;
  tasks: Record<string, string>;
  next_task_number: number;
}

// Repository selection
export interface Repository {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  description: string | null;
  private: boolean;
  html_url: string;
}

// GitHub Contents API response
export interface GitHubContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  type: 'file' | 'dir' | 'submodule' | 'symlink';
  download_url: string | null;
  content?: string;
  encoding?: string;
}
