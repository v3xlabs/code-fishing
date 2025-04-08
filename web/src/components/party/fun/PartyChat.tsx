import { FC, useEffect,useRef, useState } from 'react';

import { useUserById } from '@/api/auth';
import { usePartyEvents } from '@/api/party';
import { PartyEvent, usePartyEventSubmit } from '@/api/party/events';
import { Avatar } from '@/components/auth/Avatar';
import { Tooltip } from '@/components/helpers/Tooltip';

export const PartyChat: FC<{ party_id: string }> = ({ party_id }) => {
    const { mutate: submitEvent } = usePartyEventSubmit(party_id);
    const { events } = usePartyEvents(party_id, (event) => event.data.type == 'PartyChatMessage');
    const messageInputRef = useRef<HTMLInputElement>(null);
    const chatWindowRef = useRef<HTMLDivElement>(null);
    const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);

    const messages = events;

    // Check if user is at bottom when messages change
    useEffect(() => {
        if (chatWindowRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = chatWindowRef.current;
            // Consider "at bottom" if within 10px of the bottom
            const isAtBottom = scrollHeight - scrollTop - clientHeight < 10;

            setShouldScrollToBottom(isAtBottom);
        }
    }, [messages]);

    // Scroll to bottom when needed
    useEffect(() => {
        if (shouldScrollToBottom && chatWindowRef.current) {
            chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
        }
    }, [shouldScrollToBottom, messages]);

    // Add scroll event listener to update shouldScrollToBottom
    useEffect(() => {
        const chatWindow = chatWindowRef.current;

        if (!chatWindow) return;

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = chatWindow;
            const isAtBottom = scrollHeight - scrollTop - clientHeight < 10;

            setShouldScrollToBottom(isAtBottom);
        };

        chatWindow.addEventListener('scroll', handleScroll);

        return () => chatWindow.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="card md:col-span-2 space-y-2 text flex flex-col">
            <div className="flex gap-2 justify-between items-center">
                <h3>Party Chat</h3>
                <Tooltip>
                    <p>Hi</p>
                </Tooltip>
            </div>
            <div
                className="bg-primary w-full p-4 min-h-[160px] max-h-[420px] overflow-y-auto grow"
                ref={chatWindowRef}
            >
                <div className="flex flex-row items-center gap-1">
                    <div className="inline-flex scale-[90%]">
                        <Avatar src={'/system.png'} seed={'system'} />
                    </div>
                    <div className="space-x-2">
                        <p className="text-secondary inline bold-text">System</p>
                        <p className="break-words inline">Welcome to the party chat!</p>
                    </div>
                </div>
                {messages.map((message) => (
                    <PartyChatMessage key={message.event_id} message={message} />
                ))}
            </div>
            <div className="flex flex-row gap-2">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        const message = messageInputRef.current?.value.trim() ?? '';

                        if (message == '') {
                            return;
                        }

                        submitEvent({
                            type: 'PartyChatMessage',
                            message,
                        });

                        if (messageInputRef.current) {
                            messageInputRef.current.value = '';
                        }
                    }}
                    className="w-full flex flex-row gap-2"
                >
                    <input type="text" className="flex-1 input" ref={messageInputRef} />
                    <button className="button button-primary" type="submit">
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
};

export const PartyChatMessage: FC<{ message: PartyEvent }> = ({ message }) => {
    const messageData = message.data.type == 'PartyChatMessage' ? message.data.message : null;
    const { data: user } = useUserById(message.user_id);

    return (
        <div key={message.event_id} className="flex flex-row items-center gap-1">
            <div className="inline-flex scale-[90%]">
                <Avatar src={user?.avatar_url ?? ''} seed={message.user_id} />
            </div>
            <div className="space-x-2">
                <p className="text-secondary inline bold-text">{user?.name ?? message.user_id}</p>
                {messageData && <p className="break-words inline">{messageData}</p>}
            </div>
        </div>
    );
};
