import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * generateBeautyReport
 * Generates a branded, multi-page PDF beauty report from face analysis data.
 * @param {Object} analysis - The analysis result object
 * @param {String} username - The user's name/email
 */
const generateBeautyReport = (analysis, username = 'User') => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const primaryColor = [139, 92, 246]; // purple-500
    const secondaryColor = [20, 184, 166]; // teal-500
    const darkColor = [15, 23, 42]; // slate-900
    const lightGray = [248, 250, 252]; // slate-50
    const timestamp = new Date().toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' });

    // ── PAGE 1: COVER ─────────────────────────────────────────────────────────
    // Background gradient blocks
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 80, 'F');
    doc.setFillColor(...secondaryColor);
    doc.rect(0, 75, pageWidth, 8, 'F');

    // Logo text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('AI BEAUTY CONSULTANT', 20, 22);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Powered by GlowAI Neural VisionCore', 20, 30);

    // Report title
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('BEAUTY ANALYSIS', 20, 52);
    doc.text('REPORT', 20, 64);

    // Decorative circle
    doc.setFillColor(255, 255, 255, 0.1);
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.5);
    doc.circle(170, 40, 30);
    doc.circle(170, 40, 22);

    // User info section
    doc.setTextColor(...darkColor);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Report For:', 20, 105);
    doc.setFont('helvetica', 'normal');
    doc.text(username, 20, 115);
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.text(`Generated: ${timestamp}`, 20, 123);
    doc.text('Confidential — For Personal Use Only', 20, 130);

    // Horizontal divider
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(2);
    doc.line(20, 138, pageWidth - 20, 138);

    // ── SEASON BANNER ─────────────────────────────────────────────────────────
    doc.setFillColor(...lightGray);
    doc.roundedRect(20, 145, pageWidth - 40, 40, 5, 5, 'F');
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text((analysis?.season || 'Winter').toUpperCase(), 30, 168);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text('Your Seasonal Colour Type', 30, 177);

    // Profile grid on cover
    const covStats = [
        ['Skin Tone', analysis?.skin_tone || 'Medium'],
        ['Undertone', analysis?.undertone || 'Cool'],
        ['Eye Colour', analysis?.eye_color || 'Brown'],
        ['Hair Colour', analysis?.hair_color || 'Black'],
        ['Face Shape', analysis?.face_shape || 'Oval'],
        ['Skin Analysis', analysis?.skin_type || 'Combination'],
    ];

    doc.setFontSize(9);
    let x = 20, y = 200;
    covStats.forEach(([label, value], i) => {
        if (i > 0 && i % 3 === 0) { x = 20; y += 30; }
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(229, 231, 235);
        doc.setLineWidth(0.3);
        doc.roundedRect(x, y, 55, 25, 3, 3, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...primaryColor);
        doc.text(label, x + 5, y + 10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...darkColor);
        doc.text(value, x + 5, y + 19);
        x += 60;
    });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text('AI Beauty Consultant — GlowAI  |  Personalised Skincare Intelligence', pageWidth / 2, pageHeight - 12, { align: 'center' });
    doc.text('Page 1 of 3', pageWidth - 20, pageHeight - 12, { align: 'right' });

    // ── PAGE 2: ANALYSIS DETAILS ──────────────────────────────────────────────
    doc.addPage();

    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 18, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('AI BEAUTY CONSULTANT — DETAILED ANALYSIS', 20, 12);

    doc.setTextColor(...darkColor);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Detailed Colour & Skin Profile', 20, 36);
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(2);
    doc.line(20, 40, 80, 40);

    // Analysis table
    autoTable(doc, {
        startY: 50,
        head: [['Attribute', 'Value', 'Notes']],
        body: [
            ['Seasonal Type', analysis?.season || 'Winter', 'Based on skin tone, undertone & eye/hair colour'],
            ['Skin Tone', analysis?.skin_tone || 'Medium', 'Overall lightness/darkness of skin'],
            ['Undertone', analysis?.undertone || 'Cool', 'Pink/Blue/Purple tones in skin'],
            ['Eye Colour', analysis?.eye_color || 'Brown', 'Dominant iris colour'],
            ['Hair Colour', analysis?.hair_color || 'Black', 'Natural hair colour detected'],
            ['Face Shape', analysis?.face_shape || 'Oval', 'Based on facial landmark ratios'],
            ['Analysis Confidence', `${analysis?.confidence || 88}%`, 'Neural VisionCore confidence score'],
        ],
        theme: 'striped',
        headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 9, textColor: darkColor },
        alternateRowStyles: { fillColor: lightGray },
        columnStyles: { 2: { cellWidth: 70, textColor: [107, 114, 128] } },
        margin: { left: 20, right: 20 },
    });

    // Recommendations
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkColor);
    const rY = doc.lastAutoTable.finalY + 15;
    doc.text('Personalised Recommendations', 20, rY);
    doc.setDrawColor(...secondaryColor);
    doc.line(20, rY + 4, 95, rY + 4);

    const season = analysis?.season?.toLowerCase() || 'winter';
    const recommendations = {
        winter: {
            colors: ['Navy', 'Charcoal', 'Burgundy', 'Emerald', 'Pure White', 'Icy Pink'],
            makeup: ['Raspberry lips', 'Smoky taupe eyes', 'Porcelain foundation', 'Berry blush'],
            avoid: ['Orange', 'Warm Yellow', 'Peach', 'Camel'],
            skincare: ['Hyaluronic Acid Serum', 'SPF 50 Moisturiser', 'Gentle Cleanser', 'Retinol Night Cream'],
        },
        summer: {
            colors: ['Lavender', 'Rose', 'Dusty Blue', 'Mauve', 'Soft White', 'Powder Pink'],
            makeup: ['Soft pink lips', 'Cool-toned eyeshadow', 'Rosy foundation', 'Pinky blush'],
            avoid: ['Black', 'Bright Orange', 'Golden Yellow', 'Rust'],
            skincare: ['Niacinamide Serum', 'Lightweight SPF', 'Hydrating Toner', 'Gentle Exfoliant'],
        },
        autumn: {
            colors: ['Burnt Orange', 'Olive', 'Rust', 'Gold', 'Camel', 'Warm Brown'],
            makeup: ['Terracotta lips', 'Warm bronze eyes', 'Golden foundation', 'Peachy blush'],
            avoid: ['Blue-based Pinks', 'Icy White', 'Cool Grey', 'Lavender'],
            skincare: ['Vitamin C Serum', 'Rosehip Oil', 'Nourishing Cleanser', 'Bakuchiol Night Serum'],
        },
        spring: {
            colors: ['Coral', 'Peach', 'Warm Yellow', 'Aqua', 'Warm White', 'Soft Orange'],
            makeup: ['Coral lips', 'Golden eyeshadow', 'Peach foundation', 'Apricot blush'],
            avoid: ['Cool Blue-Pink', 'Charcoal', 'Dark Navy', 'Icy Tones'],
            skincare: ['AHA Exfoliant', 'Vitamin C + E', 'Oil-free SPF', 'Brightening Serum'],
        },
    }[season] || {};

    autoTable(doc, {
        startY: rY + 10,
        body: [
            ['Best Colours', (recommendations.colors || []).join('   •   ')],
            ['Makeup Palette', (recommendations.makeup || []).join('   •   ')],
            ['Colours to Avoid', (recommendations.avoid || []).join('   •   ')],
            ['Skincare Products', (recommendations.skincare || []).join('   •   ')],
        ],
        theme: 'plain',
        bodyStyles: { fontSize: 8.5, textColor: darkColor, cellPadding: 6 },
        columnStyles: {
            0: { fontStyle: 'bold', textColor: primaryColor, cellWidth: 45, fillColor: lightGray },
            1: { cellWidth: pageWidth - 85 },
        },
        margin: { left: 20, right: 20 },
    });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text('AI Beauty Consultant — GlowAI  |  Personalised Skincare Intelligence', pageWidth / 2, pageHeight - 12, { align: 'center' });
    doc.text('Page 2 of 3', pageWidth - 20, pageHeight - 12, { align: 'right' });

    // ── PAGE 3: WARDROBE & TIPS ───────────────────────────────────────────────
    doc.addPage();

    doc.setFillColor(...secondaryColor);
    doc.rect(0, 0, pageWidth, 18, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('AI BEAUTY CONSULTANT — WARDROBE & LIFESTYLE GUIDE', 20, 12);

    doc.setTextColor(...darkColor);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Your Wardrobe & Lifestyle Guide', 20, 36);
    doc.setDrawColor(...secondaryColor);
    doc.line(20, 40, 100, 40);

    autoTable(doc, {
        startY: 50,
        head: [['Category', 'Recommendation']],
        body: [
            ['Wardrobe Core', 'Build your capsule around your seasonal core colours. Invest in one statement piece per season.'],
            ['Fabric Choices', 'Prefer matte, non-shiny fabrics (crepe, jersey, matte satin) that complement your skin tone.'],
            ['Pattern Guide', 'Opt for classic patterns that suit your season: geometric or bold for Winter, floral for Spring.'],
            ['Metal Jewellery', season === 'autumn' || season === 'spring' ? 'Gold and rose-gold metals best complement warm undertones.' : 'Silver and platinum best complement cool undertones.'],
            ['Hair Colour Tips', 'Stick within your seasonal palette for hair colouring to maintain harmony with skin and eyes.'],
            ['Nail Colour', season === 'winter' ? 'Navy, deep berry, pure white or muted pastels work best.' : 'Warm corals, nudes, or earthy tones will complement your colouring.'],
            ['SPF Daily', 'Apply SPF 50 every morning, regardless of weather. UV damages all skin types equally.'],
            ['Skincare Routine', 'Morning: Cleanse → Vitamin C → Moisturiser → SPF. Evening: Double cleanse → Active → Night Cream.'],
        ],
        theme: 'grid',
        headStyles: { fillColor: secondaryColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 8.5, textColor: darkColor },
        alternateRowStyles: { fillColor: lightGray },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45, textColor: primaryColor } },
        margin: { left: 20, right: 20 },
    });

    // Disclaimer
    const dY = doc.lastAutoTable.finalY + 15;
    doc.setFillColor(254, 243, 199);
    doc.roundedRect(20, dY, pageWidth - 40, 30, 3, 3, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(146, 64, 14);
    doc.text('Disclaimer:', 25, dY + 10);
    doc.setFont('helvetica', 'normal');
    doc.text('This report is generated by an AI system and is for personal guidance only. It is not a substitute for professional', 25, dY + 18);
    doc.text('dermatological or medical advice. Consult a qualified professional for skin health concerns.', 25, dY + 25);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text('AI Beauty Consultant — GlowAI  |  Personalised Skincare Intelligence', pageWidth / 2, pageHeight - 12, { align: 'center' });
    doc.text('Page 3 of 3', pageWidth - 20, pageHeight - 12, { align: 'right' });

    // Save PDF
    doc.save(`GlowAI_Beauty_Report_${Date.now()}.pdf`);
};

export default generateBeautyReport;
