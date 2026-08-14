import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SchemeConfig, Student } from '../../models/report-card.models';

// A read-only, per-student rendering of the same computed data the
// mark-entry grid already has — no fetch of its own, no re-derivation.
// One row per subject the student takes, mirroring the main grid's layout.
// Each subject can resolve to a different scheme (e.g. different Credit
// Score formulas), so schemes are keyed by subject rather than shared.
@Component({
  selector: 'app-student-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-card.html',
  styleUrl: './student-card.css',
})
export class StudentCard {
  @Input({ required: true }) schoolName!: string;
  @Input({ required: true }) studentName!: string;
  @Input({ required: true }) klass!: string;
  @Input() term: string | null = null;
  @Input({ required: true }) schemesBySubject!: Record<string, SchemeConfig>;
  @Input({ required: true }) rows!: Student[];
  @Output() closed = new EventEmitter<void>();

  get headerScheme(): SchemeConfig | undefined {
    return this.rows[0] ? this.schemesBySubject[this.rows[0].subject] : undefined;
  }

  // Report Card renders `reportComponents`, not `components` — raw fields
  // like Credit Score's inputs are entry-visible but must never appear here.
  componentsForRow(row: Student) {
    return this.schemesBySubject[row.subject]?.reportComponents ?? [];
  }
}
