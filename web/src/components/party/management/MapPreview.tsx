import { useRef } from 'react';

import { usePartySettings } from '@/api/party';

import { ServerMapModelInner } from './ServerFinder';

export const MapPreview = ({ party_id }: { party_id: string }) => {
    const { data: settings } = usePartySettings(party_id);

    const mapRef = useRef<L.Map | null>(null);

    return (
        <div className="card p-4 h-full flex flex-col gap-2 w-full">
            <h3>Minimap</h3>
            {settings?.location?.map_id ? (
                <div className="aspect-square">
                    <ServerMapModelInner
                        parentClassName="aspect-square"
                        frozen={true}
                        mapId={settings.location.map_id}
                        partyId={party_id}
                        mapRef={mapRef}
                    />
                </div>
            ) : (
                <div className="text-secondary">No map selected</div>
            )}
        </div>
    );
};
