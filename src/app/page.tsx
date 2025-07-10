'use client';

import { useEffect, useState } from 'react';
import { parseDSL } from '@/lib/parser';
import { ConceptMap } from '@/lib/repository';
import { SimpleConceptDisplay } from '@/components/SimpleConceptDisplay';

const SAMPLE_DSL = `software -- implements -> functionality
software -- requires -> planning
planning -- produces -> specification
specification -- guides -> implementation
implementation -- creates -> software
software -- depends on -> libraries
libraries -- provide -> utilities
utilities -- enhance -> functionality
functionality -- satisfies -> requirements
requirements -- come from -> users
users -- interact with -> interface
interface -- is part of -> software

software:
A computer program or system designed to perform specific tasks
and solve problems through automated processes
---

functionality:
The intended behavior and capabilities that software provides
to meet user needs and requirements
---

planning:
The process of defining goals, strategies, and steps to achieve
specific objectives in software development
---

specification:
Detailed description of requirements, design, and behavior
that guides the implementation process
---

implementation:
The actual coding and development process that transforms
specifications into working software
---

libraries:
Collections of pre-written code and functions that provide
common functionality for software development
---

utilities:
Helper functions and tools that simplify common programming
tasks and enhance development efficiency
---

requirements:
Formal statements of what the software must do to meet
user needs and business objectives
---

users:
People or systems that interact with and use the software
to accomplish their goals and tasks
---

interface:
The means by which users interact with software, including
user interfaces, APIs, and other interaction points
---`;

export default function Home() {
  const [conceptMap, setConceptMap] = useState<ConceptMap | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Parse the sample DSL
      const parsed = parseDSL(SAMPLE_DSL);
      
      if (parsed.errors.length > 0) {
        setError(`Parse errors: ${parsed.errors.map(e => e.message).join(', ')}`);
        return;
      }

      // Create concept map from parsed declarations
      const map = ConceptMap.fromParsedDeclarations('Software Development Concepts', parsed);
      
      // Set initial filter to show nodes within distance 1 of active node
      map.setMaxDistance(1);
      map.setBidirectional(true);
      
      setConceptMap(map);
      
      // Log some info for debugging
      console.log('Concept Map created:', {
        nodes: map.getAllNodes().length,
        edges: map.getAllEdges().length,
        warnings: parsed.warnings.length > 0 ? parsed.warnings : 'none'
      });
      
    } catch (err) {
      setError(`Failed to create concept map: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-red-600 mb-4">Error</h1>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!conceptMap) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading concept map...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Cartograph</h1>
          <p className="text-gray-600">
            Interactive concept map visualization showing software development concepts.
            Click on nodes to explore their neighbors.
          </p>
        </header>
        
        <main>
          <SimpleConceptDisplay conceptMap={conceptMap} />
        </main>
        
        <footer className="mt-6 text-sm text-gray-500">
          <p>
            Demo showing DSL parsing → Repository graph → Interactive visualization flow.
            Random node selected on load, showing node + direct neighbors.
          </p>
        </footer>
      </div>
    </div>
  );
}
