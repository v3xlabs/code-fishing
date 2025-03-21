import { User, useUser } from "@/api/auth";
import { FC } from "react";
import { Avatar } from "../auth/Avatar";

export const PartyMembers = () => {
    const { data: user } = useUser();
    const members: User[] = [];

    return <div className="flex flex-col gap-2 card w-full h-full text">
        <div className="flex items-center justify-between">
            <h3>Members</h3>
            <span className="text-secondary">
                {members.length + 1}
            </span>
        </div>
        <ul>
            {
                [user, ...members].filter(Boolean).map((member) => (
                    <li key={member!.user_id}>
                        <PartyMember member={member!} />
                    </li>
                ))
            }
        </ul>
    </div>;
};

export const PartyMember: FC<{ member: User }> = ({ member }) => {
    return (<div className="flex items-center gap-2">
        <Avatar src={member.avatar_url} seed={member.user_id} />
        <span>{member.name}</span>
    </div>);
};
