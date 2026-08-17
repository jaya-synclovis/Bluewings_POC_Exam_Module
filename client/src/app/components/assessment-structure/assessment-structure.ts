import { Component } from '@angular/core';
import { FieldFormulaConfigComponent } from '../field-formula-config/field-formula-config';
import { CreditScoreConfigComponent } from '../credit-score-config/credit-score-config';

@Component({
  selector: 'app-assessment-structure',
  standalone: true,
  imports: [FieldFormulaConfigComponent, CreditScoreConfigComponent],
  templateUrl: './assessment-structure.html',
  styleUrl: './assessment-structure.css',
})
export class AssessmentStructure {}
