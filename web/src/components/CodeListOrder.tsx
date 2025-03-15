import { LISTS } from "@/util/lists";
import { CodeList } from "@/util/lists";
import { useState } from "react";

export const CodeListOrder = () => {
    const [list, setList] = useState<CodeList[]>(LISTS);

    return (
        <div className="card">
            {list.map((item) => (
                <div key={item.name} className="flex justify-between">
                    <span>{item.name}</span>
                    <span>{item.codes.length}</span>
                </div>
            ))}
        </div>
    )
};
