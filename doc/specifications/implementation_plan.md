# Concept Mapping Tool - Implementation Plan

## Draft Implementation Plan

This is intended to serve as an indicative high level plan, though it is not final or set in stone. 

This plan should be critically evaluated and reworked as necessary as the technical design and specifications are made more precise.

It is expected that this document will be replaced by more detailed tasks defined as per `doc/workflow.md`.

Note that this project is intended be developed by Claude Code / other agentic development tools.

### Phase 1: Core Foundation
**Goal:** Basic project structure and data management

#### Step 1.1: Project Setup
- Initialize Next.js 15 project with TypeScript and App Router
- Configure Tailwind CSS with custom theme
- Set up ESLint, Prettier, and TypeScript strict mode
- Create folder structure:
  ```
  src/
  ├── components/
  ├── lib/
  │   ├── parser/
  │   ├── repository/
  │   └── storage/
  ├── hooks/
  ├── types/
  └── app/
  ```
- Install dependencies: react-force-graph-2d, zod, lucide-react, clsx, @types/d3

#### Step 1.2: Parser Layer Implementation
- Create Parser namespace with all interfaces
- Implement DSL parser for predicate syntax (`concept -- relationship -> concept`)
- Implement DSL parser for definition syntax (`concept:\n<text>\n---`)
- Add validation logic for syntax rules
- Create error reporting system with line/column information
- Add warning system for orphaned definitions and missing definitions
- Build comprehensive test suite covering all DSL edge cases

#### Step 1.3: Repository Layer Implementation
- Implement Node and Edge classes with object references
- Build ConceptMap class with filtering logic
- Create distance calculation algorithms (bidirectional and directional)
- Add comprehensive query methods (getVisibleNodes, getVisibleEdges, getDistanceFromActive)
- Implement FilterState management
- Add ConceptMap factory method fromParsedDeclarations
- Create toDSL export method

#### Step 1.4: Storage Abstraction
- Build localStorage abstraction layer with:
  - Concept map CRUD operations
  - Storage size monitoring and reporting
  - Error handling for storage limits
  - Data migration utilities for schema changes
- Implement serialization/deserialization for ConceptMap objects

### Phase 2: Core Visualization
**Goal:** Basic force-directed graph with filtering

#### Step 2.1: UI Layer Foundation
- Create transformation from Repository to react-force-graph-2d format
- Implement NodeVisual and EdgeVisual interfaces
- Build GraphData generation with complete regeneration strategy
- Create ConceptGraphVisualization component
- Add basic node rendering with customizable appearance
- Add edge rendering with relationship labels
- Implement basic hover interactions for definition display

#### Step 2.2: Filtering System Implementation
- Implement distance-based filtering algorithm in Repository layer
- Add bidirectional/directional toggle functionality
- Create active node selection mechanism
- Build multi-select with shift-click (toggle behavior)
- Add visual indicators for selected/highlighted/active nodes
- Implement filter state persistence

#### Step 2.3: Physics Controls
- Add sliders for adjustable physics parameters:
  - Node repulsion force
  - Link strength
  - Gravity center force
  - Velocity decay
- Implement physics preset system for easy tuning
- Create GraphControls component
- Add real-time physics parameter updates

### Phase 3: Interactive Features
**Goal:** Full interaction suite and editing capabilities

#### Step 3.1: Navigation Controls
- Implement node clicking to change active focus
- Add search functionality with case-insensitive substring matching
- Create zoom/pan controls integration with react-force-graph-2d
- Build breadcrumb navigation for filter state
- Add keyboard navigation support

#### Step 3.2: Editing Interface
- Create ConceptMapEditor component with modal for DSL text editing
- Build inline predicate creation interface
- Add node/relationship deletion functionality
- Implement control-click for creating new predicates
- Add real-time DSL validation with error highlighting
- Create import/export functionality with merge options

#### Step 3.3: Enhanced Interactions
- Implement definition tooltips on node hover
- Create relationship label displays on edges
- Build context menus for quick actions
- Add keyboard shortcuts for common operations
- Implement click-and-drag node positioning

### Phase 4: UI/UX Polish
**Goal:** Professional interface with excellent usability

#### Step 4.1: Responsive Layout
- Create collapsible/resizable sidebar for definitions
- Build comprehensive control panel for physics/filtering
- Add status bar with graph statistics and storage usage
- Implement responsive design for desktop and tablet
- Add loading states and error boundaries

