import { useCallback, useEffect, useRef, useState, useMemo, FC } from 'react';
import { LISTS, setifyList } from '@/util/lists';
import cx from 'classnames';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Tooltip } from '@/components/helpers/Tooltip';
import { usePartyListOrder } from '@/api/party';

export const PartyProgress: FC<{ party_id: string }> = ({ party_id }) => {
    const { data: listOrder } = usePartyListOrder(party_id);

    // sort LISTS by listOrder and unwrap it to
    const orderedCodes = useMemo(() => {
        // If listOrder doesn't exist yet, just use LISTS as is
        if (!listOrder) {
            return setifyList(LISTS.flatMap((list) => list.codes));
        }

        // Create a map for quick lookup of lists by name
        const listsByName = new Map(LISTS.map((list) => [list.name, list]));

        // Collect all codes in the specified order, applying reversals where needed
        const allCodes = listOrder.flatMap((entry) => {
            const list = listsByName.get(entry.name);

            if (!list) return []; // Skip if list doesn't exist

            // Return the codes array, reversed if needed
            return entry.reverse ? [...list.codes].reverse() : list.codes;
        });

        // Return the deduplicated list of codes
        return setifyList(allCodes);
    }, [listOrder]);

    const codes = orderedCodes;

    console.log('coderaid rerender', listOrder);

    const parentRef = useRef<HTMLDivElement>(null);

    const progress = 5;

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
                className="max-h-[300px] overflow-auto w-full"
                style={{
                    height: '300px',
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
                                            cell.cellIndex < progress
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
