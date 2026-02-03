import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { verifySession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { PDFDocument, StandardFonts } from 'pdf-lib'
import mammoth from 'mammoth'

export const dynamic = 'force-dynamic'

const BUCKET = process.env.SUPABASE_EXAMS_BUCKET || 'exams'

function safeName(name: string) {
  return name.replace(/[^\w.\-]+/g, '_')
}

function getExt(filename: string) {
  const parts = filename.split('.')
  return parts.length > 1 ? parts.pop()!.toLowerCase() : ''
}

async function textToPdfBytes(text: string, baseName: string) {
  const pdf = await PDFDocument.create()
  const font = await pdf.embedFont(StandardFonts.Helvetica)

  const pageW = 595.28 // A4
  const pageH = 841.89
  const margin = 40
  const fontSize = 11
  const lineHeight = 14
  const maxWidth = pageW - margin * 2

  let page = pdf.addPage([pageW, pageH])
  let y = pageH - margin

  const lines: string[] = []
  for (const rawLine of text.split(/\r?\n/)) {
    let current = rawLine
    while (current.length > 0) {
      let cut = current.length
      while (cut > 0 && font.widthOfTextAtSize(current.slice(0, cut), fontSize) > maxWidth) cut--
      if (cut === 0) break
      lines.push(current.slice(0, cut))
      current = current.slice(cut)
    }
    if (rawLine.length === 0) lines.push('')
  }

  for (const ln of lines) {
    if (y < margin) {
      page = pdf.addPage([pageW, pageH])
      y = pageH - margin
    }
    page.drawText(ln, { x: margin, y: y - fontSize, size: fontSize, font })
    y -= lineHeight
  }

  return {
    pdfBytes: await pdf.save(),
    suggestedName: baseName.replace(/\.[^.]+$/, '') + '.pdf',
  }
}

async function imageToPdfBytes(file: File) {
  const ext = getExt(file.name)
  const mime = file.type || ''
  const bytes = new Uint8Array(await file.arrayBuffer())

  const pdf = await PDFDocument.create()

  let embedded: any
  if (ext === 'png' || mime === 'image/png') embedded = await pdf.embedPng(bytes)
  else embedded = await pdf.embedJpg(bytes)

  const imgW = embedded.width
  const imgH = embedded.height

  const pageW = 595.28
  const pageH = 841.89

  const scale = Math.min(pageW / imgW, pageH / imgH)
  const w = imgW * scale
  const h = imgH * scale
  const x = (pageW - w) / 2
  const y = (pageH - h) / 2

  const page = pdf.addPage([pageW, pageH])
  page.drawImage(embedded, { x, y, width: w, height: h })

  return {
    pdfBytes: await pdf.save(),
    suggestedName: file.name.replace(/\.[^.]+$/, '') + '.pdf',
  }
}

async function fileToPdf(file: File) {
  const ext = getExt(file.name)
  const mime = file.type || ''

  // PDF já pronto
  if (mime === 'application/pdf' || ext === 'pdf') {
    const uploadBytes = new Uint8Array(await file.arrayBuffer())
    return { pdfBytes: uploadBytes, suggestedName: file.name.replace(/\.[^.]+$/, '') + '.pdf' }
  }

  // TXT -> PDF
  if (mime === 'text/plain' || ext === 'txt') {
    const text = await file.text()
    return textToPdfBytes(text, file.name)
  }

  // DOCX -> PDF (extraindo texto)
  if (ext === 'docx' || mime.includes('officedocument.wordprocessingml.document')) {
    const ab = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ arrayBuffer: ab })
    const text = (result?.value || '').trim() || 'Documento sem texto.'
    return textToPdfBytes(text, file.name)
  }

  // DOC (binário antigo) não dá pra converter grátis em serverless
  if (ext === 'doc' || mime.includes('msword')) {
    return null
  }

  // Imagens -> PDF
  if (mime.startsWith('image/') || ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'webp') {
    return imageToPdfBytes(file)
  }

  return null
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { client, error } = getSupabaseAdmin()
    if (!client) return NextResponse.json({ message: error }, { status: 500 })

    const { id } = await ctx.params

    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('cliniflow_session')?.value
    const session = verifySession(sessionCookie)
    if (!session) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })

    const patient = await prisma.patient.findFirst({
      where: { id, tenantId: session.tenantId, active: true },
      select: { id: true },
    })
    if (!patient) return NextResponse.json({ message: 'Paciente inválido' }, { status: 404 })

    const rows = await prisma.exam.findMany({
      where: { tenantId: session.tenantId, patientId: id },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        filename: true,
        url: true, // aqui guardamos o PATH do storage
        contentType: true,
        createdAt: true,
      },
    })

    const exams = await Promise.all(
      rows.map(async (r) => {
        const path = r.url
        const { data: signedData, error: signedErr } = await client.storage
          .from(BUCKET)
          .createSignedUrl(path, 60 * 60)

        return {
          id: r.id,
          filename: r.filename,
          url: signedErr ? null : signedData?.signedUrl || null,
          contentType: r.contentType,
          createdAt: r.createdAt,
          path,
        }
      })
    )

    return NextResponse.json({ exams })
  } catch (e: any) {
    console.error('GET /api/patients/[id]/exams ERROR:', e)
    return NextResponse.json({ message: 'Erro ao listar anexos' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { client, error } = getSupabaseAdmin()
    if (!client) return NextResponse.json({ message: error }, { status: 500 })

    const { id } = await ctx.params

    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('cliniflow_session')?.value
    const session = verifySession(sessionCookie)
    if (!session) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })

    const patient = await prisma.patient.findFirst({
      where: { id, tenantId: session.tenantId, active: true },
      select: { id: true },
    })
    if (!patient) return NextResponse.json({ message: 'Paciente inválido' }, { status: 404 })

    const form = await req.formData()
    const file = form.get('file') as File | null
    const title = (form.get('title') ? String(form.get('title')) : 'documento').trim()

    if (!file) return NextResponse.json({ message: 'Arquivo obrigatório' }, { status: 400 })

    const ext = getExt(file.name)
    if (ext === 'doc') {
      return NextResponse.json(
        { message: 'Arquivo .DOC (Word antigo) não é suportado. Use DOCX ou exporte para PDF.' },
        { status: 400 }
      )
    }

    const converted = await fileToPdf(file)
    if (!converted) {
      return NextResponse.json(
        { message: 'Formato não suportado. Envie PDF/JPG/PNG/TXT/DOCX.' },
        { status: 400 }
      )
    }

    const finalName = converted.suggestedName
    const filename = `${Date.now()}_${safeName(title)}_${safeName(finalName)}`
    const path = `${session.tenantId}/${id}/${filename}`

    const { error: upErr } = await client.storage.from(BUCKET).upload(path, converted.pdfBytes, {
      contentType: 'application/pdf',
      upsert: false,
    })
    if (upErr) throw upErr

    const exam = await prisma.exam.create({
      data: {
        tenantId: session.tenantId,
        patientId: id,
        filename: finalName,
        url: path, // salvamos o path do storage aqui
        contentType: 'application/pdf',
      },
    })

    const { data: signedData, error: signedErr } = await client.storage
      .from(BUCKET)
      .createSignedUrl(path, 60 * 60)

    if (signedErr) throw signedErr

    return NextResponse.json({
      ok: true,
      exam: {
        id: exam.id,
        filename: exam.filename,
        url: signedData?.signedUrl || null,
        contentType: exam.contentType,
        createdAt: exam.createdAt,
        path,
      },
    })
  } catch (e: any) {
    console.error('POST /api/patients/[id]/exams ERROR:', e)
    return NextResponse.json({ message: 'Erro ao enviar anexo' }, { status: 500 })
  }
}
