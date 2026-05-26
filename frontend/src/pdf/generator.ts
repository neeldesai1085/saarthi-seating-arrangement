import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { SeatingPlan } from '../engine/types';

/** Build a fast O(1) lookup map: "row-col-side" → enrollmentNo */
const buildSeatMap = (plan: SeatingPlan): Map<string, string> => {
    const map = new Map<string, string>();
    for (const seat of plan.seats) {
        if (seat.student) {
            map.set(`${seat.row}-${seat.column}-${seat.side}`, seat.student.enrollmentNo);
        }
    }
    return map;
};

export const exportPDF = (plans: SeatingPlan[], filename = 'Seating_Plan.pdf') => {
    const doc = new jsPDF({ orientation: 'landscape', format: 'a4' });

    let pagesWritten = 0;
    for (const plan of plans) {
        if (plan.seats.length === 0) continue;
        if (pagesWritten > 0) doc.addPage();
        pagesWritten++;

        // Room name header: bold, centered, 16pt
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        const title = plan.roomName;
        const pageW = doc.internal.pageSize.getWidth();
        doc.text(title, (pageW - doc.getTextWidth(title)) / 2, 20);
        doc.setFont('helvetica', 'normal');

        // Compute grid dimensions and max enrollment length
        let maxRow = 0, maxCol = 0, maxEnrollmentLength = 1;
        for (const s of plan.seats) {
            if (s.row > maxRow) maxRow = s.row;
            if (s.column > maxCol) maxCol = s.column;
            if (s.student && s.student.enrollmentNo.length > maxEnrollmentLength) {
                maxEnrollmentLength = s.student.enrollmentNo.length;
            }
        }

        // Calculate dynamic font size to fit A4 landscape without wrapping
        const totalTableColumns = Math.max(1, maxCol * 2);
        const usableColWidth = ((pageW - 10) / totalTableColumns) - 2; // 10mm total margins, 2mm total padding
        
        // Approximate width of a character is 0.26mm per pt size
        const maxFontSizeByWidth = Math.floor(usableColWidth / (maxEnrollmentLength * 0.26));
        const maxFontSizeByHeight = Math.floor(120 / totalTableColumns);
        
        const dynamicFontSize = Math.max(4, Math.min(12, maxFontSizeByWidth, maxFontSizeByHeight));

        // Precomputed seat map for O(1) lookup
        const seatMap = buildSeatMap(plan);

        const tableBody: string[][] = [];
        for (let r = 1; r <= maxRow; r++) {
            const rowData: string[] = [];
            for (let c = 1; c <= maxCol; c++) {
                rowData.push(seatMap.get(`${r}-${c}-LEFT`) ?? '');
                rowData.push(seatMap.get(`${r}-${c}-RIGHT`) ?? '');
            }
            tableBody.push(rowData);
        }

        autoTable(doc, {
            startY: 25,
            body: tableBody,
            theme: 'plain',
            styles: {
                lineWidth: 0.1,
                lineColor: [0, 0, 0],
                halign: 'center',
                valign: 'middle',
                fontSize: dynamicFontSize,
                cellPadding: 1,
                overflow: 'linebreak',
            },
            margin: { top: 25, left: 5, right: 5, bottom: 5 },
        });
    }

    doc.save(filename);
};