import {
  Component,
  ChangeDetectionStrategy,
  input,
  computed,
} from '@angular/core';
import { renderMarkdown } from '@practica11y/util';

@Component({
  selector: 'a11y-markdown-content',
  template: `<div
    class="markdown-content prose"
    [innerHTML]="renderedHtml()"
  ></div>`,
  styleUrl: './markdown-content.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarkdownContent {
  readonly source = input.required<string>();

  protected readonly renderedHtml = computed(() =>
    renderMarkdown(this.source()),
  );
}
