import { useAuth } from "@/hooks/auth";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@radix-ui/react-dialog";
import { Link } from "@tanstack/react-router";
import { FC } from "react";
import { Modal } from "./modal/Modal";
import { FaSteam } from "react-icons/fa";
import { BsMusicNoteBeamed } from "react-icons/bs";
import { useGuestAuth, useUser } from "@/api/auth";
import { Avatar } from "./auth/Avatar";
import { LuLogOut } from "react-icons/lu";
import { toast } from "sonner";
import { baseUrl } from "@/api/api";

export const Navbar = () => {
    return (
        <>
            <div className="w-full bg-primary fixed sm:relative flex justify-between items-center">
                <div className="flex items-stretch gap-2 h-full">
                    <div className="px-1 max-h-full min-w-2 flex items-center gap-2 bg-secondary">
                        <div className="size-8 rounded-md">
                            <img src="/lock.code.png" alt="lock.code" className="w-full h-full object-contain" />
                        </div>
                    </div>
                    <Link to="/" className="text-accent text-base hover:underline py-2 block">
                        <span>code</span>
                        <span className="text-secondary">.</span>
                        <span>fishing</span>
                    </Link>
                </div>
                <div className="flex items-center h-full">
                    <Link to="/radio" className="flex items-center gap-1 px-3 py-2 hover:bg-secondary transition-colors">
                        <BsMusicNoteBeamed className="size-4" />
                        <span className="hidden sm:block">Radio</span>
                    </Link>
                </div>
                <div className="flex items-center h-full gap-2 flex-1 justify-end">
                    <UserProfile />
                </div>
            </div>
            <div className="h-12 w-full sm:hidden" />
        </>
    )
};

export const UserProfile: FC<{}> = () => {
    const { isAuthenticated, logout } = useAuth();
    const { data: user } = useUser();

    if (!isAuthenticated) {
        return (
            <LoginModal />
        );
    }

    return (
        <div className="flex items-center gap-1 text-ellipsis overflow-hidden">
            <div className="flex items-center gap-1">
                <Avatar src={user?.avatar_url} seed={user?.user_id} />
                <span className="break-words block overflow-hidden text-ellipsis whitespace-nowrap">{user?.name}</span>
            </div>
            <button className="button flex items-center gap-1" onClick={logout}>
                <LuLogOut className="size-4" />
                <span className="hidden sm:block">Logout</span>
            </button>
        </div>
    );
};

export const LoginModal: FC<{}> = () => {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <button className="button">
                    <span>Login</span>
                </button>
            </DialogTrigger>
            <Modal size="medium">
                <LoginModalContent />
            </Modal>
        </Dialog>
    )
}

export const LoginModalContent: FC<{}> = () => {
    const { login } = useAuth();
    const { mutate: guestAuth } = useGuestAuth({
        onSuccess: (data) => {
            login(data.token, data.user);
            toast.success("Logged in as guest");
        }
    });

    return (
        <div className="flex flex-wrap gap-4">
            <div className="flex flex-col gap-2 sm:w-[calc(50%-1rem)]">
                <h2>Sign in as Guest</h2>
                <p className="text-secondary">Click here to continue as an anonymous user.</p>
                <DialogClose asChild>
                    <button className="button" onClick={() => guestAuth(undefined, undefined)}>
                        <span>Continue as Guest</span>
                    </button>
                </DialogClose>
            </div>
            <div className="flex flex-col gap-2 sm:w-[calc(50%-1rem)]">
                <h2>Sign in with Steam</h2>
                <p className="text-secondary">Click here to sign in with your Steam account.</p>
                <a href={`${baseUrl}auth/oauth/steam`} className="button flex items-center justify-center gap-2">
                    <FaSteam className="size-4" />
                    <span>Sign in with Steam</span>
                </a>
            </div>
        </div>
    )
}
