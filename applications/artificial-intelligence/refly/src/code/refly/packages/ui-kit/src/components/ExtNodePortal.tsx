import { Fragment, type ReactElement, useEffect, useRef, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';

interface ExtNodePortalActions {
  mount(node: ReactElement): void;
  unmount(node: ReactElement): void;
  replace(node: ReactElement, newNode: ReactElement): void;
}

const globalExtNodeMap = new WeakMap<ReactElement, { container: HTMLDivElement; root: Root }>();

let extNodePortalActions: ExtNodePortalActions = {
  mount(node) {
    if (globalExtNodeMap.has(node)) {
      return;
    }
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    root.render(node);
    globalExtNodeMap.set(node, { container, root });
  },
  unmount(node) {
    const extNode = globalExtNodeMap.get(node);
    if (!extNode) {
      return;
    }
    setTimeout(() => {
      extNode.root.unmount();
      if (extNode.container.parentNode) {
        extNode.container.parentNode.removeChild(extNode.container);
      }
      globalExtNodeMap.delete(node);
    }, 0);
  },
  replace(node, newNode) {
    const extNode = globalExtNodeMap.get(node);
    if (!extNode) {
      return;
    }
    extNode.root.render(newNode);
    globalExtNodeMap.delete(node);
    globalExtNodeMap.set(newNode, extNode);
  },
};

export function mountExtNode(node: ReactElement): void {
  extNodePortalActions.mount(node);
}

export function unmountExtNode(node: ReactElement): void {
  extNodePortalActions.unmount(node);
}

export function replaceExtNode(node: ReactElement, newNode: ReactElement): void {
  extNodePortalActions.replace(node, newNode);
}

const extNodeKeyMap = new WeakMap<ReactElement, number>();
let extNodeKeyCount = 0;

export function ExtNodePortal(): ReactElement {
  const [nodes, setNodes] = useState<ReactElement[]>([]);
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;

  useEffect(() => {
    extNodePortalActions = {
      mount(node) {
        if (nodesRef.current.includes(node)) {
          return;
        }
        extNodeKeyMap.set(node, ++extNodeKeyCount);
        setNodes((prev) => [...prev, node]);
      },
      unmount(node) {
        if (!nodesRef.current.includes(node)) {
          return;
        }
        setNodes((prev) => {
          const next = [...prev];
          next.splice(next.indexOf(node), 1);
          return next;
        });
        extNodeKeyMap.delete(node);
      },
      replace(node, newNode) {
        if (!nodesRef.current.includes(node)) {
          return;
        }
        extNodeKeyMap.set(newNode, extNodeKeyMap.get(node) ?? -1);
        setNodes((prev) => {
          const next = [...prev];
          next.splice(next.indexOf(node), 1, newNode);
          return next;
        });
        extNodeKeyMap.delete(node);
      },
    };
  }, []);

  return (
    <>
      {nodes.map((node) => {
        return <Fragment key={extNodeKeyMap.get(node)}>{node}</Fragment>;
      })}
    </>
  );
}
