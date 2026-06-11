import * as XLSX from 'xlsx';

// نوع النتيجة النهائية
export interface ParsedStudent {
  fullName: string;
  nationalId: string;
  academicId: string;
  programName: string;
  status: string;
}

export interface ParsedScheduleItem {
  courseName: string;
  day: string;
  startTime: string;
  endTime: string;
  teacherName?: string;
  sectionCode?: string;
  creditHours?: string;
  programName: string;
}

export interface ParsedResult {
  student: ParsedStudent | null;
  schedule: ParsedScheduleItem[];
}

/**
 * محرك قراءة الجداول من Excel أو مصفوفة
 */
export class UniversityTableParser {
  // تقسيم الوقت إلى من وإلى
  private parseTimeRange(timeStr: string): { startTime: string; endTime: string } {
    const clean = timeStr.trim();
    const patterns = [
      /(\d{1,2}):(\d{2})\s*[-–至]\s*(\d{1,2}):(\d{2})/, // 04:00-07:00
      /(\d{1,2})[-–](\d{1,2})\s*(?:م|ص|AM|PM)?/, // 4-7 م
    ];

    for (const pattern of patterns) {
      const match = clean.match(pattern);
      if (match) {
        if (match.length === 5) {
          return {
            startTime: `${match[1].padStart(2, '0')}:${match[2]}`,
            endTime: `${match[3].padStart(2, '0')}:${match[4]}`,
          };
        } else if (match.length === 3) {
          return {
            startTime: `${match[1].padStart(2, '0')}:00`,
            endTime: `${match[2].padStart(2, '0')}:00`,
          };
        }
      }
    }

    // إذا لم يتطابق أي نمط:
    return { startTime: '00:00', endTime: '00:00' };
  }

  // تحويل أسماء الأيام إلى الشكل الصحيح
  private normalizeDay(dayStr: string): string {
    const map: Record<string, string> = {
      'الأحد': 'الأحد', 'احد': 'الأحد',
      'الإثنين': 'الإثنين', 'اثنين': 'الإثنين',
      'الثلاثاء': 'الثلاثاء', 'ثلاثاء': 'الثلاثاء',
      'الأربعاء': 'الأربعاء', 'اربعاء': 'الأربعاء',
      'الخميس': 'الخميس', 'خميس': 'الخميس',
      'الجمعة': 'الجمعة', 'جمعة': 'الجمعة',
      'السبت': 'السبت', 'سبت': 'السبت',
    };

    const clean = dayStr.trim();
    for (const [key, value] of Object.entries(map)) {
      if (clean.includes(key)) {
        return value;
      }
    }
    return clean;
  }

  /**
   * قراءة مصفوفة بيانات (من Excel أو HTML)
   */
  private parseGrid(grid: string[][]): ParsedResult {
    const result: ParsedResult = {
      student: null,
      schedule: [],
    };

    // الخطوة 1: استخراج بيانات الطالب من الجزء العلوي
    result.student = this.extractStudentInfo(grid);

    // الخطوة 2: معالجة الخلايا المدمجة
    const expandedGrid = this.expandMergedCells(grid);

    // الخطوة 3: استخراج الجدول الدراسي
    result.schedule = this.extractSchedule(expandedGrid, result.student?.programName || 'عام');

    return result;
  }

