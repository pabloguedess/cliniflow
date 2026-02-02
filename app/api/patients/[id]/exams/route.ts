import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { verifySession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const dynamic = 'force-dynamic'

const BUCKET = process.env.SUPABASE_EXAMS_BUCKET || 'exams'

function safeName(name: string) {
  return name.replace(/[^\w.\-]+/g, '_')
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
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

    const { data, error } = await supabaseAdmin.storage.from(BUCKET).list(prefix, {
      limit: 100,
      sortBy: { column: 'created_at', order: 'desc' },
    })
    if (error) throw error

    const files = (data || []).filter((x) => x.name && x.id)

    // gera links assinados (válidos por 1h)
    const signed = await Promise.all(
      files.map(async (f) => {
        const path = `${prefix}${f.name}`
        const { data: signedData, error: signedErr } = await supabaseAdmin.storage
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

    const ext = file.name.includes('.') ? file.name.split('.').pop() : 'bin'
    const filename = `${Date.now()}_${safeName(title)}.${safeName(ext || 'bin')}`

    const path = `${session.tenantId}/${id}/${filename}`
    const bytes = new Uint8Array(await file.arrayBuffer())

    const { error } = await supabaseAdmin.storage.from(BUCKET).upload(path, bytes, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    })
    if (error) throw error

    const { data: signedData, error: signedErr } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUrl(path, 60 * 60)

    if (signedErr) throw signedErr

    return NextResponse.json({ ok: true, path, url: signedData?.signedUrl })
  } catch (e: any) {
    console.error('POST /api/patients/[id]/exams ERROR:', e)
    return NextResponse.json({ message: 'Erro ao enviar exame' }, { status: 500 })
  }
}
