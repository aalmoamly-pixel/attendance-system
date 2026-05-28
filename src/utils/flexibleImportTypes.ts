// ----------------------------------------------------
// 1. أنواع تحذيرات الاستيراد
// ----------------------------------------------------
export type ImportWarningType = 
  | 'COLUMN_COUNT_MISMATCH'
  | 'COLUMN_EMPTY_NAME'
  | 'COLUMN_UNKNOWN'
  | 'MERGED_CELLS_DETECTED'
  | 'STUDENT_NAME_MISSING'
  | 'PHONE_MISSING'
  | 'ACADEMIC_ID_MISSING'
  | 'PASSWORD_MISSING'
  | 'DEPARTMENT_MISSING'
  | 'DEPARTMENT_UNKNOWN';

export interface ImportWarning {
  id: string;
  type: ImportWarningType;
  rowIndex?: number;
  columnIndex?: number;
  columnName?: string;
  message: string;
  autoFixed: boolean;
}

// ----------------------------------------------------
// 2. صف بيانات بعد التحليل
// ----------------------------------------------------
export interface ProcessedRow {
  original: Record<string, any>;
  processed: {
    fullName: string;
    phone: string;
    academicId: string;
    nationalId: string;
    password: string;
    department: string;
  };
  warnings: ImportWarning[];
  isSuccess: boolean;
}

// ----------------------------------------------------
// 3. تقرير الاستيراد
// ----------------------------------------------------
export interface ImportReport {
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  totalWarnings: number;
  autoFixedCount: number;
  ignoredColumns: string[];
  warnings: ImportWarning[];
  processedRows: ProcessedRow[];
}

// ----------------------------------------------------
// 4. نتيجة الاستيراد النهائية
// ----------------------------------------------------
export interface FlexibleImportResult {
  success: boolean;
  report: ImportReport;
  departments: { department_id: number; department_name: string; degree_type: string | null }[];
  students: { full_name: string; phone: string | null; academic_id: string; national_id: string; password: string; department_id: number }[];
  subjects: { subject_id: number; subject_name: string; department_id: number | null }[];
  schedules: { student_id: number; subject_id: number; weekday_id: number; slot_id: number }[];
  stats: {
    totalStudents: number;
    totalSubjects: number;
    totalSchedules: number;
    totalDepartments: number;
  };
}
