import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-about-page',
  imports: [RouterModule],
  templateUrl: './about-page.html',
  styleUrl: './about-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutPage {}
