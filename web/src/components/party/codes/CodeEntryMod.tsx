import { NotImplemented } from "@/components/modal/NotImplemented";
import { FC, useMemo, useState } from "react";
import { LuArrowBigLeft, LuArrowBigRight, LuCheck, LuSquareX } from "react-icons/lu";
import { ToolTip } from "@/components/helpers/ToolTip";
import { LISTS, setifyList } from "@/util/lists";

export const CodeEntryMod: FC<{}> = () => {
    const [codeCount, setCodeCount] = useState(5);
    const codes = useMemo(() => setifyList(LISTS.flatMap((list) => list.codes)), []);
    const results = codes.slice(0, codeCount);

    return (
        <div className="card w-full flex flex-col gap-2 !pb-2" style={{ gridColumnEnd: '-1' }}>
            <div className="flex items-center justify-between">
                <h3 className="text-primary text">Code Entry (WIP)</h3>
                <div className="flex items-center gap-1">
                    <input type="number" className="input grow-0 w-fit" min={1} max={10} value={codeCount} onChange={(e) => setCodeCount(parseInt(e.target.value))} />
                    <ToolTip>
                        <p>This is a work in progress.</p>
                        <br />
                        <p>You will mark codes as done here, and select how many you want to view at a time.</p>
                    </ToolTip>
                </div>
            </div>
            <div className="w-full -mx-4 px-4 box-content bg-primary py-2 grow">
                <ul className="space-y-1">
                    {
                        results.map((code) => (
                            <li key={code} className="flex items-center justify-between">
                                <div className="flex gap-0.5 items-center">
                                    {
                                        Array.from({ length: 4 }).map((_, i) => (
                                            <div key={i} className="bg-tertiary px-1 py-0.5 flex gap-0.5 rounded-sm">
                                                <p className="text-primary">{code.toString()[i]}</p>
                                            </div>
                                        ))
                                    }
                                </div>
                                <div className="bg-secondary px-0.5 py-0.5 flex gap-0.5 rounded-md">
                                    <NotImplemented>
                                        <button className="button">
                                            <LuCheck />
                                        </button>
                                    </NotImplemented>
                                    <NotImplemented>
                                        <button className="button">
                                        <LuArrowBigRight />
                                        </button>
                                    </NotImplemented>
                                </div>
                            </li>
                        ))
                    }
                </ul>
            </div>
            {
                results.length > 1 && (
                    <div className="w-full flex gap-1 justify-end">
                        <NotImplemented>
                            <button className="button flex items-center gap-1">
                                Next
                                <LuCheck />
                            </button>
                        </NotImplemented>
                        <NotImplemented>
                            <button className="button flex items-center gap-1 button-rust">
                                Skip
                                <LuArrowBigRight />
                            </button>
                        </NotImplemented>
                    </div>
                )
            }
        </div>
    );
};
