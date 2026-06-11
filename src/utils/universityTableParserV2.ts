import * as XLSX from 'xlsx';
import Tesseract from 'tesseract.js';

export interface ParsedStudent {
  fullName: string;
  nationalId: string;
  academicId: string;
  programName: string;
  status: string;
}

export interface ParsedScheduleItem {
  courseName: string;
  creditHours?: string;
  sectionCode?: string;
  lecturer?: string;
  day: string;
  startTime: string;
  endTime: string;
  duration?: string;
}

export interface ParsedResult {
  student: ParsedStudent | null;
  schedule: ParsedScheduleItem[];
  debugLog: DebugLogEntry[];
}

export interface DebugLogEntry {
  columnName: string;
  extractedValue: string;
  mappedToField: string;
  rowNumber?: number;
  status: 'success' | 'warning' | 'error';
}

const STUDENT_FIELD_ALIASES: Record<string, string[]> = {
  fullName: ['الاسم', 'اسم الطالب', 'الاسم الكامل', 'الطالب', 'student name', 'name'],
  nationalId: ['رقم الهوية', 'الهوية', 'رقم الهوية الوطنية', 'national id', 'national-id', 'national_id', 'id'],
  academicId: ['الرقم الأكاديمي', 'الرقم الجامعي', 'university id', 'academic id', 'student number', 'الرقم', 'student id'],
  programName: ['البرنامج', 'التخصص', 'القسم', 'department', 'program'],
  status: ['الحالة', 'status', 'حالة الطالب'],
};

const SCHEDULE_FIELD_ALIASES: Record<string, string[]> = {
  courseName: ['المقرر', 'المادة', 'المادة الدراسية', 'subject', 'course'],
  creditHours: ['عدد ساعات المقرر', 'عدد ساعات', 'الساعات', 'ساعات', 'credit hours', 'hours'],
  sectionCode: ['رمز الشعبة', 'الشعبة', 'section', 'section code'],
  lecturer: ['المحاضر', 'الدكتور', 'الاستاذ', 'lecturer', 'instructor', 'teacher'],
  day: ['اليوم', 'اليوم الدراسي', 'weekday', 'day'],
  startTime: ['المحاضرة تبدأ في', 'من', 'بداية', 'الوقت من', 'start time', 'start', 'الفترة', 'الوقت'],
  endTime: ['المحاضرة تنتهي في', 'إلى', 'نهاية', 'الوقت إلى', 'end time', 'end'],
  duration: ['مدة المحاضرة', 'المدة', 'duration'],
};

const DAY_MAP: Record<string, string> = {
  'الأحد': 'الأحد', 'احد': 'الأحد',
  'الإثنين': 'الإثنين', 'اثنين': 'الإثنين',
  'الثلاثاء': 'الثلاثاء', 'ثلاثاء': 'الثلاثاء',
  'الأربعاء': 'الأربعاء', 'اربعاء': 'الأربعاء',
  'الخميس': 'الخميس', 'خميس': 'الخميس',
  'الجمعة': 'الجمعة', 'جمعة': 'الجمعة',
  'السبت': 'السبت', 'سبت': 'السبت',
};

const EXCLUDED_HEADERS = new Set([
  "المقرر", "اليوم", "من", "إلى", "المحاضر", "رمز الشعبة", "المدة",
  "اسم الطالب", "الاسم", "الرقم الأكاديمي", "الرقم الجامعي", "رقم الهوية",
  "الهوية", "البرنامج", "التخصص", "القسم"
]);

export class UniversityTableParserV2 {
  debugLog: DebugLogEntry[] = [];

  private isHeaderRow(row: any[]): boolean {
    let headerCount = 0;
    for (const cell of row) {
      const cellStr = String(cell || '').trim();
      if (EXCLUDED_HEADERS.has(cellStr) || EXCLUDED_HEADERS.has(cellStr.replace(/\s+/g, ' ').trim())) {
        headerCount++;
      }
    }
    return headerCount >= 2;
  }

  private parseTimeRange(timeRangeStr: string): { startTime: string, endTime: string } {
    const cleaned = timeRangeStr.trim();
    if (!cleaned) return { startTime: '00:00', endTime: '00:00' };

    if (cleaned.includes('-')) {
      const parts = cleaned.split('-').map(p => p.trim());
      return {
        startTime: this.normalizeTime(parts[0]),
        endTime: parts.length > 1 ? this.normalizeTime(parts[1]) : '00:00'
      };
    }

    return {
      startTime: this.normalizeTime(cleaned),
      endTime: '00:00'
    };
  }

