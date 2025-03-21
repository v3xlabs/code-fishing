import { Switch } from '@/components/input/Switch';
import { Modal } from '@/components/modal/Modal';
import { MusicRadio } from '@/components/party/fun/MusicRadio';
import { CodeEntryMod } from '@/components/party/codes/CodeEntryMod';
import { CodeListOrder } from '@/components/party/codes/CodeListOrder';
import { PartyProgress } from '@/components/party/codes/PartyProgress';
import { PartyInviteCard } from '@/components/party/management/PartyInvite';
import { ServerFinder } from '@/components/party/management/ServerFinder';
import { PartyMembers } from '@/components/party/PartyMembers';
import { Dialog, DialogContent, DialogTrigger } from '@radix-ui/react-dialog';
import { createFileRoute, useParams } from '@tanstack/react-router'
import { PartyChat } from '@/components/party/fun/PartyChat';

export const Route = createFileRoute('/$partyId/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { partyId } = Route.useParams();

  // auto columns 300w min
  return (<div className="p-2 grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(321px, 1fr))' }}>
    <PartyInviteCard partyId={partyId} />
    <div className="flex flex-col gap-2 w-full text">
      <div className="card p-4 h-fit flex flex-col gap-2 w-full">
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
    <CodeListOrder />
    <MusicRadio />
    <CodeEntryMod />
    <PartyChat />
    <PartyProgress />
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
