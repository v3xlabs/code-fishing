import { PartyInviteCard } from '@/components/party/management/PartyInvite';
import { createFileRoute, useParams } from '@tanstack/react-router'

export const Route = createFileRoute('/$partyId/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { partyId } = Route.useParams();

  return (<div className="p-2 grid grid-cols-1 gap-2">
    <PartyInviteCard partyId={partyId} />
  </div>);
}
