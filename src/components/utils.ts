import { Repository, ConceptMap } from '@/lib/repository';
import { UI } from './types';

/**
 * Transform Repository data to react-force-graph-2d format
 */

/**
 * Convert a ConceptMap to GraphData for visualization with articulated relationships
 */
export function transformToGraphData(conceptMap: ConceptMap): UI.GraphData {
  const visibleNodes = conceptMap.getVisibleNodes();
  const visibleEdges = conceptMap.getVisibleEdges();
  const activeNode = conceptMap.getActiveNode();
  const selectedNodes = new Set(conceptMap.getSelectedNodes());

  // Transform concept nodes
  const conceptNodeVisuals: UI.NodeVisual[] = visibleNodes.map(node => {
    const distance = conceptMap.getDistanceFromActive(node);
    const isActive = activeNode?.equals(node) ?? false;
    const isSelected = selectedNodes.has(node);
    
    return {
      id: node.id,
      name: node.id,
      node,
      nodeType: 'concept',
      highlighted: isActive,
      selected: isSelected,
      distance,
      color: getNodeColor(isActive, isSelected, distance)
    };
  });

  // Group edges by relationship to create relationship nodes
  const relationshipGroups = new Map<string, Repository.Edge[]>();
  visibleEdges.forEach(edge => {
    const key = edge.relationship;
    if (!relationshipGroups.has(key)) {
      relationshipGroups.set(key, []);
    }
    relationshipGroups.get(key)!.push(edge);
  });

  // Create relationship nodes
  const relationshipNodeVisuals: UI.NodeVisual[] = Array.from(relationshipGroups.entries()).map(([relationship, edges]) => {
    // Calculate distance as minimum distance from any connected concept
    const distances = edges.flatMap(edge => [
      conceptMap.getDistanceFromActive(edge.source),
      conceptMap.getDistanceFromActive(edge.target)
    ]);
    const minDistance = Math.min(...distances);
    
    return {
      id: `rel:${relationship}`,
      name: relationship,
      nodeType: 'relationship',
      highlighted: false,
      selected: false,
      distance: minDistance,
      color: '#ffffff' // White background for relationship nodes (styling handled in renderer)
    };
  });

  // Combine all nodes
  const allNodes = [...conceptNodeVisuals, ...relationshipNodeVisuals];

  // Create fanout edges: concept -> relationship -> concept
  const fanoutEdges: UI.EdgeVisual[] = [];
  
  relationshipGroups.forEach((edges, relationship) => {
    const relationshipNodeId = `rel:${relationship}`;
    
    edges.forEach(edge => {
      // Edge from source concept to relationship
      fanoutEdges.push({
        id: `${edge.source.id}-to-${relationshipNodeId}`,
        source: edge.source.id,
        target: relationshipNodeId,
        label: '',
        edge,
        highlighted: false,
        color: '#999',
        width: 1
      });
      
      // Edge from relationship to target concept
      fanoutEdges.push({
        id: `${relationshipNodeId}-to-${edge.target.id}`,
        source: relationshipNodeId,
        target: edge.target.id,
        label: '',
        edge,
        highlighted: false,
        color: '#999',
        width: 1
      });
    });
  });

  return {
    nodes: allNodes,
    links: fanoutEdges
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

// getEdgeColor removed - no longer needed with articulated relationships

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