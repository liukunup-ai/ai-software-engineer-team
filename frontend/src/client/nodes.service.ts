import { NodesService as SDKNodesService } from "./sdk.gen"

export type { NodeCreate, NodePublic } from "./types.gen"

export class NodesService {
    /**
     * Read Nodes
     * 获取节点列表
     */
    public static readNodes(skip?: number, limit: number = 100) {
        return SDKNodesService.readNodes({ skip, limit })
    }

    /**
     * Create Node
     * 创建节点
     */
    public static createNode(requestBody: any) {
        return SDKNodesService.createNode({ requestBody })
    }

    /**
     * 获取或刷新注册密钥
     */
    public static getRegistrationKey() {
        return SDKNodesService.getRegistrationKey()
    }

    public static rotateRegistrationKey() {
        return SDKNodesService.rotateRegistrationKey()
    }

    public static registerNode(requestBody: any) {
        return SDKNodesService.registerNode({ requestBody })
    }

    public static nodeHeartbeat(requestBody: any) {
        return SDKNodesService.nodeHeartbeat({ requestBody })
    }

    public static readNode(id: string) {
        return SDKNodesService.readNode({ id })
    }

    public static updateNode(id: string, requestBody: any) {
        return SDKNodesService.updateNode({ id, requestBody })
    }

    public static deleteNode(id: string) {
        return SDKNodesService.deleteNode({ id })
    }

    public static executeCommandOnNode(id: string, requestBody: any) {
        return SDKNodesService.executeCommandOnNode({ id, requestBody })
    }
}
