I'm building a web application / tool for concept mapping. Concept maps are semi-structured knowledge graphs which describe relationships between concepts (ontologies). Concept maps are useful tools for learning and knowledge transfer (e.g. onboarding), as well as for promoting a common volabulary and shared conceptual model of complex domains. As such, they have a role in software system design, especially when the software is built by multiple collaborators.

Concept maps are easy to represent in a textual DSL, and it's easy to convert such a DSL into a visual representation using general purpose graph visualization software like Graphviz.

A common problem with this approach is that concept maps very quicky become too complex to easily follow, due both to the overall number of nodes & connections; and the unrestricted nature of these connections (which can result in maps with e.g. many overlapping edges).

Concept maps are often much more easily interpreted when they can be filtered to only include a highlighted node and its immediate neighbours, or some variation thereof (e.g. nodes with < n intervening connections; or the union of several selected nodes and their nearest neighbours).

The application I'm building is intended to facilitate authoring, editing, exploring and sharing concept maps by providing an interactive interface which restricts the visibility of nodes and edges in this fashion.

DSL:
the DSL has two syntactic forms: predicates, and definitions.

predicate:
```
concept -- relationship -> concept
```
`concept` is a short unique identifier for a node; `relationship` is a concise description for the edge. Both may contain spaces, but not newlines or the tokens '--' or '->'. Predicates end with a newline.

definition:
```
concept: 
descriptive text
---
```
`concept` uniquely identifies a node; `descriptive text` provides a definition or explanation which might be shown e.g. on hover, can contain newlines, and is terminated by a line consisting of "---" followed by a newline (other whitespace is ignored).

Functionality:
The app will have several functions:
- provide a UI for exploring the currently active concept map as a force-directed, animated graph with spring weights, gravity & repulsive forces
- interactive controls for navigation
  - select a visible neighbour, making it the active node
  - change the filter distance of the active concept map (n, where only neighbours with <= n distant neighbours are shown), e.g. with a slider control
  - shift-select a visible neighbouring node, highlighting it and adding its neighbours to those displayed.
  - search for nodes / edges, and
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

stack:
- nextjs
- typescript
- tailwindcss
- react
- three.js / react-three-fiber
- localstorage
- git
- vitest, playwright, react testing library

future features:
- auth with google, twitter, apple ID
- server-side storage of concept maps
- sharing / collaborative editing 

---

Your task: turn the above into a clear, detailed and precise specification and implementation plan. Break it down into multiple steps; define each step as clearly as possible so that they can be delegated to an agent and the results verified against the specification. 

Be sure to ask any questions necessary to meet these goals; you may wish to incorporate the answers into a revised version of this document before producing the requested specification. Ensure the presence of automated testing and appropriate documentation, carefully consider the system's architecture to promote simplicity, maintainability, and idiomatic best practice (the principle of least surprise).

