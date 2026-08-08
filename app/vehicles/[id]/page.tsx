import VehicleDetailContent from './VehicleDetailContent'

interface PageProps {
  params: {
    id: string
  }
}

export default function VehicleDetailPage({ params }: PageProps) {
  return <VehicleDetailContent vehicleId={params.id} />
}