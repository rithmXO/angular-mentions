import { Component } from '@angular/core';
import { COMMON_NAMES } from '../common-names';

/**
 * Component used for testing positions.
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'app-test-position',
  templateUrl: './test-position.component.html'
})
export class TestPositionComponent {
  /** A list of common names to use for testing. */
  items: string[] = COMMON_NAMES;

  /**
   * Returns a series of scroll values.
   *
   * @param element The element to have its scroll values returned.
   * @returns A series of scroll values.
   */
  scrollValues(element: HTMLElement): string {
    return `
      scrollLeft=${element.scrollLeft}; scrollWidth=${element.scrollWidth}
      scrollTop=${element.scrollTop}; scrollHeight=${element.scrollHeight}
    `;
  }
}
