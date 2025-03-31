import { FC } from 'react';

import { usePartySettings } from '@/api/party';
import { Switch } from '@/components';
import { LocationPicker } from '@/routes/$partyId';

import { PartyMembers } from './members/PartyMembers';

export const PartySettings: FC<{party_id: string}> = ({ party_id }) => {
    const { data: settings, update } = usePartySettings(party_id);

    return (
        <div className="flex flex-col gap-2 w-full text">
                <div className="card p-4 h-fit flex flex-col gap-2 w-full">
                    <h3 className="">Settings</h3>
                    <ul className="text-secondary w-full">
                        <li className="flex items-center justify-between gap-2">
                            Private Party
                            <Switch
                                checked={settings?.private}
                                onCheckedChange={(val) => {
                                    update('private', val);
                                }}
                            />
                        </li>
                        <li className="flex items-center justify-between gap-2">
                            Steam Only
                            <Switch
                                checked={settings?.steam_only}
                                onCheckedChange={(val) => {
                                    update('steam_only', val);
                                }}
                            />
                        </li>
                    </ul>
                    <ul className="text-secondary w-full">
                        <li className="flex items-center justify-between gap-2">
                            <h3>Location</h3>
                            <LocationPicker />
                        </li>
                    </ul>
            </div>
            <PartyMembers party_id={party_id} />
        </div>
    );
};
