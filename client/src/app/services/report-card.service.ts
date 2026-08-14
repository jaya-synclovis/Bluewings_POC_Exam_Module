import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SchemeConfig, SchoolSummary, Student } from '../models/report-card.models';

@Injectable({ providedIn: 'root' })
export class ReportCardService {
  private readonly baseUrl = 'http://localhost:3000/api';

  constructor(private readonly http: HttpClient) {}

  getSchools(): Observable<SchoolSummary[]> {
    return this.http.get<SchoolSummary[]>(`${this.baseUrl}/schools`);
  }

  private classSubjectTermParams(klass: string, subject: string, term: string): HttpParams {
    let params = new HttpParams().set('class', klass).set('subject', subject);
    if (term) params = params.set('term', term);
    return params;
  }

  getScheme(schoolId: number, klass: string, subject: string, term: string): Observable<SchemeConfig> {
    const params = this.classSubjectTermParams(klass, subject, term);
    return this.http.get<SchemeConfig>(`${this.baseUrl}/schools/${schoolId}/scheme`, { params });
  }

  getStudents(schoolId: number, klass: string, subject: string, term: string): Observable<Student[]> {
    const params = this.classSubjectTermParams(klass, subject, term);
    return this.http.get<Student[]>(`${this.baseUrl}/schools/${schoolId}/students`, { params });
  }

  updateMark(
    schoolId: number,
    studentId: number,
    klass: string,
    subject: string,
    term: string,
    componentKey: string,
    value: number
  ): Observable<Student> {
    return this.http.put<Student>(`${this.baseUrl}/schools/${schoolId}/students/${studentId}`, {
      class: klass,
      subject,
      term: term || undefined,
      componentKey,
      value,
    });
  }

  updateGrade(
    schoolId: number,
    studentId: number,
    klass: string,
    subject: string,
    term: string,
    grade: string
  ): Observable<Student> {
    return this.http.put<Student>(`${this.baseUrl}/schools/${schoolId}/students/${studentId}/grade`, {
      class: klass,
      subject,
      term: term || undefined,
      grade,
    });
  }
}
