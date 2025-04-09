import { FC } from 'react';

import { useUserById } from '@/api/auth';
import { usePartyEvents } from '@/api/party';

import { Avatar } from '../../../auth/Avatar';
import { PartyMemberPreview } from './PartyMemberPreview';

export const PartyMembers = ({ party_id }: { party_id: string }) => {
    const { events } = usePartyEvents(party_id, (event) => event.data.type === 'PartyJoinLeave');

    const members = new Set(
        events.map((event) => event.user_id).filter(Boolean)
    );

    return (
        <div className="flex flex-col gap-2 card w-full h-full text no-padding">
            <div className="flex items-center justify-between p-4 pb-0">
                <h3>Members</h3>
                <span className="text-secondary">{members.size}</span>
            </div>
            <ul className="px-2 pb-2 max-h-[420px] overflow-y-auto">
                {Array.from(members).map((member) => (
                    <li key={member}>
                        <PartyMember user_id={member} />
                    </li>
                ))}
            </ul>
        </div>
    );
};

export const PartyMember: FC<{ user_id: string }> = ({ user_id }) => {
    const { data: user } = useUserById(user_id);

    return (
        <PartyMemberPreview member={user}>
            <button className="flex items-center gap-2 hover:bg-primary w-full p-2 rounded-md">
                <Avatar src={user?.avatar_url} seed={user?.user_id} />
                <span>{user?.name}</span>
            </button>
        </PartyMemberPreview>
    );
};
