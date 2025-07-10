---
task_id: T001
title: "Core Concept Map Parsing and Visualization"
type: "epic"
priority: "high"
status: "backlog"
created_date: "2025-01-10"
estimated_effort: "large"
related_tasks: []
dependencies: []
---

# T001: Core Concept Map Parsing and Visualization

## 1. Goal

Implement the foundational functionality to parse a textual concept map DSL and render a filtered visualization showing one randomly selected node and its direct neighbors using react-force-graph-2d.

This epic establishes the core three-layer architecture (Parser → Repository → UI) and demonstrates the complete data flow from DSL text to interactive visualization.

## 2. Acceptance Criteria

### 2.1 DSL Parser Implementation
- [ ] Parse predicate syntax: `concept -- relationship -> concept`
- [ ] Parse definition syntax: `concept:\ndescriptive text\n---`
- [ ] Handle syntax validation with line/column error reporting
- [ ] Generate warnings for orphaned definitions and missing definitions
- [ ] Support multiple relationships between same concept pairs (if relationship text differs)
- [ ] Deduplicate identical predicates automatically

### 2.2 Repository Layer Implementation
- [ ] Create Node and Edge classes with object references
- [ ] Implement ConceptMap class with core graph operations
- [ ] Build filtering logic for distance-based node visibility
- [ ] Add bidirectional/directional distance calculation
- [ ] Create factory method `ConceptMap.fromParsedDeclarations()`
- [ ] Implement `toDSL()` export method

### 2.3 Basic Visualization
- [ ] Transform Repository data to react-force-graph-2d format
- [ ] Render nodes with basic styling (circles with concept names)
- [ ] Render edges with relationship labels
- [ ] Implement node hover to show definitions (if available)
- [ ] Random node selection on initial load
- [ ] Filter display to show only selected node + direct neighbors

### 2.4 Example Data & Testing
- [ ] Create sample concept map DSL with 8-12 concepts
- [ ] Include both predicates and definitions in sample data
- [ ] Implement basic error handling for malformed DSL
- [ ] Manual verification that visualization correctly reflects DSL structure

## 3. Implementation Plan & Progress

### 3.1 Layer 1: Parser Implementation ✅
- [x] 3.1.1 Create `src/lib/parser/` directory structure
- [x] 3.1.2 Define TypeScript interfaces for Parser namespace
  - [x] 3.1.2.1 ParsedDeclarations interface with predicates/definitions/errors/warnings
  - [x] 3.1.2.2 ParseError interface with line/column/message/type
  - [x] 3.1.2.3 ParseWarning interface for orphaned/missing definitions
  - [x] 3.1.2.4 Predicate interface with source/relationship/target
- [x] 3.1.3 Implement predicate parsing with regex/string splitting
  - [x] 3.1.3.1 Parse `concept -- relationship -> concept` syntax
  - [x] 3.1.3.2 Validate no newlines in concept names or relationships
  - [x] 3.1.3.3 Validate no '--' or '->' tokens within concept/relationship text
  - [x] 3.1.3.4 Trim all whitespace around concepts and relationships
- [x] 3.1.4 Implement definition parsing with multi-line support
  - [x] 3.1.4.1 Parse `concept:\n<text>\n---` syntax
  - [x] 3.1.4.2 Support multi-line descriptive text
  - [x] 3.1.4.3 Handle `---` terminator with optional whitespace
  - [x] 3.1.4.4 Validate definition format and concept name consistency
  - [x] 3.1.4.5 Enforce single definition per concept (error on duplicates)
- [x] 3.1.5 Add syntax validation and error reporting
  - [x] 3.1.5.1 Report line/column numbers for syntax errors
  - [x] 3.1.5.2 Provide clear error messages for malformed syntax
  - [x] 3.1.5.3 Fail fast on first syntax error encountered
- [x] 3.1.6 Create warning system for orphaned/missing definitions
  - [x] 3.1.6.1 Warn about definitions without corresponding predicates
  - [x] 3.1.6.2 Warn about concepts in predicates without definitions (non-fatal)
