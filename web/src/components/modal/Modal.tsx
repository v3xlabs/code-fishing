import { DialogClose, DialogContent, DialogOverlay, DialogPortal } from '@radix-ui/react-dialog';
import { FC, PropsWithChildren } from 'react';
import { LuPlus } from 'react-icons/lu';
import clsx from 'classnames';

export const Modal: FC<PropsWithChildren<{ size?: 'small' | 'medium' | 'large' | 'wide' }>> = ({ children, size = 'small' }) => {
  return (
    <DialogPortal>
      <DialogOverlay className="fixed inset-0 bg-tertiary/80 data-[state=open]:animate-overlayShow" />
      <DialogContent className={clsx(`fixed left-1/2 top-1/2 max-h-[85vh] w-[90vw] -translate-x-1/2 -translate-y-1/2 rounded-md bg-secondary p-[25px] shadow-md focus:outline-none data-[state=open]:animate-contentShow overflow-y-auto flex flex-col gap-4`,
        size === 'small' ? 'max-w-[500px]' : size === 'medium' ? 'max-w-[800px]' : size === 'large' ? 'max-w-[1000px]' : 'max-w-[90vw]'
      )}>
        {children}
        <DialogClose asChild>
          <button
            className="absolute right-2.5 top-2.5 inline-flex size-[25px] appearance-none items-center justify-center rounded-full button"
            aria-label="Close"
          >
            <LuPlus className="rotate-45 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" size={16} />
          </button>
        </DialogClose>
      </DialogContent>
    </DialogPortal>
  );
};
