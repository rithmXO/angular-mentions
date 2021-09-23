import { areMentionItemsStrings } from '.';
import { MentionItem, SingleMentionConfig } from '../models';

/**
 * The configuration class used for mentions internally.
 */
export class InternalConfig {

  /**
   * The default function to use when a mention is selected.
   *
   * @param item The item that was selected.
   * @param triggerChar The character that triggered the mention list.
   * @returns The trigger character followed by the selected item string.
   */
  private readonly DEFAULT_MENTION_SELECT =
  (item: Record<string, string>, triggerChar = this.triggerChar) => triggerChar + item[this.labelKey];

  /**
   * The default function to use to filter the mention list.
   *
   * @param searchString The string that the user entered to search the mention items.
   * @param items The mention items to search/filter.
   * @returns The filtered list of mention items.
   */
  private readonly DEFAULT_MENTION_FILTER = (searchString: string, items: Record<string, string>[] = this.items) => {
    const searchStringLowerCase = searchString.toLowerCase();
    return items.filter(item => item[this.labelKey].toLowerCase().startsWith(searchStringLowerCase));
  };

  /** The array of objects of strings to suggest. */
  items: Record<string, string>[];

  /** The character that will trigger the menu behavior. */
  triggerChar: string;

  /** Option to specify the field in the objects to be used as the item label. */
  labelKey: string;

  /** The maximum number of items shown in the pop-up menu. */
  maxItems: number;

  /** Whether to disable sorting. */
  disableSort: boolean;

  /** Whether to disable internal filtering. Can be used to show the full list returned from an async operation. */
  disableSearch: boolean;

  /** Whether to display menu above text instead of below. */
  dropUp: boolean;

  /** Whether to allow space while mentioning or not. */
  allowSpace: boolean;

  /** Whether to include the trigger char in the searchTerm event. */
  returnTrigger: boolean;

  /** Function to format the selected item before inserting the text. */
  mentionSelect: (item: Record<string, string>, triggerChar?: string) => (string);

  /** Function to customize the search implementation. */
  mentionFilter: (searchString: string, items: Record<string, string>[]) => (Record<string, string>[]);


  constructor(mentionConfig: SingleMentionConfig) {
    this.triggerChar = mentionConfig.triggerChar ?? '@';
    this.labelKey = mentionConfig.labelKey ?? 'label';
    this.maxItems = mentionConfig.maxItems ?? -1;
    this.disableSort = mentionConfig.disableSort ?? false;
    this.disableSearch = mentionConfig.disableSearch ?? false;
    this.dropUp = mentionConfig.dropUp ?? false;
    this.allowSpace = mentionConfig.allowSpace ?? false;
    this.returnTrigger = mentionConfig.returnTrigger ?? false;

    this.mentionSelect = mentionConfig.mentionSelect ?? this.DEFAULT_MENTION_SELECT;
    this.mentionFilter = mentionConfig.mentionFilter ?? this.DEFAULT_MENTION_FILTER;

    this.items = this.refineItems(mentionConfig.items);

    if (!this.disableSort) {
      this.sortItems();
    }
  }

  /**
   * Refines the mention items into a list of objects containing only the label key property.
   *
   * @param items The list of mention items to refine.
   * @returns A refined mention item object with ony a label key property containing the string.
   */
  private refineItems(items: MentionItem[]): Record<string, string>[] {
    // If empty
    if (!items || !items?.length) {
      return [];
    }

    let convertedItems: Record<string, string>[];
    if (areMentionItemsStrings(items)) {
      convertedItems = this.convertStringItemsToObjects(items);
    } else {
      // TODO: can we avoid this type assertion?
      convertedItems = this.removeItemsWithoutKey(items as Record<string, string>[]);
    }
    return convertedItems;
  }

  /**
   * Converts an array of string items to objects using the label as the key.
   *
   * @param items The array of string items to convert.
   * @returns An array of objects.
   */
  private convertStringItemsToObjects(items: string[]): Record<string, string>[] {
    return items.map((label) => {
      const stringObject: Record<string, string> = {};
      stringObject[this.labelKey] = label;
      return stringObject;
    });
  }

  /**
   * Removes items without a labelKey (as it's required to filter the list).
   *
   * @param items The list of all mention item objects.
   * @returns A list of items with the extraneous properties removed.
   */
  private removeItemsWithoutKey(items: Record<string, unknown>[]): Record<string, string>[] {
    // TODO: can we avoid this type assertion?
    return items.filter((item) => item[this.labelKey]) as Record<string, string>[];
  }

  /**
   * Sorts the mention item strings alphabetically.
   */
  private sortItems(): void {
    this.items.sort((a, b) => a[this.labelKey].localeCompare(b[this.labelKey]));
  }

}
