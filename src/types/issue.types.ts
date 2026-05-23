export interface CreateIssueBody {
  title?: string;
  description?: string;
  type?: "bug" | "feature_request";
}

export interface UpdateIssueBody {
  title?: string;
  description?: string;
  type?: "bug" | "feature_request";
  status?: "open" | "in_progress" | "resolved";
}

export interface IssueReporter {
  id: number;
  name: string;
  role: string;
}
