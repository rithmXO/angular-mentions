import { Component, ElementRef, Output, EventEmitter, ViewChild, TemplateRef } from '@angular/core';
import { isInputOrTextAreaElement, getContentEditableCaretCoordinate, getCaretCoordinate } from '../helpers';
import { MentionItem, Coordinate } from '../models';

/**
 * Angular Mentions.
 */
@Component({
  selector: 'lib-mention-list',
  templateUrl: './mention-list.component.html',
  styleUrls: ['./mention-list.component.scss']
})
export class MentionListComponent {

  /** Reference to the `<ul>` element for the list of mention items. */
  @ViewChild('list', { static: true }) listElementRef?: ElementRef<HTMLUListElement>;

  /** Event emitted whenever a mention item is clicked. */
  @Output() itemClick = new EventEmitter();

  /** The field to be used as the item label (when the mention items are objects). */
  labelKey = 'label';

  /** Template to use for the look of items displayed in the mention list. */
  itemTemplate: TemplateRef<unknown> | null = null;

  /** The list of mention items to be displayed. */
  items: MentionItem[] = [];

  /** The index position of the active mention item. */
  activeIndex = 0;

  /** Whether the list of mention items is hidden. */
  hidden = false;

  /** Whether to display the mention items above the input. */
  dropUp = false;

  /** Whether to disable all encapsulated styles so other styles can be used instead. */
  styleOff = false;

  /** The coordinate for which to draw the element (absolute). */
  private coordinate: Coordinate = { top: 0, left: 0 };

  /** The offset to be applied to compensate for the parent's line height. */
  private offset = 0;

  /**
   * The active mention item.
   *
   * @returns The active mention item.
   */
  get activeItem(): MentionItem {
    return this.items[this.activeIndex];
  }

  constructor(private element: ElementRef<HTMLElement>) {}

  /**
   * Positions the element based on the parent node.
   *
   * @param nativeParentNode The parent node of the element.
   * @param iframe The `iframe` element to position instead of the element?
   */
  positionBasedOnParent(nativeParentNode: Node, iframe?: HTMLIFrameElement): void {
    if (isInputOrTextAreaElement(nativeParentNode)) {
      // parent elements need to have position:relative for this to work correctly?
      const selectionStart = nativeParentNode.selectionStart;
      if (!selectionStart) {
        throw new Error('Selection start was undefined.'); // Does this need to be an error?
      }
      this.coordinate = getCaretCoordinate(nativeParentNode, selectionStart);
      this.coordinate.top = nativeParentNode.offsetTop + this.coordinate.top - nativeParentNode.scrollTop;
      this.coordinate.left = nativeParentNode.offsetLeft + this.coordinate.left - nativeParentNode.scrollLeft;
      // getCretCoordinates() for text/input elements needs an additional offset to position the list correctly
      this.offset = this.getParentLineHeight(nativeParentNode);
    } else if (iframe) {
      this.coordinate = getContentEditableCaretCoordinate(iframe);
    } else {
      // Was this ever doing anything? If it's not an input, textarea, or iframe, then what is it and why are we doing this?

      // const doc = document.documentElement;
      // const scrollLeft = (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);
      // const scrollTop = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);
      // bounding rectangles are relative to view, offsets are relative to container?
      // const caretRelativeToView = getContentEditableCaretCoordinate(iframe);
      // const parentRelativeToContainer = nativeParentNode.getBoundingClientRect();
      // this.coords.top = caretRelativeToView.top - parentRelativeToContainer.top + nativeParentNode.offsetTop - scrollTop;
      // this.coords.left = caretRelativeToView.left - parentRelativeToContainer.left + nativeParentNode.offsetLeft - scrollLeft;
    }
    // set the default/initial position
    this.positionElement();
  }

  /**
   * Makes the next mention item in the list active.
   */
  activateNextItem(): void {
    // adjust scrollable-menu offset if the next item is out of view
    const listElement = this.getListElement();
    const activeEl = listElement.getElementsByClassName('active').item(0);
    if (activeEl) {
      const nextLiEl = activeEl.nextElementSibling as HTMLElement;
      if (nextLiEl && nextLiEl.nodeName === 'LI') {
        const nextLiRect = nextLiEl.getBoundingClientRect();
        if (nextLiRect.bottom > listElement.getBoundingClientRect().bottom) {
          listElement.scrollTop = nextLiEl.offsetTop + nextLiRect.height - listElement.clientHeight;
        }
      }
    }
    // select the next item
    this.activeIndex = Math.max(Math.min(this.activeIndex + 1, this.items.length - 1), 0);
  }

