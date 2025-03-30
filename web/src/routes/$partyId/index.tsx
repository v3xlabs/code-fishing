import { Dialog, DialogTrigger } from '@radix-ui/react-dialog';
import { createFileRoute } from '@tanstack/react-router';

import { CodeEntryMod, CodeListOrder, Modal, MusicRadio, PartyChat, PartyInviteCard, PartyMembers, PartyProgress, ServerFinder, Switch } from '@/components';

export const Route = createFileRoute('/$partyId/')({
    component: RouteComponent,
});

function RouteComponent() {
    const { partyId } = Route.useParams();

    // auto columns 300w min
    return (
        <div className="p-2 grid gap-2 grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(320px,1fr))] md:grid-flow-row-dense">
            <PartyInviteCard partyId={partyId} />
            <div className="flex flex-col gap-2 w-full text">
                <div className="card p-4 h-fit flex flex-col gap-2 w-full">
                    <h3 className="">Settings</h3>
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
                            <h3>Location</h3>
                            <LocationPicker />
                        </li>
                    </ul>
                </div>
                <PartyMembers party_id={partyId} />
            </div>
            <CodeListOrder party_id={partyId} />
            <CodeEntryMod />
            <PartyChat party_id={partyId} />
            <MusicRadio />
            <PartyProgress party_id={partyId} />
        </div>
    );
}

export const LocationPicker = () => {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <button className="button">Not Set</button>
            </DialogTrigger>
            <Modal size="medium">
                <h3>Select Server</h3>
                <ServerFinder />
            </Modal>
        </Dialog>
    );
};
