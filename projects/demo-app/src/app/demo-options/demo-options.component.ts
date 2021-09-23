import { Component } from '@angular/core';

/**
 * Demo component for showing complex config items.
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'app-demo-options',
  templateUrl: './demo-options.component.html'
})
export class DemoOptionsComponent {

  /**
   * Formats an item to all uppercase.
   *
   * @param item The item to format.
   * @returns A formatted string.
   */
  format(item: Record<string, string>): string {
    return item['value'].toUpperCase();
  }

  /** Example list of complex items. */
  complexItems = [
    {
      value: 'user1',
      email: 'user1@domain.com',
      name: 'User One'
    },
    {
      value: 'user2',
      email: 'user2@domain.com',
      name: 'User Two'
    },
    {
      value: 'user3',
      email: 'user3@domain.com',
      name: 'User Three'
    }
  ];
}