  /**
   * Makes the previous mention item in the list active.
   */
  activatePreviousItem(): void {
    // adjust the scrollable-menu offset if the previous item is out of view
    const listElement = this.getListElement();
    const activeEl = listElement.getElementsByClassName('active').item(0);
    if (activeEl) {
      const prevLiEl = activeEl.previousElementSibling as HTMLElement;
      if (prevLiEl && prevLiEl.nodeName === 'LI') {
        const prevLiRect = prevLiEl.getBoundingClientRect();
        if (prevLiRect.top < listElement.getBoundingClientRect().top) {
          listElement.scrollTop = prevLiEl.offsetTop;
        }
      }
    }
    // select the previous item
    this.activeIndex = Math.max(Math.min(this.activeIndex - 1, this.items.length - 1), 0);
  }

  // adjust scrollable-menu offset if the next item is out of view
  // private adjustScroll(direction: 'up' | 'down'): void {
  //   const listElement = this.getListElement();
  //   const activeListItem = listElement.getElementsByClassName('active').item(0);

  //   // Is there an active item?
  //   if (activeListItem) {
  //     const adjacentListItem = direction === 'up' ? activeListItem.previousElementSibling : activeListItem.nextElementSibling;

  //     // Is there an adjacent item?
  //     if (adjacentListItem && adjacentListItem.nodeName === 'LI') {
  //       const adjacentBoundingRect = adjacentListItem.getBoundingClientRect();


  //     }
  //   }
  // }

  /**
   * Resets scroll position and element position of the list element for a new mention search.
   */
  reset(): void {
    const listElement = this.getListElement();
    listElement.scrollTop = 0;
    this.checkBounds();
    this.positionElement();
  }

  /**
   * Ensures that the list element is within the page bounds.
   */
  private checkBounds(): void {
    const listElement = this.getListElement();
    const bounds = listElement.getBoundingClientRect();

    // if off right of page, align right
    if (bounds.left + bounds.width > window.innerWidth) {
      this.coordinate.left -= bounds.left + bounds.width - window.innerWidth + 10;
    }

    // if more than half off the bottom of the page, force dropUp
    // if ((bounds.top+bounds.height/2)>window.innerHeight) {
    //   dropUp = true;
    // }

    // if top is off page, disable dropUp
    if (bounds.top < 0) {
      this.dropUp = false;
    }
  }

  /**
   * Positions the element for the mention list pane.
   */
  private positionElement(): void {
    const element = this.element.nativeElement;
    this.coordinate.top += this.dropUp ? 0 : this.offset; // top of list is next line

    // TODO: Do we really need an `ElementRef` for this? Is this just applying styles to the component element?
    element.className = this.dropUp ? 'dropup' : ''; // TODO: remove? does this do anything?
    element.style.position = 'absolute';
    element.style.left = this.coordinate.left + 'px';
    element.style.top = this.coordinate.top + 'px';
  }

  /**
   * Gets the line height from the styles of the parent `<input>` element.
   *
   * @param nativeParentElement The parent `<input>` element.
   * @returns The line height of the element.
   */
  private getParentLineHeight(nativeParentElement: Element): number {
    const parentStyles = window.getComputedStyle(nativeParentElement);
    return parseFloat(parentStyles.lineHeight);
  }

  /**
   * Gets the list element, if it exists.
   *
   * @returns The list `ul` list element.
   */
  private getListElement(): HTMLUListElement {
    if (!this.listElementRef) {
      throw new Error('List element reference is undefined.');
    }
    return this.listElementRef.nativeElement;
  }

  /**
   * Gets the font size from the styles of the parent `<input>` element.
   *
   * @param nativeParentElement The parent `<input>` element.
   * @returns The font size of the element.
   */
  // private getParentFontSize(nativeParentElement: HTMLInputElement): number {
  //   const parentStyles = window.getComputedStyle(nativeParentElement);
  //   return parseFloat(parentStyles.fontSize);
  // }

  // private getBlockCursorDimensions(nativeParentElement: HTMLInputElement) {
  //   const parentStyles = window.getComputedStyle(nativeParentElement);
  //   return {
  //     height: parseFloat(parentStyles.lineHeight),
  //     width: parseFloat(parentStyles.fontSize)
  //   };
  // }
}
