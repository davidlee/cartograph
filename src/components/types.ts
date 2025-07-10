import { Repository } from '@/lib/repository';

/**
 * UI namespace for visualization components
 * 
 * Transforms Repository data structures into formats suitable
 * for react-force-graph-2d visualization
 */
export namespace UI {
  /**
   * Visual representation of a node for rendering
   */
  export interface NodeVisual {
    id: string;
    name: string;
    node: Repository.Node;
    x?: number;
    y?: number;
    highlighted: boolean;
    selected: boolean;
    distance: number;
    val?: number; // Size for react-force-graph-2d
    color?: string;
  }

  /**
   * Visual representation of an edge for rendering
   */
  export interface EdgeVisual {
    id: string;
    source: string; // Node ID for react-force-graph-2d
    target: string; // Node ID for react-force-graph-2d
    label: string;
    edge: Repository.Edge;
    highlighted: boolean;
    color?: string;
    width?: number;
  }

  /**
   * Complete graph data structure for react-force-graph-2d
   */
  export interface GraphData {
    nodes: NodeVisual[];
    links: EdgeVisual[];
  }
}