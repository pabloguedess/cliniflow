import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim()

  if (!q || q.length < 3) {
    return NextResponse.json({ items: [] })
  }

  // Nominatim (OpenStreetMap)
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', q)
  url.searchParams.set('format', 'json')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('limit', '6')
  url.searchParams.set('countrycodes', 'br')

  const r = await fetch(url.toString(), {
    headers: {
      // Em server-side a gente consegue mandar header certinho
      'User-Agent': 'CliniFlow/1.0 (address autocomplete)',
      'Accept-Language': 'pt-BR',
    },
    // evita cache ruim
    cache: 'no-store',
  })

  const data = await r.json().catch(() => [])
  const items = Array.isArray(data) ? data : []

  // transforma em formato "Uber"
  const mapped = items.map((it: any) => {
    const a = it.address || {}
    const road = a.road || a.pedestrian || a.path || a.residential || ''
    const number = a.house_number || ''
    const suburb = a.suburb || a.neighbourhood || a.quarter || ''
    const city = a.city || a.town || a.village || a.municipality || ''
    const state = a.state || ''
    const postcode = a.postcode || ''

    const line1 = [road, number].filter(Boolean).join(', ')
    const line2 = [suburb, city].filter(Boolean).join(', ')
    const line3 = state ? ` - ${state}` : ''

    const label = `${line1 || it.display_name}${line2 ? ` – ${line2}` : ''}${line3}`

    return {
      placeId: String(it.place_id),
      label,
      road,
      number,
      suburb,
      city,
      state,
      postcode,
      lat: it.lat,
      lon: it.lon,
    }
  })

  return NextResponse.json({ items: mapped })
}
