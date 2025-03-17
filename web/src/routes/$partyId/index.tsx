import { createFileRoute, useParams } from '@tanstack/react-router'

export const Route = createFileRoute('/$partyId/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { partyId } = Route.useParams();

  return <div>Hello {partyId}</div>
}
