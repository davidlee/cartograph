/**
 * Parser namespace for concept map DSL parsing
 * 
 * Handles parsing of two syntactic forms:
 * 1. Predicates: concept -- relationship -> concept
 * 2. Definitions: concept:\n<text>\n---
 * 
 * TODO: Add Unicode support for concept names and relationships
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Parser {
  /**
   * Represents a relationship between two concepts
   */
  export interface Predicate {
    source: string;
    relationship: string;
    target: string;
  }

  /**
   * Parse error with location information
   */
  export interface ParseError {
    line: number;
    column: number;
    message: string;
    type: 'syntax' | 'semantic';
  }

  /**
   * Parse warning for non-fatal issues
   */
  export interface ParseWarning {
    line: number;
    column: number;
    message: string;
    type: 'orphaned_definition' | 'missing_definition';
  }

  /**
   * Complete result of parsing a DSL text
   */
  export interface ParsedDeclarations {
    predicates: Predicate[];
    definitions: Record<string, string>;
    errors: ParseError[];
    warnings: ParseWarning[];
  }
}