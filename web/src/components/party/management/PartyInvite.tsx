import { FC, useState } from "react"
import { LuClipboard, LuClipboardList, LuEye, LuEyeOff, LuClipboardX } from "react-icons/lu";
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';

const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
        // Try the modern Clipboard API first
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return true;
        }

        // Fallback for older browsers or non-HTTPS
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            document.execCommand('copy');
            textArea.remove();
            return true;
        } catch (err) {
            textArea.remove();
            return false;
        }
    } catch (err) {
        return false;
    }
};

const handleCopy = async (partyId: string) => {
    const success = await copyToClipboard(partyId);

    if (success) {
        toast(<div className="flex gap-2 items-center">
            <LuClipboardList className="text-secondary" />
            <p className="text-secondary">Copied to clipboard</p>
        </div>);
    } else {
        toast(<div className="flex gap-2 items-center">
            <LuClipboardX className="text-red-500" />
            <p className="text-secondary">Failed to copy. Please try selecting and copying manually.</p>
        </div>, {
            duration: 5000
        });
    }
};

export const PartyInviteCard: FC<{ partyId: string }> = ({ partyId }) => {
    const [hidden, setHidden] = useState(true);

    return (<div className="card flex flex-col gap-2 max-w-full w-full">
        <h2>Party Invite</h2>
        <p className="text-secondary">Share this link with your friends to invite them to the party.</p>
        <div className="flex justify-center gap-2 flex-col items-center">
            <QRCode value={`${window.location.origin}/${partyId}`} hidden={hidden} />
            <div className="text-secondary">
                Party Code: <span className="inline-flex font-bold bg-tertiary px-2 py-1">{hidden ? '*'.repeat(partyId.length) : partyId}</span>
            </div>
        </div>
        <div className="flex gap-2 w-full flex-wrap justify-between">
            <input type={hidden ? 'password' : 'text'} className="input flex-1 sm:w-[240px]" value={`${window.location.origin}/${partyId}`} disabled />
            <button className="button flex-1 inline-flex items-center justify-center gap-2" onClick={() => handleCopy(partyId)}>
                <LuClipboard />
                Copy
            </button>
        </div>
        <button className="button flex gap-2 items-center" onClick={() => setHidden(!hidden)}>
            {hidden ? <><LuEye /> Show</> : <><LuEyeOff /> Hide</>}
        </button>
    </div>);
}

const QRCode: FC<{ value: string, hidden: boolean }> = ({ value, hidden }) => {
    return <div className="bg-tertiary p-2 rounded-md">
        <div className="w-full h-full bg-secondary rounded-md">
            {
                hidden ? <div className="w-32 h-32 bg-tertiary rounded-md flex items-center justify-center gap-2">
                    <LuEyeOff className="text-secondary" />
                    <p className="text-secondary">Hidden</p>
                </div> :
                    <QRCodeSVG value={value} size={128} bgColor="#2d2b29" fgColor="#F5F5F5" />
            }
        </div>
    </div>
};
