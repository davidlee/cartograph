'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Repository, ConceptMap } from '@/lib/repository';
import { UI } from './types';
import { transformToGraphData, selectRandomNode } from './utils';

// Physics and visual configuration - adjust these to tune the visualization
const PHYSICS_CONFIG = {
  // Graph filtering
  maxDistance: 2,             // Maximum distance from active node to show (0=only active, 1=direct neighbors, 2=2-hop, etc.)
  bidirectional: true,        // Whether to follow edges in both directions

  // Node forces and positioning
  nodeCharge: -20,           // Repulsive force between nodes (negative = repel)
  linkDistance: 40,           // Target distance between connected nodes
  linkStrength: 0.3,          // How strongly links pull nodes together (0-1)

  // Physics simulation
  alphaDecay: 0.04,           // How quickly the simulation cools down
  velocityDecay: 0.3,         // Friction applied to node movement
  cooldownTicks: 100,         // Simulation steps before considering "settled"

  // Visual sizing
  baseNodeSize: 8,            // Base size for nodes (used for force calculations)
  nodeSizeMultiplier: 1.0,    // Factor to scale node size by text content
  minNodeSize: 10,            // Minimum node size for force calculations
  maxNodeSize: 40,            // Maximum node size for force calculations

  // Text rendering
  baseFontSize: 12,           // Base font size for node labels
  minFontSize: 8,             // Minimum font size
  labelPadding: 4,            // Padding around text in nodes

  // Relationship nodes
  relationshipNodeColor: '#ffffff',  // Background color for relationship nodes (white)
  relationshipNodeBorder: '#666666', // Border color for relationship nodes
  relationshipNodeTextColor: '#333333', // Text color for relationship nodes
  relationshipNodeSize: 0.8,         // Size multiplier for relationship nodes
  fanoutDistance: 80,                // Distance for fanout edges from relationship nodes

  // Transition behavior
  transitionDuration: 1200,          // Duration of smooth transitions (ms)
  nodeSpawnRadius: 50,               // Radius around connected nodes for spawning new nodes
  fadeInStart: 0.2,                  // When new nodes start fading in (0-1)
  fadeInDuration: 0.6,               // How long fade in takes (0-1)
  fadeOutDuration: 0.8,              // How long fade out takes (0-1)
  linkFadeInStart: 0.3,              // When new links start fading in (0-1)
  linkFadeInDuration: 0.5,           // How long link fade in takes (0-1)
  linkFadeOutDuration: 0.7,          // How long link fade out takes (0-1)
};

// Dynamically import ForceGraph2D to avoid SSR issues
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-96">Loading graph...</div>
});

interface AdvancedConceptVisualizationProps {
  conceptMap: ConceptMap;
  width?: number;
  height?: number;
}

/**
 * Advanced force-directed graph visualization with smooth transitions
 * and relationship labels
 */
