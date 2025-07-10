import { Parser } from './types';

/**
 * Main DSL parser implementation
 * 
 * TODO: Add Unicode support for concept names and relationships
 */

/**
 * Parse a single predicate line
 * Format: concept -- relationship -> concept
 */
function parsePredicate(line: string, lineNumber: number): Parser.Predicate {
  // First check for newlines in the entire line
  if (line.includes('\n')) {
    throw new Error(`Newlines not allowed in predicate components on line ${lineNumber}`);
  }

  // Check for predicate pattern: concept -- relationship -> concept
  const predicateMatch = line.match(/^(.*?)\s*--\s*(.*?)\s*->\s*(.*)$/);
  
  if (!predicateMatch) {
    throw new Error(`Invalid predicate syntax on line ${lineNumber}: ${line}`);
  }

  const [, rawSource, rawRelationship, rawTarget] = predicateMatch;

  // Trim all whitespace
  const source = rawSource.trim();
  const relationship = rawRelationship.trim();
  const target = rawTarget.trim();

  // Validate non-empty components
  if (!source || !relationship || !target) {
    throw new Error(`Empty components not allowed in predicate on line ${lineNumber}`);
  }

  // Validate no '--' or '->' tokens within concept/relationship text
  if (source.includes('--') || source.includes('->')) {
    throw new Error(`Invalid tokens in source concept on line ${lineNumber}: ${source}`);
  }
  if (relationship.includes('--') || relationship.includes('->')) {
    throw new Error(`Invalid tokens in relationship on line ${lineNumber}: ${relationship}`);
  }
  if (target.includes('--') || target.includes('->')) {
    throw new Error(`Invalid tokens in target concept on line ${lineNumber}: ${target}`);
  }

  return {
    source,
    relationship,
    target
  };
}

/**
 * Parse concept map DSL text
 * Fails fast on first syntax error
 */
export function parseDSL(text: string): Parser.ParsedDeclarations {
  const lines = text.split('\n');
  const predicates: Parser.Predicate[] = [];
  const definitions: Record<string, string> = {};
  const errors: Parser.ParseError[] = [];
  const warnings: Parser.ParseWarning[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) {
      i++;
      continue;
    }

    try {
      // Check if this is a definition start (concept:)
      if (line.endsWith(':')) {
        const conceptName = line.slice(0, -1).trim();
        
        if (!conceptName) {
          throw new Error(`Empty concept name in definition on line ${i + 1}`);
        }

        // Check for duplicate definition
        if (definitions[conceptName]) {
          throw new Error(`Duplicate definition for concept '${conceptName}' on line ${i + 1}`);
        }

        // Parse definition content
        i++; // Move to content lines
        const definitionLines: string[] = [];
        
        while (i < lines.length) {
          const contentLine = lines[i];
          
          // Check for definition terminator
          if (contentLine.trim() === '---') {
            break;
          }
          
          definitionLines.push(contentLine);
          i++;
        }

        // Validate we found the terminator
        if (i >= lines.length) {
          throw new Error(`Missing definition terminator '---' for concept '${conceptName}' starting on line ${i - definitionLines.length}`);
        }

        // Store definition (preserve internal formatting but trim overall)
        definitions[conceptName] = definitionLines.join('\n').trim();
        i++; // Move past the '---' line
      }
      // Otherwise, try to parse as predicate
      else {
        const predicate = parsePredicate(line, i + 1);
        predicates.push(predicate);
        i++;
      }
    } catch (error) {
      // Fail fast on first error
      errors.push({
        line: i + 1,
        column: 1,
        message: error instanceof Error ? error.message : String(error),
        type: 'syntax'
      });
      break;
    }
  }

  // If we have errors, return early (fail fast)
  if (errors.length > 0) {
    return {
      predicates: [],
      definitions: {},
      errors,
      warnings: []
    };
  }

  // Deduplicate predicates
  const uniquePredicates = predicates.filter((predicate, index) => {
    const predicateKey = `${predicate.source}--${predicate.relationship}-->${predicate.target}`;
    return predicates.findIndex(p => 
      `${p.source}--${p.relationship}-->${p.target}` === predicateKey
    ) === index;
  });

  // Generate warnings for orphaned definitions and missing definitions
  const conceptsInPredicates = new Set<string>();
  uniquePredicates.forEach(p => {
    conceptsInPredicates.add(p.source);
    conceptsInPredicates.add(p.target);
  });

  const definedConcepts = new Set(Object.keys(definitions));

  // Warn about definitions without predicates
  definedConcepts.forEach(concept => {
    if (!conceptsInPredicates.has(concept)) {
      warnings.push({
        line: 1, // TODO: Track actual line numbers for definitions
        column: 1,
        message: `Definition for '${concept}' exists but concept is not used in any predicates`,
        type: 'orphaned_definition'
      });
    }
  });

  // Warn about concepts in predicates without definitions (non-fatal)
  conceptsInPredicates.forEach(concept => {
    if (!definedConcepts.has(concept)) {
      warnings.push({
        line: 1, // TODO: Track actual line numbers for predicate usage
        column: 1,
        message: `Concept '${concept}' used in predicates but has no definition`,
        type: 'missing_definition'
      });
    }
  });

  return {
    predicates: uniquePredicates,
    definitions,
    errors,
    warnings
  };
}