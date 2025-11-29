'use server'

import * as XLSX from 'xlsx';

export interface ExcelData {
  sheetName: string;
  data: Record<string, any>[];
  headers: string[];
  rowCount: number;
  columnCount: number;
}

export interface ExcelResponse {
  success: boolean;
  sheets: ExcelData[];
  totalSheets: number;
  fileName: string;
  error?: string;
}

export async function processExcelFile(formData: FormData): Promise<ExcelResponse> {
  try {
    const file = formData.get('file') as File;
    
    if (!file) {
      return {
        success: false,
        sheets: [],
        totalSheets: 0,
        fileName: '',
        error: 'No file provided'
      };
    }

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];

    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      return {
        success: false,
        sheets: [],
        totalSheets: 0,
        fileName: file.name,
        error: 'Invalid file type. Please upload an Excel file (.xlsx, .xls) or CSV file.'
      };
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Read the workbook
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    // Process all sheets
    const sheets: ExcelData[] = workbook.SheetNames.map((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert sheet to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        defval: '',
        blankrows: false 
      });

      // Get headers
      const headers = jsonData.length > 0 ? Object.keys(jsonData[0] as Record<string, any>) : [];

      // Get sheet dimensions
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      const rowCount = range.e.r - range.s.r + 1;
      const columnCount = range.e.c - range.s.c + 1;

      return {
        sheetName,
        data: jsonData as Record<string, any>[],
        headers,
        rowCount: jsonData.length,
        columnCount: headers.length
      };
    });

    return {
      success: true,
      sheets,
      totalSheets: sheets.length,
      fileName: file.name
    };

  } catch (error) {
    console.error('Error processing Excel file:', error);
    return {
      success: false,
      sheets: [],
      totalSheets: 0,
      fileName: '',
      error: error instanceof Error ? error.message : 'Failed to process Excel file'
    };
  }
}