import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { SeatingPlan } from '../engine/types';

export const exportPDF = (plans: SeatingPlan[], filename = 'Seating_Plan.pdf') => {
    const doc = new jsPDF({ orientation: 'landscape', format: 'a4' });

    plans.forEach((plan, index) => {
        if (index > 0) doc.addPage();

        doc.setFontSize(18);
        doc.text(`Room: ${plan.roomName}`, 14, 20);
        
        if (plan.seats.length === 0) {
            doc.setFontSize(12);
            doc.text("No students allocated in this room.", 14, 30);
            return;
        }

        const maxRow = Math.max(...plan.seats.map(s => s.row), 0);
        const maxCol = Math.max(...plan.seats.map(s => s.column), 0);
        
        const hasMiddle = plan.seats.some(s => s.side === 'MIDDLE');
        const sides = hasMiddle ? ['LEFT', 'MIDDLE', 'RIGHT'] : ['LEFT', 'RIGHT'];

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
                fontSize: 10,
                cellPadding: 3,
            },
            margin: { top: 30, left: 14, right: 14 },
        });
    });

    doc.save(filename);
};