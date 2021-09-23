import { Component, NgZone, Input, ViewChild } from '@angular/core';
import { Editor } from 'tinymce';
import { MentionDirective } from '../../../../angular-mentions/src/public-api';
import { COMMON_NAMES } from '../common-names';

/**
 * Angular 2 Mentions.
 * Example usage with TinyMCE.
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'app-demo-tinymce',
  template: `
    <div class="form-group" style="position:relative">
      <div [mentionItems]="items"></div>
      <div>
        <textarea class="hidden" cols="60" rows="4" id="tmce">{{ htmlContent }}</textarea>
      </div>
    </div>
    <editor [init]="CONFIG"></editor>
    `
})
export class DemoTinymceComponent {
  /** HTML content to be shown in the textarea. */
  @Input() htmlContent = '';

  /** Reference to the active mentionDirective. */
  @ViewChild(MentionDirective, { static: true }) mention!: MentionDirective;

  /** A list of common names for testing. */
  public items: string[] = COMMON_NAMES;

  /** The tinyMCE config object. */
  public CONFIG = {
    base_url: '/tinymce',
    suffix: '.min',
    height: 200,
    menubar: false,
    plugins: [
      'advlist autolink lists link image charmap print preview anchor',
      'searchreplace visualblocks code fullscreen',
      'insertdatetime media table paste code help wordcount'
    ],
    toolbar:
      'undo redo | formatselect | bold italic backcolor | \
      alignleft aligncenter alignright alignjustify | \
      bullist numlist outdent indent | removeformat | help',
    setup: this.tinySetup.bind(this)
  };

  constructor(private _zone: NgZone) { }

  /**
   * Sets up tinyMCE.
   *
   * @param ed The component.
   */
  tinySetup(ed: Editor): void {
    const editorIframeElement = ed.iframeElement;
    if (!editorIframeElement) {
      throw new Error('Iframe was null for TinyMCE demo.');
    }
    ed.on('init', () => {
      this.mention.setIframe(editorIframeElement);
    });
    ed.on('keydown', (event: KeyboardEvent) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const frame = (window.frames as any)[editorIframeElement.id]; // TODO: what is the type for this?
      const contentEditable = frame.contentDocument.getElementById('tinymce');
      this._zone.run(() => {
        this.mention.keyHandler(event, contentEditable);
      });
    });
  }
}