#### Step 4.2: Visual Design
- Design consistent color scheme with Tailwind CSS
- Create node/edge styling system with distance-based coloring
- Add smooth animation transitions for state changes
- Build professional loading states
- Implement accessibility features (proper ARIA labels, keyboard navigation)

#### Step 4.3: Export/Import Features
- Implement comprehensive DSL export functionality
- Create PNG image export using HTML5 Canvas
- Build import validation with detailed error reporting
- Add drag-and-drop file import interface
- Create import merge strategies (replace, append, create new)

### Phase 5: Advanced Features
**Goal:** Power user features and optimization

#### Step 5.1: Concept Map Management
- Build concept map list interface with localStorage integration
- Add concept map creation/deletion with confirmation dialogs
- Implement concept map duplication functionality
- Create concept map metadata editing (name, description)
- Add concept map search and filtering

#### Step 5.2: Advanced Filtering & Navigation
- Add relationship-based filtering (show all edges with specific relationship)
- Create compound filter combinations
- Build filter history/undo system
- Implement saved filter presets
- Add graph statistics and analysis tools

#### Step 5.3: Performance Optimization
- Implement efficient rendering for large graphs (1000+ nodes)
- Add progressive loading for complex concept maps
- Create efficient diff algorithms for updates
- Build performance monitoring and optimization
- Add virtualization for very large node sets

### Phase 6: Testing & Documentation
**Goal:** Production-ready quality assurance

#### Step 6.1: Comprehensive Testing
- Unit tests for all Parser, Repository, and UI modules (>95% coverage)
- Integration tests for complete user workflows
- Performance tests for large datasets (100+ and 1000+ nodes)
- Accessibility testing and compliance fixes
- Cross-browser compatibility testing

#### Step 6.2: Documentation
- Create comprehensive user guide with examples
- Build developer documentation for each layer
- Add inline help system and tooltips
- Create example concept maps for demonstration
- Document keyboard shortcuts and advanced features

#### Step 6.3: Production Readiness
- Fix all identified bugs and edge cases
- Optimize bundle size and loading performance
- Add comprehensive error monitoring
- Create production deployment configuration
- Implement analytics for usage tracking

## Quality Assurance

### Testing Strategy
- **Unit Tests:** Vitest for all utility functions and data transformations
- **Component Tests:** React Testing Library for UI components
- **Integration Tests:** Playwright for complete user workflows
- **Performance Tests:** Custom benchmarks for large datasets (100+ and 1000+ nodes)

### Code Quality Standards
- **TypeScript:** Strict mode with no `any` types allowed
- **Linting:** ESLint with strict rules and automatic fixes
- **Formatting:** Prettier with consistent team configuration
- **Documentation:** JSDoc for all public APIs and complex functions
- **Architecture:** Strict adherence to three-layer separation of concerns

### Performance Targets
- **Initial Load:** < 3 seconds on 3G connection
- **Graph Rendering:** < 500ms for 100 nodes, < 2s for 1000 nodes
- **Interaction Response:** < 100ms for all user actions
- **Memory Usage:** < 100MB for typical usage (100 nodes)
- **Storage Efficiency:** Efficient localStorage usage with compression

### Accessibility Requirements
- **WCAG 2.1 AA compliance** for all interactive elements
- **Keyboard navigation** for all functionality
- **Screen reader support** with proper ARIA labels
- **High contrast mode** compatibility
- **Focus management** for modal dialogs and dynamic content

### Browser Compatibility
- **Modern browsers only:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **No polyfills** required for target browsers
- **Canvas and ES6+ support** assumed
- **LocalStorage API** required for persistence

## Future Enhancements

### Authentication & Cloud Storage
- Google, Twitter, Apple ID authentication
- Server-side storage of concept maps
- Sharing and collaborative editing capabilities
- Real-time synchronization across devices

### Advanced Visualization
- Multiple layout algorithms (hierarchical, circular, force-directed variants)
- Graph clustering and community detection
- Temporal visualization for concept map evolution
- Export to various formats (SVG, PDF, GraphML)

### Collaboration Features
- Real-time collaborative editing
- Comment and annotation system
- Version history and branching
- Team workspace management