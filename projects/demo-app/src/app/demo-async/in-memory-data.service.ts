import { InMemoryDbService } from 'angular-in-memory-web-api';
import { COMMON_NAMES } from '../common-names';

/**
 * Creates a mock database to return items on HTTP request.
 */
export class InMemoryDataService implements InMemoryDbService {
  /**
   * Creates the mock database to return items on HTTP request.
   *
   * @returns Mock data from common names.
   */
  createDb(): MockHTTPData {
    const objects = COMMON_NAMES.map(function(name) {
      return { label: name };
    });
    return { names: COMMON_NAMES, objects: objects };
  }
}

interface MockHTTPData {
  /** Names. */
  names: string[];

  /** Objects with name. */
  objects: {
    /** Label/name for the object. */
    label: string;
  }[];
}
