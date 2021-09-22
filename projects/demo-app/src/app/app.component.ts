import { Component } from '@angular/core';

import { COMMON_NAMES } from './common-names';

/**
 * Demo app showing usage of the mentions directive.
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {

  /** A list of test items (names). */
  items = COMMON_NAMES;

  /** The path to use for e2e testing. */
  test = this.getPath();

  /**
   * Gets the path for e2e testing.
   *
   * @returns The path to use for testing.
   */
  private getPath(): string | null {
    // the path provides direct access to the tests for e2e testing
    switch (window.location.pathname) {
      case '/config': return 'config';
      case '/events': return 'events';
      case '/async': return 'async';
      case '/options': return 'options';
      case '/templates': return 'templates';
      case '/pos': return 'pos';
      default: return null;
    }
  }
}
