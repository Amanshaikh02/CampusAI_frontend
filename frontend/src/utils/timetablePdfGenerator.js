import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Normalizes time strings into a comparable 24-hr representation for sorting
 */
const timeToMinutes = (timeStr = '') => {
  if (!timeStr) return 0;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) {
    // Try simple HH:MM
    const parts = timeStr.split(':');
    return parseInt(parts[0], 10) * 60 + (parseInt(parts[1], 10) || 0);
  }
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = (match[3] || '').toUpperCase();

  if (ampm === 'PM' && hours < 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

/**
 * Generates and downloads a high-fidelity, professional Weekly Grid Timetable PDF
 * @param {Object} options
 * @param {Array} options.entries - Array of timetable slot objects
 * @param {string} options.department - Selected Department
 * @param {string} options.semester - Selected Semester
 * @param {string} options.division - Selected Division / Section
 * @param {string} options.institutionName - College / Institution Title
 */
export const generateWeeklyTimetablePDF = ({
  entries = [],
  department = 'All Departments',
  semester = 'Semester 1',
  division = 'A',
  institutionName = 'CAMPUS AI - COLLEGE OF ENGINEERING & TECHNOLOGY'
}) => {
  try {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // 1. Decorative Header Bar
    doc.setFillColor(79, 70, 229); // Primary Indigo #4F46E5
    doc.rect(0, 0, pageWidth, 8, 'F');

    // 2. Institution Crest Emblem (Vector Graphic)
    doc.setFillColor(67, 56, 202); // Darker Indigo #4338CA
    doc.roundedRect(14, 13, 16, 16, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('AI', 22, 23.5, { align: 'center' });

    // 3. Institution Title & Academic Subtitle
    doc.setTextColor(30, 27, 75); // Dark Slate #1E1B4B
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(institutionName.toUpperCase(), 35, 18);

    doc.setFontSize(11);
    doc.setTextColor(99, 102, 241); // Indigo Accent
    doc.text('OFFICIAL ACADEMIC CLASS TIMETABLE — WEEKLY SCHEDULE', 35, 24);

    // 4. Meta Information Box
    doc.setFillColor(248, 250, 252); // Slate 50
    doc.setDrawColor(226, 232, 240); // Slate 200
    doc.roundedRect(14, 32, pageWidth - 28, 14, 2, 2, 'FD');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85); // Slate 700

    const metaY = 40.5;
    doc.text(`DEPARTMENT: `, 18, metaY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(79, 70, 229);
    doc.text(`${department.toUpperCase()}`, 44, metaY);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text(`SEMESTER: `, 105, metaY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(79, 70, 229);
    doc.text(`${semester}`, 127, metaY);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text(`DIVISION: `, 165, metaY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(79, 70, 229);
    doc.text(`SECTION ${division}`, 184, metaY);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text(`TERM: `, 220, metaY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(`2025–2026`, 232, metaY);

    doc.text(`ISSUED: `, 258, metaY);
    doc.text(`${new Date().toLocaleDateString()}`, 273, metaY);

    // 5. Build Dynamic Time Slots (X-Axis)
    // Extract unique time intervals sorted chronologically
    const timeSlotsMap = new Map();
    entries.forEach((e) => {
      const s = (e.startTime || '').trim();
      const end = (e.endTime || '').trim();
      if (s && end) {
        const key = `${s} - ${end}`;
        if (!timeSlotsMap.has(key)) {
          timeSlotsMap.set(key, {
            label: key,
            startMinutes: timeToMinutes(s),
            endMinutes: timeToMinutes(end),
            isBreak: Boolean(e.isBreak)
          });
        }
      }
    });

    // Fallback standard slots if none are defined
    let sortedTimeSlots = Array.from(timeSlotsMap.values()).sort(
      (a, b) => a.startMinutes - b.startMinutes
    );

    if (sortedTimeSlots.length === 0) {
      sortedTimeSlots = [
        { label: '09:00 - 10:00', startMinutes: 540, endMinutes: 600, isBreak: false },
        { label: '10:00 - 11:00', startMinutes: 600, endMinutes: 660, isBreak: false },
        { label: '11:00 - 11:30', startMinutes: 660, endMinutes: 690, isBreak: true },
        { label: '11:30 - 12:30', startMinutes: 690, endMinutes: 750, isBreak: false },
        { label: '12:30 - 01:30', startMinutes: 750, endMinutes: 810, isBreak: false },
        { label: '01:30 - 02:30', startMinutes: 810, endMinutes: 870, isBreak: false }
      ];
    }

    // Table Columns: ['DAY', ...Time Slots]
    const tableColumns = [
      { header: 'DAY', dataKey: 'day' },
      ...sortedTimeSlots.map((slot, idx) => ({
        header: slot.isBreak ? `${slot.label}\n(BREAK)` : slot.label,
        dataKey: `slot_${idx}`
      }))
    ];

    // 6. Build Table Rows (Y-Axis: Monday to Saturday)
    const tableRows = DAYS_OF_WEEK.map((dayName) => {
      const row = { day: dayName.toUpperCase() };

      sortedTimeSlots.forEach((slot, idx) => {
        // Find matching entry for this day and slot interval
        const match = entries.find((e) => {
          const entryDay = (e.day || e.dayOfWeek || '').toLowerCase();
          const dayMatches = entryDay === dayName.toLowerCase();
          const timeMatches =
            e.startTime && e.endTime && `${e.startTime} - ${e.endTime}` === slot.label;
          return dayMatches && timeMatches;
        });

        if (match) {
          if (match.isBreak) {
            row[`slot_${idx}`] = '☕ BREAK / LUNCH';
          } else {
            const lines = [];
            if (match.subject) lines.push(match.subject.toUpperCase());
            if (match.faculty) lines.push(`Fac: ${match.faculty}`);
            if (match.roomNumber) lines.push(`Room: ${match.roomNumber}`);
            if (match.sessionType && match.sessionType !== 'Break') {
              lines.push(`[${match.sessionType}]`);
            }
            row[`slot_${idx}`] = lines.join('\n');
          }
        } else {
          row[`slot_${idx}`] = slot.isBreak ? '☕ BREAK' : '—';
        }
      });

      return row;
    });

    // 7. Render Matrix Autotable
    autoTable(doc, {
      columns: tableColumns,
      body: tableRows,
      startY: 50,
      margin: { left: 14, right: 14 },
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 7.5,
        cellPadding: 2.5,
        valign: 'middle',
        halign: 'center',
        lineColor: [226, 232, 240], // Slate 200
        lineWidth: 0.2
      },
      headStyles: {
        fillColor: [79, 70, 229], // Indigo 600
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center'
      },
      columnStyles: {
        day: {
          fillColor: [241, 245, 249], // Slate 100
          fontStyle: 'bold',
          textColor: [30, 41, 59],
          halign: 'center',
          cellWidth: 26
        }
      },
      alternateRowStyles: {
        fillColor: [252, 253, 255]
      },
      didParseCell: (data) => {
        // Highlight Break cells in soft warm amber
        const text = String(data.cell.raw || '');
        if (text.includes('BREAK') || text.includes('LUNCH')) {
          data.cell.styles.fillColor = [254, 243, 199]; // Amber 100 #FEF3C7
          data.cell.styles.textColor = [180, 83, 9]; // Amber 700
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });

    // 8. Signatures & Accreditation Footer
    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 14 : pageHeight - 25;
    const sigY = Math.min(finalY, pageHeight - 18);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);

    // Left Signature
    doc.text('_____________________________', 24, sigY);
    doc.text('Timetable Coordinator', 32, sigY + 5);

    // Center Signature
    doc.text('_____________________________', 125, sigY);
    doc.text('Head of Department (HOD)', 132, sigY + 5);

    // Right Signature
    doc.text('_____________________________', 225, sigY);
    doc.text('Principal / Dean of Academics', 228, sigY + 5);

    // Bottom decorative bar
    doc.setFillColor(79, 70, 229);
    doc.rect(0, pageHeight - 4, pageWidth, 4, 'F');

    // Save File
    const cleanDept = department.replace(/\s+/g, '_');
    const cleanSem = semester.replace(/\s+/g, '_');
    const fileName = `Timetable_${cleanDept}_${cleanSem}_Sec${division}.pdf`;
    doc.save(fileName);
    return true;
  } catch (error) {
    console.error('Error generating Weekly Timetable PDF:', error);
    throw error;
  }
};

export default generateWeeklyTimetablePDF;
