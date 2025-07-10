import { Repository, ConceptMap } from '@/lib/repository';
import { UI } from './types';

/**
 * Transform Repository data to react-force-graph-2d format
 */

/**
 * Convert a ConceptMap to GraphData for visualization
 */
export function transformToGraphData(conceptMap: ConceptMap): UI.GraphData {
  const visibleNodes = conceptMap.getVisibleNodes();
  const visibleEdges = conceptMap.getVisibleEdges();
  const activeNode = conceptMap.getActiveNode();
  const selectedNodes = new Set(conceptMap.getSelectedNodes());

  // Transform nodes
  const nodeVisuals: UI.NodeVisual[] = visibleNodes.map(node => {
    const distance = conceptMap.getDistanceFromActive(node);
    const isActive = activeNode?.equals(node) ?? false;
    const isSelected = selectedNodes.has(node);
    
    return {
      id: node.id,
      name: node.id,
      node,
      highlighted: isActive,
      selected: isSelected,
      distance,
      val: isActive ? 8 : (isSelected ? 6 : 4), // Size based on status
      color: getNodeColor(isActive, isSelected, distance)
    };
  });

  // Transform edges
  const edgeVisuals: UI.EdgeVisual[] = visibleEdges.map(edge => {
    const activeRelationship = conceptMap.getActiveRelationship();
    const isHighlighted = activeRelationship === edge.relationship;
    
    return {
      id: edge.id,
      source: edge.source.id,
      target: edge.target.id,
      label: edge.relationship,
      edge,
      highlighted: isHighlighted,
      color: getEdgeColor(isHighlighted),
      width: isHighlighted ? 3 : 1
    };
  });

  return {
    nodes: nodeVisuals,
    links: edgeVisuals
  };
}

/**
 * Get node color based on state
 */
function getNodeColor(isActive: boolean, isSelected: boolean, distance: number): string {
  if (isActive) return '#ff6b6b'; // Red for active
  if (isSelected) return '#4ecdc4'; // Teal for selected
  
  // Color by distance
  switch (distance) {
    case 0: return '#ff6b6b'; // Red (same as active)
    case 1: return '#ffd93d'; // Yellow
    case 2: return '#6bcf7f'; // Green
    default: return '#a8e6cf'; // Light green
  }
}

/**
 * Get edge color based on state
 */
function getEdgeColor(isHighlighted: boolean): string {
  return isHighlighted ? '#ff6b6b' : '#999';
}

/**
 * Select a random node from the concept map
 */
export function selectRandomNode(conceptMap: ConceptMap): Repository.Node | null {
  const allNodes = conceptMap.getAllNodes();
  if (allNodes.length === 0) {
    return null;
  }
  
  const randomIndex = Math.floor(Math.random() * allNodes.length);
  return allNodes[randomIndex];
}