/* eslint-disable */
import { ComponentFactoryResolver, Directive, ElementRef, HostBinding, HostListener, TemplateRef, ViewContainerRef } from '@angular/core';
import { EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { getCaretPosition, getValue, insertValue, setCaretPosition } from './helpers/mention-utils';

import { MentionConfig, SingleMentionConfig } from './models/mention-config';
import { MentionListComponent } from './mention-list/mention-list.component';
import { MentionItem } from './models/mention-item';

// Keyboard codes
// TODO: update these to new codes: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code/code_values
const KEY_BACKSPACE = 8;
const KEY_TAB = 9;
const KEY_ENTER = 13;
const KEY_SHIFT = 16;
const KEY_ESCAPE = 27;
const KEY_SPACE = 32;
const KEY_UP = 38;
const KEY_DOWN = 40;
// const KEY_LEFT = 37;
// const KEY_RIGHT = 39;
const KEY_BUFFERED = 229;

/**
 * Angular Mentions.
 *
 * Copyright (c) 2017 Dan MacFarlane.
 */
@Directive({
  selector: '[mentionConfig]',
})
export class MentionDirective implements OnChanges {

  /** Turns off autocomplete for the host element of this directive. */
  @HostBinding('attr.autocomplete') autoComplete = 'off';

  /** Stores the items passed to the mentions directive and used to populate the root items in mentionConfig. */
  private mentionItems: MentionItem[] = [];

  /** The provided configuration object. */
  @Input() mentionConfig: MentionConfig = { items: [] };

  /** Template to customize the look of items displayed in the mention list. */
  @Input() mentionListTemplate?: TemplateRef<unknown>;

  /** Event emitted whenever the search term changes. Can be used to trigger async search. */
  @Output() searchTerm = new EventEmitter<string>();

  /** Event emitted when an item is selected. */
  @Output() itemSelected = new EventEmitter<MentionItem>();

  /** Event emitted when the mention list panel is opened. */
  @Output() opened = new EventEmitter();

  /** Event emitted when the mention list panel is closed. */
  @Output() closed = new EventEmitter();

  /** Component used to display the list of mentionable items. */
  private mentionListComponent: MentionListComponent;

  /** The active mention configuration based on the entered character. */
  private activeConfig: SingleMentionConfig | null = null;

  /** The default mention configuration to be used. */
  private readonly DEFAULT_CONFIG: MentionConfig = {
    items: [],
    triggerChar: '@',
    labelKey: 'label',
    maxItems: -1,
    allowSpace: false,
    returnTrigger: false,
    mentionSelect: (item: MentionItem) => this.activeConfig?.triggerChar + item[this.activeConfig.labelKey],
    mentionFilter: (searchString: string, items: MentionItem[] = []) => {
      const test = this.activeConfig;
      if (!test) {
        throw new Error('Cannot filter without an active config');
      }
      const searchStringLowerCase = searchString.toLowerCase();
      return items.filter(item => item[this.activeConfig.labelKey].toLowerCase().startsWith(searchStringLowerCase));
    }
  };

  /** All the mention configs for all the given trigger characters. */
  private triggerChars: { [key: string]: MentionConfig } = {};

  /** The search string that the user has entered. */
  private searchString = '';

  /** The starting position of ???. */
  private startPos = 0;

  /** The start node. */
  private startNode: Node | null = null;

  /** Whether the user is currently searching for a mention item. */
  private searching = false;

  /** The keyboard code of the key that the user last entered. */
  private lastKeyCode: number | null = null;

  /** */
  private iframe?: HTMLIFrameElement; // optional

  constructor(
    private element: ElementRef<Node>,
    private componentResolver: ComponentFactoryResolver,
    private viewContainerRef: ViewContainerRef
  ) {
    const componentFactory = this.componentResolver.resolveComponentFactory(MentionListComponent);
    const componentRef = this.viewContainerRef.createComponent(componentFactory);
    this.mentionListComponent = componentRef.instance;
    this.mentionListComponent.itemTemplate = this.mentionListTemplate;
  }

  /**
   * Updates the mention config whenever there is a change in directive inputs.
   *
   * @param changes The changes that occurred.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mention'] || changes['mentionConfig']) {
      this.updateConfig();
    }
  }

  /**
   * Stops the focus event from propagating and stops the search for mentionable items.
   *
   * @param event The event that was emitted upon losing focus.
   */
  @HostListener('blur', ['$event'])
  blurHandler(event: FocusEvent): void {
    this.stopEvent(event);
    this.stopSearch();
  }

  /**
   * @param event
   */
  @HostListener('input', ['$event'])
  inputHandler(event: InputEvent): void {
    if (this.lastKeyCode === KEY_BUFFERED && event.data) {
      const keyCode = event.data.charCodeAt(0);
      const fakeKeydownEvent = new KeyboardEvent('keydown', { keyCode })
      this.keyHandler(fakeKeydownEvent, true);
    }
  }

  /**
   * Handles keyboard input from the user.
   *
   * @param event The `'keydown'` event triggered by the user.
   * @param inputEvent Whether the event actually came from an event.
   * @param wasClick Whether the event actually came from a click.
   */
  @HostListener('keydown', ['$event'])
  keyHandler(event: KeyboardEvent, inputEvent = false, wasClick = false): void {
    // TODO: Refactor this method; THIS IS HUGE
    this.lastKeyCode = event.keyCode;

    if (event.isComposing || event.keyCode === KEY_BUFFERED) {
      return;
    }

    const inputString = getValue(this.element.nativeElement);
    let pos = getCaretPosition(this.element.nativeElement, this.iframe);
    let charPressed = event.key;
    if (!charPressed) {
      const charCode = event.which || event.keyCode;
      if (!event.shiftKey && (charCode >= 65 && charCode <= 90)) {
        charPressed = String.fromCharCode(charCode + 32);
      } else {
        // TODO: fix this for non-alpha keys
        // http://stackoverflow.com/questions/2220196/how-to-decode-character-pressed-from-jquerys-keydowns-event-handler?lq=1
        charPressed = String.fromCharCode(event.which || event.keyCode);
      }
    }
    if (event.keyCode === KEY_ENTER && wasClick && pos < this.startPos) {
      // put caret back in position prior to content editable menu click
      pos = this.startNode?.length ?? 0;
      setCaretPosition(this.startNode, pos, this.iframe);
    }
    // console.log("keyHandler", this.startPos, pos, val, charPressed, event);

    const config = this.triggerChars[charPressed];
    if (config) {
      this.activeConfig = config;
      this.startPos = inputEvent ? pos - 1 : pos;
      this.startNode = (this.iframe ? this.iframe.contentWindow.getSelection() : window.getSelection()).anchorNode;
      this.searching = true;
      this.searchString = '';
      this.showSearchList(this.element.nativeElement);
      this.updateSearchList();

      if (config.returnTrigger) {
        this.searchTerm.emit(config.triggerChar);
      }
    } else if (this.startPos >= 0 && this.searching) {
      if (pos <= this.startPos) {
        this.mentionListComponent.hidden = true;
      } else if (event.keyCode !== KEY_SHIFT &&
        // ignore shift when pressed alone, but not when used with another key
        !event.metaKey &&
        !event.altKey &&
        !event.ctrlKey &&
        pos > this.startPos
      ) {
        if (!this.activeConfig.allowSpace && event.keyCode === KEY_SPACE) {
          this.startPos = -1;
        } else if (event.keyCode === KEY_BACKSPACE && pos > 0) {
          pos--;
          if (pos === this.startPos) {
            this.stopSearch();
          }
        } else if (this.mentionListComponent.hidden) {
          if (event.keyCode === KEY_TAB || event.keyCode === KEY_ENTER) {
            this.stopSearch();
            return;
          }
        } else if (!this.mentionListComponent.hidden) {
          if (event.keyCode === KEY_TAB || event.keyCode === KEY_ENTER) {
            this.stopEvent(event, wasClick);
            // emit the selected list item
            this.itemSelected.emit(this.mentionListComponent.activeItem);
            // optional function to format the selected item before inserting the text
            const text = this.getActiveConfig().mentionSelect(this.mentionListComponent.activeItem, this.getActiveConfig().triggerChar);
            // value is inserted without a trailing space for consistency
            // between element types (div and iframe do not preserve the space)
            insertValue(this.element.nativeElement, this.startPos, pos, text, this.iframe);

            // fire input event so angular bindings are updated
            if ('createEvent' in document) {
              const htmlEvent = document.createEvent('HTMLEvents');
              if (this.iframe) {
                // a 'change' event is required to trigger tinymce updates
                htmlEvent.initEvent('change', true, false);
              } else {
                htmlEvent.initEvent('input', true, false);
              }
              // this seems backwards, but fire the event from this elements nativeElement (not the
              // one provided that may be in an iframe, as it won't be propagate)
              this.element.nativeElement.dispatchEvent(htmlEvent);
            }

            this.startPos = -1;
            this.stopSearch();
            return;
          } else if (event.keyCode === KEY_ESCAPE) {
            this.stopEvent(event, wasClick);
            this.stopSearch();
            return;
          } else if (event.keyCode === KEY_DOWN) {
            this.stopEvent(event, wasClick);
            this.mentionListComponent.activateNextItem();
            return;
          } else if (event.keyCode === KEY_UP) {
            this.stopEvent(event, wasClick);
            this.mentionListComponent.activatePreviousItem();
            return;
          }
        }

        if (charPressed.length !== 1 && event.keyCode !== KEY_BACKSPACE) {
          this.stopEvent(event, wasClick);
          return;
        } else if (this.searching) {
          let mention = inputString.substring(this.startPos + 1, pos);
          if (event.keyCode !== KEY_BACKSPACE && !inputEvent) {
            mention += charPressed;
          }
          this.searchString = mention;
          if (this.getActiveConfig().returnTrigger) {
            const triggerChar = (this.searchString || event.keyCode === KEY_BACKSPACE) ? inputString.substring(this.startPos, this.startPos + 1) : '';
            this.searchTerm.emit(triggerChar + this.searchString);
          } else {
            this.searchTerm.emit(this.searchString);
          }
          this.updateSearchList();
        }
      }
    }
  }

  /**
   *
   */
  updateConfig(): void {
    const config = this.mentionConfig;
    this.triggerChars = {};
    // use items from directive if they have been set
    if (this.mentionItems) {
      config.items = this.mentionItems;
    }
    this.addConfig(config);
    // nested configs
    if (config.configs) {
      config.configs.forEach((mentionsConfig) => this.addConfig(mentionsConfig));
    }
  }

  /**
   * Adds a mention configuration for a trigger character.
   *
   * @param config The config to be added for the trigger character.
   */
  private addConfig(config: MentionConfig): void {
    // defaults
    const defaults = Object.assign({}, this.DEFAULT_CONFIG);
    config = Object.assign(defaults, config);
    // items
    let items = config.items;
    if (items && items.length > 0) {
      // convert strings to objects
      if (typeof items[0] === 'string') {
        items = items.map((label) => {
          const object = {};
          object[config.labelKey] = label;
          return object;
        });
      }
      if (config.labelKey) {
        // remove items without an labelKey (as it's required to filter the list)
        items = items.filter(e => e[config.labelKey]);
        if (!config.disableSort) {
          items.sort((a, b) => a[config.labelKey].localeCompare(b[config.labelKey]));
        }
      }
    }
    config.items = items;

    // add the config
    this.triggerChars[config.triggerChar] = config;

    // for async update while menu/search is active
    if (this.activeConfig && this.activeConfig.triggerChar === config.triggerChar) {
      this.activeConfig = config;
      this.updateSearchList();
    }
  }

  /**
   * @param iframe
   */
  setIframe(iframe: HTMLIFrameElement) {
    this.iframe = iframe;
  }

  /**
   * Prevents an event from propagating.
   *
   * @param event The event to stop propagating.
   */
  stopEvent(event: Event, wasClick = false): void {
    //if (event instanceof KeyboardEvent) { // does not work for iframe
    if (!wasClick) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
  }

  // exposed for external calls to open the mention list, e.g. by clicking a button
  /**
   * @param triggerChar
   */
  startSearch(triggerChar?: string, nativeElement: HTMLInputElement = this.element.nativeElement): void {
    triggerChar = triggerChar || this.mentionConfig.triggerChar || this.DEFAULT_CONFIG.triggerChar;
    const pos = getCaretPosition(nativeElement, this.iframe);
    insertValue(nativeElement, pos, pos, triggerChar ?? '', this.iframe);
    const fakeKeydownEvent = new KeyboardEvent('keydown', { key: triggerChar });
    this.keyHandler(fakeKeydownEvent, true);
  }

  /**
   *
   */
  stopSearch(): void {
    if (this.mentionListComponent && !this.mentionListComponent.hidden) {
      this.mentionListComponent.hidden = true;
      this.closed.emit();
    }
    this.activeConfig = null;
    this.searching = false;
  }

  /**
   *
   */
  updateSearchList(): void {
    let matches: MentionItem[] = [];
    if (this.activeConfig && this.activeConfig.items) {
      let objects = this.activeConfig.items;
      // disabling the search relies on the async operation to do the filtering
      if (!this.activeConfig.disableSearch && this.searchString && this.activeConfig.labelKey) {
        if (this.activeConfig.mentionFilter) {
          objects = this.activeConfig.mentionFilter(this.searchString, objects);
        }
      }
      matches = objects;
      if (this.getActiveConfig().maxItems > 0) {
        matches = matches.slice(0, this.activeConfig.maxItems);
      }
    }
    // update the search list
    if (this.mentionListComponent) {
      this.mentionListComponent.items = matches;
      this.mentionListComponent.hidden = matches.length === 0;
    }
  }

  /**
   * Opens the mention list and displays the component.
   *
   * @param nativeElement
   */
  showSearchList(nativeElement: Node): void {
    this.opened.emit();

    this.mentionListComponent.itemClick.subscribe(() => {
      nativeElement.focus();
      const fakeKeydownEvent = new KeyboardEvent('keydown', { key: 'Enter', keyCode: KEY_ENTER });
      this.keyHandler(fakeKeydownEvent, false, true); // TODO: This is gross, change method param signature
    });
    this.mentionListComponent.labelKey = this.getActiveConfig().labelKey;
    this.mentionListComponent.dropUp = this.getActiveConfig().dropUp;
    this.mentionListComponent.styleOff = this.mentionConfig.disableStyle;
    this.mentionListComponent.activeIndex = 0;
    this.mentionListComponent.positionBasedOnParent(nativeElement, this.iframe);
    window.requestAnimationFrame(() => this.mentionListComponent.reset());
  }

  /**
   * Gets the active config, if it exists.
   *
   * @returns The active config.
   */
  private getActiveConfig(): SingleMentionConfig {
    if (!this.activeConfig) {
      throw new Error('The active config has not been set');
    }
    return this.activeConfig;
  }
}
