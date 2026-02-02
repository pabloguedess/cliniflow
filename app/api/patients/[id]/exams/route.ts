import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { verifySession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { PDFDocument, StandardFonts } from 'pdf-lib'

export const dynamic = 'force-dynamic'

const BUCKET = process.env.SUPABASE_EXAMS_BUCKET || 'exams'

function safeName(name: string) {
  return name.replace(/[^\w.\-]+/g, '_')
}

function getExt(filename: string) {
  const parts = filename.split('.')
  return parts.length > 1 ? parts.pop()!.toLowerCase() : ''
}

async function imageOrTextToPdfBytes(file: File) {
  const ext = getExt(file.name)
  const mime = file.type || ''

  // TXT -> PDF
  if (mime === 'text/plain' || ext === 'txt') {
    const text = await file.text()
    const pdf = await PDFDocument.create()
    const font = await pdf.embedFont(StandardFonts.Helvetica)

    const page = pdf.addPage([595.28, 841.89]) // A4
    const { width, height } = page.getSize()

    const fontSize = 11
    const lineHeight = 14
    const margin = 40
    const maxWidth = width - margin * 2

    const lines: string[] = []
    for (const rawLine of text.split(/\r?\n/)) {
      // quebra simples por largura aproximada
      let current = rawLine
      while (current.length > 0) {
        let cut = current.length
        while (cut > 0 && font.widthOfTextAtSize(current.slice(0, cut), fontSize) > maxWidth) {
          cut--
        }
        if (cut === 0) break
        lines.push(current.slice(0, cut))
        current = current.slice(cut)
      }
      if (rawLine.length === 0) lines.push('')
    }

    let y = height - margin
    for (const ln of lines) {
      if (y < margin) break
      page.drawText(ln, { x: margin, y: y - fontSize, size: fontSize, font })
      y -= lineHeight
    }

    return { pdfBytes: await pdf.save(), suggestedName: file.name.replace(/\.[^.]+$/, '') + '.pdf' }
  }

  // PNG/JPG -> PDF
  if (
    mime.startsWith('image/') ||
    ext === 'png' ||
    ext === 'jpg' ||
    ext === 'jpeg' ||
    ext === 'webp'
  ) {
    const bytes = new Uint8Array(await file.arrayBuffer())
    const pdf = await PDFDocument.create()

    let embedded: any
    if (ext === 'png' || mime === 'image/png') embedded = await pdf.embedPng(bytes)
    else embedded = await pdf.embedJpg(bytes) // jpg/jpeg e a maioria das imagens

    const imgW = embedded.width
    const imgH = embedded.height

    // A4
    const pageW = 595.28
    const pageH = 841.89

    // escala para caber
    const scale = Math.min(pageW / imgW, pageH / imgH)
    const w = imgW * scale
    const h = imgH * scale
    const x = (pageW - w) / 2
    const y = (pageH - h) / 2

    const page = pdf.addPage([pageW, pageH])
    page.drawImage(embedded, { x, y, width: w, height: h })

    return { pdfBytes: await pdf.save(), suggestedName: file.name.replace(/\.[^.]+$/, '') + '.pdf' }
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

    const prefix = `${session.tenantId}/${id}/`

    const { data, error: listErr } = await client.storage.from(BUCKET).list(prefix, {
      limit: 100,
      sortBy: { column: 'created_at', order: 'desc' },
    })
    if (listErr) throw listErr

    const files = (data || []).filter((x) => x.name && x.id)

    const signed = await Promise.all(
      files.map(async (f) => {
        const path = `${prefix}${f.name}`
        const { data: signedData, error: signedErr } = await client.storage
          .from(BUCKET)
          .createSignedUrl(path, 60 * 60)

        if (signedErr) return null

        return {
          name: f.name,
          path,
          url: signedData?.signedUrl || null,
          createdAt: f.created_at,
          size: f.metadata?.size || null,
        }
      })
    )

    return NextResponse.json({ items: signed.filter(Boolean) })
  } catch (e: any) {
    console.error('GET /api/patients/[id]/exams ERROR:', e)
    return NextResponse.json({ message: 'Erro ao listar exames' }, { status: 500 })
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
    const title = (form.get('title') ? String(form.get('title')) : 'exame').trim()

    if (!file) return NextResponse.json({ message: 'Arquivo obrigatório' }, { status: 400 })

    const ext = getExt(file.name)

    // ✅ Word: por enquanto não convertemos no free.
    if (ext === 'doc' || ext === 'docx' || file.type.includes('word')) {
      return NextResponse.json(
        { message: 'Por enquanto, envie Word já em PDF (exportar do Word). Conversão automática será adicionada depois.' },
        { status: 400 }
      )
    }

    // Se já for PDF, salva como está. Se for imagem/txt, converte para PDF antes.
    let uploadBytes: Uint8Array
    let finalName = file.name
    if (file.type === 'application/pdf' || ext === 'pdf') {
      uploadBytes = new Uint8Array(await file.arrayBuffer())
    } else {
      const converted = await imageOrTextToPdfBytes(file)
      if (!converted) {
        return NextResponse.json(
          { message: 'Formato não suportado. Envie PDF/JPG/PNG/TXT.' },
          { status: 400 }
        )
      }
      uploadBytes = new Uint8Array(converted.pdfBytes)
      finalName = converted.suggestedName
    }

    const filename = `${Date.now()}_${safeName(title)}_${safeName(finalName)}`
    const path = `${session.tenantId}/${id}/${filename}`

    const { error: upErr } = await client.storage.from(BUCKET).upload(path, uploadBytes, {
      contentType: 'application/pdf',
      upsert: false,
    })
    if (upErr) throw upErr

    const { data: signedData, error: signedErr } = await client.storage
      .from(BUCKET)
      .createSignedUrl(path, 60 * 60)

    if (signedErr) throw signedErr

    return NextResponse.json({ ok: true, path, url: signedData?.signedUrl })
  } catch (e: any) {
    console.error('POST /api/patients/[id]/exams ERROR:', e)
    return NextResponse.json({ message: 'Erro ao enviar exame' }, { status: 500 })
  }
}
