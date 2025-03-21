import { FC } from "react";
import { LuType } from "react-icons/lu";
import { useApp } from "@/hooks/context";

export const FontSwitch: FC = () => {
    const { toggleFont } = useApp();

    return (
        <>
            <button className="button h-full" onClick={toggleFont}>
                <LuType />
            </button>
        </>
    )
};
