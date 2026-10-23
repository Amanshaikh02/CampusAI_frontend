import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generates and downloads or exports a professional College Marksheet PDF
 * using jspdf + jspdf-autotable.
 *
 * @param {Object} options
 * @param {string} options.institutionName - College Header Name
 * @param {string} options.department - Department (e.g., AIML, Cyber Security)
 * @param {string|number} options.semester - Semester number or string
 * @param {string} options.division - Division / Section (e.g., A, B)
 * @param {string} options.subject - Subject Name
 * @param {string} options.examType - 'Mid Term' | 'Final Exam'
 * @param {number} options.maxMarks - Maximum Marks (e.g., 30 or 50)
 * @param {string} options.enteredBy - Faculty or Admin Name
 * @param {Array} options.records - Array of student mark entries
 * @param {boolean} options.autoDownload - Whether to trigger browser download (default: true)
 * @returns {jsPDF} The generated jsPDF instance (can be used for datauri/base64 export)
 */
export const generateMarksheetPDF = ({
  institutionName = 'CAMPUS AI INSTITUTE OF TECHNOLOGY & MANAGEMENT',
  department = 'AIML',
  semester = '6',
  division = 'A',
  subject = 'Engineering Subject',
  examType = 'Mid Term',
  maxMarks = 30,
  enteredBy = 'Faculty Member',
  records = [],
  autoDownload = true
}) => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    // 1. Decorative Header Bar
    doc.setFillColor(79, 70, 229); // Primary Indigo #4F46E5
    doc.rect(0, 0, pageWidth, 8, 'F');

    // 2. Institution Crest Emblem (Vector Graphic Box)
    doc.setFillColor(67, 56, 202); // Dark Indigo #4338CA
    doc.roundedRect(14, 12, 16, 16, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('CAI', 22, 22, { align: 'center' });

    // 3. College Header & Title
    doc.setTextColor(17, 24, 39); // Gray 900
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(institutionName, 34, 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.text('Approved by AICTE | Affiliated to State Technological University | NAAC A+ Accredited', 34, 23);

    // Document Title Banner
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(79, 70, 229); // Indigo 600
    const bannerTitle = `OFFICIAL EXAMINATION MARKSHEET & PERFORMANCE REPORT`;
    doc.text(bannerTitle, 34, 28);

    // Horizontal Rule
    doc.setDrawColor(226, 232, 240); // Slate 200
    doc.setLineWidth(0.4);
    doc.line(14, 32, pageWidth - 14, 32);

    // 4. Metadata Information Grid (Card Box)
    doc.setFillColor(248, 250, 252); // Slate 50
    doc.roundedRect(14, 35, pageWidth - 28, 26, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 35, pageWidth - 28, 26, 2, 2, 'S');

    // Meta Column 1
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('DEPARTMENT:', 18, 41);
    doc.text('SEMESTER & DIV:', 18, 48);
    doc.text('SUBJECT:', 18, 55);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59); // Slate 800
    doc.text(`${department}`, 48, 41);
    doc.text(`Semester ${semester} - Division ${division}`, 48, 48);
    doc.text(`${subject}`, 48, 55);

    // Meta Column 2
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('EXAM TYPE:', 115, 41);
    doc.text('MAX MARKS:', 115, 48);
    doc.text('GENERATED ON:', 115, 55);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(`${examType}`, 145, 41);
    doc.text(`${maxMarks} Marks`, 145, 48);
    doc.text(`${currentDate} (By: ${enteredBy})`, 145, 55);

    // 5. Build Student Marks Table Data
    const tableColumns = [
      { header: 'S.NO', dataKey: 'sno' },
      { header: 'ENROLLMENT NO', dataKey: 'enrollment' },
      { header: 'STUDENT NAME', dataKey: 'name' },
      { header: 'ATTENDANCE', dataKey: 'attendance' },
      { header: `MARKS (/${maxMarks})`, dataKey: 'marks' },
      { header: 'GRADE', dataKey: 'grade' },
      { header: 'STATUS', dataKey: 'status' }
    ];

    let totalStudents = records.length;
    let presentCount = 0;
    let absentCount = 0;
    let passCount = 0;
    let totalMarksPresent = 0;
    let highestMark = 0;

    const tableRows = records.map((rec, index) => {
      const isAbsent = String(rec.attendance).toLowerCase() === 'absent';
      if (isAbsent) {
        absentCount++;
      } else {
        presentCount++;
      }

      const numScore = parseFloat(rec.marks);
      const isPass = !isAbsent && !isNaN(numScore) && numScore >= (maxMarks * 0.4);
      if (isPass) passCount++;

      if (!isAbsent && !isNaN(numScore)) {
        totalMarksPresent += numScore;
        if (numScore > highestMark) highestMark = numScore;
      }

      let displayMarks = isAbsent ? 'AB' : (rec.marks !== '' && rec.marks !== undefined ? rec.marks : '0');
      let displayGrade = isAbsent ? 'AB' : (rec.grade || '—');
      let displayStatus = isAbsent ? 'ABSENT' : (isPass ? 'PASS' : 'FAIL');

      return {
        sno: index + 1,
        enrollment: rec.enrollment || '—',
        name: rec.name || rec.student || '—',
        attendance: isAbsent ? 'ABSENT' : 'PRESENT',
        marks: displayMarks,
        grade: displayGrade,
        status: displayStatus
      };
    });

    // 6. Render Data Table via AutoTable
    autoTable(doc, {
      columns: tableColumns,
      body: tableRows,
      startY: 65,
      margin: { left: 14, right: 14 },
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: 2.2,
        valign: 'middle',
        lineColor: [226, 232, 240],
        lineWidth: 0.15
      },
      headStyles: {
        fillColor: [79, 70, 229], // Indigo 600
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center'
      },
      columnStyles: {
        sno: { halign: 'center', cellWidth: 14 },
        enrollment: { halign: 'center', cellWidth: 32, fontStyle: 'bold' },
        name: { halign: 'left', cellWidth: 50 },
        attendance: { halign: 'center', cellWidth: 26 },
        marks: { halign: 'center', cellWidth: 24, fontStyle: 'bold' },
        grade: { halign: 'center', cellWidth: 18, fontStyle: 'bold' },
        status: { halign: 'center', cellWidth: 18, fontStyle: 'bold' }
      },
      didParseCell: (data) => {
        if (data.section === 'body') {
          // Color code attendance and status
          if (data.column.dataKey === 'attendance') {
            if (data.cell.raw === 'ABSENT') {
              data.cell.styles.textColor = [220, 38, 38]; // Red 600
              data.cell.styles.fontStyle = 'bold';
            } else {
              data.cell.styles.textColor = [22, 163, 74]; // Emerald 600
            }
          }
          if (data.column.dataKey === 'status') {
            if (data.cell.raw === 'PASS') {
              data.cell.styles.textColor = [22, 163, 74]; // Green
            } else if (data.cell.raw === 'FAIL') {
              data.cell.styles.textColor = [220, 38, 38]; // Red
            } else {
              data.cell.styles.textColor = [100, 116, 139]; // Slate
            }
          }
          if (data.column.dataKey === 'marks') {
            if (data.cell.raw === 'AB') {
              data.cell.styles.textColor = [220, 38, 38];
            } else {
              data.cell.styles.textColor = [67, 56, 202]; // Indigo
            }
          }
        }
      }
    });

    // 7. Performance Summary & Statistics Box
    const finalY = doc.lastAutoTable.finalY + 6;
    if (finalY + 40 < pageHeight) {
      // Summary card
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, finalY, pageWidth - 28, 16, 2, 2, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, finalY, pageWidth - 28, 16, 2, 2, 'S');

      const classAvg = presentCount > 0 ? (totalMarksPresent / presentCount).toFixed(1) : '0';
      const passRate = presentCount > 0 ? Math.round((passCount / presentCount) * 100) : 0;

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('TOTAL ENROLLED', 20, finalY + 6);
      doc.text('PRESENT', 55, finalY + 6);
      doc.text('ABSENT', 85, finalY + 6);
      doc.text('CLASS AVERAGE', 115, finalY + 6);
      doc.text('HIGHEST SCORE', 148, finalY + 6);
      doc.text('PASS RATE', 178, finalY + 6);

      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text(`${totalStudents}`, 20, finalY + 12);
      doc.setTextColor(22, 163, 74);
      doc.text(`${presentCount}`, 55, finalY + 12);
      doc.setTextColor(220, 38, 38);
      doc.text(`${absentCount}`, 85, finalY + 12);
      doc.setTextColor(67, 56, 202);
      doc.text(`${classAvg} / ${maxMarks}`, 115, finalY + 12);
      doc.text(`${highestMark} / ${maxMarks}`, 148, finalY + 12);
      doc.setTextColor(22, 163, 74);
      doc.text(`${passRate}%`, 178, finalY + 12);

      // 8. Signature Blocks
      const signY = finalY + 28;
      if (signY + 10 < pageHeight) {
        doc.setDrawColor(148, 163, 184); // Slate 400
        doc.setLineWidth(0.3);

        // Teacher signature
        doc.line(20, signY, 65, signY);
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(71, 85, 105);
        doc.text('Course Faculty Signature', 42.5, signY + 4, { align: 'center' });

        // HOD signature
        doc.line(85, signY, 130, signY);
        doc.text('Head of Department (HOD)', 107.5, signY + 4, { align: 'center' });

        // Controller of examinations
        doc.line(148, signY, 192, signY);
        doc.text('Controller of Examinations', 170, signY + 4, { align: 'center' });
      }
    }

    // 9. Document Footer
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Confidential Academic Document — Generated on ${currentDate} | Page ${i} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 6,
        { align: 'center' }
      );
    }

    // Auto download if requested
    if (autoDownload) {
      const sanitizedSubject = (subject || 'Subject').replace(/[^a-zA-Z0-9]/g, '_');
      const sanitizedExam = (examType || 'Exam').replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `Marksheet_${department}_Sem${semester}_Div${division}_${sanitizedSubject}_${sanitizedExam}.pdf`;
      doc.save(fileName);
    }

    return doc;
  } catch (error) {
    console.error('Failed to generate marksheet PDF:', error);
    throw error;
  }
};
