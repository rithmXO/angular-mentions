import { MentionItem } from './mention-item';

export interface MentionConfig extends SingleMentionConfig {
  /** Nested config. */
  configs?: SingleMentionConfig[];

  /** Option to disable encapsulated styles so global styles can be used instead. */
  disableStyle?: boolean;
}

export interface SingleMentionConfig {
  /** An array of strings or objects to suggest. */
  items: MentionItem[];

  /** The character that will trigger the menu behavior. */
  triggerChar?: string;

  /** Option to specify the field in the objects to be used as the item label. */
  labelKey?: string;

  /** Option to limit the number of items shown in the pop-up menu. */
  maxItems?: number;

  /** Option to disable sorting. */
  disableSort?: boolean;

  /** Option to disable internal filtering. Can be used to show the full list returned from an async operation. */
  disableSearch?: boolean;

  /** Display menu above text instead of below. */
  dropUp?: boolean;

  /** Whether to allow space while mentioning or not. */
  allowSpace?: boolean;

  /** Option to include the trigger char in the searchTerm event. */
  returnTrigger?: boolean;

  /** Optional function to format the selected item before inserting the text. */
  mentionSelect?: (item: MentionItem, triggerChar?: string) => (string);

  /** Optional function to customize the search implementation. */
  mentionFilter?: (searchString: string, items?: MentionItem[]) => (MentionItem[]);
}
