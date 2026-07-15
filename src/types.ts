export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  agentData?: {
    thought?: string;
    command?: string;
    tool?: string;
    terminalOutput?: string[];
    downloadUrl?: string | null;
  };
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

export interface AppSettings {
  userName: string;
  temperature: number;
  maxTokens: number;
  apiEndpoint: string;
  modelName: string;
  appIcon?: string;
  githubUsername?: string;
  githubRepo?: string;
  githubToken?: string;
  buildFramework?: "flutter" | "gradle";
}

export interface BuildStatus {
  status: "queued" | "in_progress" | "completed" | "no_runs" | "pushing";
  conclusion?: "success" | "failure" | "cancelled" | "timed_out" | null;
  run_html_url?: string;
  artifact_url?: string;
  artifact_name?: string;
  failure_reason?: string;
}
