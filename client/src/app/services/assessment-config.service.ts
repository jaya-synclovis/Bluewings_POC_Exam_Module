import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ComponentFormula,
  CreditScoreSubjectConfig,
  HalfYearlyConfig,
  NewRawFieldRequest,
  RawField,
} from '../models/report-card.models';

@Injectable({ providedIn: 'root' })
export class AssessmentConfigService {
  private readonly baseUrl = 'http://localhost:3000/api';

  constructor(private readonly http: HttpClient) {}

  // Half Yearly and Credit Score are both configured per (class, subject) —
  // Class 6 Maths and Class 7 Maths resolve to independent components.
  getHalfYearly(schoolId: number, className: string, subject: string): Observable<HalfYearlyConfig> {
    const params = { class: className, subject };
    return this.http.get<HalfYearlyConfig>(`${this.baseUrl}/schools/${schoolId}/half-yearly`, { params });
  }

  updateHalfYearly(
    schoolId: number,
    className: string,
    subject: string,
    formula: ComponentFormula
  ): Observable<HalfYearlyConfig> {
    const params = { class: className, subject };
    return this.http.put<HalfYearlyConfig>(`${this.baseUrl}/schools/${schoolId}/half-yearly`, { formula }, { params });
  }

  getCreditScore(schoolId: number, className: string): Observable<CreditScoreSubjectConfig[]> {
    const params = { class: className };
    return this.http.get<CreditScoreSubjectConfig[]>(`${this.baseUrl}/schools/${schoolId}/credit-score`, { params });
  }

  updateCreditScore(
    schoolId: number,
    className: string,
    subject: string,
    formula: ComponentFormula
  ): Observable<CreditScoreSubjectConfig> {
    const params = { class: className };
    return this.http.put<CreditScoreSubjectConfig>(
      `${this.baseUrl}/schools/${schoolId}/credit-score/${encodeURIComponent(subject)}`,
      { formula },
      { params }
    );
  }

  updateRawField(schoolId: number, fieldKey: string, changes: { source: 'manual' | 'bluewings' }): Observable<RawField> {
    return this.http.put<RawField>(`${this.baseUrl}/schools/${schoolId}/raw-fields/${encodeURIComponent(fieldKey)}`, changes);
  }

  addRawField(schoolId: number, field: NewRawFieldRequest): Observable<RawField> {
    return this.http.post<RawField>(`${this.baseUrl}/schools/${schoolId}/raw-fields`, field);
  }
}
