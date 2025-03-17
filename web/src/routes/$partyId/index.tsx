import { Switch } from '@/components/input/Switch';
import { Modal } from '@/components/modal/Modal';
import { PartyInviteCard } from '@/components/party/management/PartyInvite';
import { ServerFinder } from '@/components/party/management/ServerFinder';
import { Dialog, DialogContent, DialogTrigger } from '@radix-ui/react-dialog';
import { createFileRoute, useParams } from '@tanstack/react-router'

export const Route = createFileRoute('/$partyId/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { partyId } = Route.useParams();

  return (<div className="p-2 flex flex-wrap gap-2">
    <PartyInviteCard partyId={partyId} />
    <div className="card p-4 h-fit flex flex-col gap-2">
      <h3 className="">
        Settings
      </h3>
      <ul className="text-secondary">
      <li className="flex items-center gap-2">
          Private Party
          <Switch />
        </li>
        <li className="flex items-center gap-2">
          Steam Only
          <Switch />
        </li>
        <li>

        </li>
      </ul>
      <ul className="text-secondary">
        <li className="flex items-center gap-2">
          <h3>
            Location
          </h3>
          <LocationPicker />
        </li>
      </ul>
    </div>
    <div className="font-mono">
      <ServerFinder />
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
