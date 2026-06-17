import logging
_log = logging.getLogger("beauty_api.report")

"""
PDF Report Generation API Route
Generates a professional beauty analysis report as a PDF
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from app.auth.jwt_handler import get_current_user
from app.mongodb.collections import analysis_collection
from bson import ObjectId
from datetime import datetime
from typing import Optional
import io
import os

router = APIRouter(prefix="/api/report", tags=["Report"])


def generate_pdf_report(analysis: dict, user_email: str) -> bytes:
    """
    Generates a beautiful PDF report from analysis data using ReportLab.
    """
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm, mm
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
        HRFlowable, KeepTogether
    )
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
    from reportlab.graphics.shapes import Drawing, Rect, String
    from reportlab.graphics import renderPDF

    # ─────────────────────────────── Palette ────────────────────────────────
    INDIGO   = colors.HexColor("#4F46E5")
    PURPLE   = colors.HexColor("#7C3AED")
    TEAL     = colors.HexColor("#0D9488")
    SLATE    = colors.HexColor("#1E293B")
    SLATE_LT = colors.HexColor("#64748B")
    GRAY_BG  = colors.HexColor("#F8FAFC")
    WHITE    = colors.white
    RED      = colors.HexColor("#EF4444")
    AMBER    = colors.HexColor("#F59E0B")
    EMERALD  = colors.HexColor("#10B981")

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2*cm, leftMargin=2*cm,
        topMargin=2.5*cm, bottomMargin=2*cm,
        title="AI Beauty Consultant — Facial Intelligence Report"
    )

    width, height = A4
    story = []
    styles = getSampleStyleSheet()

    # ── Custom Styles ──────────────────────────────────────────────────────
    heading_style = ParagraphStyle(
        "Heading", parent=styles["Normal"],
        fontSize=22, textColor=SLATE,
        spaceAfter=4, fontName="Helvetica-Bold",
        alignment=TA_CENTER
    )
    sub_heading = ParagraphStyle(
        "SubHeading", parent=styles["Normal"],
        fontSize=10, textColor=SLATE_LT,
        spaceAfter=2, fontName="Helvetica",
        alignment=TA_CENTER
    )
    section_title = ParagraphStyle(
        "SectionTitle", parent=styles["Normal"],
        fontSize=11, textColor=WHITE,
        spaceAfter=0, fontName="Helvetica-Bold",
        alignment=TA_LEFT
    )
    body_text = ParagraphStyle(
        "BodyText", parent=styles["Normal"],
        fontSize=9, textColor=SLATE,
        spaceAfter=4, fontName="Helvetica",
        leading=14
    )
    meta_text = ParagraphStyle(
        "Meta", parent=styles["Normal"],
        fontSize=8, textColor=SLATE_LT,
        fontName="Helvetica", alignment=TA_CENTER
    )
    tip_text = ParagraphStyle(
        "Tip", parent=styles["Normal"],
        fontSize=9, textColor=SLATE,
        leading=14, leftIndent=8,
        fontName="Helvetica"
    )

    # ── HEADER BANNER ─────────────────────────────────────────────────────
    # Gradient-like header using nested tables
    header_data = [
        [
            Paragraph("💄 AI Beauty Consultant", ParagraphStyle(
                "hdr", parent=styles["Normal"],
                fontSize=20, textColor=WHITE,
                fontName="Helvetica-Bold", alignment=TA_LEFT
            )),
            Paragraph(
                f"FACIAL INTELLIGENCE REPORT<br/><font size='8'>Generated: {datetime.now().strftime('%B %d, %Y at %I:%M %p')}</font>",
                ParagraphStyle("hdrR", parent=styles["Normal"],
                               fontSize=10, textColor=colors.HexColor("#C7D2FE"),
                               fontName="Helvetica-Bold", alignment=TA_RIGHT)
            )
        ]
    ]
    header_table = Table(header_data, colWidths=[10*cm, 7.5*cm])
    header_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), INDIGO),
        ("TEXTCOLOR",  (0, 0), (-1, -1), WHITE),
        ("TOPPADDING",    (0, 0), (-1, -1), 14),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 14),
        ("LEFTPADDING",   (0, 0), (-1, -1), 16),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 16),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [INDIGO]),
        ("ROUNDEDCORNERS", (0, 0), (-1, -1), [6, 6, 6, 6]),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 0.4*cm))

    # ── REPORT META ───────────────────────────────────────────────────────
    report_id = analysis.get("id", f"AB-{hash(user_email) % 99999:05d}")
    date_str  = analysis.get("date", datetime.now().strftime("%Y-%m-%d"))
    meta_data = [
        ["Report ID", f"#{report_id[:8].upper()}", "Subject",
         analysis.get("gender", "N/A"), "Analysis Date", date_str]
    ]
    meta_table = Table(meta_data, colWidths=[2.8*cm, 3.5*cm, 2.2*cm, 2.5*cm, 2.8*cm, 3.5*cm])
    meta_table.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), GRAY_BG),
        ("TEXTCOLOR",     (0, 0), (0, -1), SLATE_LT),
        ("TEXTCOLOR",     (2, 0), (2, -1), SLATE_LT),
        ("TEXTCOLOR",     (4, 0), (4, -1), SLATE_LT),
        ("FONTNAME",      (0, 0), (-1, -1), "Helvetica"),
        ("FONTNAME",      (1, 0), (1, -1), "Helvetica-Bold"),
        ("FONTNAME",      (3, 0), (3, -1), "Helvetica-Bold"),
        ("FONTNAME",      (5, 0), (5, -1), "Helvetica-Bold"),
        ("FONTSIZE",      (0, 0), (-1, -1), 8),
        ("FONTSIZE",      (1, 0), (1, -1), 9),
        ("TOPPADDING",    (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("LEFTPADDING",   (0, 0), (-1, -1), 10),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 10),
        ("GRID",          (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [GRAY_BG]),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 0.5*cm))

    # ─── Helper: section banner ───────────────────────────────────────────
    def section_banner(title: str, icon: str = "◾", color=INDIGO):
        banner_data = [[Paragraph(f"{icon}  {title}", section_title)]]
        t = Table(banner_data, colWidths=[17.5*cm])
        t.setStyle(TableStyle([
            ("BACKGROUND",    (0, 0), (-1, -1), color),
            ("LEFTPADDING",   (0, 0), (-1, -1), 12),
            ("RIGHTPADDING",  (0, 0), (-1, -1), 12),
            ("TOPPADDING",    (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ]))
        return t

    # ─── Helper: score bar table ──────────────────────────────────────────
    def score_row(label: str, value: float):
        pct = int(value * 100)
        if pct > 70:
            clr, status = RED,    "High Concern"
        elif pct > 40:
            clr, status = AMBER,  "Moderate"
        else:
            clr, status = EMERALD, "Optimal"

        bar_width_full = 7.0 * cm
        bar_filled = bar_width_full * value

        # Draw bar as a simple drawing
        d = Drawing(bar_width_full, 10)
        d.add(Rect(0, 2, bar_width_full, 6, fillColor=colors.HexColor("#E2E8F0"), strokeColor=None))
        if bar_filled > 0:
            d.add(Rect(0, 2, bar_filled, 6, fillColor=clr, strokeColor=None))

        row = [
            Paragraph(label.capitalize(), ParagraphStyle(
                "rl", parent=styles["Normal"], fontSize=9,
                fontName="Helvetica-Bold", textColor=SLATE
            )),
            d,
            Paragraph(f"<b>{pct}%</b>", ParagraphStyle(
                "rv", parent=styles["Normal"], fontSize=9,
                fontName="Helvetica-Bold", textColor=clr, alignment=TA_CENTER
            )),
            Paragraph(status, ParagraphStyle(
                "rs", parent=styles["Normal"], fontSize=8,
                textColor=SLATE_LT, fontName="Helvetica"
            )),
        ]
        return row

    # ── SECTION 1: PROFILE SUMMARY ─────────────────────────────────────────
    story.append(section_banner("1. Profile Summary", "👤", SLATE))
    story.append(Spacer(1, 0.2*cm))

    face_shape  = analysis.get("face_shape", "Not detected")
    gender      = analysis.get("gender", "Not detected")
    skin_tone   = analysis.get("skin_tone", "N/A")
    undertone   = analysis.get("undertone", "N/A")
    eye_color   = analysis.get("eye_color", "N/A")
    hair_color  = analysis.get("hair_color", "N/A")
    season      = analysis.get("season", "N/A")
    conf        = analysis.get("face_shape_conf", 0)

    profile_data = [
        ["Face Shape", face_shape, "Gender",     gender],
        ["Skin Tone",  skin_tone,  "Undertone",  undertone],
        ["Eye Color",  eye_color,  "Hair Color", hair_color],
        ["Season",     season,     "Confidence", f"{int(float(conf or 0)*100)}%"],
    ]
    profile_table = Table(profile_data, colWidths=[3.5*cm, 5*cm, 3.5*cm, 5*cm])
    profile_table.setStyle(TableStyle([
        ("FONTNAME",  (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME",  (2, 0), (2, -1), "Helvetica-Bold"),
        ("FONTNAME",  (1, 0), (1, -1), "Helvetica"),
        ("FONTNAME",  (3, 0), (3, -1), "Helvetica"),
        ("FONTSIZE",  (0, 0), (-1, -1), 9),
        ("TEXTCOLOR", (0, 0), (0, -1), SLATE_LT),
        ("TEXTCOLOR", (2, 0), (2, -1), SLATE_LT),
        ("TEXTCOLOR", (1, 0), (1, -1), SLATE),
        ("TEXTCOLOR", (3, 0), (3, -1), SLATE),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [WHITE, GRAY_BG]),
        ("GRID",      (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ("TOPPADDING",    (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING",   (0, 0), (-1, -1), 10),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 10),
    ]))
    story.append(profile_table)
    story.append(Spacer(1, 0.5*cm))

    # ── SECTION 2: SKIN HEALTH METRICS ────────────────────────────────────
    story.append(section_banner("2. Skin Health Metrics", "📊", PURPLE))
    story.append(Spacer(1, 0.2*cm))

    skin_scores = analysis.get("skin_scores", {})
    if skin_scores:
        score_header = [
            Paragraph("Metric", ParagraphStyle("sh", parent=styles["Normal"], fontSize=8,
                                                fontName="Helvetica-Bold", textColor=SLATE_LT, alignment=TA_LEFT)),
            Paragraph("Score Bar", ParagraphStyle("shb", parent=styles["Normal"], fontSize=8,
                                                  fontName="Helvetica-Bold", textColor=SLATE_LT)),
            Paragraph("Value", ParagraphStyle("shv", parent=styles["Normal"], fontSize=8,
                                              fontName="Helvetica-Bold", textColor=SLATE_LT, alignment=TA_CENTER)),
            Paragraph("Status", ParagraphStyle("shs", parent=styles["Normal"], fontSize=8,
                                               fontName="Helvetica-Bold", textColor=SLATE_LT)),
        ]
        score_rows = [score_header]
        for k, v in skin_scores.items():
            score_rows.append(score_row(k, float(v or 0)))

        score_table = Table(score_rows, colWidths=[3.5*cm, 7*cm, 2*cm, 5*cm])
        score_table.setStyle(TableStyle([
            ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.HexColor("#F1F5F9"), WHITE]),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ("TOPPADDING",    (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("LEFTPADDING",   (0, 0), (-1, -1), 10),
            ("RIGHTPADDING",  (0, 0), (-1, -1), 10),
            ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ]))
        story.append(score_table)
    else:
        story.append(Paragraph("No skin metrics available for this analysis.", body_text))
    story.append(Spacer(1, 0.5*cm))

    # ── SECTION 3: PERSONALIZED RECOMMENDATIONS ───────────────────────────
    recs = analysis.get("recommendations", [])
    if recs:
        story.append(section_banner("3. AI-Generated Recommendations", "✨", TEAL))
        story.append(Spacer(1, 0.15*cm))
        rec_items = []
        for i, rec in enumerate(recs[:10], 1):
            clean = str(rec).replace("**", "")
            rec_items.append(Paragraph(f"<b>{i}.</b>  {clean}", body_text))
            rec_items.append(Spacer(1, 0.1*cm))
        story.extend(rec_items)
        story.append(Spacer(1, 0.4*cm))

    # ── SECTION 4: PERSONALIZED TIPS ──────────────────────────────────────
    tips = analysis.get("personalized_tips", [])
    if tips:
        story.append(section_banner("4. Personalized Beauty Insights", "💡", colors.HexColor("#9333EA")))
        story.append(Spacer(1, 0.15*cm))
        for tip in tips[:8]:
            clean = str(tip).strip()
            tip_data = [[Paragraph(clean, tip_text)]]
            tip_table = Table(tip_data, colWidths=[17.5*cm])
            tip_table.setStyle(TableStyle([
                ("BACKGROUND",    (0, 0), (-1, -1), GRAY_BG),
                ("LEFTBORDERCOLOR", (0, 0), (-1, -1), PURPLE),
                ("LINEBEFOREA",   (0, 0), (-1, -1), 3, PURPLE),
                ("TOPPADDING",    (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("LEFTPADDING",   (0, 0), (-1, -1), 12),
                ("RIGHTPADDING",  (0, 0), (-1, -1), 12),
                ("GRID",          (0, 0), (-1, -1), 0, WHITE),
            ]))
            story.append(tip_table)
            story.append(Spacer(1, 0.15*cm))
        story.append(Spacer(1, 0.3*cm))

    # ── FOOTER ────────────────────────────────────────────────────────────
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#E2E8F0")))
    story.append(Spacer(1, 0.2*cm))
    footer_lines = [
        "⚠️ This report is generated by AI and is intended for informational purposes only.",
        "Please consult a certified dermatologist or beauty professional for clinical diagnosis.",
        f"© {datetime.now().year} AI Beauty Consultant • Confidential Report • {user_email}",
    ]
    for line in footer_lines:
        story.append(Paragraph(line, meta_text))
        story.append(Spacer(1, 0.05*cm))

    doc.build(story)
    return buffer.getvalue()


@router.get("/download/{analysis_id}")
async def download_report(
    analysis_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Generate and download a PDF report for a specific analysis.
    Retrieves analysis by ID from MongoDB and streams PDF.
    """
    user_email = current_user.get("sub")

    try:
        obj_id = ObjectId(analysis_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid analysis ID format")

    analysis = analysis_collection.find_one(
        {"_id": obj_id, "user_email": user_email}
    )
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found or access denied")

    # Serialize MongoDB doc
    analysis["id"] = str(analysis["_id"])
    analysis.pop("_id", None)
    if "created_at" in analysis:
        analysis["date"] = analysis["created_at"].strftime("%Y-%m-%d")
        analysis["time"] = analysis["created_at"].strftime("%H:%M")

    try:
        pdf_bytes = generate_pdf_report(analysis, user_email)
    except Exception as e:
        import traceback
        _log.exception("Unhandled error")
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")

    filename = f"beauty_report_{analysis['id'][:8]}.pdf"

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/download/latest")
async def download_latest_report(current_user: dict = Depends(get_current_user)):
    """
    Generate and download the most recent analysis as a PDF report.
    """
    user_email = current_user.get("sub")

    analysis = analysis_collection.find_one(
        {"user_email": user_email},
        sort=[("created_at", -1)]
    )
    if not analysis:
        raise HTTPException(status_code=404, detail="No analysis found for this user")

    analysis["id"] = str(analysis["_id"])
    analysis.pop("_id", None)
    if "created_at" in analysis:
        analysis["date"] = analysis["created_at"].strftime("%Y-%m-%d")

    try:
        pdf_bytes = generate_pdf_report(analysis, user_email)
    except Exception as e:
        import traceback
        _log.exception("Unhandled error")
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")

    filename = f"beauty_report_latest.pdf"
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
@router.post("/demo")
async def download_demo_report(
    analysis: dict,
    current_user: Optional[dict] = Depends(get_current_user)
):
    """
    Generate and download a PDF report for demo/unsaved data.
    Takes the full analysis object in the request body.
    """
    user_email = current_user.get("sub") if current_user else "Guest (Demo Mode)"
    
    # Pre-process demo data for PDF generator
    analysis["id"] = "DEMO-" + datetime.utcnow().strftime("%Y%m%d%H%M")
    if "created_at" not in analysis:
        analysis["date"] = datetime.utcnow().strftime("%Y-%m-%d")
    
    try:
        pdf_bytes = generate_pdf_report(analysis, user_email)
    except Exception as e:
        import traceback
        _log.exception("Unhandled error")
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")

    filename = "beauty_report_demo.pdf"
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
