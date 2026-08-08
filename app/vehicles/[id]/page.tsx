import type { Metadata } from 'next'
import VehicleDetailContent from './VehicleDetailContent'
import { supabaseServer } from '@/lib/supabase/server'

interface VehiclePageProps {
  params: {
    id: string
  }
}

export async function generateMetadata(
  { params }: VehiclePageProps
): Promise<Metadata> {
  const { data: vehicle, error } = await supabaseServer
    .from('vehicles')
    .select(`
      id,
      title,
      brand,
      model,
      year,
      price,
      description,
      condition,
      city,
      state,
      country,
      cover_image,
      status,
      unavailable,
      Removed
    `)
    .eq('id', params.id)
    .single()

  // Fallback metadata if the vehicle cannot be found
  if (error || !vehicle) {
    return {
      title: 'Vehicle Listing | AutoRepublic',
      description:
        'Explore vehicles for sale in Nigeria on AutoRepublic.',
      robots: {
        index: false,
        follow: true,
      },
    }
  }

  const location = [vehicle.city, vehicle.state, vehicle.country]
    .filter(Boolean)
    .join(', ')

  const condition = vehicle.condition
    ? vehicle.condition
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (char: string) => char.toUpperCase())
    : ''

  const vehicleName =
    vehicle.title ||
    `${vehicle.year} ${vehicle.brand} ${vehicle.model}`

  const titleParts = [
    vehicleName,
    location ? `for Sale in ${location}` : 'for Sale',
  ]

  const title = titleParts.join(' | ')

  const descriptionParts = [
    `${vehicleName} available on AutoRepublic.`,
    condition ? `${condition} vehicle.` : '',
    location ? `Located in ${location}.` : '',
    vehicle.description
      ? vehicle.description.replace(/\s+/g, ' ').trim().slice(0, 300)
      : '',
  ].filter(Boolean)

  const description = descriptionParts.join(' ')

  const isUnavailable =
    vehicle.unavailable === true ||
    vehicle.Removed === true ||
    vehicle.status !== 'active'

  const canonicalUrl = `https://autorepublic.ng/vehicles/${vehicle.id}`

  return {
    title,

    description,

    keywords: [
      vehicle.brand,
      vehicle.model,
      `${vehicle.year} ${vehicle.brand} ${vehicle.model}`,
      `${vehicle.brand} ${vehicle.model} for sale`,
      `${vehicle.brand} cars for sale in Nigeria`,
      'cars for sale in Nigeria',
      'vehicles for sale in Nigeria',
      'AutoRepublic',
      'Auto Republic',
    ].filter(Boolean),

    alternates: {
      canonical: canonicalUrl,
    },

    robots: {
      index: !isUnavailable,
      follow: true,
      googleBot: {
        index: !isUnavailable,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },

    openGraph: {
      type: 'website',
      locale: 'en_NG',
      url: canonicalUrl,
      siteName: 'AutoRepublic',
      title,
      description,
      images: vehicle.cover_image
        ? [
            {
              url: vehicle.cover_image,
              width: 1200,
              height: 630,
              alt: vehicleName,
            },
          ]
        : [],
    },

    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: vehicle.cover_image
        ? [vehicle.cover_image]
        : [],
    },
  }
}

export default function VehicleDetailPage({
  params,
}: VehiclePageProps) {
  return <VehicleDetailContent vehicleId={params.id} />
}