  /**
   * استخراج بيانات الطالب
   */
  private extractStudentInfo(grid: string[][]): ParsedStudent | null {
    const student: Partial<ParsedStudent> = {
      fullName: '',
      nationalId: '',
      academicId: '',
      programName: 'عام',
      status: '',
    };

    // نماذج للبحث في الخلايا
    const patterns = {
      fullName: [/الاسم\s*[:\-]?\s*(.+)/i, /اسم\s+الطالب\s*[:\-]?\s*(.+)/i],
      nationalId: [/رقم\s*الهوية\s*[:\-]?\s*(\d{10})/i, /الهوية\s*[:\-]?\s*(\d{10})/i],
      academicId: [/الرقم\s*الأكاديمي\s*[:\-]?\s*(\d{7,9})/i, /الرقم\s*الجامعي\s*[:\-]?\s*(\d{7,9})/i, /university\s*id\s*[:\-]?\s*(\d{7,9})/i],
      programName: [/البرنامج\s*[:\-]?\s*(.+)/i, /التخصص\s*[:\-]?\s*(.+)/i, /القسم\s*[:\-]?\s*(.+)/i, /department\s*[:\-]?\s*(.+)/i],
      status: [/الحالة\s*[:\-]?\s*(.+)/i, /status\s*[:\-]?\s*(.+)/i],
    };

    // البحث في الجزء العلوي من الجدول (أول 10 صفوف عادةً)
    for (let row = 0; row < Math.min(20, grid.length); row++) {
      for (let col = 0; col < Math.min(20, grid[row]?.length || 0); col++) {
        const cell = (grid[row][col] || '').toString().trim();
        if (!cell) continue;

        // البحث عن الاسم
        for (const pattern of patterns.fullName) {
          const match = cell.match(pattern);
          if (match && match[1]) {
            student.fullName = match[1].trim();
            break;
          }
        }
        if (!student.fullName && cell.length > 5 && !cell.includes(':') && !cell.match(/^\d/)) {
          // ربما هو الاسم نفسه بدون علامة
          if (cell.includes(' ') || cell.length > 8) {
            student.fullName = cell;
          }
        }

        // البحث عن رقم الهوية
        for (const pattern of patterns.nationalId) {
          const match = cell.match(pattern);
          if (match) {
            student.nationalId = match[1];
            break;
          }
        }
        if (!student.nationalId && cell.match(/^\d{10}$/)) {
          student.nationalId = cell;
        }

        // البحث عن الرقم الأكاديمي
        for (const pattern of patterns.academicId) {
          const match = cell.match(pattern);
          if (match) {
            student.academicId = match[1];
            break;
          }
        }
        if (!student.academicId && cell.match(/^\d{7,9}$/)) {
          if (cell !== student.nationalId) {
            student.academicId = cell;
          }
        }

        // البحث عن البرنامج
        for (const pattern of patterns.programName) {
          const match = cell.match(pattern);
          if (match && match[1]) {
            student.programName = match[1].trim();
            break;
          }
        }

        // البحث عن الحالة
        for (const pattern of patterns.status) {
          const match = cell.match(pattern);
          if (match && match[1]) {
            student.status = match[1].trim();
            break;
          }
        }
      }
    }

    return student.fullName && (student.nationalId || student.academicId) ? student as ParsedStudent : null;
  }

  /**
   * توسيع الخلايا المدمجة
   */
  private expandMergedCells(grid: string[][]): string[][] {
    const expanded = grid.map(row => [...row]);

    for (let row = 0; row < expanded.length; row++) {
      for (let col = 0; col < expanded[row].length; col++) {
        if (!expanded[row][col] || expanded[row][col].toString().trim() === '') {
          // ننظر للأعلى في نفس العمود
          for (let checkRow = row - 1; checkRow >= 0; checkRow--) {
            const val = expanded[checkRow][col];
            if (val && val.toString().trim() !== '') {
              expanded[row][col] = val;
              break;
            }
          }
          // إذا لم يوجد، ننظر إلى اليسار في نفس الصف
          if (!expanded[row][col] || expanded[row][col].toString().trim() === '') {
            for (let checkCol = col - 1; checkCol >= 0; checkCol--) {
              const val = expanded[row][checkCol];
              if (val && val.toString().trim() !== '') {
                expanded[row][col] = val;
                break;
              }
            }
          }
        }
      }
    }

    return expanded;
  }

