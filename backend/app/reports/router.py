import os

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.reports.service import create_csv_report
from app.database.session import get_db
from app.reports.service import create_pdf_report

router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)


@router.get("/pdf")
def download_report(db: Session = Depends(get_db)):

    filename = create_pdf_report(db)

    if not os.path.exists(filename):
        raise HTTPException(status_code=404, detail="PDF not found")

    return FileResponse(
        path=filename,
        media_type="application/pdf",
        filename="IntelliForge_Report.pdf"
    )

@router.get("/csv")
def download_csv(db: Session = Depends(get_db)):

    filename = create_csv_report(db)

    return FileResponse(
        filename,
        media_type="text/csv",
        filename="IntelliForge_Report.csv"
    )