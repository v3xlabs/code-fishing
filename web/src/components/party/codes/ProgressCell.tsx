import cx from 'classnames';
import { FC } from 'react';

import { PartyEvent } from '@/api/party/events';
import { backgroundColorBySeed } from '@/util/user';

export const ProgressCell: FC<{
    code: string;
    triedCodes: Map<string, PartyEvent[]>;
    visibleCodes: Map<string, string[]>;
}> = ({ code, triedCodes, visibleCodes }) => {
    // Visible codes key is user_id, value is an array of codes. Find first user_id that has this code
    const userId = Array.from(visibleCodes.entries()).find(([_, codes]) =>
        codes.includes(code)
    )?.[0];

    return (
        <div
            className={cx(
                'flex justify-center items-center w-full h-full rounded-sm text-[0.8rem]',
                triedCodes.has(code) ? 'bg-tertiary text-white' : 'bg-tertiary text-secondary'
            )}
            style={{
                ...(triedCodes.has(code)
                    ? {
                          backgroundColor: backgroundColorBySeed(
                              (triedCodes.get(code) || [])[0]?.user_id,
                              {
                                  saturation: 25,
                                  lightness: 40,
                              }
                          ),
                      }
                    : {}),
                ...(userId
                    ? {
                          borderBottom: `2px solid ${backgroundColorBySeed(userId)}`,
                      }
                    : {}),
            }}
        >
            <div
                style={
                    triedCodes.has(code)
                        ? {
                              backgroundColor: backgroundColorBySeed(
                                  (triedCodes.get(code) || [])[0]?.user_id,
                                  {
                                      saturation: 25,
                                      lightness: 40,
                                  }
                              ),
                              borderRadius: '2px',
                          }
                        : {}
                }
            >
                {code}
            </div>
        </div>
    );
};
