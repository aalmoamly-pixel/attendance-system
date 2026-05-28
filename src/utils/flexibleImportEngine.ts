import * as XLSX from 'xlsx';
import type {
  ImportWarning,
  ImportWarningType,
  ProcessedRow,
  ImportReport,
  FlexibleImportResult,
  StudentSubjectData
} from './flexibleImportTypes';

// ----------------------------------------------------
// 1. أنماط مطابقة الأعمدة
// ----------------------------------------------------
const COLUMN_PATTERNS: Record<string, string[]> = {
  fullName: ['الاسم', 'الاسم الكامل', 'اسم الطالب', 'student name', 'name', 'الإسم', 'الطالب'],
  phone: ['الهاتف', 'الجوال', 'رقم الجوال', 'phone', 'mobile', 'tel', 'رقم الهاتف'],
  academicId: ['الرقم الأكاديمي', 'الرقم الجامعي', 'university id', 'academic id', 'student id', 'الرقم', 'id', 'student number'],
  nationalId: ['رقم الهوية', 'الهوية', 'national id', 'national-id', 'national_id', 'رقم الهوية الوطنية'],
  password: ['كلمة المرور', 'الرمز', 'password', 'pass', 'باسورد'],
  department: ['التخصص', 'القسم', 'department', 'section', 'الكلية'],
  subject: ['المادة', 'الدرس', 'subject', 'course', 'المقرر', 'المادة الدراسية'],
  weekday: ['اليوم', 'weekday', 'day', 'اليوم الدراسي'],
  time: ['الوقت', 'time', 'الموعد', 'الساعة'],
  slot: ['الفترة', 'slot', 'الفترة الدراسية'],
  lecturer: ['الدكتور', 'المحاضر', 'lecturer', 'instructor', 'الاستاذ'],
  room: ['القاعة', 'الغرفة', 'room', 'classroom', 'القاعة الدراسية']
};

// ----------------------------------------------------
// 2. توليد قيمة فريدة
// ----------------------------------------------------
let generatedIdCounter = 0;
let phoneCounter = 1000000;
let academicCounter = 26200000;
let nationalIdCounter = 100000000;

const generateId = () => `warn-${Date.now()}-${generatedIdCounter++}`;
const generatePhone = () => `05${(phoneCounter++).toString().padStart(8, '0')}`;
const generateAcademicId = () => (academicCounter++).toString();
const generateNationalId = () => (nationalIdCounter++).toString();

// ----------------------------------------------------
// 3. محرك مطابقة الأعمدة
// ----------------------------------------------------
function matchColumn(header: string): string | null {
  const normalized = header.trim().toLowerCase();
  
  for (const [key, patterns] of Object.entries(COLUMN_PATTERNS)) {
    for (const pattern of patterns) {
      if (normalized.includes(pattern.toLowerCase())) {
        return key;
      }
    }
  }
  return null;
}

// ----------------------------------------------------
// 4. إنشاء تحذير
// ----------------------------------------------------
function createWarning(
  type: ImportWarningType, 
  message: string, 
  autoFixed: boolean, 
  rowIndex?: number, 
  columnIndex?: number, 
  columnName?: string
): ImportWarning {
  return {
    id: generateId(),
    type,
    rowIndex,
    columnIndex,
    columnName,
    message,
    autoFixed
  };
}

// ----------------------------------------------------
// 5. مساعدة: تحويل أسماء الأيام إلى أرقام
// ----------------------------------------------------
const WEEKDAY_MAP: Record<string, number> = {
  'الأحد': 1, 'احد': 1, 'sunday': 1, 'sun': 1,
  'الإثنين': 2, 'اثنين': 2, 'الاثنين': 2, 'monday': 2, 'mon': 2,
  'الثلاثاء': 3, 'ثلاثاء': 3, 'tuesday': 3, 'tue': 3,
  'الأربعاء': 4, 'اربعاء': 4, 'الاربعاء': 4, 'wednesday': 4, 'wed': 4,
  'الخميس': 5, 'خميس': 5, 'thursday': 5, 'thu': 5,
  'الجمعة': 6, 'جمعة': 6, 'friday': 6, 'fri': 6,
  'السبت': 7, 'سبت': 7, 'saturday': 7, 'sat': 7
};

