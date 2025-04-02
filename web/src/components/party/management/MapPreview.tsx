import { useRef } from 'react';

import { usePartySettings } from '@/api/party';

import { ServerMapModelInner } from './ServerFinder';

export const MapPreview = ({ party_id }: { party_id: string }) => {
    const { data: settings } = usePartySettings(party_id);

    console.log({
        msg: 'MapPreview',
        settings,
        party_id,
        map_id: settings?.location?.map_id,
    });
    const mapRef = useRef<L.Map | null>(null);

    return (
        <div className="card p-4 h-fit flex flex-col gap-2 w-full">
            {settings?.location?.map_id ? (
                <ServerMapModelInner
                    frozen={true}
                    mapId={settings.location.map_id}
                    partyId={party_id}
                    mapRef={mapRef}
                />
            ) : (
                <div className="text-secondary">No map selected</div>
            )}
        </div>
    );
};
