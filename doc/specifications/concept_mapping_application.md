# Concept Mapping Tool - Technical Specification

## Introduction & Background

Concept maps are semi-structured knowledge graphs which describe relationships between concepts (ontologies). Concept maps are useful tools for learning and knowledge transfer (e.g. onboarding), as well as for promoting a common vocabulary and shared conceptual model of complex domains. As such, they have a role in software system design, especially when the software is built by multiple collaborators.

Concept maps are easy to represent in a textual DSL, and it's easy to convert such a DSL into a visual representation using general purpose graph visualization software like Graphviz.

A common problem with this approach is that concept maps very quickly become too complex to easily follow, due both to the overall number of nodes & connections; and the unrestricted nature of these connections (which can result in maps with e.g. many overlapping edges).

Concept maps are often much more easily interpreted when they can be filtered to only include a highlighted node and its immediate neighbours, or some variation thereof (e.g. nodes with < n intervening connections; or the union of several selected nodes and their nearest neighbours).

The application being built is intended to facilitate authoring, editing, exploring and sharing concept maps by providing an interactive interface which restricts the visibility of nodes and edges in this fashion.

## DSL Specification

The DSL has two syntactic forms: predicates and definitions.

### Predicate Syntax
```
concept -- relationship -> concept
```
- `concept` is a short unique identifier for a node
- `relationship` is a concise description for the edge
- Both may contain spaces, but not newlines or the tokens '--' or '->'
- Predicates end with a newline

### Definition Syntax
```
concept: 
descriptive text
---
```
- `concept` uniquely identifies a node
- `descriptive text` provides a definition or explanation which might be shown e.g. on hover
- Can contain newlines
- Terminated by a line consisting of "---" followed by a newline (other whitespace is ignored)

### Parser Rules
- Relationships are directional by default (A -> B is different from B -> A)
- Multiple relationships between the same pair of concepts are supported if the relationship text is unique
- Duplicate predicates (same source, relationship, and target) are de-duplicated
- Concepts without explicit definitions are still displayable (just without descriptive text)
- Predicates referencing undefined concepts are valid and create nodes implicitly
- Warning (non-fatal) when parsing a map which has nodes with a definition but not included in any predicates

## Technical Architecture

### Core Stack
- **Next.js 15** (App Router)
- **NodeJS 24** w. npm
- **TypeScript** (strict mode)
- **Tailwind CSS** (utility-first styling)
- **react-force-graph-2d** (graph visualization) - chosen for purpose-built 2D force-directed graphs with canvas rendering and d3-force physics engine
- **React 18** (concurrent features)
- **localStorage** (client-side persistence)

### Additional Dependencies
- **Zod** (schema validation)
- **Lucide React** (icons)
- **clsx** (conditional classes)

### Layered Architecture

The system is organized into three distinct layers with clear separation of concerns:

#### Layer 1: Parser
Responsible for converting DSL text into structured data.

```typescript
namespace Parser {
  interface Predicate {
    source: string;
    relationship: string;
    target: string;
  }

  interface ParsedDeclarations {
    predicates: Predicate[];
    definitions: Record<string, string>;
    errors: ParseError[];
    warnings: ParseWarning[];
  }

  interface ParseError {
    line: number;
    column: number;
    message: string;
    type: 'syntax' | 'semantic';
  }

  interface ParseWarning {
    line: number;
    column: number;
    message: string;
    type: 'orphaned_definition' | 'missing_definition';
  }

  function parseDSL(text: string): ParsedDeclarations;
}
```

#### Layer 2: Repository
Manages the logical graph structure and navigation state.

