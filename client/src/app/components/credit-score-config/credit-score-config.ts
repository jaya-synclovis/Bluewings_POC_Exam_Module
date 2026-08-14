import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComponentFormula, CreditScoreSubjectConfig, RawField } from '../../models/report-card.models';
import { AssessmentConfigService } from '../../services/assessment-config.service';
import { ReportCardService } from '../../services/report-card.service';

type CreditScoreFormulaType = 'sum' | 'percentOf' | 'linearCombination';

interface PercentOfDraft {
  of: string;
  percent: number; // shown/edited as a 0-100 percentage, saved as a 0-1 fraction
}

interface LinearPart {
  of: string;
  weight: number; // shown/edited as a 0-100 percentage, saved as a 0-1 fraction
}

interface NewFieldDraft {
  name: string;
  maxMarks: number;
  scope: 'global' | 'subject';
  subjectName: string;
  source: 'manual' | 'bluewings';
}

const EMPTY_NEW_FIELD: NewFieldDraft = { name: '', maxMarks: 10, scope: 'global', subjectName: '', source: 'manual' };

@Component({
  selector: 'app-credit-score-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './credit-score-config.html',
  styleUrl: './credit-score-config.css',
})
export class CreditScoreConfigComponent implements OnInit {
  private schoolId: number | null = null;

  classes = signal<string[]>([]);
  selectedClass = signal<string>('');
  configs = signal<CreditScoreSubjectConfig[]>([]);
  selectedSubject = signal<string>('');
  formulaType = signal<CreditScoreFormulaType>('sum');
  sumDraft = signal<string[]>([]);
  percentOfDraft = signal<PercentOfDraft>({ of: '', percent: 100 });
  linearDraft = signal<LinearPart[]>([]);
  dirty = signal(false);
  status = signal<{ kind: 'ok' | 'error'; message: string } | undefined>(undefined);

  newField = signal<NewFieldDraft>({ ...EMPTY_NEW_FIELD });
  newFieldStatus = signal<{ kind: 'ok' | 'error'; message: string } | undefined>(undefined);

  constructor(
    private readonly reportCardService: ReportCardService,
    private readonly configService: AssessmentConfigService
  ) {}

  ngOnInit(): void {
    this.reportCardService.getSchools().subscribe((schools) => {
      const greenwood = schools.find((s) => s.name === 'Greenwood High');
      if (!greenwood) return;
      this.schoolId = greenwood.id;
      this.classes.set(greenwood.classes);
      this.selectedClass.set(greenwood.classes[0] ?? '');
      this.loadAll(greenwood.subjects[0]);
    });
  }

  private loadAll(preferredSubject?: string): void {
    if (this.schoolId === null || !this.selectedClass()) return;
    this.configService.getCreditScore(this.schoolId, this.selectedClass()).subscribe((configs) => {
      this.configs.set(configs);
      const subject = preferredSubject && configs.some((c) => c.subject === preferredSubject)
        ? preferredSubject
        : configs[0]?.subject ?? '';
      this.selectedSubject.set(subject);
      if (!this.newField().subjectName) {
        this.newField.set({ ...this.newField(), subjectName: configs[0]?.subject ?? '' });
      }
      this.applyDraftFromSelected();
    });
  }

  onClassChange(className: string): void {
    this.selectedClass.set(className);
    this.loadAll(this.selectedSubject());
  }

  get selectedConfig(): CreditScoreSubjectConfig | undefined {
    return this.configs().find((c) => c.subject === this.selectedSubject());
  }

  private applyDraftFromSelected(): void {
    const formula = this.selectedConfig?.component.formula;
    if (formula?.type === 'percentOf') {
      this.formulaType.set('percentOf');
      this.percentOfDraft.set({ of: formula.of, percent: Math.round(formula.percent * 1000) / 10 });
    } else if (formula?.type === 'linearCombination') {
      this.formulaType.set('linearCombination');
      this.linearDraft.set(formula.parts.map((p) => ({ of: p.of, weight: Math.round(p.weight * 1000) / 10 })));
    } else if (formula?.type === 'sum') {
      this.formulaType.set('sum');
      this.sumDraft.set([...formula.of]);
    }
    this.dirty.set(false);
    this.status.set(undefined);
  }

  onSubjectChange(subject: string): void {
    this.selectedSubject.set(subject);
    this.applyDraftFromSelected();
  }

  markDirty(): void {
    this.dirty.set(true);
    this.status.set(undefined);
  }

  onTypeChange(type: CreditScoreFormulaType): void {
    this.formulaType.set(type);
    this.markDirty();
  }

  // --- Sum draft ---

