import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { SeatingPlan } from '../engine/types';

export const exportPDF = (plans: SeatingPlan[], filename = 'Seating_Plan.pdf') => {
    const doc = new jsPDF({ orientation: 'landscape', format: 'a4' });

    let pagesWritten = 0;
    plans.forEach((plan) => {
        if (plan.seats.length === 0) return;
        if (pagesWritten > 0) doc.addPage();
        pagesWritten++;

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        const titleText = plan.roomName;
        const textWidth = doc.getTextWidth(titleText);
        const pageWidth = doc.internal.pageSize.getWidth();
        doc.text(titleText, (pageWidth - textWidth) / 2, 20);
        doc.setFont('helvetica', 'normal');
        


        const maxRow = Math.max(...plan.seats.map(s => s.row), 0);
        const maxCol = Math.max(...plan.seats.map(s => s.column), 0);
        
        const sides: Array<"LEFT" | "RIGHT"> = ['LEFT', 'RIGHT'];

        const tableBody: string[][] = [];

        for (let r = 1; r <= maxRow; r++) {
            const rowData: string[] = [];
            for (let c = 1; c <= maxCol; c++) {
                for (const side of sides) {
                    const seat = plan.seats.find(s => s.row === r && s.column === c && s.side === side);
                    rowData.push(seat?.student?.enrollmentNo || '');
                }
            }
            tableBody.push(rowData);
        }

        autoTable(doc, {
            startY: 30,
            body: tableBody,
            theme: 'plain',
            styles: {
                lineWidth: 0.1,
                lineColor: [0, 0, 0],
                halign: 'center',
                valign: 'middle',
                fontSize: 8,
                cellPadding: 3,
            },
            margin: { top: 30, left: 14, right: 14 },
        });
    });

    doc.save(filename);
};