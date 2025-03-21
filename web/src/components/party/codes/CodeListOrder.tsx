import { LISTS } from "@/util/lists";
import { CodeList } from "@/util/lists";
import { useState } from "react";
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
import { ToolTip } from "@/components/helpers/ToolTip";

const SortableItem = ({ item, id }: { item: CodeList; id: string }) => {
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
        {item.codes.length}
      </span>
    </div>
  );
};

export const CodeListOrder = () => {
  const [list, setList] = useState<CodeList[]>(LISTS);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setList((items) => {
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
      <div className="card space-y-2 p-4 h-auto w-full">
        <div className="flex items-center justify-between">
          <h3>Arrange Lists</h3>
          <ToolTip>
            <p>
              Customize the order of codes you want to use.
            </p>
            <p>You will be able to use custom lists in the future.</p>
          </ToolTip>
        </div>
        <SortableContext items={list.map(item => item.name)} strategy={verticalListSortingStrategy}>
          {list.map((item) => (
            <SortableItem key={item.name} id={item.name} item={item} />
          ))}
        </SortableContext>
      </div>
    </DndContext>
  );
};
