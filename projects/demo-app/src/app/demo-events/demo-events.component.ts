import { Component } from '@angular/core';
import { COMMON_NAMES } from '../common-names';
import { MentionConfig } from 'projects/angular-mentions/src/public-api';
import { MentionItem } from 'projects/angular-mentions/src/lib/models';

/**
 * Demo component for events.
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'app-demo-events',
  templateUrl: './demo-events.component.html'
})
export class DemoEventsComponent {
  /** A list of common names to demo complex items in an object. */
  complexItems = COMMON_NAMES.map(name => ({ label: name }));

  /** */
  mentionConfig: MentionConfig = {
    configs: [
      {
        items: this.complexItems,
        returnTrigger: false
      }
    ]
  };

  /** The output to be displayed. */
  output = '';

  constructor() {
    this.log('Ready...');
  }

  /**
   * Logs text and an optional event.
   *
   * @param text The text to log.
   * @param event The event to log (optional).
   */
  log(text: string, event?: string | MentionItem): void {
    this.output = new Date().toISOString() + ' ' + text + (event ? ' ' + JSON.stringify(event) : '') + '\n' + this.output;
  }

  /**
   * Updates the mention config based on the checkbox state.
   *
   * @param event The checkbox change event.
   */
  updateConfig(event: Event): void {
    if (event.target) {
      this.mentionConfig.configs[0].returnTrigger = (event.target as HTMLInputElement).checked;
    }
  }
}
