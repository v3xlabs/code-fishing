import { FC, useState } from 'react';
import { LuArrowBigRight, LuCheck } from 'react-icons/lu';

import { usePartyEventSubmit } from '@/api/party';
import { usePartyCursor } from '@/api/party/cursor';
import { NotImplemented, Tooltip } from '@/components';

export const CodeEntryMod: FC<{ party_id: string }> = ({ party_id }) => {
    const [codeCount, setCodeCount] = useState(5);
    const { codes } = usePartyCursor(party_id);

    return (
        <div className="card w-full flex flex-col gap-2 !pb-2" style={{ gridColumnEnd: '-1' }}>
            <div className="flex items-center justify-between">
                <h3 className="text-primary text">Code Entry (WIP)</h3>
                <div className="flex items-center gap-1">
                    <input
                        type="number"
                        className="input grow-0 w-fit"
                        min={1}
                        max={10}
                        value={codeCount}
                        onChange={(e) => setCodeCount(parseInt(e.target.value))}
                    />
                    <Tooltip>
                        <p>This is a work in progress.</p>
                        <br />
                        <p>
                            You will mark codes as done here, and select how many you want to view
                            at a time.
                        </p>
                    </Tooltip>
                </div>
            </div>
            <div className="w-full -mx-4 px-4 box-content bg-primary py-2 grow">
                <ul className="space-y-1">
                    {codes.map((code) => (
                        <IndividualCodeEntry key={code} code={code} party_id={party_id} />
                    ))}
                </ul>
            </div>
            {codes.length > 1 && (
                <div className="w-full flex gap-1 justify-end">
                    <NotImplemented>
                        <button className="button flex items-center gap-1">
                            Next
                            <LuCheck />
                        </button>
                    </NotImplemented>
                    <NotImplemented>
                        <button className="button flex items-center gap-1 button-rust">
                            Skip
                            <LuArrowBigRight />
                        </button>
                    </NotImplemented>
                </div>
            )}
        </div>
    );
};

const IndividualCodeEntry: FC<{ code: string; party_id: string }> = ({ code, party_id }) => {
    const { mutate: submitCode } = usePartyEventSubmit(party_id);

    return (
        <li key={code} className="flex items-center justify-between">
            <div className="flex gap-0.5 items-center">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div
                        key={i}
                        className="bg-tertiary px-1 py-0.5 flex gap-0.5 rounded-sm"
                    >
                        <p className="text-primary">{code.toString()[i]}</p>
                    </div>
                ))}
            </div>
            <div className="bg-secondary px-0.5 py-0.5 flex gap-0.5 rounded-md">
                    <button className="button" onClick={() => {
                        submitCode({
                            type: 'PartyCodesSubmitted',
                            codes: [code],
                            // TODO: figure out if duplicate (cuz event automatically has author id)
                            user_id: 'deprecated value',
                        });
                    }}>
                        <LuCheck />
                    </button>
                <NotImplemented>
                    <button className="button">
                        <LuArrowBigRight />
                    </button>
                </NotImplemented>
            </div>
        </li>
    );
};
