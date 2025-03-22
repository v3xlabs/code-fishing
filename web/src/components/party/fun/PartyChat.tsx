import { Avatar } from "@/components/auth/Avatar";
import { Tooltip } from "@/components/helpers/Tooltip";
import { FC } from "react";

const messages = [
    {
        id: 'system',
        content: 'Welcome to the party chat!',
        avatar: '/system.png',
        createdAt: new Date(),
        sender: 'system',
    },
    // {
    //     id: 'system',
    //     content: 'Welcome to the party chat!',
    //     avatar: '/system.png',
    //     createdAt: new Date(),
    //     sender: 'system',
    // },
    // {
    //     id: 'system',
    //     content: 'Welcome to the party chat! Welcome to the party chat! Welcome to the party chat! Welcome to the party chat! Welcome to the party chat! Welcome to the party chat! Welcome to the party chat! Welcome to the party chat!',
    //     avatar: '/system.png',
    //     createdAt: new Date(),
    //     sender: 'system',
    // },
    // {
    //     id: 'system',
    //     content: 'Welcome to the party chat! Welcome to the party chat! Welcome to the party chat! Welcome to the party chat! Welcome to the party chat! Welcome to the party chat! Welcome to the party chat! Welcome to the party chat!',
    //     avatar: '/system.png',
    //     createdAt: new Date(),
    //     sender: 'system',
    // },
    // {
    //     id: 'system',
    //     content: 'Welcome to the party chat! Welcome to the party chat! Welcome to the party chat! Welcome to the party chat! Welcome to the party chat! Welcome to the party chat! Welcome to the party chat! Welcome to the party chat!',
    //     avatar: '/system.png',
    //     createdAt: new Date(),
    //     sender: 'system',
    // },
    // {
    //     id: 'system',
    //     content: 'Welcome to the party chat! Welcome to the party chat! Welcome to the party chat! Welcome to the party chat! Welcome to the party chat! Welcome to the party chat! Welcome to the party chat! Welcome to the party chat!',
    //     avatar: '/system.png',
    //     createdAt: new Date(),
    //     sender: 'system',
    // },
    // {
    //     id: 'system',
    //     content: 'Welcome to the party chat! Welcome to the party chat! Welcome to the party chat! Welcome to the party chat! Welcome to the party chat! Welcome to the party chat! Welcome to the party chat! Welcome to the party chat!',
    //     avatar: '/system.png',
    //     createdAt: new Date(),
    //     sender: 'system',
    // },
];

export const PartyChat: FC<{}> = () => {
    return (
        <div className="card md:col-span-2 space-y-2 text">
            <div className="flex gap-2 justify-between items-center">
                <h3>Party Chat</h3>
                <Tooltip>
                    <p>Hi</p>
                </Tooltip>
            </div>
            <div className="bg-primary w-full p-4 pt-1 min-h-[160px] max-h-[420px] overflow-y-auto">
                {messages.map((message) => (
                    <div key={message.id} className="flex flex-row items-baseline gap-1">
                        <div className="inline-flex translate-y-1/4 scale-[90%]">
                            <Avatar src={message.avatar} seed={message.sender} />
                        </div>
                        <div className="space-x-2">
                            <p className="text-secondary inline bold-text">{message.sender}</p>
                            <p className="break-words inline">{message.content}</p>
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex flex-row gap-2">
                <input type="text" className="flex-1 input" />
                <button className="button button-primary">Send</button>
            </div>
        </div>
    )
}
