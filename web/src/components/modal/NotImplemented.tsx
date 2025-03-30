import { FC, PropsWithChildren } from 'react';
import { Modal } from './Modal';
import { Dialog, DialogTrigger } from '@radix-ui/react-dialog';

export const NotImplemented: FC<PropsWithChildren> = ({ children }) => {
    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <Modal>
                <h3 className="text-accent">This feature is not implemented yet.</h3>
                <p>Please check back soon!</p>
                <p className="text-secondary">
                    We are working hard to bring you new features and improvements over time.
                </p>
            </Modal>
        </Dialog>
    );
};
