// 手动补充 NodesService，前端调用后端 /nodes 相关接口
import type { CancelablePromise } from './core/CancelablePromise';
import { OpenAPI } from './core/OpenAPI';
import { request as __request } from './core/request';

export interface NodeCreate {
  name: string;
  ip: string;
  description?: string;
  tags?: string;
  status?: string;
}

export interface NodeUpdate {
  name?: string;
  ip?: string;
  description?: string;
  tags?: string;
  status?: string;
}

export interface NodePublic {
  id: string;
  name: string;
  ip: string;
  description?: string;
  tags?: string;
  status?: string;
  last_heartbeat?: string;
}

export interface NodesPublic {
  data: NodePublic[];
  count: number;
}

export interface RegistrationKeyPublic {
  registration_key: string;
  docker_command: string;
}

export class NodesService {
  static readNodes(params: { skip?: number; limit?: number } = {}): CancelablePromise<NodesPublic> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/v1/nodes/',
      query: params,
    });
  }

  static createNode(data: NodeCreate): CancelablePromise<NodePublic> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/api/v1/nodes/',
      body: data,
      mediaType: 'application/json',
    });
  }

  static readNode(id: string): CancelablePromise<NodePublic> {
    return __request(OpenAPI, {
      method: 'GET',
      url: `/api/v1/nodes/${id}`,
    });
  }

  static updateNode(id: string, data: NodeUpdate): CancelablePromise<NodePublic> {
    return __request(OpenAPI, {
      method: 'PUT',
      url: `/api/v1/nodes/${id}`,
      body: data,
      mediaType: 'application/json',
    });
  }

  static deleteNode(id: string): CancelablePromise<void> {
    return __request(OpenAPI, {
      method: 'DELETE',
      url: `/api/v1/nodes/${id}`,
    });
  }

  static getRegistrationKey(): CancelablePromise<RegistrationKeyPublic> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/v1/nodes/registration-key',
    });
  }
}
