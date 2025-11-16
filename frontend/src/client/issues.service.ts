// Issues Service - 手动创建
import type { CancelablePromise } from './core/CancelablePromise';
import { OpenAPI } from './core/OpenAPI';
import { request as __request } from './core/request';

export interface IssueCreate {
  title: string;
  description?: string | null;
  repository_url?: string | null;
  issue_number?: number | null;
  priority?: number;
  assigned_node_id?: string | null;
  status?: string;
}

export interface IssueUpdate {
  title?: string | null;
  description?: string | null;
  repository_url?: string | null;
  issue_number?: number | null;
  status?: string | null;
  priority?: number | null;
  assigned_node_id?: string | null;
}

export interface IssuePublic {
  id: string;
  owner_id: string;
  title: string;
  description?: string | null;
  repository_url?: string | null;
  issue_number?: number | null;
  status: string;
  priority: number;
  assigned_node_id?: string | null;
  created_at: string;
  updated_at: string;
  started_at?: string | null;
  completed_at?: string | null;
  error_message?: string | null;
  result_branch?: string | null;
}

export interface IssuesPublic {
  data: IssuePublic[];
  count: number;
}

export class IssuesService {
  static readIssues(params: { skip?: number; limit?: number } = {}): CancelablePromise<IssuesPublic> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/v1/issues/',
      query: params,
    });
  }

  static createIssue(data: { requestBody: IssueCreate }): CancelablePromise<IssuePublic> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/v1/issues/',
      body: data.requestBody,
      mediaType: 'application/json',
    });
  }

  static readIssue(data: { id: string }): CancelablePromise<IssuePublic> {
    return __request(OpenAPI, {
      method: 'GET',
      url: `/api/v1/issues/${data.id}`,
    });
  }

  static updateIssue(data: { id: string; requestBody: IssueUpdate }): CancelablePromise<IssuePublic> {
    return __request(OpenAPI, {
      method: 'PUT',
      url: `/api/v1/issues/${data.id}`,
      body: data.requestBody,
      mediaType: 'application/json',
    });
  }

  static deleteIssue(data: { id: string }): CancelablePromise<void> {
    return __request(OpenAPI, {
      method: 'DELETE',
      url: `/api/v1/issues/${data.id}`,
    });
  }

  static getNextPendingIssue(): CancelablePromise<IssuePublic> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/v1/issues/pending/next',
    });
  }

  static processIssueWorkflow(data: { 
    id: string; 
    node_id: string;
  }): CancelablePromise<any> {
    return __request(OpenAPI, {
      method: 'POST',
      url: `/api/v1/issues/${data.id}/process`,
      query: { node_id: data.node_id },
    });
  }

  static commitAndPushIssue(data: { 
    id: string; 
    commit_message?: string | null;
  }): CancelablePromise<any> {
    return __request(OpenAPI, {
      method: 'POST',
      url: `/api/v1/issues/${data.id}/commit-push`,
      query: data.commit_message ? { commit_message: data.commit_message } : {},
    });
  }
}
