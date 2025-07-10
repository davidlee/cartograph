import { describe, it, expect, beforeEach } from 'vitest';
import { ConceptMap } from './concept-map';
import { parseDSL } from '../parser';

describe('ConceptMap', () => {
  let conceptMap: ConceptMap;

  beforeEach(() => {
    conceptMap = new ConceptMap('test-map');
  });

  describe('Node operations', () => {
    it('should add and retrieve nodes', () => {
      const node = conceptMap.addNode('software', 'A computer program');
      
      expect(node.id).toBe('software');
      expect(node.definition).toBe('A computer program');
      expect(conceptMap.getNode('software')).toBe(node);
    });

    it('should update node definition when adding existing node', () => {
      const node1 = conceptMap.addNode('software', 'Initial definition');
      const node2 = conceptMap.addNode('software', 'Updated definition');
      
      expect(node1).toBe(node2); // Same object reference
      expect(node1.definition).toBe('Updated definition');
    });

    it('should handle nodes without definitions', () => {
      const node = conceptMap.addNode('software');
      
      expect(node.id).toBe('software');
      expect(node.definition).toBeUndefined();
    });
  });

  describe('Edge operations', () => {
    it('should add and retrieve edges', () => {
      const source = conceptMap.addNode('software');
      const target = conceptMap.addNode('functionality');
      const edge = conceptMap.addEdge(source, target, 'implements');
      
      expect(edge.source).toBe(source);
      expect(edge.target).toBe(target);
      expect(edge.relationship).toBe('implements');
      expect(edge.id).toBe('software--implements-->functionality');
      expect(conceptMap.getEdge(edge.id)).toBe(edge);
    });

    it('should handle multiple edges between same nodes', () => {
      const source = conceptMap.addNode('software');
      const target = conceptMap.addNode('functionality');
      
      const edge1 = conceptMap.addEdge(source, target, 'implements');
      const edge2 = conceptMap.addEdge(source, target, 'provides');
      
      expect(edge1.id).toBe('software--implements-->functionality');
      expect(edge2.id).toBe('software--provides-->functionality');
      expect(edge1).not.toBe(edge2);
    });
  });

  describe('Navigation state', () => {
    it('should manage active node', () => {
      const node = conceptMap.addNode('software');
      
      expect(conceptMap.getActiveNode()).toBeNull();
      
      conceptMap.setActiveNode(node);
      expect(conceptMap.getActiveNode()).toBe(node);
      
      conceptMap.setActiveNode(null);
      expect(conceptMap.getActiveNode()).toBeNull();
    });

    it('should manage selected nodes', () => {
      const node1 = conceptMap.addNode('software');
      const node2 = conceptMap.addNode('functionality');
      
      expect(conceptMap.getSelectedNodes()).toHaveLength(0);
      
      conceptMap.addSelectedNode(node1);
      expect(conceptMap.getSelectedNodes()).toHaveLength(1);
      expect(conceptMap.getSelectedNodes()).toContain(node1);
      
      conceptMap.addSelectedNode(node2);
      expect(conceptMap.getSelectedNodes()).toHaveLength(2);
      
      conceptMap.removeSelectedNode(node1);
      expect(conceptMap.getSelectedNodes()).toHaveLength(1);
      expect(conceptMap.getSelectedNodes()).toContain(node2);
    });

    it('should manage filter settings', () => {
      expect(conceptMap.getMaxDistance()).toBe(2); // default
      expect(conceptMap.isBidirectional()).toBe(true); // default
      expect(conceptMap.getActiveRelationship()).toBeNull(); // default
      
      conceptMap.setMaxDistance(3);
      expect(conceptMap.getMaxDistance()).toBe(3);
      
      conceptMap.setBidirectional(false);
      expect(conceptMap.isBidirectional()).toBe(false);
      
      conceptMap.setActiveRelationship('implements');
      expect(conceptMap.getActiveRelationship()).toBe('implements');
    });
  });

  describe('Distance calculation', () => {
    beforeEach(() => {
      // Create a simple graph: A -> B -> C -> D
      const nodeA = conceptMap.addNode('A');
      const nodeB = conceptMap.addNode('B');
      const nodeC = conceptMap.addNode('C');
      const nodeD = conceptMap.addNode('D');
      
      conceptMap.addEdge(nodeA, nodeB, 'connects');
      conceptMap.addEdge(nodeB, nodeC, 'connects');
      conceptMap.addEdge(nodeC, nodeD, 'connects');
    });

    it('should calculate distance from active node', () => {
      const nodeA = conceptMap.getNode('A')!;
      const nodeB = conceptMap.getNode('B')!;
      const nodeC = conceptMap.getNode('C')!;
      const nodeD = conceptMap.getNode('D')!;
      
      conceptMap.setActiveNode(nodeA);
      
      expect(conceptMap.getDistanceFromActive(nodeA)).toBe(0);
      expect(conceptMap.getDistanceFromActive(nodeB)).toBe(1);
      expect(conceptMap.getDistanceFromActive(nodeC)).toBe(2);
      expect(conceptMap.getDistanceFromActive(nodeD)).toBe(3);
    });

    it('should return infinity when no active node', () => {
      const nodeA = conceptMap.getNode('A')!;
      
      expect(conceptMap.getDistanceFromActive(nodeA)).toBe(Infinity);
    });

    it('should respect bidirectional setting', () => {
      const nodeA = conceptMap.getNode('A')!;
      const nodeD = conceptMap.getNode('D')!;
      
      conceptMap.setActiveNode(nodeD);
      conceptMap.setBidirectional(true);
      expect(conceptMap.getDistanceFromActive(nodeA)).toBe(3);
      
      conceptMap.setBidirectional(false);
      expect(conceptMap.getDistanceFromActive(nodeA)).toBe(Infinity);
    });
  });

  describe('Filtering', () => {
    beforeEach(() => {
      // Create graph: A -> B -> C, A -> D
      const nodeA = conceptMap.addNode('A');
      const nodeB = conceptMap.addNode('B');
      const nodeC = conceptMap.addNode('C');
      const nodeD = conceptMap.addNode('D');
      
      conceptMap.addEdge(nodeA, nodeB, 'implements');
      conceptMap.addEdge(nodeB, nodeC, 'uses');
      conceptMap.addEdge(nodeA, nodeD, 'implements');
    });

    it('should return visible nodes within max distance', () => {
      const nodeA = conceptMap.getNode('A')!;
      
      conceptMap.setActiveNode(nodeA);
      conceptMap.setMaxDistance(1);
      
      const visibleNodes = conceptMap.getVisibleNodes();
      const nodeIds = visibleNodes.map(n => n.id).sort();
      
      expect(nodeIds).toEqual(['A', 'B', 'D']);
    });

    it('should return visible edges between visible nodes', () => {
      const nodeA = conceptMap.getNode('A')!;
      
      conceptMap.setActiveNode(nodeA);
      conceptMap.setMaxDistance(1);
      
      const visibleEdges = conceptMap.getVisibleEdges();
      const edgeIds = visibleEdges.map(e => e.id).sort();
      
      expect(edgeIds).toEqual(['A--implements-->B', 'A--implements-->D']);
    });

    it('should filter by active relationship', () => {
      const nodeA = conceptMap.getNode('A')!;
      
      conceptMap.setActiveNode(nodeA);
      conceptMap.setMaxDistance(3);
      conceptMap.setActiveRelationship('implements');
      
      const visibleNodes = conceptMap.getVisibleNodes();
      const nodeIds = visibleNodes.map(n => n.id).sort();
      
      expect(nodeIds).toEqual(['A', 'B', 'D']); // Only nodes connected by 'implements'
    });

    it('should include selected nodes and their neighbors', () => {
      const nodeC = conceptMap.getNode('C')!;
      
      conceptMap.addSelectedNode(nodeC);
      
      const visibleNodes = conceptMap.getVisibleNodes();
      const nodeIds = visibleNodes.map(n => n.id).sort();
      
      expect(nodeIds).toEqual(['B', 'C']); // C and its neighbor B
    });

    it('should return empty array when no active node or selected nodes', () => {
      const visibleNodes = conceptMap.getVisibleNodes();
      expect(visibleNodes).toHaveLength(0);
    });
  });

  describe('Factory method', () => {
    it('should create ConceptMap from parsed declarations', () => {
      const dsl = `software -- implements -> functionality
planning -- produces -> specification

software:
A computer program
---

functionality:
The intended behavior
---`;

      const parsed = parseDSL(dsl);
      const map = ConceptMap.fromParsedDeclarations('test', parsed);
      
      expect(map.name).toBe('test');
      expect(map.getAllNodes()).toHaveLength(4);
      expect(map.getAllEdges()).toHaveLength(2);
      
      const softwareNode = map.getNode('software')!;
      expect(softwareNode.definition).toBe('A computer program');
      
      const functionalityNode = map.getNode('functionality')!;
      expect(functionalityNode.definition).toBe('The intended behavior');
      
      // Nodes without definitions should still exist
      expect(map.getNode('planning')).toBeDefined();
      expect(map.getNode('specification')).toBeDefined();
    });
  });

  describe('DSL export', () => {
    it('should export to DSL format', () => {
      const nodeA = conceptMap.addNode('software', 'A computer program');
      const nodeB = conceptMap.addNode('functionality', 'The intended behavior');
      const nodeC = conceptMap.addNode('planning');
      
      conceptMap.addEdge(nodeA, nodeB, 'implements');
      conceptMap.addEdge(nodeC, nodeA, 'produces');
      
      const dsl = conceptMap.toDSL();
      
      expect(dsl).toContain('software -- implements -> functionality');
      expect(dsl).toContain('planning -- produces -> software');
      expect(dsl).toContain('software:');
      expect(dsl).toContain('A computer program');
      expect(dsl).toContain('functionality:');
      expect(dsl).toContain('The intended behavior');
      expect(dsl).toContain('---');
    });

    it('should handle concepts without definitions', () => {
      const nodeA = conceptMap.addNode('software');
      const nodeB = conceptMap.addNode('functionality');
      
      conceptMap.addEdge(nodeA, nodeB, 'implements');
      
      const dsl = conceptMap.toDSL();
      
      expect(dsl).toBe('software -- implements -> functionality');
    });
  });
});