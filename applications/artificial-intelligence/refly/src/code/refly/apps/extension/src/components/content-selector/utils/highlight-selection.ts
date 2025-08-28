import { INLINE_SELECTED_MARK_ID } from '@/components/content-selector/utils';

export function highlightSelection(xPath: string) {
  const selection = window.getSelection() as Selection;
  const selectedNodes = [];

  if (!selection) return [];

  if (selection?.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const selectedTextNodes = getTextNodesInRange(range);

    for (const { node, text, startOffset, endOffset } of selectedTextNodes) {
      const span = document.createElement('span');
      span.setAttribute(INLINE_SELECTED_MARK_ID, xPath);
      span.textContent = text; // put the selected text into the span

      const newNode = node.splitText(startOffset);
      newNode.splitText(endOffset - startOffset);
      newNode.parentNode.replaceChild(span, newNode); // replace the selected text node

      range.setStartAfter(span); // update the range
      selectedNodes.push(span);
    }

    // clear the selection
    selection.removeAllRanges();
  }

  return selectedNodes;
}

function getTextNodesInRange(range) {
  const textNodes = [];
  const startContainer = range.startContainer;
  const endContainer = range.endContainer;

  // get all text nodes in the range
  function traverseNodes(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (range.intersectsNode(node)) {
        let startOffset = 0;
        let endOffset = node.nodeValue.length;

        if (node === startContainer) {
          startOffset = range.startOffset;
        }
        if (node === endContainer) {
          endOffset = range.endOffset;
        }

        const text = node.nodeValue.substring(startOffset, endOffset);
        if (text.trim()) {
          textNodes.push({ node, text, startOffset, endOffset });
        }
      }
    } else {
      for (let i = 0; i < node.childNodes.length; i++) {
        traverseNodes(node.childNodes[i]);
      }
    }
  }

  // traverse all related nodes using range.commonAncestorContainer
  traverseNodes(range.commonAncestorContainer);

  return Array.from(new Set(textNodes));
}

export function removeHighlight(xPath: string) {
  const highlightedSpans = document.querySelectorAll(`span[${INLINE_SELECTED_MARK_ID}="${xPath}"]`);

  for (const span of highlightedSpans) {
    const parent = span.parentNode;
    const textContent = span.textContent;

    // create a new text node to replace the span
    const textNode = document.createTextNode(textContent);
    parent.replaceChild(textNode, span);

    // try to merge adjacent text nodes
    parent.normalize();
  }
}
