import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { resolveAllComponents, resolveGrade, resolveTotal } from '../../engine/formula-engine';
import { ComponentConfig, SchemeConfig, SchoolSummary, Student } from '../../models/report-card.models';
import { ReportCardService } from '../../services/report-card.service';
import { StudentCard } from '../student-card/student-card';

interface StudentOption {
  id: number;
  name: string;
}

@Component({
  selector: 'app-report-card',
  standalone: true,
  imports: [CommonModule, FormsModule, StudentCard],
  templateUrl: './report-card.html',
  styleUrl: './report-card.css',
})
export class ReportCard implements OnInit {
  schools = signal<SchoolSummary[]>([]);
  selectedSchoolId = signal<number | null>(null);
  selectedClass = signal<string>('');
  selectedTerm = signal<string>('');
  selectedStudentId = signal<number | null>(null);

  // Different subjects at the same school can resolve to different schemes
  // (e.g. Greenwood's Maths/Science Credit Score use different codes) — so
  // each subject gets its own resolved scheme, keyed by subject name.
  schemesBySubject = signal<Record<string, SchemeConfig>>({});
  studentOptions = signal<StudentOption[]>([]);
  // One row per subject the school offers, holding the selected student's
  // record for that subject — the table's row axis is now Subject, not Student.
  subjectRows = signal<Student[]>([]);
  error = signal<string>('');

  showReportCard = signal<boolean>(false);

  constructor(private readonly reportCardService: ReportCardService) {}

  ngOnInit(): void {
    this.reportCardService.getSchools().subscribe((schools) => {
      this.schools.set(schools);
      const greenwood = schools.find((s) => s.name === 'Greenwood High');
      if (greenwood) {
        this.selectSchool(greenwood);
      }
    });
  }

  get selectedSchool(): SchoolSummary | undefined {
    return this.schools().find((s) => s.id === this.selectedSchoolId()) ?? undefined;
  }

  get selectedStudentName(): string {
    return this.subjectRows()[0]?.name ?? '';
  }

  // Used only for the grade scale (same across subjects at this school) and
  // the "no data" colspan — the column set itself comes from entryComponents.
  get headerScheme(): SchemeConfig | undefined {
    return this.subjectRows()[0] ? this.schemesBySubject()[this.subjectRows()[0].subject] : undefined;
  }

  // The grid's actual column set: the union (by LABEL, not key) of every
  // subject's entry components. Grouping by label (not key) is what merges
  // each subject's own Credit Score field into a single "Credit Score"
  // column — same label, deliberately different underlying key/formula per
  // subject — while genuinely distinct fields (e.g. Discipline, which only
  // Science has) still get their own column.
  //
  // Ordered by each label's highest `order` across all contributing
  // subjects — e.g. Science's own Credit Score sits after its Discipline and
  // Attendance (Science) fields, so the merged "Credit Score" column takes
  // that later position rather than Maths' earlier one, keeping it after
  // every subject's raw inputs instead of wedged in the middle of them.
  get entryComponents(): ComponentConfig[] {
    const byLabel = new Map<string, ComponentConfig>();
    for (const row of this.subjectRows()) {
      for (const component of this.componentsForRow(row)) {
        const existing = byLabel.get(component.label);
        if (!existing || component.order > existing.order) {
          byLabel.set(component.label, component);
        }
      }
    }
    return [...byLabel.values()].sort((a, b) => a.order - b.order);
  }

  componentsForRow(row: Student): ComponentConfig[] {
    return this.schemesBySubject()[row.subject]?.components ?? [];
  }

  // The row's own component for a given column — since two subjects can use
  // a different underlying component (different key/formula) for what's
  // visually the same labeled column (e.g. each subject's own Credit Score).
  // Undefined means this column doesn't apply to this row's subject at all.
  rowComponentForLabel(row: Student, label: string): ComponentConfig | undefined {
    return this.componentsForRow(row).find((c) => c.label === label);
  }

  // Collapses entryComponents' consecutive same-`group` runs into colspan
  // cells for the grouped header row (e.g. "Half Yearly Exam" spanning its 4
  // columns) — purely a display grouping, driven entirely by each
  // component's own `group`, never hardcoded here. Columns with no group sit
  // in their own ungrouped, blank-label cell.
  get headerGroups(): { label: string; span: number }[] {
    const groups: { label: string; span: number }[] = [];
    for (const column of this.entryComponents) {
      const label = column.group ?? '';
      const last = groups[groups.length - 1];
      if (last && last.label === label && label !== '') {
        last.span++;
      } else {
        groups.push({ label, span: 1 });
      }
    }
    return groups;
  }

  openReportCard(): void {
    this.showReportCard.set(true);
  }

  closeReportCard(): void {
    this.showReportCard.set(false);
  }

  private selectSchool(school: SchoolSummary): void {
    this.selectedSchoolId.set(school.id);
    this.selectedClass.set(school.classes[0]);
    this.selectedTerm.set(school.terms[0] ?? '');
    this.loadClass(true);
  }