  private normalizeTime(timeStr: string): string {
    if (!timeStr || timeStr.trim() === '') return '00:00';
    
    let clean = timeStr.trim();
    let isPM = clean.toLowerCase().includes('pm');
    let isAM = clean.toLowerCase().includes('am');
    
    clean = clean.replace(/am|pm|صباحا|مساءً/gi, '').trim();
    
    const timePattern = /(\d{1,2})[:\.]?(\d{0,2})?/;
    const match = clean.match(timePattern);
    
    if (match) {
      let hour = parseInt(match[1], 10);
      let minute = parseInt(match[2] || '0', 10);
      
      if (isPM && hour < 12) hour += 12;
      if (isAM && hour === 12) hour = 0;
      
      const hourStr = hour.toString().padStart(2, '0');
      const minuteStr = minute.toString().padStart(2, '0');
      
      return `${hourStr}:${minuteStr}`;
    }
    
    return '00:00';
  }

  private normalizeDay(dayStr: string): string {
    const clean = dayStr.trim();
    for (const [key, value] of Object.entries(DAY_MAP)) {
      if (clean.includes(key)) return value;
    }
    return clean;
  }

  private isRowEmpty(row: any[]): boolean {
    return row.every(cell => cell === null || cell === undefined || (typeof cell === 'string' && cell.trim() === ''));
  }

  private isOnlyNumber(value: string): boolean {
    return /^\d+$/.test(value.trim());
  }

  private isExcludedHeader(value: string): boolean {
    const trimmed = value.trim().replace(/\s+/g, ' ');
    return EXCLUDED_HEADERS.has(trimmed);
  }

  private matchFieldAlias(cell: string, aliases: string[]): boolean {
    const cleanCell = cell.trim().toLowerCase();
    return aliases.some(alias => cleanCell.includes(alias.toLowerCase()));
  }

  private smartHeaderSplit(headerRow: string): string[] {
    const cleanRow = headerRow.trim();
    
    if (cleanRow.includes(',')) return cleanRow.split(',').map(cell => cell.trim());
    if (cleanRow.includes('|')) return cleanRow.split('|').map(cell => cell.trim());
    if (cleanRow.includes('\t')) return cleanRow.split('\t').map(cell => cell.trim());
    
    const sortedHeaders = [...new Set([...Object.values(SCHEDULE_FIELD_ALIASES), ...Object.values(STUDENT_FIELD_ALIASES)].flat())]
      .sort((a, b) => b.length - a.length);
    
    const foundHeaders: string[] = [];
    let remainingText = cleanRow;
    
    while (remainingText.trim().length > 0) {
      let matched = false;
      for (const header of sortedHeaders) {
        if (remainingText.toLowerCase().startsWith(header.toLowerCase())) {
          foundHeaders.push(header);
          remainingText = remainingText.slice(header.length).trim();
          matched = true;
          break;
        }
      }
      if (!matched) {
        const nextSpaceIdx = remainingText.search(/\s/);
        if (nextSpaceIdx !== -1) {
          foundHeaders.push(remainingText.slice(0, nextSpaceIdx).trim());
          remainingText = remainingText.slice(nextSpaceIdx).trim();
        } else {
          foundHeaders.push(remainingText.trim());
          remainingText = '';
        }
      }
    }
    
    return foundHeaders;
  }

