import * as XLSX from 'xlsx';
import { z } from 'zod';
import type { Student } from './types';

const ExcelRowSchema = z.object({
  enrollment_no: z.union([z.string(), z.number()]).transform(val => String(val).trim()),
  subject_code: z.union([z.string(), z.number()]).transform(val => String(val).trim()),
  subject_name: z.union([z.string(), z.number()]).transform(val => String(val).trim()).optional().default(''),
});

/**
 * Normalize header keys: trim whitespace, lowercase.
 * This handles Excel artifacts like "enrollment_no " or "Subject_Code".
 */
const normalizeHeaders = (row: Record<string, unknown>): Record<string, unknown> => {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(row)) {
        out[key.trim().toLowerCase()] = row[key];
    }
    return out;
};

export const parseExcelFile = async (file: File): Promise<{ students: Student[], errors: any[] }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: "" }) as Record<string, unknown>[];

                const students: Student[] = [];
                const errors: any[] = [];

                // Composite dedupe: enrollment_no + subject_code
                const seen = new Set<string>();

                rawJson.forEach((rawRow, index) => {
                    const row = normalizeHeaders(rawRow);
                    const parsed = ExcelRowSchema.safeParse(row);

                    if (parsed.success && parsed.data.enrollment_no !== "") {
                        const compositeKey = `${parsed.data.enrollment_no}::${parsed.data.subject_code}`;
                        if (seen.has(compositeKey)) return; // skip exact duplicate
                        seen.add(compositeKey);

                        students.push({
                            enrollmentNo: parsed.data.enrollment_no,
                            subjectCode: parsed.data.subject_code,
                            subjectName: parsed.data.subject_name ?? '',
                        });
                    } else if (!parsed.success) {
                        errors.push({ row: index + 2, issues: parsed.error.issues });
                    }
                });

                resolve({ students, errors });
            } catch (err) {
                reject(err);
            }
        };
        reader.readAsArrayBuffer(file);
    });
};

const InvigilatorRowSchema = z.object({
  invigilator_name: z.union([z.string(), z.number()]).transform(val => String(val).trim()),
});

export const parseInvigilatorFile = async (file: File): Promise<{ invigilators: import('./types').Invigilator[], errors: any[] }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: "" }) as Record<string, unknown>[];

                const invigilators: import('./types').Invigilator[] = [];
                const errors: any[] = [];
                const seen = new Set<string>();

                rawJson.forEach((rawRow, index) => {
                    const row = normalizeHeaders(rawRow);
                    const parsed = InvigilatorRowSchema.safeParse(row);

                    if (parsed.success && parsed.data.invigilator_name !== "") {
                        const name = parsed.data.invigilator_name;
                        if (seen.has(name.toLowerCase())) return; // skip exact duplicate by name
                        seen.add(name.toLowerCase());

                        invigilators.push({
                            id: `inv-${index}`,
                            name: name,
                        });
                    } else if (!parsed.success) {
                        errors.push({ row: index + 2, issues: parsed.error.issues });
                    }
                });

                resolve({ invigilators, errors });
            } catch (err) {
                reject(err);
            }
        };
        reader.readAsArrayBuffer(file);
    });
};
