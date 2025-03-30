import { LISTS } from "@/util/lists";
import { CodeList } from "@/util/lists";
import { FC, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Tooltip } from "@/components/helpers/Tooltip";
import { CodeListEntry, defaultListOrder, usePartyEventSubmit, usePartyListOrder } from "@/api/party";
import { LuArrowUpDown } from "react-icons/lu";

const SortableItem = ({ item, id, onReverseToggle }: {
  item: CodeListEntry;
  id: string;
  onReverseToggle: (name: string) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const codesList = LISTS.find(list => list.name === item.name);

  // Handler for arrow click to toggle reverse
  const handleReverseClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering drag
    e.preventDefault();
    onReverseToggle(item.name);
  };

  // Prevent all drag-related events for the button
  const preventDragHandlers = {
    onMouseDown: (e: React.MouseEvent) => e.stopPropagation(),
    onPointerDown: (e: React.PointerEvent) => e.stopPropagation(),
    onTouchStart: (e: React.TouchEvent) => e.stopPropagation(),
    onClick: (e: React.MouseEvent) => e.stopPropagation()
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center p-3 mb-2 bg-primary border border-secondary rounded-md"
    >
      {/* Make the main content draggable */}
      <div
        className="flex-grow flex items-center cursor-move"
        style={{ touchAction: 'none' }}
        {...attributes}
        {...listeners}
      >
        <span className="font-medium">{item.name}</span>
      </div>

      {/* Completely isolated button area */}
      <div className="flex items-center gap-3 ml-2">
        <div {...preventDragHandlers} className="flex items-center gap-1">
          {
            (codesList?.description || codesList?.source) && (
              <Tooltip>
                <div className="flex flex-col gap-1">
                  {codesList?.description && (
                <p>{codesList.description}</p>
              )}
              {
                codesList?.source && (
                  <p>
                    Source: <a href={codesList.source} target="_blank" rel="noopener noreferrer" className="link">{codesList.source}</a>
                  </p>
                )
              }
              <div className="border flex flex-wrap gap-1 p-2 rounded-md border-secondary font-mono">
                {
                  codesList?.codes.slice(0, 17).map(code => (
                    <p key={code} className="text-xs">{code}</p>
                  ))
                }
                <p className="text-secondary text-xs">....</p>
              </div>
              </div>
            </Tooltip>)
          }
          <button
            onClick={handleReverseClick}
            className={`flex items-center justify-center w-8 h-8 rounded-full hover:bg-secondary/20 transition-colors ${item.reverse ? 'text-blue-400' : 'text-secondary'}`}
            title={item.reverse ? "Sort ascending" : "Sort descending"}
          >
            <LuArrowUpDown
              className={`w-5 h-5 transition-transform ${item.reverse ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
        <span className="text-secondary bg-secondary px-2 py-1 rounded-full text-sm">
          {codesList?.codes.length}
        </span>
      </div>
    </div>
  );
};


export const CodeListOrder: FC<{ party_id: string }> = ({ party_id }) => {
  // const [list, setList] = useState<CodeList[]>();
  const { data: list, update, reset, isDefault } = usePartyListOrder(party_id);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      update((items) => {
        const oldIndex = items.findIndex((item) => item.name === active.id);
        const newIndex = items.findIndex((item) => item.name === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Handle toggling the reverse property
  const handleReverseToggle = (name: string) => {
    update((items) => {
      return items.map(item =>
        item.name === name
          ? { ...item, reverse: !item.reverse }
          : item
      );
    });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="card space-y-2 p-4 h-auto w-full text 3xl:col-span-2">
        <div className="flex items-center justify-between">
          <h3>Arrange Lists</h3>
          <div className="flex items-center gap-2">
            {
              !isDefault && (
                <button onClick={reset} className="button">
                  Reset
                </button>
              )
            }
            <Tooltip>
              <p>
                Customize the order of codes you want to use.
              </p>
              <p>You will be able to use custom lists in the future.</p>
            </Tooltip>
          </div>
        </div>
        <SortableContext items={list?.map(item => item.name) ?? []} strategy={verticalListSortingStrategy}>
          {list?.map((item) => (
            <SortableItem
              key={item.name}
              id={item.name}
              item={item}
              onReverseToggle={handleReverseToggle}
            />
          ))}
        </SortableContext>
      </div>
    </DndContext>
  );
};