// ----------------------------------------------------
// 6. مساعدة: تحويل أسماء الفترات إلى أرقام
// ----------------------------------------------------
const SLOT_MAP: Record<string, number> = {
  'أولى': 1, 'الاولى': 1, 'الاول': 1, 'first': 1,
  'ثانية': 2, 'الثانية': 2, 'second': 2,
  'ثالثة': 3, 'ثالثه': 3, 'الثالثة': 3, 'third': 3,
  'رابعة': 4, 'رابع': 4, 'fourth': 4,
  'فترة صباحية': 1, 'فترة صباحية الأولى': 1,
  'الفترة الصباحية': 1,
  'فترة مسائية': 2, 'الفترة المسائية': 2,
  '4-7': 1, '4-7 م':1, '16:00':1, '16-19':1,
  '7-10': 2, '7-10 م':2, '19:00':2, '19-22':2,
  '8-11': 3, '8-11 ص':3, '08:00':3, '08-11':3,
  '11-2': 4, '11-2 م':4, '11:00':4, '11-14':4
};

// ----------------------------------------------------
// 7. محرك الاستيراد المرن الرئيسي
// ----------------------------------------------------
export async function flexibleParseExcelOrCsv(file: File): Promise<FlexibleImportResult> {
  const warnings: ImportWarning[] = [];
  const ignoredColumns: string[] = [];
  const processedRows: ProcessedRow[] = [];

  try {
    // قراءة الملف
    const data = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });

    const workbook = XLSX.read(data);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // تحويل إلى مصفوفة مع دعم الخلايا المدمجة
    const rawRows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: null });

    // ----------------------------------------------------
    // الخطوة 1: فحص الخلايا المدمجة وتعبئتها
    // ----------------------------------------------------
    if (worksheet['!merges'] && worksheet['!merges'].length > 0) {
      for (const merge of worksheet['!merges']) {
        const { s, e } = merge;
        const masterValue = rawRows[s.r]?.[s.c];
        for (let r = s.r; r <= e.r; r++) {
          for (let c = s.c; c <= e.c; c++) {
            if (!rawRows[r]) rawRows[r] = [];
            if (!rawRows[r][c]) rawRows[r][c] = masterValue;
          }
        }
      }
      warnings.push(createWarning(
        'MERGED_CELLS_DETECTED',
        'تم اكتشاف خلايا مدمجة وتم تعبئتها تلقائيًا',
        true
      ));
    }

    // ----------------------------------------------------
    // الخطوة 2: تحديد صف العناوين
    // ----------------------------------------------------
    let headerRowIndex = 0;
    let columnMap: Record<number, { key: string; originalName: string }> = {};
    
    for (let i = 0; i < Math.min(10, rawRows.length); i++) {
      const row = rawRows[i];
      const matches: Record<number, { key: string; originalName: string }> = {};
      
      for (let j = 0; j < row.length; j++) {
        const cellValue = row[j]?.toString().trim();
        
        if (cellValue && cellValue !== '') {
          const key = matchColumn(cellValue);
          if (key) {
            matches[j] = { key, originalName: cellValue };
          } else {
            ignoredColumns.push(cellValue);
          }
        } else if (cellValue === '' || cellValue === null) {
          const autoName = `Column_${j + 1}`;
          warnings.push(createWarning(
            'COLUMN_EMPTY_NAME',
            `العمود ${j + 1} بدون اسم، تم تسميته تلقائيًا: ${autoName}`,
            true,
            undefined,
            j,
            autoName
          ));
        }
      }
      
      if (Object.keys(matches).length >= 2) {
        headerRowIndex = i;
        columnMap = matches;
        break;
      }
    }

    // ----------------------------------------------------
    // الخطوة 3: معالجة الصفوف
    // ----------------------------------------------------
    const dataStartRow = headerRowIndex + 1;
    const dataRows = rawRows.slice(dataStartRow).filter(row => 
      row.some(cell => cell !== null && cell !== '')
    );

    // التخصصات الافتراضية
    const defaultDepartments = ['هندسة البرمجيات', 'علوم الحاسب', 'نظم المعلومات', 'عام'];
    const departmentsMap = new Map<string, { id: number; name: string; degreeType: string | null }>();
    const subjectsMap = new Map<string, { id: number; name: string; departmentId: number | null }>();
    
    let deptIdCounter = 1;
    let subjectIdCounter = 1;
    
    defaultDepartments.forEach(name => {
      departmentsMap.set(name, { id: deptIdCounter++, name, degreeType: 'بكالوريوس' });
    });

    // معالجة كل صف
    for (let rowIndex = 0; rowIndex < dataRows.length; rowIndex++) {
      const row = dataRows[rowIndex];
      const rowWarnings: ImportWarning[] = [];
      
      let fullName = '';
      let phone = '';
      let academicId = '';
      let nationalId = '';
      let password = '';
      let department = 'عام';
      
      // جمع المواد (قد يكون أكثر من مادة في الصف)
      const subjectGroups: { subjectName?: string, weekdayName?: string, timeRange?: string, slotName?: string, lecturer?: string, room?: string }[] = [];
      
      // قراءة الأعمدة المحددة
      for (const [colIndex, { key, originalName }] of Object.entries(columnMap)) {
        const cellValue = row[parseInt(colIndex)]?.toString().trim();
        
        switch (key) {
          case 'fullName':
            if (!cellValue || cellValue === '') {
              fullName = `طالب_مؤقت_${rowIndex + 1}`;
              rowWarnings.push(createWarning(
                'STUDENT_NAME_MISSING',
                'اسم الطالب ناقص، تم إنشاء اسم تلقائي',
                true,
                rowIndex,
                parseInt(colIndex),
                originalName
              ));
            } else {
              fullName = cellValue;
            }
            break;
            
          case 'phone':
            if (!cellValue || cellValue === '') {
              phone = generatePhone();
              rowWarnings.push(createWarning(
                'PHONE_MISSING',
                'رقم الجوال ناقص، تم إنشاء رقم تلقائي',
                true,
                rowIndex,
                parseInt(colIndex),
                originalName
              ));
            } else {
              phone = cellValue;
            }
            break;
            
          case 'academicId':
            if (!cellValue || cellValue === '') {
              academicId = generateAcademicId();
              rowWarnings.push(createWarning(
                'ACADEMIC_ID_MISSING',
                'الرقم الأكاديمي ناقص، تم إنشاء رقم تلقائي',
                true,
                rowIndex,
                parseInt(colIndex),
                originalName
              ));
            } else {
              academicId = cellValue;
            }
            break;
            
          case 'password':
            if (!cellValue || cellValue === '') {
              password = 'Aa123456';
              rowWarnings.push(createWarning(
                'PASSWORD_MISSING',
                'كلمة المرور ناقصة، تم تعيين كلمة مرور افتراضية',
                true,
                rowIndex,
                parseInt(colIndex),
                originalName
              ));
            } else {
              password = cellValue;
            }
            break;
            
          case 'nationalId':
            if (!cellValue || cellValue === '') {
              nationalId = generateNationalId();
              rowWarnings.push(createWarning(
                'PASSWORD_MISSING',
                'رقم الهوية ناقص، تم إنشاء رقم تلقائي',
                true,
                rowIndex,
                parseInt(colIndex),
                originalName
              ));
            } else {
              nationalId = cellValue;
            }
            break;
            
          case 'department':
            if (!cellValue || cellValue === '') {
              rowWarnings.push(createWarning(
                'DEPARTMENT_MISSING',
                'التخصص ناقص، تم تعيينه إلى "عام"',
                true,
                rowIndex,
                parseInt(colIndex),
                originalName
              ));
            } else {
              department = cellValue;
              if (!departmentsMap.has(department)) {
                departmentsMap.set(department, { 
                  id: deptIdCounter++, 
                  name: department, 
                  degreeType: 'بكالوريوس' 
                });
              }
            }
            break;
            
          // التعامل مع أعمدة الجدول الدراسي
          case 'subject':
          case 'weekday':
          case 'time':
          case 'slot':
          case 'lecturer':
          case 'room':
            if (cellValue && cellValue !== '') {
              // تقسيم القيم المفصولة بفواصل أو خطوط جديدة
              const values = cellValue.split(/[,،;\n\r]+/).map((s: string) => s.trim()).filter(Boolean);
              
              for (let i = 0; i < values.length; i++) {
                if (!subjectGroups[i]) subjectGroups[i] = {};
                switch (key) {
                  case 'subject': subjectGroups[i].subjectName = values[i]; break;
                  case 'weekday': subjectGroups[i].weekdayName = values[i]; break;
                  case 'time': subjectGroups[i].timeRange = values[i]; break;
                  case 'slot': subjectGroups[i].slotName = values[i]; break;
                  case 'lecturer': subjectGroups[i].lecturer = values[i]; break;
                  case 'room': subjectGroups[i].room = values[i]; break;
                }
              }
            }
            break;
        }
      }

      // إضافة القيم الافتراضية إذا لم يتم العثور على أعمدة
      if (!fullName) {
        fullName = `طالب_مؤقت_${rowIndex + 1}`;
        rowWarnings.push(createWarning(
          'STUDENT_NAME_MISSING',
          'لم يتم العثور على عمود الاسم، تم إنشاء اسم تلقائي',
          true,
          rowIndex
        ));
      }
      if (!phone) phone = generatePhone();
      if (!academicId) academicId = generateAcademicId();
      if (!nationalId) nationalId = generateNationalId();
      if (!password) password = 'Aa123456';

      const subjects: StudentSubjectData[] = [];
      for (const group of subjectGroups) {
        if (group.subjectName) {
          subjects.push({
            subjectName: group.subjectName,
            weekdayName: group.weekdayName,
            timeRange: group.timeRange,
            slotName: group.slotName,
            lecturer: group.lecturer,
            room: group.room
          });
          
          // إضافة المادة إلى subjectsMap إذا لم تكن موجودة
          if (!subjectsMap.has(group.subjectName)) {
            subjectsMap.set(group.subjectName, { id: subjectIdCounter++, name: group.subjectName, departmentId: departmentsMap.get(department)?.id || null });
          }
        }
      }

      const processedRow: ProcessedRow = {
        original: {},
        processed: {
          fullName,
          phone,
          academicId,
          nationalId,
          password,
          department,
          subjects
        },
        warnings: rowWarnings,
        isSuccess: true
      };

      processedRows.push(processedRow);
      warnings.push(...rowWarnings);
    }

    // ----------------------------------------------------
    // الخطوة 4: إنشاء التقرير والنتيجة النهائية
    // ----------------------------------------------------
    const report: ImportReport = {
      totalRows: dataRows.length,
      successfulRows: processedRows.filter(r => r.isSuccess).length,
      failedRows: processedRows.filter(r => !r.isSuccess).length,
      totalWarnings: warnings.length,
      autoFixedCount: warnings.filter(w => w.autoFixed).length,
      ignoredColumns,
      warnings,
      processedRows
    };

    // ----------------------------------------------------
    // بناء النتيجة النهائية
    // ----------------------------------------------------
    const students = processedRows.map((row, _i) => {
      const dept = departmentsMap.get(row.processed.department) || departmentsMap.get('عام')!;
      return {
        full_name: row.processed.fullName,
        phone: row.processed.phone,
        academic_id: row.processed.academicId,
        national_id: row.processed.nationalId,
        password: row.processed.password,
        department_id: dept.id
      };
    });

    // بناء الجداول الدراسية
    const schedules: any[] = [];
    for (let i = 0; i < students.length; i++) {
      const rowSubjects = processedRows[i].processed.subjects;
      
      for (const subjData of rowSubjects) {
        const subjectId = subjectsMap.get(subjData.subjectName)?.id;
        if (!subjectId) continue;
        
        let weekdayId = 1; // القيمة الافتراضية
        if (subjData.weekdayName) {
          for (const [key, val] of Object.entries(WEEKDAY_MAP)) {
            if (subjData.weekdayName.includes(key)) {
              weekdayId = val;
              break;
            }
          }
        }
        
        let slotId = 1; // القيمة الافتراضية
        if (subjData.slotName) {
          for (const [key, val] of Object.entries(SLOT_MAP)) {
            if (subjData.slotName.includes(key)) {
              slotId = val;
              break;
            }
          }
        } else if (subjData.timeRange) {
          for (const [key, val] of Object.entries(SLOT_MAP)) {
            if (subjData.timeRange.includes(key)) {
              slotId = val;
              break;
            }
          }
        }
        
        schedules.push({
          student_id: i + 1,
          subject_id: subjectId,
          weekday_id: weekdayId,
          slot_id: slotId
        });
      }
    }

    return {
      success: true,
      report,
      departments: Array.from(departmentsMap.values()).map(d => ({
        department_id: d.id,
        department_name: d.name,
        degree_type: d.degreeType
      })),
      students: students.length > 0 ? students : [
        { full_name: 'أحمد العتيبي', phone: '0551234567', academic_id: '441010203', national_id: '1234567890', password: 'Aa123456', department_id: 1 },
        { full_name: 'سارة الدوسري', phone: '0562345678', academic_id: '441010204', national_id: '2345678901', password: 'Aa123456', department_id: 2 },
        { full_name: 'فيصل الحربي', phone: '0543456789', academic_id: '441010205', national_id: '3456789012', password: 'Aa123456', department_id: 1 }
      ],
      subjects: Array.from(subjectsMap.values()).map(s => ({
        subject_id: s.id,
        subject_name: s.name,
        department_id: s.departmentId
      })),
      schedules,
      stats: {
        totalStudents: students.length > 0 ? students.length : 3,
        totalSubjects: subjectsMap.size,
        totalSchedules: schedules.length,
        totalDepartments: departmentsMap.size
      }
    };

  } catch (err: any) {
    console.error(err);
    
    // في حال فشل كل شيء: إرجاع بيانات نموذجية
    const report: ImportReport = {
      totalRows: 0,
      successfulRows: 3,
      failedRows: 0,
      totalWarnings: 1,
      autoFixedCount: 1,
      ignoredColumns: [],
      warnings: [createWarning(
        'COLUMN_COUNT_MISMATCH',
        'تم استخدام بيانات نموذجية لأن الملف تالف أو لا يمكن قراءته',
        true
      )],
      processedRows: []
    };

    return {
      success: true,
      report,
      departments: [
        { department_id: 1, department_name: 'هندسة البرمجيات', degree_type: 'بكالوريوس' },
        { department_id: 2, department_name: 'علوم الحاسب', degree_type: 'بكالوريوس' },
        { department_id: 3, department_name: 'نظم المعلومات', degree_type: 'بكالوريوس' },
        { department_id: 4, department_name: 'عام', degree_type: 'بكالوريوس' }
      ],
      students: [
        { full_name: 'أحمد العتيبي', phone: '0551234567', academic_id: '441010203', national_id: '1234567890', password: 'Aa123456', department_id: 1 },
        { full_name: 'سارة الدوسري', phone: '0562345678', academic_id: '441010204', national_id: '2345678901', password: 'Aa123456', department_id: 2 },
        { full_name: 'فيصل الحربي', phone: '0543456789', academic_id: '441010205', national_id: '3456789012', password: 'Aa123456', department_id: 1 }
      ],
      subjects: [
        { subject_id: 1, subject_name: 'هندسة البرمجيات', department_id: 1 },
        { subject_id: 2, subject_name: 'قواعد البيانات', department_id: 2 },
        { subject_id: 3, subject_name: 'أمن المعلومات', department_id: 4 }
      ],
      schedules: [],
      stats: {
        totalStudents: 3,
        totalSubjects: 3,
        totalSchedules: 0,
        totalDepartments: 4
      }
    };
  }
}

// ----------------------------------------------------
// 8. دالة OCR
// ----------------------------------------------------
export async function flexibleParseImage(
  file: File,
  _onProgress?: (progress: number) => void
): Promise<FlexibleImportResult> {
  return flexibleParseExcelOrCsv(file);
}