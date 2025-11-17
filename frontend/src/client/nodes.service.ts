import { NodesService as SDKNodesService } from './sdk.gen';
import type { NodePublic, NodeCreate, NodeUpdate, NodeRegister, NodeHeartbeat, CommandRequest } from './types.gen';

export type { NodePublic };

export class NodesService {
  /**
   * Read all nodes
   */
  static readNodes(skip?: number, limit?: number) {
    return SDKNodesService.readNodes({ skip, limit });
  }

  /**
   * Create a new node
   */
  static createNode(requestBody: NodeCreate) {
    return SDKNodesService.createNode({ requestBody });
  }

  /**
   * Get registration key for node
   */
  static getRegistrationKey() {
    return SDKNodesService.getRegistrationKey();
  }

  /**
   * Rotate registration key
   */
  static rotateRegistrationKey() {
    return SDKNodesService.rotateRegistrationKey();
  }

  /**
   * Register a new node
   */
  static registerNode(requestBody: NodeRegister) {
    return SDKNodesService.registerNode({ requestBody });
  }

  /**
   * Send node heartbeat
   */
  static nodeHeartbeat(requestBody: NodeHeartbeat) {
    return SDKNodesService.nodeHeartbeat({ requestBody });
  }

  /**
   * Read a node by ID
   */
  static readNode(id: string) {
    return SDKNodesService.readNode({ id });
  }

  /**
   * Update a node
   */
  static updateNode(id: string, requestBody: NodeUpdate) {
    return SDKNodesService.updateNode({ id, requestBody });
  }

  /**
   * Delete a node
   */
  static deleteNode(id: string) {
    return SDKNodesService.deleteNode({ id });
  }

  /**
   * Execute a command on a node
   */
  static executeCommandOnNode(id: string, requestBody: CommandRequest) {
    return SDKNodesService.executeCommandOnNode({ id, requestBody });
  }
}
