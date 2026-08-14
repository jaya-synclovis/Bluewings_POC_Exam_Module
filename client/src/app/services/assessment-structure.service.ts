import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { StructureDetail, TotalFormula } from '../models/report-card.models';

@Injectable({ providedIn: 'root' })
export class AssessmentStructureService {
  private readonly baseUrl = 'http://localhost:3000/api';

  constructor(private readonly http: HttpClient) {}

  getStructures(schoolId: number): Observable<StructureDetail[]> {
    return this.http.get<StructureDetail[]>(`${this.baseUrl}/schools/${schoolId}/structures`);
  }

  updateStructure(
    schoolId: number,
    structureId: number,
    changes: { name?: string; totalFormula?: TotalFormula }
  ): Observable<StructureDetail> {
    return this.http.put<StructureDetail>(`${this.baseUrl}/schools/${schoolId}/structures/${structureId}`, changes);
  }
}
