import * as XLSX from 'xlsx';
import { z } from 'zod';
import { Student } from './types';

const ExcelRowSchema = z.object({
  enrollment_no: z.union([z.string(), z.number()]).transform(val => String(val).trim()),
  subject_code: z.union([z.string(), z.number()]).transform(val => String(val).trim())
});

export const parseExcelFile = async (file: File): Promise<{ students: Student[], errors: any[] }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
                
                const students: Student[] = [];
                const errors: any[] = [];

                rawJson.forEach((row: any, index) => {
                const parsed = ExcelRowSchema.safeParse(row);
                if (parsed.success && parsed.data.enrollment_no !== "") {
                    students.push({
                        enrollmentNo: parsed.data.enrollment_no,
                        subjectCode: parsed.data.subject_code
                    });
                } else if (!parsed.success) {
                    errors.push({ row: index + 2, issues: parsed.error.issues });
                }
                });

                const uniqueStudentsMap = new Map<string, Student>();
                students.forEach(s => uniqueStudentsMap.set(s.enrollmentNo, s));

                resolve({ 
                    students: Array.from(uniqueStudentsMap.values()), 
                    errors 
                });
            } catch (err) {
                reject(err);
            }
        };
        reader.readAsArrayBuffer(file);
    });
};
