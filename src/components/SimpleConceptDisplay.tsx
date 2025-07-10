'use client';

import { useEffect, useState, useCallback } from 'react';
import { Repository, ConceptMap } from '@/lib/repository';
import { selectRandomNode } from './utils';

interface SimpleConceptDisplayProps {
  conceptMap: ConceptMap;
}

/**
 * Simple text-based display of concept map for testing core functionality
 */
export function SimpleConceptDisplay({ conceptMap }: SimpleConceptDisplayProps) {
  const [selectedNode, setSelectedNode] = useState<Repository.Node | null>(null);
  const [visibleNodes, setVisibleNodes] = useState<Repository.Node[]>([]);
  const [visibleEdges, setVisibleEdges] = useState<Repository.Edge[]>([]);

  const updateDisplay = useCallback(() => {
    setVisibleNodes(conceptMap.getVisibleNodes());
    setVisibleEdges(conceptMap.getVisibleEdges());
  }, [conceptMap]);

  // Initialize with random node selection
  useEffect(() => {
    const randomNode = selectRandomNode(conceptMap);
    if (randomNode) {
      conceptMap.setActiveNode(randomNode);
      setSelectedNode(randomNode);
      updateDisplay();
    }
  }, [conceptMap, updateDisplay]);

  const handleNodeClick = (node: Repository.Node) => {
    conceptMap.setActiveNode(node);
    setSelectedNode(node);
    updateDisplay();
  };

  return (
    <div className="concept-display">
      <div className="mb-6 p-4 bg-blue-50 rounded">
        <h3 className="text-lg font-semibold mb-2">Concept Map: {conceptMap.name}</h3>
        <div className="text-sm text-gray-600">
          <p>Active Node: {selectedNode?.id || 'None'}</p>
          <p>Max Distance: {conceptMap.getMaxDistance()}</p>
          <p>Bidirectional: {conceptMap.isBidirectional() ? 'Yes' : 'No'}</p>
          <p>Total Nodes: {conceptMap.getAllNodes().length} | Visible: {visibleNodes.length}</p>
          <p>Total Edges: {conceptMap.getAllEdges().length} | Visible: {visibleEdges.length}</p>
        </div>
      </div>

      {selectedNode?.definition && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <h4 className="font-semibold text-yellow-800">{selectedNode.id}</h4>
          <p className="text-yellow-700">{selectedNode.definition}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-lg font-semibold mb-3">Visible Nodes</h4>
          <div className="space-y-2">
            {visibleNodes.map(node => {
              const distance = conceptMap.getDistanceFromActive(node);
              const isActive = selectedNode?.equals(node);
              
              return (
                <div 
                  key={node.id}
                  className={`p-3 rounded border cursor-pointer transition-colors ${
                    isActive 
                      ? 'bg-blue-100 border-blue-300' 
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                  onClick={() => handleNodeClick(node)}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-medium">{node.id}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      distance === 0 ? 'bg-red-100 text-red-700' :
                      distance === 1 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      Distance: {distance === Infinity ? '∞' : distance}
                    </span>
                  </div>
                  {node.definition && (
                    <p className="text-sm text-gray-600 mt-1">{node.definition.slice(0, 100)}...</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h4 className="text-lg font-semibold mb-3">Visible Relationships</h4>
          <div className="space-y-2">
            {visibleEdges.map(edge => (
              <div key={edge.id} className="p-3 bg-gray-50 border border-gray-200 rounded">
                <div className="text-sm">
                  <span className="font-medium">{edge.source.id}</span>
                  <span className="mx-2 text-gray-500">--{edge.relationship}--&gt;</span>
                  <span className="font-medium">{edge.target.id}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded">
        <h4 className="font-semibold mb-2">Instructions</h4>
        <p className="text-sm text-gray-600">
          Click on any visible node to make it the active node and see its neighbors. 
          The display shows nodes within distance {conceptMap.getMaxDistance()} of the active node.
        </p>
      </div>
    </div>
  );
}