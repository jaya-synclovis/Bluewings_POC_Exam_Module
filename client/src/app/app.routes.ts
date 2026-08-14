import { Routes } from '@angular/router';
import { ReportCard } from './components/report-card/report-card';
import { AssessmentStructure } from './components/assessment-structure/assessment-structure';

export const routes: Routes = [
  { path: '', component: ReportCard },
  { path: 'structure', component: AssessmentStructure },
];