  /**
   * استخراج الجدول الدراسي
   */
  private extractSchedule(grid: string[][], defaultProgramName: string): ParsedScheduleItem[] {
    const schedule: ParsedScheduleItem[] = [];
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

    // البحث عن بداية الجدول الدراسي (حيث يظهر اليوم أو المادة أو الوقت)
    let startRow = 0;
    for (let row = 0; row < grid.length; row++) {
      const rowStr = grid[row].join(' ');
      if (days.some(d => rowStr.includes(d)) || rowStr.includes('المقرر') || rowStr.includes('المادة') || rowStr.includes('الوقت')) {
        startRow = row;
        break;
      }
    }

    // تحديد الأعمدة
    let dayCol = -1;
    let courseCol = -1;
    let timeCol = -1;
    let teacherCol = -1;
    let sectionCol = -1;
    let creditCol = -1;

    // الحاول تحديد الأعمدة من الصف الرأيسي
    for (let col = 0; col < grid[startRow]?.length || 0; col++) {
      const cell = (grid[startRow][col] || '').toString().toLowerCase();
      if (cell.includes('اليوم') || cell.includes('day')) dayCol = col;
      if (cell.includes('المقرر') || cell.includes('المادة') || cell.includes('course') || cell.includes('subject')) courseCol = col;
      if (cell.includes('الوقت') || cell.includes('time')) timeCol = col;
      if (cell.includes('الدكتور') || cell.includes('المحاضر') || cell.includes('lecturer') || cell.includes('teacher')) teacherCol = col;
      if (cell.includes('الشعبة') || cell.includes('section')) sectionCol = col;
      if (cell.includes('الساعات') || cell.includes('ساعات') || cell.includes('credit')) creditCol = col;
    }

    // إذا لم يتم العثور على الأعمدة من الرأيسي، نحاول تحديدها من المحتوى
    if (courseCol === -1) {
      for (let row = startRow; row < Math.min(startRow + 10, grid.length); row++) {
        for (let col = 0; col < grid[row]?.length; col++) {
          const cell = (grid[row][col] || '').toString().trim();
          if (cell.length > 6 && !cell.match(/^\d+$/) && !days.some(d => cell.includes(d)) && !cell.match(/^\d{1,2}:/)) {
            courseCol = col;
            break;
          }
        }
        if (courseCol !== -1) break;
      }
    }

    // الآن قراءة كل صف بعد بداية الجدول
    for (let row = startRow + 1; row < grid.length; row++) {
      const rowCells = grid[row] || [];
      
      // الحصول على البيانات
      let courseName = '';
      let day = '';
      let timeRange = '';
      let teacherName = '';
      let sectionCode = '';
      let creditHours = '';

      for (let col = 0; col < rowCells.length; col++) {
        const cell = (rowCells[col] || '').toString().trim();
        if (!cell) continue;

        // تحديد نوع البيانات في هذا العمود
        if (col === courseCol) {
          courseName = cell;
        } else if (col === dayCol) {
          day = cell;
        } else if (col === timeCol) {
          timeRange = cell;
        } else if (col === teacherCol) {
          teacherName = cell;
        } else if (col === sectionCol) {
          sectionCode = cell;
        } else if (col === creditCol) {
          creditHours = cell;
        } else {
          // محاولة تحديد نوع المحتوى تلقائيًا
          if (days.some(d => cell.includes(d))) day = cell;
          else if (cell.match(/\d{1,2}:/) || cell.includes('-') && cell.match(/\d/)) timeRange = cell;
          else if (cell.length > 5 && !courseName) courseName = cell;
          else if (!teacherName && cell.includes('د.') || cell.includes('الدكتور')) teacherName = cell;
        }
      }

      // معالجة البيانات
      if (courseName && (day || timeRange)) {
        const { startTime, endTime } = this.parseTimeRange(timeRange || '00:00-00:00');
        const normalizedDay = this.normalizeDay(day || 'الأحد');

        schedule.push({
          courseName,
          day: normalizedDay,
          startTime,
          endTime,
          teacherName,
          sectionCode,
          creditHours,
          programName: defaultProgramName,
        });
      }
    }

    return schedule;
  }

  /**
   * قراءة ملف Excel
   */
  async parseExcel(file: File): Promise<ParsedResult> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const grid = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as string[][];
        
        resolve(this.parseGrid(grid));
      };
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * قراءة HTML Table (من string أو عنصر DOM)
   */
  parseHtmlTable(html: string): ParsedResult {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const tables = Array.from(doc.querySelectorAll('table'));
    
    let combinedGrid: string[][] = [];
    
    tables.forEach(table => {
      const rows = Array.from(table.rows);
      rows.forEach(row => {
        const cells = Array.from(row.cells);
        const cellValues = cells.map(cell => cell.innerText || cell.textContent || '');
        combinedGrid.push(cellValues);
      });
    });

    return this.parseGrid(combinedGrid);
  }
}
