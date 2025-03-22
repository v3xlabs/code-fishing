import { User, useUser } from "@/api/auth";
import { FC } from "react";
import { Avatar } from "../../../auth/Avatar";
import { PartyMemberPreview } from "./PartyMemberPreview";

export const PartyMembers = () => {
    const { data: user } = useUser();
    const members: User[] = [];

    return <div className="flex flex-col gap-2 card w-full h-full text no-padding">
        <div className="flex items-center justify-between p-4 pb-0">
            <h3>Members</h3>
            <span className="text-secondary">
                {members.length + 1}
            </span>
        </div>
        <ul className="px-2 pb-2">
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
    return (
        <PartyMemberPreview member={member}>
            <button className="flex items-center gap-2 hover:bg-primary w-full p-2 rounded-md">
                <Avatar src={member.avatar_url} seed={member.user_id} />
                <span>{member.name}</span>
            </button>
        </PartyMemberPreview>
    );
};