- [x] 3.1.7 Write comprehensive unit tests for parser
  - [x] 3.1.7.1 Test valid predicate and definition parsing
  - [x] 3.1.7.2 Test syntax error cases with proper error reporting
  - [x] 3.1.7.3 Test warning generation for orphaned/missing definitions
  - [x] 3.1.7.4 Test edge cases (empty input, whitespace trimming, ASCII-only)
  - [x] 3.1.7.6 Test duplicate definition detection and rejection
  - [x] 3.1.7.5 Test duplicate predicate deduplication

### 3.2 Layer 2: Repository Implementation ✅
- [x] 3.2.1 Create `src/lib/repository/` directory structure
- [x] 3.2.2 Implement Node class with id and optional definition
- [x] 3.2.3 Implement Edge class with source/target object references
- [x] 3.2.4 Build ConceptMap class with graph operations
- [x] 3.2.5 Add distance calculation algorithms (BFS-based)
- [x] 3.2.6 Implement filtering logic for visible nodes/edges
- [x] 3.2.7 Create factory method from parsed declarations
- [x] 3.2.8 Add DSL export functionality
- [x] 3.2.9 Write unit tests for repository layer

### 3.3 Layer 3: UI Implementation
- [ ] 3.3.1 Install react-force-graph-2d dependency
- [ ] 3.3.2 Create `src/components/` directory structure
- [ ] 3.3.3 Implement data transformation utilities
- [ ] 3.3.4 Build ConceptGraphVisualization component
- [ ] 3.3.5 Add basic node rendering with concept names
- [ ] 3.3.6 Add edge rendering with relationship labels
- [ ] 3.3.7 Implement hover interactions for definitions
- [ ] 3.3.8 Add random node selection logic
- [ ] 3.3.9 Integrate filtering for neighbor visualization

### 3.4 Integration & Testing
- [ ] 3.4.1 Create sample concept map DSL file
- [ ] 3.4.2 Integrate all layers in main application page
- [ ] 3.4.3 Add error boundaries for component crashes
- [ ] 3.4.4 Test with various DSL inputs (valid/invalid)
- [ ] 3.4.5 Verify visualization accuracy against DSL structure
- [ ] 3.4.6 Write integration tests for complete flow

## 4. Roadblocks

None identified at planning stage.

## 5. Notes / Discussion Log

- **2025-01-10**: Initial task creation based on specifications review
- React-force-graph-2d chosen as specified in technical requirements
- Three-layer architecture enforced to maintain separation of concerns
- Focus on core functionality only - advanced features deferred to future tasks
- **2025-01-10**: Parser implementation decisions confirmed:
  - Fail fast on first syntax error encountered
  - Trim all whitespace around concepts and relationships
  - Enforce single definition per concept (error on duplicates)
  - ASCII-only for now, plan for Unicode support (add TODO comments)
  - Target: several hundred predicates, 1-2 paragraph definitions

## 6. Code Snippets & Artifacts

### Expected Project Structure
```
src/
├── lib/
│   ├── parser/
│   │   ├── index.ts
│   │   ├── types.ts
│   │   └── parser.test.ts
│   └── repository/
│       ├── index.ts
│       ├── types.ts
│       └── repository.test.ts
├── components/
│   ├── ConceptGraphVisualization.tsx
│   └── ConceptGraphVisualization.test.tsx
└── app/
    └── page.tsx (integration)
```

### Sample DSL for Testing
```
software -- implements -> functionality
software -- requires -> planning
planning -- produces -> specification
specification -- guides -> implementation
implementation -- creates -> software

software:
A computer program or system designed to perform specific tasks
---

planning:
The process of defining goals, strategies, and steps to achieve objectives
---

specification:
Detailed description of requirements, design, and behavior
---
```

## 7. Definition of Done

- [ ] All acceptance criteria met and verified
- [ ] Unit tests written with >90% coverage for parser and repository layers
- [ ] Integration test demonstrates complete DSL → visualization flow
- [ ] Code follows TypeScript strict mode and project conventions
- [ ] Documentation includes JSDoc for public APIs
- [ ] Error handling prevents crashes with malformed inputs
- [ ] Sample concept map loads and displays correctly
- [ ] Random node selection works with neighbor filtering
- [ ] Hover interactions show concept definitions where available