/**
 * Repository namespace for concept map graph data structures
 * 
 * Manages logical graph structure and navigation state with
 * object references between nodes and edges.
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Repository {
  /**
   * Represents a concept node in the graph
   */
  export class Node {
    constructor(
      public readonly id: string,
      public definition?: string
    ) {}

    /**
     * String representation for debugging
     */
    toString(): string {
      return `Node(${this.id})`;
    }

    /**
     * Equality comparison based on ID
     */
    equals(other: Node): boolean {
      return this.id === other.id;
    }
  }

  /**
   * Represents a directed edge between two nodes
   */
  export class Edge {
    public readonly id: string;

    constructor(
      public readonly source: Node,
      public readonly target: Node,
      public readonly relationship: string
    ) {
      // Generate unique ID from components
      this.id = `${source.id}--${relationship}-->${target.id}`;
    }

    /**
     * String representation for debugging
     */
    toString(): string {
      return `Edge(${this.source.id} --${this.relationship}--> ${this.target.id})`;
    }

    /**
     * Equality comparison based on ID
     */
    equals(other: Edge): boolean {
      return this.id === other.id;
    }
  }

  /**
   * Current filtering and navigation state
   */
  export interface FilterState {
    activeNode: Node | null;
    maxDistance: number;
    selectedNodes: Set<Node>;
    bidirectional: boolean;
    activeRelationship: string | null;
  }

  /**
   * Default filter state for new concept maps
   */
  export function createDefaultFilterState(): FilterState {
    return {
      activeNode: null,
      maxDistance: 2,
      selectedNodes: new Set(),
      bidirectional: true,
      activeRelationship: null
    };
  }
}