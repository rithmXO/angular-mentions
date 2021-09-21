import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MentionListComponent } from '.';
import { MentionDirective } from './mention.directive';

/**
 * Angular module for all comment mention behavior.
 */
@NgModule({
  declarations: [
    MentionDirective,
    MentionListComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    MentionDirective
  ],
  entryComponents: [
    MentionListComponent
  ]
})
export class MentionModule { }