  parseGrid(grid: any[][]): ParsedResult {
    this.debugLog = [];
    
    this.debugLog.push({
      columnName: "Total Rows in Grid",
      extractedValue: grid.length.toString(),
      mappedToField: "grid",
      rowNumber: undefined,
      status: "success"
    });

    const student: Partial<ParsedStudent> = {
      fullName: '',
      nationalId: '',
      academicId: '',
      programName: '',
      status: '',
    };
    const schedule: ParsedScheduleItem[] = [];
    const columnMap: Record<number, string> = {};
    let headerRowIndex: number | null = null;

    let processedGrid = [...grid];
    if (grid.length > 0 && grid[0].length === 1 && typeof grid[0][0] === 'string') {
      const splitHeaders = this.smartHeaderSplit(grid[0][0]);
      if (splitHeaders.length > 1) {
        processedGrid[0] = splitHeaders;
      }
    }

    // Log first 5 rows to see raw data
    for (let i = 0; i < Math.min(processedGrid.length, 5); i++) {
      this.debugLog.push({
        columnName: `Row ${i} Raw`,
        extractedValue: processedGrid[i].join(' | '),
        mappedToField: "raw",
        rowNumber: i,
        status: "success"
      });
    }

    // Find header row
    for (let rowIndex = 0; rowIndex < Math.min(processedGrid.length, 20); rowIndex++) {
      const row = processedGrid[rowIndex];
      if (this.isHeaderRow(row)) {
        headerRowIndex = rowIndex;
        this.debugLog.push({
          columnName: "Header Row Found at Index",
          extractedValue: rowIndex.toString(),
          mappedToField: "header",
          rowNumber: rowIndex,
          status: "success"
        });
        break;
      }
    }

    // Map columns to fields (using header row if found)
    const startMappingRow = headerRowIndex ?? 0;
    for (let rowIndex = startMappingRow; rowIndex < Math.min(processedGrid.length, 20); rowIndex++) {
      const row = processedGrid[rowIndex];
      for (let colIndex = 0; colIndex < row.length; colIndex++) {
        const cell = String(row[colIndex] || '').trim();
        if (!cell) continue;

        for (const [field, aliases] of Object.entries(STUDENT_FIELD_ALIASES)) {
          if (!columnMap[colIndex] && this.matchFieldAlias(cell, aliases)) {
            columnMap[colIndex] = field;
            this.debugLog.push({
              columnName: cell,
              extractedValue: cell,
              mappedToField: field,
              rowNumber: rowIndex,
              status: 'success',
            });
          }
        }

        for (const [field, aliases] of Object.entries(SCHEDULE_FIELD_ALIASES)) {
          if (!columnMap[colIndex] && this.matchFieldAlias(cell, aliases)) {
            columnMap[colIndex] = field;
            this.debugLog.push({
              columnName: cell,
              extractedValue: cell,
              mappedToField: field,
              rowNumber: rowIndex,
              status: 'success',
            });
          }
        }
      }
      if (Object.keys(columnMap).length >= 2) break; // Stop when we have enough fields mapped
    }

    // Log column map
    this.debugLog.push({
      columnName: "Column Mapping (col index -> field)",
      extractedValue: JSON.stringify(columnMap),
      mappedToField: "mapping",
      rowNumber: undefined,
      status: "success"
    });

    // Extract data rows (skip header row)
    const startDataRow = (headerRowIndex !== null) ? headerRowIndex + 1 : 0;
    for (let rowIndex = startDataRow; rowIndex < processedGrid.length; rowIndex++) {
      const row = processedGrid[rowIndex];
      if (this.isRowEmpty(row)) continue;
      if (this.isHeaderRow(row)) continue;

      const item: Partial<ParsedScheduleItem> = {
        courseName: '',
        day: 'الأحد',
        startTime: '00:00',
        endTime: '00:00'
      };

      for (let colIndex = 0; colIndex < row.length; colIndex++) {
        const cell = String(row[colIndex] || '').trim();
        if (!cell) continue;

        this.debugLog.push({
          columnName: `Col ${colIndex} Raw Value`,
          extractedValue: `"${cell}"`,
          mappedToField: columnMap[colIndex] || "unknown",
          rowNumber: rowIndex,
          status: "success"
        });

        const field = columnMap[colIndex];
        if (field) {
          if (field in student && !student[field as keyof ParsedStudent]) {
            if (!this.isExcludedHeader(cell)) {
              student[field as keyof ParsedStudent] = cell;
              this.debugLog.push({
                columnName: field,
                extractedValue: cell,
                mappedToField: field,
                rowNumber: rowIndex,
                status: 'success',
              });
            }
          } else if (field in SCHEDULE_FIELD_ALIASES) {
            if (field === 'day') {
              item.day = this.normalizeDay(cell);
              this.debugLog.push({
                columnName: `Day (col ${colIndex})`,
                extractedValue: cell,
                mappedToField: "day",
                rowNumber: rowIndex,
                status: "success"
              });
            } else if (field === 'startTime') {
              if (cell.includes('-')) {
                const { startTime, endTime } = this.parseTimeRange(cell);
                item.startTime = startTime;
                item.endTime = endTime;
                this.debugLog.push({
                  columnName: `Time Range (col ${colIndex})`,
                  extractedValue: cell,
                  mappedToField: `startTime: ${startTime}, endTime: ${endTime}`,
                  rowNumber: rowIndex,
                  status: "success"
                });
              } else {
                item.startTime = this.normalizeTime(cell);
                this.debugLog.push({
                  columnName: `Start Time (col ${colIndex})`,
                  extractedValue: cell,
                  mappedToField: "startTime",
                  rowNumber: rowIndex,
                  status: "success"
                });
              }
            } else if (field === 'endTime') {
              item.endTime = this.normalizeTime(cell);
              this.debugLog.push({
                columnName: `End Time (col ${colIndex})`,
                extractedValue: cell,
                mappedToField: "endTime",
                rowNumber: rowIndex,
                status: "success"
              });
            } else {
              item[field as keyof ParsedScheduleItem] = cell;
            }
          }
        } else {
          if (cell.match(/^\d{10}$/) && !student.nationalId) {
            student.nationalId = cell;
          } else if (cell.match(/^\d{7,9}$/) && !student.academicId && cell !== student.nationalId) {
            student.academicId = cell;
          } else if (cell.length > 5 && !student.fullName && !cell.match(/^\d+$/) && !this.isExcludedHeader(cell)) {
            student.fullName = cell;
          } else if (cell.length > 2 && !item.courseName && !this.isOnlyNumber(cell) && !this.isExcludedHeader(cell)) {
            item.courseName = cell;
            this.debugLog.push({
              columnName: "Found course name (unmapped)",
              extractedValue: cell,
              mappedToField: "courseName",
              rowNumber: rowIndex,
              status: "success"
            });
          } else if (!item.day && Object.keys(DAY_MAP).some(key => cell.includes(key))) {
            item.day = this.normalizeDay(cell);
          } else if (!item.startTime && (cell.match(/\d{1,2}[:\.]\d{2}/) || cell.match(/\d{1,2}[-: ]\d{1,2}/) || cell.includes('-'))) {
            if (cell.includes('-')) {
              const { startTime, endTime } = this.parseTimeRange(cell);
              item.startTime = startTime;
              item.endTime = endTime;
              this.debugLog.push({
                columnName: `Found time range (unmapped)`,
                extractedValue: cell,
                mappedToField: `startTime: ${startTime}, endTime: ${endTime}`,
                rowNumber: rowIndex,
                status: "success"
              });
            } else {
              item.startTime = this.normalizeTime(cell);
            }
          }
        }
      }

      if (item.courseName) {
        this.debugLog.push({
          columnName: "Adding course item",
          extractedValue: JSON.stringify(item),
          mappedToField: "schedule",
          rowNumber: rowIndex,
          status: "success"
        });
        schedule.push(item as ParsedScheduleItem);
      }
    }

    const finalStudent: ParsedStudent | null = 
      student.fullName || student.academicId || student.nationalId ? student as ParsedStudent : null;

    return {
      student: finalStudent,
      schedule,
      debugLog: this.debugLog,
    };
  }

