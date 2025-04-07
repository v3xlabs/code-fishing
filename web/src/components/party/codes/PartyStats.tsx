import { FC } from 'react';

import { usePartyProgress } from '@/api/progress';

export const PartyStats: FC<{ party_id: string }> = ({ party_id }) => {
    const { percentages, triedCodes } = usePartyProgress(party_id);

    return (
        <div className="card w-full flex flex-col gap-2 !pb-2" style={{ gridColumnEnd: '-2' }}>
            <h3 className="text-primary text">Stats</h3>
            <div className="flex gap-1 flex-col grow">
                <div className="flex items-center justify-between">
                    <span>
                        Total
                    </span>
                    <span>
                        {percentages}%
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <span>
                        Codes tried
                    </span>
                    <span>{triedCodes.size}</span>
                </div>
            </div>
            <div className="w-full h-4 bg-primary rounded-md border border-secondary overflow-hidden mb-2">
                <div className="h-full bg-accent" style={{ width: `${percentages}%` }}>

                </div>
            </div>
        </div>

    );
};