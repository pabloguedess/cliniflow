import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim()

  if (q.length < 3) {
    return NextResponse.json({ results: [] })
  }

  // Nominatim (OpenStreetMap) - grátis
  const url =
    `https://nominatim.openstreetmap.org/search?format=json&limit=6&addressdetails=1&accept-language=pt-BR&q=` +
    encodeURIComponent(q)

  const res = await fetch(url, {
    headers: {
      // Nominatim recomenda um User-Agent identificável; usamos um genérico aqui.
      'User-Agent': 'Cliniflow/1.0',
    },
    // cache curto pra não “martelar” o serviço
    next: { revalidate: 60 },
  })

  const data = await res.json()

  const results = (Array.isArray(data) ? data : []).map((item: any) => ({
    label: item.display_name,
    lat: item.lat,
    lon: item.lon,
  }))

  return NextResponse.json({ results })
}