  parseText(text: string): ParsedResult {
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
    const grid: string[][] = [];

    for (const line of lines) {
      let row: string[];
      if (line.includes(',')) row = line.split(',').map(cell => cell.trim());
      else if (line.includes('|')) row = line.split('|').map(cell => cell.trim());
      else if (line.includes('\t')) row = line.split('\t').map(cell => cell.trim());
      else row = [line.trim()];
      
      grid.push(row);
    }

    return this.parseGrid(grid);
  }

  async parseExcel(file: File): Promise<ParsedResult> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          const grid = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
          resolve(this.parseGrid(grid));
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  }

  parseHtmlTable(html: string): ParsedResult {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const tables = Array.from(doc.querySelectorAll('table'));
    
    const grid: any[][] = [];
    tables.forEach(table => {
      const rows = Array.from(table.rows);
      rows.forEach(row => {
        const cells = Array.from(row.cells);
        const cellValues = cells.map(cell => cell.innerText || cell.textContent || '');
        grid.push(cellValues);
      });
    });
    
    return this.parseGrid(grid);
  }

  async parseImage(file: File): Promise<ParsedResult> {
    const ocrResult = await Tesseract.recognize(file, 'ara+eng', {
      logger: (m) => console.log('OCR:', m)
    });

    return this.parseText(ocrResult.data.text);
  }

  async parseFile(file: File): Promise<ParsedResult> {
    if (file.type.startsWith('image/')) {
      return await this.parseImage(file);
    } else if (file.name.endsWith('.csv')) {
      const text = await file.text();
      return this.parseText(text);
    } else {
      return await this.parseExcel(file);
    }
  }
}