  isSumFieldSelected(key: string): boolean {
    return this.sumDraft().includes(key);
  }

  toggleSumField(key: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const keys = new Set(this.sumDraft());
    if (checked) keys.add(key);
    else keys.delete(key);
    this.sumDraft.set([...keys]);
    this.markDirty();
  }

  // --- Percentage draft ---

  onPercentOfBaseChange(of: string): void {
    this.percentOfDraft.set({ ...this.percentOfDraft(), of });
    this.markDirty();
  }

  onPercentOfPercentChange(percent: number): void {
    this.percentOfDraft.set({ ...this.percentOfDraft(), percent: Number(percent) || 0 });
    this.markDirty();
  }

  // --- Linear combination draft ---

  isLinearFieldSelected(key: string): boolean {
    return this.linearDraft().some((p) => p.of === key);
  }

  getLinearWeight(key: string): number {
    return this.linearDraft().find((p) => p.of === key)?.weight ?? 0;
  }

  toggleLinearField(key: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.linearDraft.set([...this.linearDraft(), { of: key, weight: 50 }]);
    } else {
      this.linearDraft.set(this.linearDraft().filter((p) => p.of !== key));
    }
    this.markDirty();
  }

  onLinearWeightChange(key: string, weight: number): void {
    this.linearDraft.set(this.linearDraft().map((p) => (p.of === key ? { ...p, weight: Number(weight) || 0 } : p)));
    this.markDirty();
  }

  save(): void {
    if (this.schoolId === null || !this.selectedSubject() || !this.selectedClass()) return;

    let formula: ComponentFormula;
    if (this.formulaType() === 'sum') {
      if (!this.sumDraft().length) {
        this.status.set({ kind: 'error', message: 'Select at least one field' });
        return;
      }
      formula = { type: 'sum', of: this.sumDraft() };
    } else if (this.formulaType() === 'percentOf') {
      if (!this.percentOfDraft().of) {
        this.status.set({ kind: 'error', message: 'Pick a base field' });
        return;
      }
      formula = { type: 'percentOf', of: this.percentOfDraft().of, percent: this.percentOfDraft().percent / 100 };
    } else {
      if (!this.linearDraft().length) {
        this.status.set({ kind: 'error', message: 'Select at least one field' });
        return;
      }
      formula = {
        type: 'linearCombination',
        parts: this.linearDraft().map((p) => ({ of: p.of, weight: p.weight / 100 })),
      };
    }

    this.configService.updateCreditScore(this.schoolId, this.selectedClass(), this.selectedSubject(), formula).subscribe({
      next: () => {
        this.loadAll(this.selectedSubject());
        this.status.set({ kind: 'ok', message: 'Saved — Credit Score now recomputes with this formula.' });
      },
      error: (err) => {
        this.status.set({ kind: 'error', message: err?.error?.error ?? 'Failed to save' });
      },
    });
  }

  // --- Raw field source (auto-saves) ---

  onSourceChange(field: RawField, source: 'manual' | 'bluewings'): void {
    if (this.schoolId === null) return;
    this.configService.updateRawField(this.schoolId, field.key, { source }).subscribe(() => this.loadAll(this.selectedSubject()));
  }

  // --- Add a brand-new field, e.g. "Cleanliness" ---

  onNewFieldChange(patch: Partial<NewFieldDraft>): void {
    this.newField.set({ ...this.newField(), ...patch });
    this.newFieldStatus.set(undefined);
  }

  addField(): void {
    if (this.schoolId === null) return;
    const draft = this.newField();
    if (!draft.name.trim()) {
      this.newFieldStatus.set({ kind: 'error', message: 'Name is required' });
      return;
    }
    if (draft.scope === 'subject' && !draft.subjectName) {
      this.newFieldStatus.set({ kind: 'error', message: 'Pick a subject' });
      return;
    }

    this.configService
      .addRawField(this.schoolId, {
        name: draft.name.trim(),
        maxMarks: Number(draft.maxMarks) || 10,
        scope: draft.scope,
        subjectName: draft.scope === 'subject' ? draft.subjectName : undefined,
        source: draft.source,
      })
      .subscribe({
        next: (field) => {
          this.newField.set({ ...EMPTY_NEW_FIELD, subjectName: draft.subjectName });
          this.newFieldStatus.set({ kind: 'ok', message: `Added '${field.label}' — now editable in Marks Entry.` });
          this.loadAll(this.selectedSubject());
        },
        error: (err) => {
          this.newFieldStatus.set({ kind: 'error', message: err?.error?.error ?? 'Failed to add field' });
        },
      });
  }
}
