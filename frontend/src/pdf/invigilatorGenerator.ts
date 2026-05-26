import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { InvigilatorPlan } from '../engine/types';

export const exportInvigilatorPDF = (plans: InvigilatorPlan[], filename = 'Invigilator_Plan.pdf') => {
    const doc = new jsPDF({ orientation: 'portrait', format: 'a4' });

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    const pageW = doc.internal.pageSize.getWidth();
    const title = "Invigilator Assignments";
    doc.text(title, (pageW - doc.getTextWidth(title)) / 2, 20);

    let startY = 30;

    for (const plan of plans) {
        if (plan.invigilators.length === 0) continue;

        const tableBody = plan.invigilators.map((inv, index) => [
            (index + 1).toString(),
            inv.name
        ]);

        autoTable(doc, {
            startY: startY,
            head: [[`Room: ${plan.roomName}`, 'Invigilator Name']],
            body: tableBody,
            theme: 'grid',
            headStyles: {
                fillColor: [60, 141, 188],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
            },
            styles: {
                fontSize: 10,
                cellPadding: 3,
            },
            columnStyles: {
                0: { cellWidth: 30, halign: 'center' },
                1: { cellWidth: 'auto' },
            },
            margin: { left: 14, right: 14 },
            pageBreak: 'avoid',
            didDrawPage: (data) => {
                // If it drew a new page, update startY so the next table flows correctly
                if (data.cursor) {
                    startY = data.cursor.y + 15;
                }
            },
        });
        
        // Use the final cursor position of the table to add spacing for the next room
        // type definition for lastAutoTable is sometimes missing but it exists at runtime on doc
        const finalY = (doc as any).lastAutoTable.finalY || startY + 20;
        startY = finalY + 10; 
    }

    doc.save(filename);
};
