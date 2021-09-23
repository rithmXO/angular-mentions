import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { MockHTTPData } from './in-memory-data.service';
import { Observable, of, Subject } from 'rxjs';
import { debounceTime, switchMap, distinctUntilChanged } from 'rxjs/operators';

/**
 * Demo component for async items.
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'app-demo-async',
  templateUrl: './demo-async.component.html'
})
export class DemoAsyncComponent implements OnInit {
  /** Items as returned through an async method. */
  httpItems!: Observable<MockHTTPData[]>;

  /** The subject stream for the search term. */
  private searchTermStream: Subject<string> = new Subject();

  /**
   * Gets the HTTP items.
   */
  ngOnInit(): void {
    this.httpItems = this.searchTermStream
    .pipe(
      debounceTime(500),
      distinctUntilChanged(),
      switchMap((term: string) => this.getItems(term))
    );
  }

  /**
   * Starts a search given a string.
   *
   * @param term The search term.
   */
  search(term: string): void {
    this.searchTermStream.next(term);
  }

  // this should be in a separate demo-async.service.ts file
  constructor(private http: HttpClient) { }

  /**
   * Gets items filtered by the search term.
   *
   * @param term The search term.
   * @returns A list of filtered items.
   */
  getItems(term: string): Observable<MockHTTPData[]> {
    console.log('getItems:', term);
    if (!term) {
      // if the search term is empty, return an empty array
      return of([]);
    }
    // return this.http.get('api/names') // get all names
    return this.http.get<MockHTTPData[]>('api/objects?label=' + term); // get filtered names
  }
}
