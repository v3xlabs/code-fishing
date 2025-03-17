import { Link } from "@tanstack/react-router";

export const Navbar = () => {
    return (
        <>
        <div className="w-full bg-primary fixed sm:relative">
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
            </div>
            <div className="h-12 w-full sm:hidden" />
        </>
    )
};
