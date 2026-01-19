export interface Section {
  _id: string;
  section_id: string;
  name: string;
  description?: string;
  grade_id?: {
    _id: string;
    grade_id: string;
    name: string;
    level: number;
  } | string;
  capacity?: number;
  is_active: boolean;
  created_by: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSectionRequest {
  section_id: string;
  name: string;
  description?: string;
  grade_id?: string;
  capacity?: number;
}

export interface UpdateSectionRequest {
  name?: string;
  description?: string;
  grade_id?: string;
  capacity?: number;
}

export interface SectionListResponse {
  sections: Section[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
