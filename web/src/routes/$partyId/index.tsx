import { Dialog, DialogTrigger } from '@radix-ui/react-dialog';
import { createFileRoute } from '@tanstack/react-router';
import { FC, useState } from 'react';

import { useParty, usePartyJoin, usePartySettings } from '@/api/party';
import {
    CodeEntryMod,
    CodeListOrder,
    LoginModalContent,
    Modal,
    MusicRadio,
    PartyChat,
    PartyInviteCard,
    PartyMembers,
    PartyProgress,
    ServerFinder,
} from '@/components';
import { PartyStats } from '@/components/party/codes/PartyStats';
import { MapPreview } from '@/components/party/management/MapPreview';
import { PartySettings } from '@/components/party/management/PartySettings';
import { useAuth } from '@/hooks/auth';

export const Route = createFileRoute('/$partyId/')({
    component: RouteComponent,
});

function RouteComponent() {
    const { partyId } = Route.useParams();
    const { isAuthenticated } = useAuth();
    const { data: party, error, isLoading, refetch } = useParty(partyId);

    if (!isAuthenticated)
        return (
            <div>
                <Dialog open={true} onOpenChange={() => { }}>
                    <Modal size="medium">
                        <LoginModalContent />
                    </Modal>
                </Dialog>
            </div>
        );

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full p-4">
                Getting things ready...
            </div>
        );
    }

    if (error && (error as unknown as { status: number }).status === 403)
        return <CodeEntry partyId={partyId} onRefetch={refetch} />;

    if (party)
        return <PartyDashboard partyId={partyId} />;

    return (
        <div>
            other
        </div>
    );
}

const CodeEntry: FC<{ partyId: string, onRefetch: () => void }> = ({ partyId, onRefetch }) => {
    const { mutate: joinParty, isPending } = usePartyJoin();

    return (<div className="flex justify-center items-center h-full p-4">
        <div className="card w-fit min-w-[300px] md:mt-8 flex flex-col gap-2">
            <h1>Party Code Lock</h1>
            <p className="text-secondary">
                This party is locked. Please enter the party code to join.
            </p>
            <div className="flex gap-2 w-full">
                <input
                    placeholder="Party Code"
                    className="input grow"
                // value={code}
                // onChange={(e) => setCode(e.target.value)}
                />
                <button onClick={() => {
                    joinParty(partyId, {
                        onSuccess: () => {
                            onRefetch();
                        }
                    });
                }} className="button" disabled={isPending}>Join</button>
            </div>
        </div>
    </div>);
};

const SteamOnly: FC<{ partyId: string }> = ({ partyId }) => {
    return (<div className="flex justify-center items-center h-full p-4">
        <div className="card w-fit min-w-[300px] md:mt-8">
            <h1>Party Code Lock</h1>
            <p>
                This party is steam only. Please sign in using a steam account instead.
            </p>
        </div>
    </div>);
};

const PartyDashboard: FC<{ partyId: string }> = ({ partyId }) => {
    return (
        <div className="p-2 grid gap-2 grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(320px,1fr))] md:grid-flow-row-dense">
            <MapPreview party_id={partyId} />
            <div className="flex flex-col gap-2">
                <PartyInviteCard partyId={partyId} />
                <PartySettings party_id={partyId} />
            </div>
            <PartyStats party_id={partyId} />
            <CodeEntryMod party_id={partyId} />
            <MusicRadio />
            <PartyChat party_id={partyId} />
            <PartyMembers party_id={partyId} />
            <CodeListOrder party_id={partyId} />
            <PartyProgress party_id={partyId} />
        </div>
    );
};

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
