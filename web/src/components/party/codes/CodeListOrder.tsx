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
import { CodeListEntry, usePartyEventSubmit, usePartyListOrder } from "@/api/party";

const SortableItem = ({ item, id }: { item: CodeListEntry; id: string }) => {
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

  const codes = LISTS.find(list => list.name === item.name)?.codes;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex justify-between items-center p-3 mb-2 cursor-move bg-primary border border-secondary rounded-md ${isDragging ? "z-10 shadow-md" : ""
        }`}
      {...attributes}
      {...listeners}
    >
      <span className="font-medium">{item.name}</span>
      <span className="text-secondary bg-secondary px-2 py-1 rounded-full text-sm">
        {codes?.length}
      </span>
    </div>
  );
};


export const CodeListOrder: FC<{ party_id: string }> = ({ party_id }) => {
  // const [list, setList] = useState<CodeList[]>();
  const { data: list, update } = usePartyListOrder(party_id);

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

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="card space-y-2 p-4 h-auto w-full text 3xl:col-span-2">
        <div className="flex items-center justify-between">
          <h3>Arrange Lists</h3>
          <Tooltip>
            <p>
              Customize the order of codes you want to use.
            </p>
            <p>You will be able to use custom lists in the future.</p>
          </Tooltip>
        </div>
        <SortableContext items={list?.map(item => item.name) ?? []} strategy={verticalListSortingStrategy}>
          {list?.map((item) => (
            <SortableItem key={item.name} id={item.name} item={item} />
          ))}
        </SortableContext>
      </div>
    </DndContext>
  );
};
