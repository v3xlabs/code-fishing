import { useVirtualizer } from '@tanstack/react-virtual';
import cx from 'classnames';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { PartyEvent } from '@/api/party/events';
import { usePartyCodes, usePartyProgress } from '@/api/progress';
import { Tooltip } from '@/components/helpers/Tooltip';

export const PartyProgress: FC<{ party_id: string }> = ({ party_id }) => {
    const { data: orderedCodes } = usePartyCodes(party_id);
    const { triedCodes, percentages } = usePartyProgress(party_id);

    const codes = orderedCodes;

    return (
        <>
            <PartyProgressList party_id={party_id} orderedCodes={orderedCodes} triedCodes={triedCodes} percentages={percentages} codes={codes} />
        </>
    );
};

export const PartyProgressList: FC<{
    party_id: string,
    orderedCodes: string[],
    triedCodes: Map<string, PartyEvent[]>,
    percentages: Map<string, number>,
    codes: string[]
}> = ({ party_id, orderedCodes, triedCodes, percentages, codes }) => {

    const parentRef = useRef<HTMLDivElement>(null);

    // Constants for item sizing
    const ITEM_WIDTH = 64;
    const ITEM_HEIGHT = 24;
    const ITEM_GAP = 2;
    const CELL_SIZE = ITEM_WIDTH + ITEM_GAP;

    // State for container dimensions
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

    // Calculate columns based on container width - memoize to prevent recalculation
    const columnCount = useMemo(
        () => Math.max(1, Math.floor(containerSize.width / CELL_SIZE)),
        [containerSize.width, CELL_SIZE]
    );

    // Calculate the total number of rows needed - memoize to prevent recalculation
    const rowCount = useMemo(
        () => Math.ceil(codes.length / columnCount),
        [codes.length, columnCount]
    );

    // Resize observer callback
    const observerCallback = useCallback(() => {
        if (parentRef.current) {
            const width = parentRef.current.clientWidth;
            const height = parentRef.current.clientHeight;

            setContainerSize({ width, height });
        }
    }, []);

    // Set up resize observer
    useEffect(() => {
        if (!parentRef.current) return;

        observerCallback();

        // Use ResizeObserver for more efficient resize detection
        const resizeObserver = new ResizeObserver(observerCallback);

        resizeObserver.observe(parentRef.current);

        return () => {
            if (parentRef.current) {
                resizeObserver.unobserve(parentRef.current);
            }

            resizeObserver.disconnect();
        };
    }, [observerCallback]);

    // Create a virtualizer for rows
    const rowVirtualizer = useVirtualizer({
        count: rowCount,
        getScrollElement: () => parentRef.current,
        estimateSize: () => ITEM_HEIGHT + ITEM_GAP,
        overscan: 5,
    });

    // Create a virtualizer for columns
    const columnVirtualizer = useVirtualizer({
        count: columnCount,
        getScrollElement: () => parentRef.current,
        horizontal: true,
        estimateSize: () => ITEM_WIDTH + ITEM_GAP, // Make sure this uses the updated ITEM_WIDTH
        overscan: 5,
    });

    // Get cell index in the full list
    const getCellIndex = useCallback(
        (rowIndex: number, columnIndex: number) => {
            return rowIndex * columnCount + columnIndex;
        },
        [columnCount]
    );

    // Memoize virtual cells to prevent unnecessary re-renders
    const virtualCells = useMemo(() => {
        return rowVirtualizer.getVirtualItems().flatMap(
            (virtualRow) =>
                columnVirtualizer
                    .getVirtualItems()
                    .map((virtualColumn) => {
                        const cellIndex = getCellIndex(virtualRow.index, virtualColumn.index);

                        // Skip rendering if cell index is out of bounds
                        if (cellIndex >= codes.length) return null;

                        const code = codes[cellIndex];

                        return {
                            key: `${virtualRow.index}:${virtualColumn.index}`,
                            rowStart: virtualRow.start,
                            columnStart: virtualColumn.start,
                            code,
                            cellIndex,
                        };
                    })
                    .filter(Boolean) // Filter out null entries
        );
    }, [
        rowVirtualizer.getVirtualItems(),
        columnVirtualizer.getVirtualItems(),
        codes,
        getCellIndex,
    ]);

    return (
        <div className="card w-full flex flex-col gap-2 text" style={{ gridColumn: '1 / -1' }}>
            <div className="flex items-center justify-between">
                <h3>Raid Progress</h3>
                <Tooltip>
                    <p>Here you see the progress of the raid.</p>
                    <br />
                    <p>More info about your progress will be added in the future.</p>
                </Tooltip>
            </div>
            <p className="text-secondary">
                These are all the codes you have entered and you have left to explore.
            </p>
            <div
                ref={parentRef}
                className="max-h-[80vh] overflow-auto w-full"
                style={{
                    height: '900px',
                    width: '100%',
                }}
            >
                <div
                    style={{
                        height: `${rowVirtualizer.getTotalSize()}px`,
                        width: `${columnVirtualizer.getTotalSize()}px`,
                        position: 'relative',
                    }}
                >
                    {virtualCells.map(
                        (cell) =>
                            cell && (
                                <div
                                    key={cell.key}
                                    className="absolute bg-secondary rounded-sm"
                                    style={{
                                        top: cell.rowStart,
                                        left: cell.columnStart,
                                        width: `${ITEM_WIDTH}px`, // This will now use the increased width
                                        height: `${ITEM_HEIGHT}px`,
                                    }}
                                >
                                    <div
                                        className={cx(
                                            'flex justify-center items-center w-full h-full rounded-sm text-[0.8rem]',
                                            triedCodes.has(cell.code)
                                                ? 'bg-accent text-primary'
                                                : 'bg-tertiary text-secondary'
                                        )}
                                    >
                                        {cell.code}
                                    </div>
                                </div>
                            )
                    )}
                </div>
            </div>
        </div>
    );
};
