import { useMemo, useState } from 'react'
import DOMPurify from 'dompurify'
import { marked } from 'marked'
import './App.css'

const DEFAULT_MARKDOWN = `# Markdown Converter\n\nConvert markdown into **DOCX** and **PDF** files directly in your browser.\n\n## Features\n\n- Live markdown preview\n- Export to .docx\n- Export to .pdf\n\n> Tip: Paste your own markdown and export instantly.`

const headingLevels = {
  1: 'HEADING_1',
  2: 'HEADING_2',
  3: 'HEADING_3',
  4: 'HEADING_4',
  5: 'HEADING_5',
  6: 'HEADING_6',
}

const stripMarkdownSyntax = (input) =>
  input
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[*_~>#]/g, '')
    .trim()

const markdownToDocxParagraphs = (markdown, { Paragraph, TextRun, HeadingLevel }) => {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const paragraphs = []
  let isCodeBlock = false

  lines.forEach((line) => {
    const trimmedLine = line.trim()

    if (trimmedLine.startsWith('```')) {
      isCodeBlock = !isCodeBlock
      return
    }

    if (isCodeBlock) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: line || ' ', font: 'Courier New' })],
        }),
      )
      return
    }

    if (trimmedLine.length === 0) {
      paragraphs.push(new Paragraph({ text: ' ' }))
      return
    }

    const headingMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      const level = headingMatch[1].length
      const headingText = stripMarkdownSyntax(headingMatch[2])
      paragraphs.push(
        new Paragraph({
          text: headingText,
          heading: HeadingLevel[headingLevels[level]],
        }),
      )
      return
    }

    const bulletMatch = trimmedLine.match(/^[-*+]\s+(.+)$/)
    if (bulletMatch) {
      paragraphs.push(
        new Paragraph({
          text: stripMarkdownSyntax(bulletMatch[1]),
          bullet: { level: 0 },
        }),
      )
      return
    }

    const orderedMatch = trimmedLine.match(/^(\d+)\.\s+(.+)$/)
    if (orderedMatch) {
      paragraphs.push(
        new Paragraph({
          text: `${orderedMatch[1]}. ${stripMarkdownSyntax(orderedMatch[2])}`,
        }),
      )
      return
    }

    const quoteMatch = trimmedLine.match(/^>\s+(.+)$/)
    if (quoteMatch) {
      paragraphs.push(
        new Paragraph({
          text: stripMarkdownSyntax(quoteMatch[1]),
          indent: { left: 720 },
        }),
      )
      return
    }

    paragraphs.push(new Paragraph({ text: stripMarkdownSyntax(trimmedLine) }))
  })

  return paragraphs.length > 0 ? paragraphs : [new Paragraph({ text: ' ' })]
}

const markdownToPdfLines = (markdown) =>
  markdown
    .replace(/\r\n/g, '\n')
    .split('\n')
    .filter((line, index, arr) => line.trim().length > 0 || arr[index - 1]?.trim().length > 0)
    .map((line) => stripMarkdownSyntax(line))

function App() {
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN)
  const [isExporting, setIsExporting] = useState(false)

  const previewHtml = useMemo(() => {
    const html = marked.parse(markdown, { breaks: true, gfm: true })
    return DOMPurify.sanitize(html)
  }, [markdown])

  const handleDocxDownload = async () => {
    setIsExporting(true)
    try {
      const [{ Document, HeadingLevel, Packer, Paragraph, TextRun }, { saveAs }] =
        await Promise.all([import('docx'), import('file-saver')])
      const doc = new Document({
        sections: [
          { children: markdownToDocxParagraphs(markdown, { Paragraph, TextRun, HeadingLevel }) },
        ],
      })
      const blob = await Packer.toBlob(doc)
      saveAs(blob, 'converted-document.docx')
    } finally {
      setIsExporting(false)
    }
  }

  const handlePdfDownload = async () => {
    setIsExporting(true)
    try {
      const { jsPDF } = await import('jspdf')
      const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
      const margin = 40
      const lineHeight = 18
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const printableWidth = pageWidth - margin * 2
      let y = margin

      markdownToPdfLines(markdown).forEach((line) => {
        const textLines = pdf.splitTextToSize(line || ' ', printableWidth)
        textLines.forEach((textLine) => {
          if (y > pageHeight - margin) {
            pdf.addPage()
            y = margin
          }
          pdf.text(textLine, margin, y)
          y += lineHeight
        })
      })

      pdf.save('converted-document.pdf')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <main className="app">
      <header className="app-header">
        <h1>Markdown to DOCX/PDF Converter</h1>
        <p>Paste markdown, preview instantly, then export to DOCX or PDF.</p>
      </header>

      <section className="workspace" aria-label="Markdown editor and preview">
        <article className="panel">
          <div className="panel-header">
            <h2>Markdown Input</h2>
          </div>
          <textarea
            aria-label="Markdown editor"
            value={markdown}
            onChange={(event) => setMarkdown(event.target.value)}
          />
        </article>

        <article className="panel">
          <div className="panel-header">
            <h2>Preview</h2>
          </div>
          <div
            className="preview"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </article>
      </section>

      <section className="actions" aria-label="Export actions">
        <button type="button" onClick={handleDocxDownload} disabled={isExporting}>
          Download DOCX
        </button>
        <button type="button" onClick={handlePdfDownload} disabled={isExporting}>
          Download PDF
        </button>
      </section>
    </main>
  )
}

export default App
