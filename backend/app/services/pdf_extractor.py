import fitz  # PyMuPDF

class PDFExtractor:
    @staticmethod
    def extract_text(file_path: str) -> str:
        text = ""
        try:
            doc = fitz.open(file_path)
            for page in doc:
                text += page.get_text()
            doc.close()
        except Exception as e:
            print(f"Error extracting PDF: {e}")
            return ""
        return text
