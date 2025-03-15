export const Navbar = () => {
    return (
        <div className="w-full bg-primary px-2 py-1 mb-1">
            <div className="flex items-center gap-2">
                <div className="size-7 bg-primary rounded-md">
                    <img src="/lock.code.png" alt="lock.code" className="w-full h-full object-contain" />
                </div>
                <a href="#" className="text-accent text-sm hover:underline">
                    <span>code</span>
                    <span className="text-secondary">.</span>
                    <span>fishing</span>
                </a>
            </div>
        </div>
    )
};
