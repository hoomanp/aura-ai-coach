import React from 'react';

/**
 * Lightweight React Element inspection utility for Node / Jest TDD testing.
 * Traverses React Element trees without heavyweight DOM or simulator dependencies.
 */
export function getChildren(element: any): any[] {
  if (!element || typeof element !== 'object' || !element.props) return [];
  const children = element.props.children;
  if (!children) return [];
  if (Array.isArray(children)) return children.flat(Infinity).filter(Boolean);
  return [children];
}

export function findByType(element: any, typeName: string): any[] {
  const results: any[] = [];
  function search(node: any) {
    if (!node || typeof node !== 'object') return;
    const nodeTypeName = typeof node.type === 'string' 
      ? node.type 
      : (node.type?.displayName || node.type?.name);
    if (nodeTypeName === typeName) {
      results.push(node);
    }
    const children = getChildren(node);
    for (const child of children) {
      if (React.isValidElement(child)) {
        search(child);
      }
    }
  }
  search(element);
  return results;
}

export function extractAllText(element: any): string {
  let text = '';
  function search(node: any) {
    if (node === null || node === undefined) return;
    if (typeof node === 'string' || typeof node === 'number') {
      text += String(node) + ' ';
      return;
    }
    const children = getChildren(node);
    for (const child of children) {
      search(child);
    }
  }
  search(element);
  return text.replace(/\s+/g, ' ').trim();
}

let stateStore: any[] = [];
let stateIndex = 0;

export function setupMockHooks() {
  stateStore = [];
  stateIndex = 0;

  jest.spyOn(React, 'useState').mockImplementation((initial: any) => {
    const idx = stateIndex++;
    if (stateStore[idx] === undefined) {
      stateStore[idx] = typeof initial === 'function' ? initial() : initial;
    }
    const setState = (next: any) => {
      stateStore[idx] = typeof next === 'function' ? next(stateStore[idx]) : next;
    };
    return [stateStore[idx], setState];
  });

  jest.spyOn(React, 'useEffect').mockImplementation((fn: any) => {
    try {
      fn();
    } catch {}
  });

  jest.spyOn(React, 'useCallback').mockImplementation((fn: any) => fn);
  jest.spyOn(React, 'useMemo').mockImplementation((fn: any) => fn());
  jest.spyOn(React, 'useRef').mockImplementation((initial: any) => ({ current: initial }));
}

export function restoreMockHooks() {
  stateStore = [];
  stateIndex = 0;
  jest.restoreAllMocks();
}

