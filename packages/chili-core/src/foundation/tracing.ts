import { v4 as uuidv4 } from "uuid";
import { IDisposable } from "./disposable";
import { IHistoryRecord } from "./history";

export type NodeId = string;

export interface TracingNode {
    id: NodeId;
    parentId: NodeId | null;
    children: NodeId[];
    meta?: { timestamp: number; label?: string };
    data?: IHistoryRecord;
}

/** Manages the user-operations tracing tree.
 *
 * @beta
 */
export class Tracing implements IDisposable {
    private nodes: Map<NodeId, TracingNode> = new Map();
    private currentId: NodeId;

    /**
     * Creates a new Tracing instance.
     *
     * @param data - Initial IHistoryRecord. Leave empty for new documents.
     * @param parent - Parent node ID.
     */
    constructor(data?: IHistoryRecord, parent?: NodeId) {
        const root: TracingNode = {
            id: uuidv4(),
            parentId: null,
            children: [],
            meta: { timestamp: Date.now() },
        };
        this.nodes.set(root.id, root);
        this.currentId = root.id;
    }

    /** Logs the current state for debugging. */
    update() {
        console.log(this.currentId, this.nodes);
    }

    /**
     * Adds a new history record as a child of the current node.
     */
    push(data: IHistoryRecord) {
        const node: TracingNode = {
            id: data.id,
            parentId: this.currentId,
            children: [],
            meta: { timestamp: Date.now() },
            data: data,
        };

        // Add child id into parent
        this.nodes.get(this.currentId)?.children.push(data.id);
        this.nodes.set(data.id, node);
        this.currentId = node.id;

        this.update();
    }

    /**
     * Is run when user calls undo.
     */
    undo() {
        const node = this.nodes.get(this.currentId)!;

        if (node.parentId != null) this.currentId = node.parentId;

        this.update();
    }

    /**
     * Is run when user calls redo.
     */
    redo(childId: NodeId) {
        this.currentId = childId;
        this.update();
    }

    /**
     * Serializes the tracing tree into a plain object.
     */
    serialize() {
        const nodes: Record<NodeId, TracingNode> = {};
        this.nodes.forEach((node, id) => {
            nodes[id] = node;
        });
        return nodes;
    }

    dispose() {
        this.nodes.clear();
    }
}
