import { Component } from '@angular/core';

// import { COMMON_NAMES } from '../common-names';

/**
 * Demo for using a custom Angular template.
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'app-demo-template',
  templateUrl: './demo-template.component.html'
})
export class DemoTemplateComponent {
  /** Sample object list for demo. */
  items = [
    {
      username: 'noah',
      name: 'Noah',
      img: '42143138'
    },
    {
      username: 'liam',
      name: 'Liam',
      img: '42143139'
    },
    {
      username: 'mason',
      name: 'Mason',
      img: '42143140'
    },
    {
      username: 'jacob',
      name: 'Jacob',
      img: '42143141'
    }
  ];
}
