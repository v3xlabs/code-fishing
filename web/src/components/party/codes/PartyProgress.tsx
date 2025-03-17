import { LISTS, setifyList } from '@/util/lists';
import cx from 'classnames';

export const PartyProgress = () => {
    const codes = setifyList(LISTS.flatMap(list => list.codes));

    const progress = 10;
    return (
        <div className="card">
            <div className="max-h-[300px] overflow-y-auto">
                <div className="w-full flex flex-wrap gap-0.5 font-bold">
                    {
                        codes.map((code, index) => (
                            <div key={index} className="w-6 h-6 bg-secondary rounded-sm">
                                <div className={cx("flex justify-center items-center w-full h-full rounded-sm text-[0.5rem]", index < progress ? 'bg-accent  text-primary' : 'bg-tertiary text-secondary')}>
                                    {code}
                                </div>
                            </div>
                        ))
                    }
                </div>
            </div>
        </div>
    )
}
