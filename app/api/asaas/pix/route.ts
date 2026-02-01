import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { message: 'PIX Asaas ainda não configurado' },
    { status: 501 }
  )
}
