// DOM element manipulation functions...

import { Coordinate, MentionItem } from '../models';

// TODO: Is an extra `iframe` parameter really required for most of these functions? Could we not just use the existing `node` param?
// An iframe IS a node, after all.

/**
 * Gets the value of a DOM node.
 *
 * @param node The DOM node for which to get the value.
 * @returns The string value of the DOM node.
 */
export function getValue(node: Node): string {
  if (isInputOrTextAreaElement(node)) {
    return node.value;
  }
  return node.textContent ?? '';
}

/**
 * Inserts text into a DOM node at a specified location.
 *
 * @param node The node for which to insert the value.
 * @param start The start point where the value should be inserted.
 * @param end The end point where the value should be inserted.
 * @param text The text to insert as the value.
 * @param iframe The `iframe` for which to insert the value (optional).
 * @param noRecursion Whether to recursively insert values (optional, defaults to false).
 */
export function insertValue(
  node: Node,
  start: number,
  end: number,
  text: string,
  iframe?: HTMLIFrameElement,
  noRecursion = false
): void {
  if (isTextElement(node)) {
    const elementText = getValue(node);
    const newText = elementText.substring(0, start) + text + elementText.substring(end, elementText.length);
    setValue(node, newText);
    setCaretPosition(node, start + text.length, iframe);
  } else if (!noRecursion) { // For the iframe
    const selectionObject = getTextSelection(iframe);
    if (selectionObject && selectionObject.rangeCount > 0) {
      const selRange = selectionObject.getRangeAt(0);
      const position = selRange.startOffset;
      const anchorNode = selectionObject.anchorNode;
      insertValue(anchorNode as HTMLInputElement, position - (end - start), position, text, iframe, true);
    }
  }
}

/**
 * Sets the `value` or `textContent` of the DOM node depending on the type of node.
 *
 * @param node The DOM node for which to set the value.
 * @param value The text to set on the node.
 */
function setValue(node: Node, value: string): void {
  if (isInputOrTextAreaElement(node)) {
    node.value = value;
  } else {
    node.textContent = value;
  }
}

/**
 * Determines if the mention items are all strings.
 *
 * @param mentionItems The array of mention items to check.
 * @returns True if all mentions items are strings.
 */
export function areMentionItemsStrings(mentionItems: MentionItem[]): mentionItems is string[] {
  if (!Array.isArray(mentionItems)) {
    return false;
  }
  if (mentionItems.some((item) => typeof item !== 'string')) {
    return false;
  }
  return true;
}

/**
 * Determines if the DOM node is an `<input>` or `<textarea>`.
 *
 * @param node The DOM node to check.
 * @returns True if the DOM node is an `<input>` or `<textarea>`.
 */
export function isInputOrTextAreaElement(node: Node): node is HTMLInputElement | HTMLTextAreaElement {
  return node && (node.nodeName === 'INPUT' || node.nodeName === 'TEXTAREA');
}

/**
 * Determines if a DOM node is used for text.
 *
 * @param node The DOM node to check.
 * @returns True if the DOM node is used for text.
 */
export function isTextElement(node: Node): node is HTMLInputElement | HTMLTextAreaElement | Text {
  return isInputOrTextAreaElement(node) || node.nodeName === '#text';
}

/**
 * Sets the position of the caret for the element.
 *
 * @param node The DOM node for which to set the caret position.
 * @param position The position in the text field to place the caret.
 * @param iframe The `iframe` for which to set the position instead of the node (optional).
 */
export function setCaretPosition(node: Node, position: number, iframe?: HTMLIFrameElement): void {
  if (isInputOrTextAreaElement(node) && node.selectionStart) {
    node.focus();
    node.setSelectionRange(position, position);
  } else {
    const range = getDocument(iframe).createRange();
    range.setStart(node, position);
    range.collapse(true);
    const sel = getTextSelection(iframe);
    sel.removeAllRanges();
    sel.addRange(range);
  }
}

/**
 * Gets the position of the text caret for a DOM node.
 *
 * @param node The DOM node for which to get the position.
 * @param iframe The `iframe` for which to get the position instead of the node (optional).
 * @returns The position of the text caret.
 */
export function getCaretPosition(node: Node, iframe?: HTMLIFrameElement): number {
  if (isInputOrTextAreaElement(node)) {
    const textElementValue = node.value;
    return textElementValue.slice(0, node.selectionStart ?? 0).length;
  } else {
    const iframeTextSelection = getTextSelection(iframe);
    if (iframeTextSelection.rangeCount > 0) {
      const selRange = iframeTextSelection.getRangeAt(0);
      const preCaretRange = selRange.cloneRange();
      preCaretRange.selectNodeContents(node);
      preCaretRange.setEnd(selRange.endContainer, selRange.endOffset);
      const position = preCaretRange.toString().length;
      return position;
    }
    throw new Error('Could not get caret position of an iframe selection range of 0.');
  }
}

