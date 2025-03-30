import { FC, ReactElement, ReactNode } from 'react';
import { LuInfo } from 'react-icons/lu';
import * as RadixTooltip from '@radix-ui/react-tooltip';

interface ToolTipProps {
    children: ReactNode;
    trigger?: ReactElement;
    /** Optional description for screen readers */
    ariaLabel?: string;
    /** Positioning of the tooltip */
    side?: 'top' | 'right' | 'bottom' | 'left';
    /** Alignment of the tooltip */
    align?: 'start' | 'center' | 'end';
}

export const Tooltip: FC<ToolTipProps> = ({
    children,
    trigger,
    ariaLabel = 'Information',
    side = 'top',
    align = 'center',
}) => {
    return (
        <RadixTooltip.Provider delayDuration={300}>
            <RadixTooltip.Root>
                <RadixTooltip.Trigger asChild>
                    <span>
                        {trigger ?? (
                            <button
                                type="button"
                                className="button size-[32px] mt-0.5"
                                aria-label={ariaLabel}
                            >
                                <LuInfo />
                            </button>
                        )}
                    </span>
                </RadixTooltip.Trigger>
                <RadixTooltip.Portal>
                    <RadixTooltip.Content
                        className="bg-secondary border border-secondary text-primary p-2 rounded-md max-w-sm z-50 text-sm text"
                        side={side}
                        align={align}
                        sideOffset={5}
                        aria-label={ariaLabel}
                        collisionPadding={10}
                    >
                        {children}
                        <RadixTooltip.Arrow className="fill-secondary" />
                    </RadixTooltip.Content>
                </RadixTooltip.Portal>
            </RadixTooltip.Root>
        </RadixTooltip.Provider>
    );
};
