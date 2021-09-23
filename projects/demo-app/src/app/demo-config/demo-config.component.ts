import { Component } from '@angular/core';
import { MentionConfig } from 'projects/angular-mentions/src/public-api';
import { COMMON_NAMES } from '../common-names';

/**
 * Demo component for complex configs.
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'app-demo-config',
  templateUrl: './demo-config.component.html'
})
export class DemoConfigComponent {

  /** Complex items to demo. */
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

  /**
   * Formats an item to all uppercase.
   *
   * @param item The item to be formatted.
   * @returns The formatted string.
   */
  format(item: Record<string, string>): string {
    return item['value'].toUpperCase();
  }

  /**
   * Filters the list of all items.
   *
   * @param searchString The search string entered by the user.
   * @param items The items to be filtered.
   * @returns A filtered list.
   */
  filter(searchString: string, items: Record<string, string>[]): Record<string, string>[] {
    return items.filter(item => item.name.toLowerCase().includes(searchString));
  }

  /** */
  mentionConfig: MentionConfig = {
    configs: [
      {
        items: this.complexItems,
        labelKey: 'name',
        triggerChar: '#',
        mentionSelect: this.format,
        mentionFilter: this.filter
      },
      {
        items: COMMON_NAMES,
        triggerChar: '@'
      }
    ]
  };

  /**
   * Adds a user to the complex items.
   */
  addUser(): void {
    const next = this.complexItems.length + 1;
    this.complexItems.push({
      value: 'user' + next,
      email: 'user' + next + '@domain.com',
      name: 'User ' + next
    });
    this.mentionConfig = Object.assign({}, this.mentionConfig);
  }
}
