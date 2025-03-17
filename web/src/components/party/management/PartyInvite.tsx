import { FC, useState } from "react"
import { LuEye, LuEyeOff } from "react-icons/lu";
import { QRCodeSVG } from 'qrcode.react';
export const PartyInviteCard: FC<{ partyId: string }> = ({ partyId }) => {
    const [hidden, setHidden] = useState(true);

    return (<div className="card flex flex-col gap-2 max-w-sm">
        <h2>Party Invite</h2>
        <p className="text-secondary">Share this link with your friends to invite them to the party.</p>
        <div className="flex justify-center gap-2 flex-col items-center">
            <QRCode value={`${window.location.origin}/party/${partyId}`} hidden={hidden} />
            <div className="text-secondary">
                Party Code: <span className="inline-flex font-bold bg-tertiary px-2 py-1">{hidden ? '*'.repeat(partyId.length) : partyId}</span>
            </div>
        </div>
        <div className="flex gap-2 w-full flex-wrap justify-between">
            <input type={hidden ? 'password' : 'text'} className="input flex-1" value={`${window.location.origin}/party/${partyId}`} disabled />
            <button className="button" onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/party/${partyId}`);
            }}>Copy</button>
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
