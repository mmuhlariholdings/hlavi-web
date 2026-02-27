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
  rejection_reason: string | null;
  start_date?: string | null;
  end_date?: string | null;
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