```typescript
namespace Repository {
  class Node {
    constructor(
      public readonly id: string,
      public definition?: string
    ) {}
  }

  class Edge {
    constructor(
      public readonly source: Node,
      public readonly target: Node,
      public readonly relationship: string
    ) {
      // Generate unique ID from components
      this.id = `${source.id}--${relationship}-->${target.id}`;
    }
    
    public readonly id: string;
  }

  interface FilterState {
    activeNode: Node | null;
    maxDistance: number;
    selectedNodes: Set<Node>;
    bidirectional: boolean;
    activeRelationship: string | null;
  }

  class ConceptMap {
    private nodes = new Map<string, Node>();
    private edges = new Map<string, Edge>();
    private filterState: FilterState;

    constructor(public readonly name: string) {
      this.filterState = {
        activeNode: null,
        maxDistance: 2,
        selectedNodes: new Set(),
        bidirectional: true,
        activeRelationship: null
      };
    }

    // Core graph operations
    addNode(id: string, definition?: string): Node;
    addEdge(source: Node, target: Node, relationship: string): Edge;
    getNode(id: string): Node | undefined;
    getEdge(id: string): Edge | undefined;
    
    // Navigation operations
    setActiveNode(node: Node | null): void;
    addSelectedNode(node: Node): void;
    removeSelectedNode(node: Node): void;
    
    // Query operations
    getVisibleNodes(): Node[];
    getVisibleEdges(): Edge[];
    getDistanceFromActive(node: Node): number;
    
    // Import/Export
    static fromParsedDeclarations(name: string, parsed: Parser.ParsedDeclarations): ConceptMap;
    toDSL(): string;
  }
}
```

#### Layer 3: UI
Handles presentation and user interaction.

```typescript
namespace UI {
  interface NodeVisual {
    node: Repository.Node;
    x: number;
    y: number;
    highlighted: boolean;
    selected: boolean;
    distance: number;
  }

  interface EdgeVisual {
    edge: Repository.Edge;
    source: NodeVisual;
    target: NodeVisual;
    highlighted: boolean;
  }

  interface GraphData {
    nodes: NodeVisual[];
    links: EdgeVisual[];
  }

  // React components
  function ConceptGraphVisualization({ conceptMap }: { conceptMap: Repository.ConceptMap }): JSX.Element;
  function GraphControls({ conceptMap }: { conceptMap: Repository.ConceptMap }): JSX.Element;
  function ConceptMapEditor({ conceptMap }: { conceptMap: Repository.ConceptMap }): JSX.Element;
}
```

## Functional Requirements Overview

### Core Visualization Features
- Force-directed, animated graph with spring weights, gravity & repulsive forces
- Physics parameters adjustable during prototyping (node repulsion, link strength, gravity center force, velocity decay)
- Complete regeneration of visualization after any change to active concept map predicates
- Best effort attempt to preserve active node selection when map structure changes

### Interactive Navigation Controls
- Select a visible neighbour, making it the active node
- Change the filter distance of the active concept map (n, where only neighbours with <= n distant neighbours are shown) via slider control
- Shift-select a visible neighbouring node, highlighting it and adding its neighbours to those displayed
- Toggle for bidirectional vs directional filtering (default: bidirectional)
- Successive shift-select of the same node toggles selection
- Search for nodes/edges with case-insensitive substring matching:
  - Select a node to make it the active node
  - Select an edge to make it active (visualize all predicates with that relationship text)
  - Create a new predicate with the active node and the chosen node or relationship (e.g. by control-clicking)
- Hover over a node to display its definition

### General Commands
- Edit the current concept map as plain text
- Add a new predicate
- Export the active concept map as plain text (DSL)
- Import (replace active, append/merge, or create new) plain text DSL
- Edit and validate the active concept map as a plain text DSL
- Export/download the current view as an image (PNG)
- Toggle sidebar with definitions for any nodes shown (collapsible/resizable)
- List concept maps (in user's localStorage); select to change the active concept map

### Validation & Error Handling
- DSL syntax validation on save and import
- Graceful handling of localStorage size limits with user feedback
- Display of total localStorage usage
- Non-fatal warnings for orphaned definitions
- Error boundaries for component crashes