import { Parser } from '../parser';
import { Repository } from './types';

/**
 * Main concept map class managing graph structure and navigation state
 */
export class ConceptMap {
  private nodes = new Map<string, Repository.Node>();
  private edges = new Map<string, Repository.Edge>();
  private filterState: Repository.FilterState;

  constructor(public readonly name: string) {
    this.filterState = Repository.createDefaultFilterState();
  }

  // Core graph operations

  /**
   * Add a node to the graph or update existing node's definition
   */
  addNode(id: string, definition?: string): Repository.Node {
    const existingNode = this.nodes.get(id);
    if (existingNode) {
      // Update definition if provided
      if (definition !== undefined) {
        (existingNode as { definition?: string }).definition = definition;
      }
      return existingNode;
    }

    const node = new Repository.Node(id, definition);
    this.nodes.set(id, node);
    return node;
  }

  /**
   * Add an edge to the graph
   */
  addEdge(source: Repository.Node, target: Repository.Node, relationship: string): Repository.Edge {
    const edge = new Repository.Edge(source, target, relationship);
    this.edges.set(edge.id, edge);
    return edge;
  }

  /**
   * Get a node by ID
   */
  getNode(id: string): Repository.Node | undefined {
    return this.nodes.get(id);
  }

  /**
   * Get an edge by ID
   */
  getEdge(id: string): Repository.Edge | undefined {
    return this.edges.get(id);
  }

