"""Convert RAPPORT_GAPS.md to a styled PDF using Chrome headless."""
import markdown
import subprocess
import os
from pathlib import Path

ROOT = Path(__file__).parent
MD_FILE = ROOT / 'RAPPORT_GAPS.md'
HTML_FILE = ROOT / 'RAPPORT_GAPS.html'
PDF_FILE = ROOT / 'RAPPORT_GAPS.pdf'

# Read markdown
md_text = MD_FILE.read_text(encoding='utf-8')

# Convert to HTML with tables support
html_body = markdown.markdown(
    md_text,
    extensions=['tables', 'fenced_code', 'nl2br', 'sane_lists', 'toc']
)

# Styled HTML wrapper
html_full = f"""<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<title>SwiftBridge — Gap Rapport</title>
<style>
  @page {{
    size: A4;
    margin: 18mm 16mm;
  }}
  body {{
    font-family: -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
    color: #1f2937;
    line-height: 1.55;
    font-size: 11pt;
    max-width: 100%;
  }}
  h1 {{
    color: #1e40af;
    border-bottom: 3px solid #3b82f6;
    padding-bottom: 8px;
    margin-top: 28px;
    page-break-after: avoid;
    font-size: 22pt;
  }}
  h2 {{
    color: #1e40af;
    border-bottom: 1px solid #cbd5e1;
    padding-bottom: 6px;
    margin-top: 24px;
    page-break-after: avoid;
    font-size: 16pt;
  }}
  h3 {{
    color: #2563eb;
    margin-top: 18px;
    page-break-after: avoid;
    font-size: 13pt;
  }}
  h4 {{
    color: #3b82f6;
    margin-top: 14px;
    font-size: 11pt;
  }}
  p, li {{
    margin: 6px 0;
  }}
  ul, ol {{
    padding-left: 22px;
  }}
  blockquote {{
    border-left: 4px solid #3b82f6;
    background: #eff6ff;
    margin: 12px 0;
    padding: 10px 16px;
    color: #1e3a8a;
    font-style: italic;
  }}
  table {{
    border-collapse: collapse;
    width: 100%;
    margin: 12px 0;
    font-size: 9.5pt;
    page-break-inside: avoid;
  }}
  th {{
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    text-align: left;
    padding: 8px 10px;
    font-weight: 700;
    font-size: 9pt;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }}
  td {{
    border: 1px solid #e5e7eb;
    padding: 6px 10px;
    vertical-align: top;
  }}
  tr:nth-child(even) td {{
    background: #f8fafc;
  }}
  code {{
    background: #f1f5f9;
    color: #1e40af;
    padding: 1px 5px;
    border-radius: 3px;
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 9.5pt;
  }}
  pre {{
    background: #f8fafc;
    border-left: 3px solid #3b82f6;
    padding: 10px;
    overflow-x: auto;
    font-size: 9pt;
  }}
  hr {{
    border: none;
    border-top: 1px solid #cbd5e1;
    margin: 24px 0;
  }}
  strong {{
    color: #0f172a;
  }}
  em {{
    color: #475569;
  }}
  a {{
    color: #2563eb;
    text-decoration: none;
  }}
  /* Cover-achtige eerste sectie */
  body > h1:first-of-type {{
    text-align: left;
    font-size: 26pt;
    margin-top: 0;
  }}
  /* Emoji-bullets */
  li {{
    page-break-inside: avoid;
  }}
</style>
</head>
<body>
{html_body}
</body>
</html>
"""

HTML_FILE.write_text(html_full, encoding='utf-8')
print(f'HTML saved: {HTML_FILE}')

# Find Chrome
chrome_paths = [
    r'C:\Program Files\Google\Chrome\Application\chrome.exe',
    r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',
    r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
]
chrome = next((p for p in chrome_paths if os.path.exists(p)), None)
if not chrome:
    raise RuntimeError('Chrome niet gevonden')
print(f'Browser: {chrome}')

# Print to PDF via Chrome headless
result = subprocess.run([
    chrome,
    '--headless=new',
    '--disable-gpu',
    '--no-pdf-header-footer',
    f'--print-to-pdf={PDF_FILE}',
    HTML_FILE.as_uri(),
], capture_output=True, text=True, timeout=60)

if PDF_FILE.exists() and PDF_FILE.stat().st_size > 1000:
    print(f'PDF created: {PDF_FILE} ({PDF_FILE.stat().st_size // 1024} KB)')
else:
    print('PDF generation failed')
    print('STDOUT:', result.stdout)
    print('STDERR:', result.stderr)
