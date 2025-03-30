import { Switch as SwitchPrimitive, SwitchThumb } from '@radix-ui/react-switch';
import { FC } from 'react';

interface SwitchProps {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    disabled?: boolean;
    id?: string;
}

export const Switch: FC<SwitchProps> = ({ checked, onCheckedChange, disabled = false, id }) => {
    return (
        <SwitchPrimitive
            checked={checked}
            onCheckedChange={onCheckedChange}
            disabled={disabled}
            id={id}
            className="relative h-[22px] w-[40px] cursor-pointer border border-accent bg-secondary outline-none 
                 focus:outline-accent data-[state=checked]:bg-accent
                 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <SwitchThumb
                className="block size-[18px] translate-x-0.5 bg-tertiary 
                             shadow-sm transition-transform duration-100 will-change-transform 
                             data-[state=checked]:translate-x-[18px] data-[state=checked]:bg-primary"
            />
        </SwitchPrimitive>
    );
};
