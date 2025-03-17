import { Switch } from '@/components/input/Switch';
import { Modal } from '@/components/modal/Modal';
import { PartyInviteCard } from '@/components/party/management/PartyInvite';
import { ServerFinder } from '@/components/party/management/ServerFinder';
import { PartyMembers } from '@/components/party/PartyMembers';
import { Dialog, DialogContent, DialogTrigger } from '@radix-ui/react-dialog';
import { createFileRoute, useParams } from '@tanstack/react-router'

export const Route = createFileRoute('/$partyId/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { partyId } = Route.useParams();

  return (<div className="p-2 flex flex-wrap gap-2">
    <PartyInviteCard partyId={partyId} />
    <div className="flex flex-col gap-2">
      <div className="card p-4 h-fit flex flex-col gap-2 max-w-xs w-full">
        <h3 className="">
          Settings
        </h3>
        <ul className="text-secondary w-full">
          <li className="flex items-center justify-between gap-2">
            Private Party
            <Switch />
          </li>
          <li className="flex items-center justify-between gap-2">
            Steam Only
            <Switch />
          </li>
        </ul>
        <ul className="text-secondary w-full">
          <li className="flex items-center justify-between gap-2">
            <h3>
              Location
            </h3>
            <LocationPicker />
          </li>
        </ul>
      </div>
      <PartyMembers />
    </div>
  </div>);
}

export const LocationPicker = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="button">
          Not Set
        </button>
      </DialogTrigger>
      <Modal size="medium">
        <h3>Select Server</h3>
        <ServerFinder />
      </Modal>
    </Dialog>
  );
};
