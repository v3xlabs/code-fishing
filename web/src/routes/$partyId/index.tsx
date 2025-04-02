import { Dialog, DialogTrigger } from '@radix-ui/react-dialog';
import { createFileRoute } from '@tanstack/react-router';

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
import { MapPreview } from '@/components/party/management/MapPreview';
import { PartySettings } from '@/components/party/management/PartySettings';
import { usePartySettings } from '@/api/party';
import { useState } from 'react';

export const Route = createFileRoute('/$partyId/')({
    component: RouteComponent,
});

function RouteComponent() {
    const { partyId } = Route.useParams();

    // auto columns 300w min
    return (
        <div className="p-2 grid gap-2 grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(320px,1fr))] md:grid-flow-row-dense">
            <PartyInviteCard partyId={partyId} />
            <PartySettings party_id={partyId} />
            <MapPreview party_id={partyId} />
            <CodeListOrder party_id={partyId} />
            <CodeEntryMod />
            <PartyChat party_id={partyId} />
            <MusicRadio />
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
