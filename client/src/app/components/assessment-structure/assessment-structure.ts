import { Component } from '@angular/core';
import { HalfYearlyConfigComponent } from '../half-yearly-config/half-yearly-config';
import { CreditScoreConfigComponent } from '../credit-score-config/credit-score-config';

@Component({
  selector: 'app-assessment-structure',
  standalone: true,
  imports: [HalfYearlyConfigComponent, CreditScoreConfigComponent],
  templateUrl: './assessment-structure.html',
  styleUrl: './assessment-structure.css',
})
export class AssessmentStructure {}