// Based on ment.io functions...
//

/**
 * Gets the document for the page or for an `iframe`.
 *
 * @param iframe The `iframe` for which to get the document instead of the window (optional).
 * @returns The document object.
 */
function getDocument(iframe?: HTMLIFrameElement): Document {
  if (iframe && !iframe.contentWindow) {
    throw new Error('Could not get the document for an iframe content window that doesn\'t exist.');
  }
  return iframe?.contentWindow ? iframe.contentWindow.document : document;
}

/**
 * Gets the range of texted selected by the user from the window or `iframe`.
 *
 * @param iframe The `iframe` for which to get the text instead of the window (optional).
 * @returns The object for the selection.
 */
export function getTextSelection(iframe?: HTMLIFrameElement): Selection {
  const windowContext = iframe ? iframe.contentWindow : window;
  if (!windowContext) {
    throw new Error('A window context is needed to get the selection. This is most likely an error with an non-existent iframe.');
  }

  const selection = windowContext.getSelection();
  if (!selection) {
    throw new Error('There was no selection for the window context.');
  }
  return selection;
}

/**
 * Gets the coordinate of the content editable caret.
 *
 * @param iframe The `iframe` element for which to get the coordinate.
 * @returns The coordinate.
 */
export function getContentEditableCaretCoordinate(iframe: HTMLIFrameElement): Coordinate {
  const markerTextChar = '\ufeff';
  const markerId = 'sel_' + new Date().getTime() + '_' + Math.random().toString().substr(2);
  const document = getDocument(iframe);
  const textSelection = getTextSelection(iframe);
  const prevRange = textSelection.getRangeAt(0);

  // create new range and set position using prevRange
  const anchorNode = textSelection.anchorNode;
  if (!anchorNode) {
    throw new Error('Could not get an anchor node from the text selection.');
  }
  const range = document.createRange();
  range.setStart(anchorNode, prevRange.startOffset);
  range.setEnd(anchorNode, prevRange.startOffset);
  range.collapse(false);

  // Create the marker element containing a single invisible character
  // using DOM methods and insert it at the position in the range
  const markerElement = document.createElement('span');
  markerElement.id = markerId;
  markerElement.appendChild(document.createTextNode(markerTextChar));
  range.insertNode(markerElement);
  textSelection.removeAllRanges();
  textSelection.addRange(prevRange);

  const coordinate = localToRelativeCoordinate(iframe, markerElement);

  const markerElementParent = markerElement.parentNode;
  if (!markerElementParent) {
    throw new Error('Marker element does not have a parent node.'); // Not sure if this needs to be an error?
  }
  markerElementParent.removeChild(markerElement);
  return coordinate;
}

/**
 * Gets the relative coordinate of an iframe from the local coordinate.
 *
 * @param iframe The `iframe` element of which to get the relative coordinate.
 * @param element The `span` element used as a marker.
 * @returns The relative coordinate.
 */
function localToRelativeCoordinate(iframe: HTMLIFrameElement, element: HTMLSpanElement): Coordinate {
  const coordinate = {
    left: 0,
    top: element.offsetHeight
  };
  let currentElement: Element | null = element; // Index

  while (currentElement) {
    // If the iframe parent is the current element, stop
    if (iframe.offsetParent === currentElement) {
      break;
    }

    if (!(currentElement instanceof HTMLElement)) {
      throw new Error('The element is not an HTML element.');
    }

    // Update the coordinate, assuming element is HTML and not SVG
    coordinate.left += currentElement.offsetLeft + currentElement.clientLeft;
    coordinate.top += currentElement.offsetTop + currentElement.clientTop;

    // Set current element to next parent
    currentElement = currentElement.offsetParent;
  }

  currentElement = element;
  // While current element hasn't reached body and is not null
  while (currentElement !== getDocument().body && currentElement) {

    // If the iframe parent is the current element, stop
    if (iframe.offsetParent === currentElement) {
      break;
    }

    if (currentElement.scrollTop > 0) {
      coordinate.top -= currentElement.scrollTop;
    }
    if (currentElement.scrollLeft > 0) {
      coordinate.left -= currentElement.scrollLeft;
    }

    // Set current element to next parent
    currentElement = currentElement.parentElement;
  }
  return coordinate;
}
