import { Dialog, DialogTrigger } from '@radix-ui/react-dialog';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

import { usePartySettings } from '@/api/party';
import {
    CodeEntryMod,
    CodeListOrder,
    Modal,
    MusicRadio,
    PartyChat,
    PartyInviteCard,
    PartyProgress,
    ServerFinder,
} from '@/components';
import { PartyStats } from '@/components/party/codes/PartyStats';
import { MapPreview } from '@/components/party/management/MapPreview';
import { PartySettings } from '@/components/party/management/PartySettings';

export const Route = createFileRoute('/$partyId/')({
    component: RouteComponent,
});

function RouteComponent() {
    const { partyId } = Route.useParams();

    console.log('route');

    // auto columns 300w min
    return (
        <div className="p-2 grid gap-2 grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(320px,1fr))] md:grid-flow-row-dense">
            <MapPreview party_id={partyId} />
            <PartyInviteCard partyId={partyId} />
            <PartySettings party_id={partyId} />
            <PartyStats party_id={partyId} />
            <CodeEntryMod party_id={partyId} />
            <PartyChat party_id={partyId} />
            <MusicRadio />
            <CodeListOrder party_id={partyId} />
            <PartyProgress party_id={partyId} />
        </div>
    );
}

export const LocationPicker = ({ partyId }: { partyId: string }) => {
    const { data: settings } = usePartySettings(partyId);
    const [modalOpen, setModalOpen] = useState(false);

    return (
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogTrigger asChild>
                <button className="button">
                    {settings.location ? 'Reconfigure' : 'Configure'}
                </button>
            </DialogTrigger>
            <Modal size="medium">
                <h3>Select Server</h3>
                <ServerFinder
                    partyId={partyId}
                    finished={() => {
                        setModalOpen(false);
                    }}
                />
            </Modal>
        </Dialog>
    );
};