  onClassChange(klass: string): void {
    this.selectedClass.set(klass);
    this.loadClass(true);
  }

  onTermChange(term: string): void {
    this.selectedTerm.set(term);
    this.loadClass(false);
  }

  onStudentChange(studentId: string): void {
    this.selectedStudentId.set(Number(studentId));
    this.loadClass(false);
  }

  // resetStudent: the roster changes with the class, so default back to the
  // first student; a term change keeps whichever student is already picked.
  private loadClass(resetStudent: boolean): void {
    const schoolId = this.selectedSchoolId();
    const school = this.selectedSchool;
    if (schoolId === null || !school) return;
    this.error.set('');

    const klass = this.selectedClass();
    const term = this.selectedTerm();

    forkJoin({
      schemes: forkJoin(school.subjects.map((subject) => this.reportCardService.getScheme(schoolId, klass, subject, term))),
      subjectRosters: forkJoin(
        school.subjects.map((subject) => this.reportCardService.getStudents(schoolId, klass, subject, term))
      ),
    }).subscribe(({ schemes, subjectRosters }) => {
      const schemesBySubject: Record<string, SchemeConfig> = {};
      school.subjects.forEach((subject, i) => (schemesBySubject[subject] = schemes[i]));
      this.schemesBySubject.set(schemesBySubject);

      const firstRoster = subjectRosters[0] ?? [];
      this.studentOptions.set(firstRoster.map((s) => ({ id: s.id, name: s.name })));

      if (resetStudent || this.selectedStudentId() === null) {
        this.selectedStudentId.set(firstRoster[0]?.id ?? null);
      }

      this.rebuildSubjectRows(subjectRosters);
    });
  }

  private rebuildSubjectRows(subjectRosters: Student[][]): void {
    const studentId = this.selectedStudentId();
    const rows = subjectRosters
      .map((roster) => roster.find((s) => s.id === studentId))
      .filter((s): s is Student => !!s);
    this.subjectRows.set(rows);
  }

  // Direct-entry cells only ever call this — formula cells have no input to change.
  onMarkChange(row: Student, component: ComponentConfig, event: Event): void {
    const schoolId = this.selectedSchoolId();
    const scheme = this.schemesBySubject()[row.subject];
    if (schoolId === null || !scheme) return;

    const input = event.target as HTMLInputElement;
    const newValue = Number(input.value);
    if (Number.isNaN(newValue) || newValue < 0 || newValue > component.max) {
      this.error.set(`${component.label} must be between 0 and ${component.max}`);
      input.value = String(row.marks[component.key] ?? 0);
      return;
    }
    this.error.set('');

    // Optimistic local recompute (same generic engine as the server) so
    // Total/Grade/formula cells update instantly, then confirm with the
    // server's response once the PUT resolves. A manually overridden grade
    // stays put — editing marks never silently reverts it back to auto.
    const updatedMarks = { ...row.marks, [component.key]: newValue };
    const components = resolveAllComponents(scheme.components, updatedMarks, row.computed.components);
    const total = resolveTotal(scheme.totalFormula, scheme.components, components);
    const grade = row.computed.gradeOverridden ? row.computed.grade : resolveGrade(scheme.gradeScale, total);
    this.subjectRows.update((rows) =>
      rows.map((r) =>
        r.subject === row.subject
          ? { ...r, marks: updatedMarks, computed: { components, total, grade, gradeOverridden: r.computed.gradeOverridden } }
          : r
      )
    );

    const klass = this.selectedClass();
    const term = this.selectedTerm();
    this.reportCardService.updateMark(schoolId, row.id, klass, row.subject, term, component.key, newValue).subscribe({
      next: (confirmed) => {
        this.subjectRows.update((rows) => rows.map((r) => (r.subject === confirmed.subject ? confirmed : r)));
      },
      error: (err) => {
        this.error.set(err?.error?.error ?? 'Failed to save mark');
        this.loadClass(false);
      },
    });
  }

  // The Grade select always starts pre-filled with the auto-computed value —
  // this only fires when a teacher explicitly picks a different one.
  onGradeChange(row: Student, event: Event): void {
    const schoolId = this.selectedSchoolId();
    if (schoolId === null) return;

    const select = event.target as HTMLSelectElement;
    const grade = select.value;
    this.error.set('');

    this.subjectRows.update((rows) =>
      rows.map((r) => (r.subject === row.subject ? { ...r, computed: { ...r.computed, grade, gradeOverridden: true } } : r))
    );

    const klass = this.selectedClass();
    const term = this.selectedTerm();
    this.reportCardService.updateGrade(schoolId, row.id, klass, row.subject, term, grade).subscribe({
      next: (confirmed) => {
        this.subjectRows.update((rows) => rows.map((r) => (r.subject === confirmed.subject ? confirmed : r)));
      },
      error: (err) => {
        this.error.set(err?.error?.error ?? 'Failed to save grade');
        this.loadClass(false);
      },
    });
  }
}
