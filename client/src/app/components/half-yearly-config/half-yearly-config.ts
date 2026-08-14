import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComponentConfig, ComponentFormula, HalfYearlyConfig } from '../../models/report-card.models';
import { AssessmentConfigService } from '../../services/assessment-config.service';
import { ReportCardService } from '../../services/report-card.service';

type HalfYearlyFormulaType = 'linearCombination' | 'average' | 'sum' | 'bestOfN';

// One independent draft per formula type so switching the radio button
// doesn't lose what was already filled in on the other options.
interface LinearPart {
  of: string;
  weight: number; // shown/edited as a 0-100 percentage, saved as a 0-1 fraction
}

interface BestOfNDraft {
  of: string[];
  n: number;
  normalize: boolean;
}

@Component({
  selector: 'app-half-yearly-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './half-yearly-config.html',
  styleUrl: './half-yearly-config.css',
})
export class HalfYearlyConfigComponent implements OnInit {
  private schoolId: number | null = null;

  classes = signal<string[]>([]);
  subjects = signal<string[]>([]);
  selectedClass = signal<string>('');
  selectedSubject = signal<string>('');

  config = signal<HalfYearlyConfig | undefined>(undefined);
  formulaType = signal<HalfYearlyFormulaType>('linearCombination');
  linearDraft = signal<LinearPart[]>([]);
  averageDraft = signal<string[]>([]);
  sumDraft = signal<string[]>([]);
  bestOfNDraft = signal<BestOfNDraft>({ of: [], n: 1, normalize: true });
  dirty = signal(false);
  status = signal<{ kind: 'ok' | 'error'; message: string } | undefined>(undefined);

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
      this.subjects.set(greenwood.subjects);
      this.selectedClass.set(greenwood.classes[0] ?? '');
      this.selectedSubject.set(greenwood.subjects[0] ?? '');
      this.load();
    });
  }

  private load(): void {
    if (this.schoolId === null || !this.selectedClass() || !this.selectedSubject()) return;
    this.configService
      .getHalfYearly(this.schoolId, this.selectedClass(), this.selectedSubject())
      .subscribe((config) => this.applyConfig(config));
  }

  onClassChange(className: string): void {
    this.selectedClass.set(className);
    this.load();
  }

  onSubjectChange(subject: string): void {
    this.selectedSubject.set(subject);
    this.load();
  }

  private applyConfig(config: HalfYearlyConfig): void {
    this.config.set(config);
    const formula = config.component.formula;
    if (formula?.type === 'bestOfN') {
      this.formulaType.set('bestOfN');
      this.bestOfNDraft.set({ of: [...formula.of], n: formula.n, normalize: formula.normalize });
    } else if (formula?.type === 'linearCombination') {
      this.formulaType.set('linearCombination');
      this.linearDraft.set(formula.parts.map((p) => ({ of: p.of, weight: Math.round(p.weight * 1000) / 10 })));
    } else if (formula?.type === 'average') {
      this.formulaType.set('average');
      this.averageDraft.set([...formula.of]);
    } else if (formula?.type === 'sum') {
      this.formulaType.set('sum');
      this.sumDraft.set([...formula.of]);
    }
    this.dirty.set(false);
    this.status.set(undefined);
  }

  get availableComponents(): ComponentConfig[] {
    return this.config()?.availableComponents ?? [];
  }

  markDirty(): void {
    this.dirty.set(true);
    this.status.set(undefined);
  }

  onTypeChange(type: HalfYearlyFormulaType): void {
    this.formulaType.set(type);
    this.markDirty();
  }

  // --- Weighted combination draft ---

  isLinearFieldSelected(key: string): boolean {
    return this.linearDraft().some((p) => p.of === key);
  }

  getLinearWeight(key: string): number {
    return this.linearDraft().find((p) => p.of === key)?.weight ?? 0;
  }

  toggleLinearField(key: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.linearDraft.set([...this.linearDraft(), { of: key, weight: 10 }]);
    } else {
      this.linearDraft.set(this.linearDraft().filter((p) => p.of !== key));
    }
    this.markDirty();
  }

  onLinearWeightChange(key: string, weight: number): void {
    this.linearDraft.set(this.linearDraft().map((p) => (p.of === key ? { ...p, weight: Number(weight) || 0 } : p)));
    this.markDirty();
  }

  // --- Average / Total (Sum) drafts — plain field selection, no weights ---

  isAverageFieldSelected(key: string): boolean {
    return this.averageDraft().includes(key);
  }

  toggleAverageField(key: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const keys = new Set(this.averageDraft());
    if (checked) keys.add(key);
    else keys.delete(key);
    this.averageDraft.set([...keys]);
    this.markDirty();
  }

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

  // --- Best of N draft ---

  isBestOfNKeySelected(key: string): boolean {
    return this.bestOfNDraft().of.includes(key);
  }

  toggleBestOfNKey(key: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const keys = new Set(this.bestOfNDraft().of);
    if (checked) keys.add(key);
    else keys.delete(key);
    const of = [...keys];
    const n = Math.min(this.bestOfNDraft().n, of.length || 1);
    this.bestOfNDraft.set({ ...this.bestOfNDraft(), of, n });
    this.markDirty();
  }

  onBestOfNChange(n: number): void {
    this.bestOfNDraft.set({ ...this.bestOfNDraft(), n: Math.max(1, Number(n) || 1) });
    this.markDirty();
  }

  onNormalizeChange(normalize: boolean): void {
    this.bestOfNDraft.set({ ...this.bestOfNDraft(), normalize });
    this.markDirty();
  }

  save(): void {
    if (this.schoolId === null) return;

    let formula: ComponentFormula;
    if (this.formulaType() === 'linearCombination') {
      if (!this.linearDraft().length) {
        this.status.set({ kind: 'error', message: 'Select at least one field' });
        return;
      }
      formula = { type: 'linearCombination', parts: this.linearDraft().map((p) => ({ of: p.of, weight: p.weight / 100 })) };
    } else if (this.formulaType() === 'average') {
      if (!this.averageDraft().length) {
        this.status.set({ kind: 'error', message: 'Select at least one field' });
        return;
      }
      formula = { type: 'average', of: this.averageDraft() };
    } else if (this.formulaType() === 'sum') {
      if (!this.sumDraft().length) {
        this.status.set({ kind: 'error', message: 'Select at least one field' });
        return;
      }
      formula = { type: 'sum', of: this.sumDraft() };
    } else {
      const draft = this.bestOfNDraft();
      if (!draft.of.length) {
        this.status.set({ kind: 'error', message: 'Select at least one field' });
        return;
      }
      formula = { type: 'bestOfN', of: draft.of, n: draft.n, normalize: draft.normalize };
    }

    this.configService.updateHalfYearly(this.schoolId, this.selectedClass(), this.selectedSubject(), formula).subscribe({
      next: (config) => {
        this.applyConfig(config);
        this.status.set({ kind: 'ok', message: 'Saved — First Half now recomputes with this formula.' });
      },
      error: (err) => {
        this.status.set({ kind: 'error', message: err?.error?.error ?? 'Failed to save' });
      },
    });
  }
}
