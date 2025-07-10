import { describe, it, expect } from 'vitest';
import { parseDSL } from './parser';

describe('DSL Parser', () => {
  describe('Valid predicate parsing', () => {
    it('should parse simple predicate', () => {
      const input = 'software -- implements -> functionality';
      const result = parseDSL(input);
      
      expect(result.errors).toHaveLength(0);
      expect(result.predicates).toHaveLength(1);
      expect(result.predicates[0]).toEqual({
        source: 'software',
        relationship: 'implements',
        target: 'functionality'
      });
    });

    it('should trim whitespace around components', () => {
      const input = '  software  --  implements  ->  functionality  ';
      const result = parseDSL(input);
      
      expect(result.errors).toHaveLength(0);
      expect(result.predicates[0]).toEqual({
        source: 'software',
        relationship: 'implements',
        target: 'functionality'
      });
    });

    it('should parse multiple predicates', () => {
      const input = `software -- implements -> functionality
planning -- produces -> specification`;
      const result = parseDSL(input);
      
      expect(result.errors).toHaveLength(0);
      expect(result.predicates).toHaveLength(2);
    });

    it('should deduplicate identical predicates', () => {
      const input = `software -- implements -> functionality
software -- implements -> functionality`;
      const result = parseDSL(input);
      
      expect(result.errors).toHaveLength(0);
      expect(result.predicates).toHaveLength(1);
    });
  });

  describe('Valid definition parsing', () => {
    it('should parse simple definition', () => {
      const input = `software:
A computer program or system
---`;
      const result = parseDSL(input);
      
      expect(result.errors).toHaveLength(0);
      expect(result.definitions).toHaveProperty('software');
      expect(result.definitions.software).toBe('A computer program or system');
    });

    it('should parse multi-line definition', () => {
      const input = `software:
A computer program or system designed to
perform specific tasks and solve problems.
---`;
      const result = parseDSL(input);
      
      expect(result.errors).toHaveLength(0);
      expect(result.definitions.software).toBe('A computer program or system designed to\nperform specific tasks and solve problems.');
    });

    it('should handle definition terminator with whitespace', () => {
      const input = `software:
A computer program
   ---   `;
      const result = parseDSL(input);
      
      expect(result.errors).toHaveLength(0);
      expect(result.definitions.software).toBe('A computer program');
    });
  });

  describe('Mixed predicate and definition parsing', () => {
    it('should parse predicates and definitions together', () => {
      const input = `software -- implements -> functionality

software:
A computer program or system
---

functionality:
The intended behavior and capabilities
---`;
      const result = parseDSL(input);
      
      expect(result.errors).toHaveLength(0);
      expect(result.predicates).toHaveLength(1);
      expect(result.definitions).toHaveProperty('software');
      expect(result.definitions).toHaveProperty('functionality');
    });
  });

  describe('Syntax error handling', () => {
    it('should fail fast on invalid predicate syntax', () => {
      const input = 'software implements functionality';
      const result = parseDSL(input);
      
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('syntax');
      expect(result.errors[0].line).toBe(1);
      expect(result.predicates).toHaveLength(0);
    });

    it('should reject predicates with newlines', () => {
      const input = 'software\nprogram -- implements -> functionality';
      const result = parseDSL(input);
      
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Invalid predicate syntax');
    });

    it('should reject predicates with invalid tokens', () => {
      const input = 'soft--ware -- implements -> functionality';
      const result = parseDSL(input);
      
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Invalid tokens');
    });

    it('should reject empty components', () => {
      const input = ' -- implements -> functionality';
      const result = parseDSL(input);
      
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Empty components not allowed');
    });

    it('should reject empty source component', () => {
      const input = ' -- implements -> functionality';
      const result = parseDSL(input);
      
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Empty components not allowed');
    });

    it('should reject empty relationship component', () => {
      const input = 'software --  -> functionality';
      const result = parseDSL(input);
      
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Empty components not allowed');
    });

    it('should reject empty target component', () => {
      const input = 'software -- implements -> ';
      const result = parseDSL(input);
      
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Empty components not allowed');
    });

    it('should reject duplicate definitions', () => {
      const input = `software:
First definition
---

software:
Second definition
---`;
      const result = parseDSL(input);
      
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Duplicate definition');
    });

    it('should reject definitions without terminator', () => {
      const input = `software:
A computer program`;
      const result = parseDSL(input);
      
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Missing definition terminator');
    });
  });

  describe('Warning generation', () => {
    it('should warn about orphaned definitions', () => {
      const input = `software:
A computer program
---`;
      const result = parseDSL(input);
      
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].type).toBe('orphaned_definition');
      expect(result.warnings[0].message).toContain('not used in any predicates');
    });

    it('should warn about missing definitions', () => {
      const input = 'software -- implements -> functionality';
      const result = parseDSL(input);
      
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(2);
      expect(result.warnings.every(w => w.type === 'missing_definition')).toBe(true);
    });

    it('should not warn when definitions and predicates match', () => {
      const input = `software -- implements -> functionality

software:
A computer program
---

functionality:
The intended behavior
---`;
      const result = parseDSL(input);
      
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty input', () => {
      const result = parseDSL('');
      
      expect(result.errors).toHaveLength(0);
      expect(result.predicates).toHaveLength(0);
      expect(result.definitions).toEqual({});
      expect(result.warnings).toHaveLength(0);
    });

    it('should handle whitespace-only input', () => {
      const result = parseDSL('   \n\n   \n   ');
      
      expect(result.errors).toHaveLength(0);
      expect(result.predicates).toHaveLength(0);
      expect(result.definitions).toEqual({});
    });

    it('should handle concepts with spaces', () => {
      const input = 'software system -- implements -> user functionality';
      const result = parseDSL(input);
      
      expect(result.errors).toHaveLength(0);
      expect(result.predicates[0]).toEqual({
        source: 'software system',
        relationship: 'implements',
        target: 'user functionality'
      });
    });

    it('should handle relationships with spaces', () => {
      const input = 'software -- is composed of -> modules';
      const result = parseDSL(input);
      
      expect(result.errors).toHaveLength(0);
      expect(result.predicates[0].relationship).toBe('is composed of');
    });
  });
});