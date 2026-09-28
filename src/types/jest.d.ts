// Jest ambient type definitions
declare var describe: (name: string, fn: () => void) => void;
declare var it: (name: string, fn: () => void | Promise<void>) => void;
declare var test: (name: string, fn: () => void | Promise<void>) => void;

interface JestExpect {
  (actual: any): {
    toBe: (expected: any) => void;
    toEqual: (expected: any) => void;
    toBeDefined: () => void;
    toBeNull: () => void;
    toBeGreaterThan: (expected: number) => void;
    toBeGreaterThanOrEqual: (expected: number) => void;
    toBeLessThan: (expected: number) => void;
    toBeLessThanOrEqual: (expected: number) => void;
    toContain: (expected: string) => void;
    toHaveLength: (expected: number) => void;
    toBeCloseTo: (expected: number, precision?: number) => void;
    toHaveBeenCalled: () => void;
    toHaveBeenCalledWith: (...args: any[]) => void;
    not: any;
    [key: string]: any;
  };
  stringContaining: (str: string) => any;
  objectContaining: (obj: any) => any;
  arrayContaining: (arr: any[]) => any;
  any: (constructor: any) => any;
}

declare var expect: JestExpect;
declare var beforeEach: (fn: () => void | Promise<void>) => void;
declare var afterEach: (fn: () => void | Promise<void>) => void;
declare var beforeAll: (fn: () => void | Promise<void>) => void;
declare var afterAll: (fn: () => void | Promise<void>) => void;
declare var jest: {
  fn: (...args: any[]) => any;
  spyOn: (...args: any[]) => any;
  mock: (...args: any[]) => any;
  clearAllMocks: () => void;
  resetAllMocks: () => void;
  restoreAllMocks: () => void;
  useFakeTimers: () => void;
  useRealTimers: () => void;
  advanceTimersByTime: (ms: number) => void;
  runAllTimers: () => void;
  [key: string]: any;
};
