import { Repository } from '@/lib/repository';

/**
 * UI namespace for visualization components
 * 
 * Transforms Repository data structures into formats suitable
 * for react-force-graph-2d visualization. Types extend the library's
 * required NodeObject and LinkObject interfaces.
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace UI {
  /**
   * Visual representation of a node for rendering
   * Extends react-force-graph-2d's NodeObject interface
   */
  export interface NodeVisual {
    // Required by react-force-graph-2d
    id: string;
    x?: number;
    y?: number;
    vx?: number;
    vy?: number;
    fx?: number;
    fy?: number;
    
    // Our custom properties
    name: string;
    node?: Repository.Node; // Optional for relationship nodes
    nodeType: 'concept' | 'relationship';
    highlighted: boolean;
    selected: boolean;
    distance: number;
    val?: number; // Size for react-force-graph-2d
    color?: string;
    opacity?: number; // For smooth transitions
    
    // Allow additional properties from the library
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }

  /**
   * Visual representation of an edge for rendering
   * Extends react-force-graph-2d's LinkObject interface
   */
  export interface EdgeVisual {
    // Required by react-force-graph-2d
    source: string | NodeVisual; // Node ID or object
    target: string | NodeVisual; // Node ID or object
    
    // Our custom properties
    id: string;
    label: string;
    edge: Repository.Edge;
    highlighted: boolean;
    color?: string;
    width?: number;
    opacity?: number; // For smooth transitions
    
    // Allow additional properties from the library
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }

  /**
   * Complete graph data structure for react-force-graph-2d
   */
  export interface GraphData {
    nodes: NodeVisual[];
    links: EdgeVisual[];
  }

  /**
   * Transition state for smooth animations
   */
  export interface TransitionState {
    isTransitioning: boolean;
    progress: number; // 0-1
    fromNodes: NodeVisual[];
    toNodes: NodeVisual[];
    fromLinks: EdgeVisual[];
    toLinks: EdgeVisual[];
    duration: number;
    startTime: number;
  }
}