import { MentionItem } from './mention-item';

/**
 * Object housing all options for configuring the mentions.
 */
export interface MentionConfig {

  /** Nested config. */
  configs: SingleMentionConfig[];

  /** Option to disable encapsulated styles so global styles can be used instead. */
  disableStyle?: boolean;
}

/**
 * A configuration for a single mention (tied to a label key).
 */
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
  mentionSelect?: (item: Record<string, string>, triggerChar?: string) => (string);

  /** Optional function to customize the search implementation. */
  mentionFilter?: (searchString: string, items: Record<string, string>[]) => (Record<string, string>[]);
}
