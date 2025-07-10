# CLAUDE.md

## Project Overview

**Cartograph** is a concept mapping web application built with Next.js. It enables users to create, edit, explore, and share interactive concept maps through a visual graph interface with filtering and navigation capabilities.

### Core Architecture

- **Frontend**: Next.js 15 with React 24, TypeScript, and Tailwind CSS v4
- **Visualization**: Planned to use react-force-graph-2d for interactive force-directed graphs
- **Storage**: Local storage for concept maps (with future plans for server-side storage)
- **Testing**: Planned to use Vitest, Playwright, and React Testing Library

### DSL (Domain Specific Language)

The app uses a textual DSL for concept maps with two syntactic forms:

1. **Predicates**: `concept -- relationship -> concept`
2. **Definitions**: 

```
concept: 
descriptive text
---
   ```

## Development Commands

```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run ESLint
npm run lint

# Enter Nix development environment (if using Nix)
nix-shell
```

## Development Environment

- **Node.js**: v24 (specified in shell.nix)
- **Package Manager**: npm (package-lock.json present)
- **Nix Environment**: via shell.nix for consistent development setup; auto-setup using nix-direnv (.envrc)

## Project Structure

- `src/app/`: Next.js App Router structure
  - `layout.tsx`: Root layout with Geist fonts
  - `page.tsx`: Main application page
  - `globals.css`: Global styles with Tailwind and CSS variables
- `doc/`: Project documentation including specifications and workflow
- `kanban/`: Task management system with backlog, in-progress, and done folders
- `public/`: Static assets

## Key Configuration

- **TypeScript**: Strict mode enabled with path mapping (`@/*` → `./src/*`)
- **ESLint**: Uses Next.js core-web-vitals and TypeScript configurations
- **Tailwind CSS**: v4 with inline theme configuration and CSS variables
- **Fonts**: Geist Sans and Geist Mono from Google Fonts

## Workflow & Task Management

This project uses a DIY Kanban system with folders and Markdown files.

- **Kanban Structure**: 
  - `kanban/backlog/`: New tasks
  - `kanban/in-progress/`: Active tasks
  - `kanban/in-review/`: Completed tasks pending validation
  - `kanban/done/`: Verified completed tasks

- **Task Format**: Each task is a Markdown file with unique ID (e.g., `T023_task_name.md`)
- **Git Conventions**: Commits should reference task IDs using format `type(scope): [task-id] description` (conventional commits, plus task ID)
- **AI Role**: Act as senior developer/pair programmer, update task statuses, and follow the stopping conditions defined in workflow.md

 Read and closely follow the instructions in `doc/workflow.md` before beginning work on any task.

## Code Style & Conventions

- **TypeScript**: Strict mode with proper typing
- **React**: Functional components with hooks
- **CSS**: Tailwind utility classes with CSS custom properties for theming
- **Imports**: Use absolute imports with `@/` prefix for src directory
- **Fonts**: Use CSS variable references for consistent typography

## Planned Functionality

- provide a UI for exploring the currently active concept map as a force-directed, animated graph with spring weights, gravity & repulsive forces
- interactive controls for navigation
  - select a visible neighbour (on click), making it the active node
  - change the filter distance of the active concept map (n, where only neighbours with <= n distant neighbours are shown), e.g. with a slider control
  - shift-select a visible neighbouring node, highlighting it and adding its neighbours to those displayed.
  - search (text substring match) for nodes / edges, and
    - select a node to make it the active node
    - select an edge to make it active (visualise all predicates with that relationship text)
    - create a new predicate with the active node and the chosen node or relationship (e.g. by control-clicking)
  - hover over a node to display its definition
- general commands 
  - edit the current concept map as plain text
  - add a new predicate
  - export the active concept map as plain text (DSL)
  - import (replace active, append / merge, or create new) plain text DSL
  - edit and validate the active concept map as a plain text DSL
  - export / download the current view as an image (png)
  - toggle sidebar with definitions for any nodes shown (if defined)
  - list concept maps (in user's localstorage); select to change the active concept map

## Future Architecture Considerations

- **State Management**: Consider context or state management library for complex concept map data
- **Authentication**: Planned integration with Google, Twitter, Apple ID
- **Collaboration**: Real-time collaborative editing capabilities
- **Export/Import**: Image export and DSL text format handling

## Testing Strategy

Code should be accompanied by thorough tests.

When implementing tests:
- Use Vitest for unit testing
- Use Playwright for end-to-end testing
- Use React Testing Library for component testing
- Follow the test files structure that matches the source code organization