  /**
   * Get all nodes in the graph
   */
  getAllNodes(): Repository.Node[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Get all edges in the graph
   */
  getAllEdges(): Repository.Edge[] {
    return Array.from(this.edges.values());
  }

  // Navigation operations

  /**
   * Set the active node for filtering
   */
  setActiveNode(node: Repository.Node | null): void {
    this.filterState.activeNode = node;
  }

  /**
   * Get the current active node
   */
  getActiveNode(): Repository.Node | null {
    return this.filterState.activeNode;
  }

  /**
   * Add a node to the selection
   */
  addSelectedNode(node: Repository.Node): void {
    this.filterState.selectedNodes.add(node);
  }

  /**
   * Remove a node from the selection
   */
  removeSelectedNode(node: Repository.Node): void {
    this.filterState.selectedNodes.delete(node);
  }

  /**
   * Get all selected nodes
   */
  getSelectedNodes(): Repository.Node[] {
    return Array.from(this.filterState.selectedNodes);
  }

  /**
   * Set maximum distance for filtering
   */
  setMaxDistance(distance: number): void {
    this.filterState.maxDistance = Math.max(0, distance);
  }

  /**
   * Get maximum distance for filtering
   */
  getMaxDistance(): number {
    return this.filterState.maxDistance;
  }

  /**
   * Set bidirectional filtering mode
   */
  setBidirectional(bidirectional: boolean): void {
    this.filterState.bidirectional = bidirectional;
  }

  /**
   * Get bidirectional filtering mode
   */
  isBidirectional(): boolean {
    return this.filterState.bidirectional;
  }

  /**
   * Set active relationship filter
   */
  setActiveRelationship(relationship: string | null): void {
    this.filterState.activeRelationship = relationship;
  }

  /**
   * Get active relationship filter
   */
  getActiveRelationship(): string | null {
    return this.filterState.activeRelationship;
  }

  // Query operations

  /**
   * Calculate distance between two nodes using BFS
   */
  private calculateDistance(fromNode: Repository.Node, toNode: Repository.Node, bidirectional: boolean = true): number {
    if (fromNode.equals(toNode)) {
      return 0;
    }

    const visited = new Set<string>();
    const queue: { node: Repository.Node; distance: number }[] = [{ node: fromNode, distance: 0 }];
    visited.add(fromNode.id);

    while (queue.length > 0) {
      const { node: currentNode, distance } = queue.shift()!;

      // Get neighboring nodes
      const neighbors = this.getNeighbors(currentNode, bidirectional);

      for (const neighbor of neighbors) {
        if (neighbor.equals(toNode)) {
          return distance + 1;
        }

        if (!visited.has(neighbor.id)) {
          visited.add(neighbor.id);
          queue.push({ node: neighbor, distance: distance + 1 });
        }
      }
    }

    return Infinity; // No path found
  }

  /**
   * Get neighboring nodes for a given node
   */
  private getNeighbors(node: Repository.Node, bidirectional: boolean = true): Repository.Node[] {
    const neighbors = new Set<Repository.Node>();

    this.getAllEdges().forEach(edge => {
      if (edge.source.equals(node)) {
        neighbors.add(edge.target);
      }
      if (bidirectional && edge.target.equals(node)) {
        neighbors.add(edge.source);
      }
    });

    return Array.from(neighbors);
  }

  /**
   * Calculate distance from active node to given node
   */
  getDistanceFromActive(node: Repository.Node): number {
    if (!this.filterState.activeNode) {
      return Infinity;
    }
    return this.calculateDistance(this.filterState.activeNode, node, this.filterState.bidirectional);
  }

  /**
   * Get visible nodes based on current filter state
   */
  getVisibleNodes(): Repository.Node[] {
    const { activeNode, maxDistance, selectedNodes, activeRelationship } = this.filterState;

    // If no active node and no selected nodes, return empty array
    if (!activeNode && selectedNodes.size === 0) {
      return [];
    }

    const visibleNodes = new Set<Repository.Node>();

    // Add active node if it exists
    if (activeNode) {
      visibleNodes.add(activeNode);

      // Add nodes within maxDistance of active node
      this.getAllNodes().forEach(node => {
        const distance = this.getDistanceFromActive(node);
        if (distance <= maxDistance) {
          visibleNodes.add(node);
        }
      });
    }

    // Add selected nodes and their neighbors
    selectedNodes.forEach(selectedNode => {
      visibleNodes.add(selectedNode);

      // Add neighbors of selected nodes
      const neighbors = this.getNeighbors(selectedNode, this.filterState.bidirectional);
      neighbors.forEach(neighbor => {
        visibleNodes.add(neighbor);
      });
    });

    // Filter by active relationship if specified
    if (activeRelationship) {
      const relationshipNodes = new Set<Repository.Node>();
      
      this.getAllEdges().forEach(edge => {
        if (edge.relationship === activeRelationship) {
          relationshipNodes.add(edge.source);
          relationshipNodes.add(edge.target);
        }
      });

      // Only keep visible nodes that are part of the active relationship
      const filteredNodes = Array.from(visibleNodes).filter(node => 
        relationshipNodes.has(node)
      );
      return filteredNodes;
    }

    return Array.from(visibleNodes);
  }

  /**
   * Get visible edges based on current filter state
   */
  getVisibleEdges(): Repository.Edge[] {
    const visibleNodes = new Set(this.getVisibleNodes());
    const { activeRelationship } = this.filterState;

    return this.getAllEdges().filter(edge => {
      // Edge is visible if both source and target are visible
      const bothNodesVisible = visibleNodes.has(edge.source) && visibleNodes.has(edge.target);
      
      // Filter by active relationship if specified
      if (activeRelationship) {
        return bothNodesVisible && edge.relationship === activeRelationship;
      }

      return bothNodesVisible;
    });
  }

  // Factory method

  /**
   * Create a ConceptMap from parsed DSL declarations
   */
  static fromParsedDeclarations(name: string, parsed: Parser.ParsedDeclarations): ConceptMap {
    const conceptMap = new ConceptMap(name);

    // Add all concepts referenced in predicates as nodes
    const conceptIds = new Set<string>();
    parsed.predicates.forEach(predicate => {
      conceptIds.add(predicate.source);
      conceptIds.add(predicate.target);
    });

    // Add nodes with definitions
    conceptIds.forEach(id => {
      const definition = parsed.definitions[id];
      conceptMap.addNode(id, definition);
    });

    // Add edges
    parsed.predicates.forEach(predicate => {
      const sourceNode = conceptMap.getNode(predicate.source)!;
      const targetNode = conceptMap.getNode(predicate.target)!;
      conceptMap.addEdge(sourceNode, targetNode, predicate.relationship);
    });

    return conceptMap;
  }

  // Export functionality

  /**
   * Export the concept map to DSL format
   */
  toDSL(): string {
    const lines: string[] = [];

    // Export predicates
    this.getAllEdges().forEach(edge => {
      lines.push(`${edge.source.id} -- ${edge.relationship} -> ${edge.target.id}`);
    });

    // Add empty line between predicates and definitions
    if (this.getAllEdges().length > 0) {
      lines.push('');
    }

    // Export definitions
    this.getAllNodes().forEach(node => {
      if (node.definition) {
        lines.push(`${node.id}:`);
        lines.push(node.definition);
        lines.push('---');
        lines.push('');
      }
    });

    return lines.join('\n').trim();
  }
}