// Given a list of codes, return a list of codes but only the first unique ones,

import { MATHS_SEQUENCES } from "@/lists/math";
import { RANDOM_BIRTHYEARS } from "@/lists/random";
import { RUSTTIPS_10000 } from "@/lists/rusttips";

// the order should be the same as the original list
export const setifyList = (list: string[]) => {
    const uniqueList: string[] = [];
    for (const code of list) {
        if (!uniqueList.includes(code)) {
            uniqueList.push(code);
        }
    }
    return uniqueList;
};

export type CodeList = {
    name: string;
    source?: string;
    codes: string[];
}

export const LISTS: CodeList[] = [
    MATHS_SEQUENCES,
    RANDOM_BIRTHYEARS,
    RUSTTIPS_10000
];