export function AdvancedConceptVisualization({
  conceptMap,
  width = 1000,
  height = 700
}: AdvancedConceptVisualizationProps) {
  const [graphData, setGraphData] = useState<UI.GraphData>({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState<Repository.Node | null>(null);
  const [transitionState, setTransitionState] = useState<UI.TransitionState | null>(null);

  // Use proper typing for the ForceGraph2D ref
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const graphRef = useRef<any>(null);

  // Update graph data with transition support
  const updateGraphData = useCallback(() => {
    const newGraphData = transformToGraphData(conceptMap);

    if (transitionState?.isTransitioning) {
      // Don't update during transitions
      return;
    }

    // Use a ref to get current graph data to avoid dependency loop
    setGraphData(currentGraphData => {
      // Start transition if data is significantly different
      const currentNodeIds = new Set(currentGraphData.nodes.map(n => n.id));
      const newNodeIds = new Set(newGraphData.nodes.map(n => n.id));
      const hasSignificantChange =
        currentNodeIds.size !== newNodeIds.size ||
        [...newNodeIds].some(id => !currentNodeIds.has(id));

      if (hasSignificantChange && currentGraphData.nodes.length > 0) {
        // Start smooth transition
        setTransitionState({
          isTransitioning: true,
          progress: 0,
          fromNodes: [...currentGraphData.nodes],
          toNodes: newGraphData.nodes,
          fromLinks: [...currentGraphData.links],
          toLinks: newGraphData.links,
          duration: PHYSICS_CONFIG.transitionDuration,
          startTime: Date.now()
        });
        return currentGraphData; // Don't update yet, transition will handle it
      } else {
        // Direct update for first load or minor changes
        return newGraphData;
      }
    });
  }, [conceptMap, transitionState]);

  // Handle smooth transitions
  useEffect(() => {
    if (!transitionState?.isTransitioning) return;

    const animate = () => {
      const elapsed = Date.now() - transitionState.startTime;
      const progress = Math.min(elapsed / transitionState.duration, 1);

      // Easing function for smooth animation
      const easedProgress = 1 - Math.pow(1 - progress, 3); // ease-out cubic

      // Interpolate between states
      const interpolatedData = interpolateGraphData(
        transitionState.fromNodes,
        transitionState.toNodes,
        transitionState.fromLinks,
        transitionState.toLinks,
        easedProgress
      );

      setGraphData(interpolatedData);

      if (progress >= 1) {
        // Transition complete
        setTransitionState(null);
      } else {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [transitionState]);

  // Initialize with random node selection and apply configuration
  useEffect(() => {
    // Apply distance configuration
    conceptMap.setMaxDistance(PHYSICS_CONFIG.maxDistance);
    conceptMap.setBidirectional(PHYSICS_CONFIG.bidirectional);

    const randomNode = selectRandomNode(conceptMap);
    if (randomNode) {
      conceptMap.setActiveNode(randomNode);
      setSelectedNode(randomNode);
    }
    updateGraphData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conceptMap]); // Remove updateGraphData from dependencies to prevent loops

  // Handle node click with smooth transition
  const handleNodeClick = useCallback((node: UI.NodeVisual) => {
    // Only handle concept nodes for navigation
    if (node.nodeType === 'concept' && node.node) {
      const repositoryNode = node.node;
      conceptMap.setActiveNode(repositoryNode);
      setSelectedNode(repositoryNode);
      updateGraphData();
    }
    // Relationship nodes are not clickable for navigation
  }, [conceptMap, updateGraphData]);

  // Handle node hover for tooltips
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleNodeHover = useCallback((_node: UI.NodeVisual | null) => {
    // Future: Implement tooltip system
  }, []);

  // Custom node rendering with enhanced visuals (rectangular records)
  const nodeCanvasObject = useCallback((node: UI.NodeVisual, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.name;
    const fontSize = Math.max(PHYSICS_CONFIG.baseFontSize / globalScale, PHYSICS_CONFIG.minFontSize);
    const padding = PHYSICS_CONFIG.labelPadding;

    ctx.font = `${fontSize}px Sans-Serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Measure text to determine rectangle size
    const textWidth = ctx.measureText(label).width;
    const textHeight = fontSize;

    // Calculate rectangle dimensions based on text content and node type
    const sizeMultiplier = node.nodeType === 'relationship' ? PHYSICS_CONFIG.relationshipNodeSize : 1.0;
    const rectWidth = (textWidth + 2 * padding) * sizeMultiplier;
    const rectHeight = (textHeight + 2 * padding) * sizeMultiplier;

    // Choose colors based on node type
    let backgroundColor = node.color || '#1f77b4';
    let textColor = '#fff';
    let borderColor = null;
    let borderWidth = 0;

    if (node.nodeType === 'relationship') {
      backgroundColor = PHYSICS_CONFIG.relationshipNodeColor;
      textColor = PHYSICS_CONFIG.relationshipNodeTextColor;
      borderColor = PHYSICS_CONFIG.relationshipNodeBorder;
      borderWidth = Math.max(1 / globalScale, 0.5);
    }

    // Apply opacity for smooth transitions
    const opacity = node.opacity ?? 1.0;
    ctx.globalAlpha = opacity;

    // Draw rectangular node background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(
      node.x! - rectWidth / 2,
      node.y! - rectHeight / 2,
      rectWidth,
      rectHeight
    );

    // Add border for relationship nodes or highlighted/selected concept nodes
    if (node.nodeType === 'relationship' && borderColor) {
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = borderWidth;
      ctx.strokeRect(
        node.x! - rectWidth / 2,
        node.y! - rectHeight / 2,
        rectWidth,
        rectHeight
      );
    } else if (node.highlighted || node.selected) {
      ctx.strokeStyle = node.highlighted ? '#ff0000' : '#00ff00';
      ctx.lineWidth = Math.max(2 / globalScale, 0.5);
      ctx.strokeRect(
        node.x! - rectWidth / 2,
        node.y! - rectHeight / 2,
        rectWidth,
        rectHeight
      );
    }

    // Draw text label inside the rectangle
    ctx.fillStyle = textColor;
    ctx.fillText(label, node.x!, node.y!);

    // Distance indicator (small rectangle in corner) - only for concept nodes
    if (node.nodeType === 'concept' && node.distance !== undefined && node.distance < Infinity) {
      const indicatorSize = Math.max(8 / globalScale, 4);
      ctx.fillStyle = getDistanceColor(node.distance);
      ctx.fillRect(
        node.x! + rectWidth / 2 - indicatorSize,
        node.y! - rectHeight / 2,
        indicatorSize,
        indicatorSize
      );
    }

    // Reset global alpha
    ctx.globalAlpha = 1.0;
  }, []);

  // Apply custom D3 forces when graph is ready
  const applyCustomForces = useCallback(() => {
    if (graphRef.current) {
      const graph = graphRef.current;
      // Set charge force (node repulsion)
      graph.d3Force('charge')?.strength(PHYSICS_CONFIG.nodeCharge);
      // Set link force distance and strength
      graph.d3Force('link')
        ?.distance(PHYSICS_CONFIG.linkDistance)
        .strength(PHYSICS_CONFIG.linkStrength);
      // Restart simulation to apply new forces
      graph.d3ReheatSimulation();
    }
  }, []);

  // Apply forces when graph data changes
  useEffect(() => {
    // Apply forces multiple times to ensure they take effect immediately
    const applyForcesRepeatedly = () => {
      applyCustomForces();
      // Apply again after a short delay to ensure it sticks
      setTimeout(() => applyCustomForces(), 50);
      setTimeout(() => applyCustomForces(), 150);
    };

    const timer = setTimeout(applyForcesRepeatedly, 10);
    return () => clearTimeout(timer);
  }, [graphData, applyCustomForces]);

  return (
    <div className="advanced-concept-visualization">
      <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-2 text-gray-800">
          {conceptMap.name}
          {transitionState?.isTransitioning && (
            <span className="ml-2 text-sm text-blue-600 animate-pulse">Transitioning...</span>
          )}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
          <div>
            <span className="font-medium">Active:</span> {selectedNode?.id || 'None'}
          </div>
          <div>
            <span className="font-medium">Nodes:</span> {graphData.nodes.length}
          </div>
          <div>
            <span className="font-medium">Edges:</span> {graphData.links.length}
          </div>
          <div>
            <span className="font-medium">Distance:</span> {conceptMap.getMaxDistance()}
          </div>
        </div>

        {selectedNode?.definition && (
          <div className="mt-3 p-3 bg-white rounded border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-1">{selectedNode.id}</h4>
            <p className="text-sm text-gray-700">{selectedNode.definition}</p>
          </div>
        )}
      </div>

      <div className="relative">
        {/* eslint-disable @typescript-eslint/no-explicit-any */}
        <ForceGraph2D
          ref={graphRef}
          graphData={graphData}
          width={width}
          height={height}
          nodeCanvasObject={nodeCanvasObject as any}
          nodeCanvasObjectMode={() => 'replace'}
          onNodeClick={handleNodeClick as any}
          onNodeHover={handleNodeHover as any}
          linkColor={(link: any) => {
            const edgeVisual = link as UI.EdgeVisual;
            const baseColor = edgeVisual.color || '#999';
            const opacity = edgeVisual.opacity ?? 1.0;

            // Convert hex color to rgba with opacity
            if (baseColor.startsWith('#')) {
              const r = parseInt(baseColor.slice(1, 3), 16);
              const g = parseInt(baseColor.slice(3, 5), 16);
              const b = parseInt(baseColor.slice(5, 7), 16);
              return `rgba(${r}, ${g}, ${b}, ${opacity})`;
            }
            return baseColor;
          }}
          linkWidth={(link: any) => (link as UI.EdgeVisual).width || 1}
          nodeVal={(node: any) => {
            const nodeVisual = node as UI.NodeVisual;
            const label = nodeVisual.name;
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d')!;
            ctx.font = `${PHYSICS_CONFIG.baseFontSize}px Sans-Serif`;
            const textWidth = ctx.measureText(label).width;
            const textHeight = PHYSICS_CONFIG.baseFontSize;

            // Apply size multiplier for relationship nodes
            const sizeMultiplier = nodeVisual.nodeType === 'relationship' ? PHYSICS_CONFIG.relationshipNodeSize : 1.0;
            const rectWidth = (textWidth + 2 * PHYSICS_CONFIG.labelPadding) * sizeMultiplier;
            const rectHeight = (textHeight + 2 * PHYSICS_CONFIG.labelPadding) * sizeMultiplier;

            // For rectangles, use the diagonal as the "size" for force calculations
            const diagonal = Math.sqrt(rectWidth * rectWidth + rectHeight * rectHeight) / 2;
            return Math.max(
              PHYSICS_CONFIG.minNodeSize,
              Math.min(PHYSICS_CONFIG.maxNodeSize, diagonal)
            );
          }}
          linkDirectionalArrowLength={6}
          linkDirectionalArrowRelPos={1}
          backgroundColor="#ffffff"
          d3AlphaDecay={PHYSICS_CONFIG.alphaDecay}
          d3VelocityDecay={PHYSICS_CONFIG.velocityDecay}
          cooldownTicks={PHYSICS_CONFIG.cooldownTicks}
          enableNodeDrag={true}
          enableZoomInteraction={true}
          enablePanInteraction={true}
          onEngineStop={() => applyCustomForces()}
        />
        {/* eslint-enable @typescript-eslint/no-explicit-any */}
      </div>

      <div className="mt-4 text-sm text-gray-500 text-center">
        Click nodes to explore • Drag to reposition • Scroll to zoom
      </div>
    </div>
  );
}

// Helper function for sophisticated graph data interpolation during transitions
function interpolateGraphData(
  fromNodes: UI.NodeVisual[],
  toNodes: UI.NodeVisual[],
  fromLinks: UI.EdgeVisual[],
  toLinks: UI.EdgeVisual[],
  progress: number
): UI.GraphData {
  // Create maps for efficient lookup
  const fromNodeMap = new Map(fromNodes.map(n => [n.id, n]));
  const toNodeMap = new Map(toNodes.map(n => [n.id, n]));

  // Categorize nodes
  const stayingNodeIds = new Set([...fromNodeMap.keys()].filter(id => toNodeMap.has(id)));
  const enteringNodeIds = new Set([...toNodeMap.keys()].filter(id => !fromNodeMap.has(id)));
  const exitingNodeIds = new Set([...fromNodeMap.keys()].filter(id => !toNodeMap.has(id)));

  // Create interpolated nodes
  const interpolatedNodes: UI.NodeVisual[] = [];

  // Staying nodes: interpolate properties but keep positions stable
  stayingNodeIds.forEach(id => {
    const fromNode = fromNodeMap.get(id)!;
    const toNode = toNodeMap.get(id)!;

    interpolatedNodes.push({
      ...toNode, // Use target properties
      x: fromNode.x, // Keep current position
      y: fromNode.y,
      vx: fromNode.vx, // Keep current velocity
      vy: fromNode.vy,
      opacity: 1.0 // Full opacity
    });
  });

  // Entering nodes: fade in and position near connected nodes
  enteringNodeIds.forEach(id => {
    const toNode = toNodeMap.get(id)!;
    const opacity = Math.max(0, Math.min(1, (progress - PHYSICS_CONFIG.fadeInStart) / PHYSICS_CONFIG.fadeInDuration));

    // Find connected nodes that are already visible to spawn near them
    const connectedVisibleNodes = interpolatedNodes.filter(existingNode =>
      toLinks.some(link =>
        (link.source === id && link.target === existingNode.id) ||
        (link.target === id && link.source === existingNode.id)
      )
    );

    let spawnX = toNode.x;
    let spawnY = toNode.y;

    if (connectedVisibleNodes.length > 0) {
      // Spawn near the center of connected visible nodes
      const avgX = connectedVisibleNodes.reduce((sum, n) => sum + (n.x || 0), 0) / connectedVisibleNodes.length;
      const avgY = connectedVisibleNodes.reduce((sum, n) => sum + (n.y || 0), 0) / connectedVisibleNodes.length;

      // Add some randomness to avoid stacking
      const radius = PHYSICS_CONFIG.nodeSpawnRadius;
      spawnX = avgX + (Math.random() - 0.5) * radius;
      spawnY = avgY + (Math.random() - 0.5) * radius;
    }

    interpolatedNodes.push({
      ...toNode,
      x: spawnX,
      y: spawnY,
      opacity: opacity
    });
  });

  // Exiting nodes: fade out
  exitingNodeIds.forEach(id => {
    const fromNode = fromNodeMap.get(id)!;
    const opacity = Math.max(0, 1 - (progress / PHYSICS_CONFIG.fadeOutDuration));

    if (opacity > 0.01) { // Only include if still visible
      interpolatedNodes.push({
        ...fromNode,
        opacity: opacity
      });
    }
  });

  // Handle links similarly
  const fromLinkMap = new Map(fromLinks.map(l => [l.id, l]));
  const toLinkMap = new Map(toLinks.map(l => [l.id, l]));

  const interpolatedLinks: UI.EdgeVisual[] = [];

  // Staying links
  [...fromLinkMap.keys()].filter(id => toLinkMap.has(id)).forEach(id => {
    const toLink = toLinkMap.get(id)!;
    interpolatedLinks.push({
      ...toLink,
      opacity: 1.0
    });
  });

  // Entering links
  [...toLinkMap.keys()].filter(id => !fromLinkMap.has(id)).forEach(id => {
    const toLink = toLinkMap.get(id)!;
    const opacity = Math.max(0, Math.min(1, (progress - PHYSICS_CONFIG.linkFadeInStart) / PHYSICS_CONFIG.linkFadeInDuration));

    interpolatedLinks.push({
      ...toLink,
      opacity: opacity
    });
  });

  // Exiting links
  [...fromLinkMap.keys()].filter(id => !toLinkMap.has(id)).forEach(id => {
    const fromLink = fromLinkMap.get(id)!;
    const opacity = Math.max(0, 1 - (progress / PHYSICS_CONFIG.linkFadeOutDuration));

    if (opacity > 0.01) {
      interpolatedLinks.push({
        ...fromLink,
        opacity: opacity
      });
    }
  });

  return {
    nodes: interpolatedNodes,
    links: interpolatedLinks
  };
}

// Helper function for distance-based colors
function getDistanceColor(distance: number): string {
  switch (distance) {
    case 0: return '#ff6b6b'; // Red for active
    case 1: return '#ffd93d'; // Yellow for direct neighbors
    case 2: return '#6bcf7f'; // Green for 2-hop neighbors
    default: return '#a8e6cf'; // Light green for distant
  }
}
