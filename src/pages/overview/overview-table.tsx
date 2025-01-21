import { type Component, createSignal, For, Match, Show, Switch } from "solid-js";
import { useNavigate, usePreloadRoute } from "@solidjs/router";

import {
  type ColumnFiltersState,
  createColumnHelper,
  createSolidTable,
  type FilterFn,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortDirection,
  type SortingState,
} from "@tanstack/solid-table";
import { intlFormatDistance } from "date-fns";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-solid";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { TextField, TextFieldInput } from "~/components/ui/text-field";

import { cn } from "~/lib/utils";
import { Flex } from "~/components/ui/flex";
import { dbLoaded, threadSentMessagesOverviewQuery } from "~/db";

export interface RoomOverview {
  threadId: number;
  recipientId: number;
  archived: boolean;
  messageCount: number;
  lastMessageDate: Date | undefined;
  name: string;
  isGroup: boolean;
}

const columnHelper = createColumnHelper<RoomOverview>();

const archivedFilterFn: FilterFn<RoomOverview> = (row, _columnId, filterValue) => {
  if (filterValue === true) {
    return true;
  }

  return !row.original.archived;
};

const isGroupFilterFn: FilterFn<RoomOverview> = (row, _columnId, filterValue) => {
  if (filterValue === true) {
    return true;
  }

  return !row.original.isGroup;
};

const rowIsAvailable = (threadId: number): boolean => {
  if (dbLoaded()) {
    return true;
  }

  if (threadSentMessagesOverviewQuery.hasCacheFor(threadId)) {
    return true;
  }

  return false;
};

const SortingDisplay: Component<{ sorting: false | SortDirection; class?: string; activeClass?: string }> = (props) => {
  return (
    <Switch>
      <Match when={props.sorting === false}>
        <ArrowUpDown class={props.class} />
      </Match>
      <Match when={props.sorting === "asc"}>
        <ArrowUp class={cn(props.class, props.activeClass)} />
      </Match>
      <Match when={props.sorting === "desc"}>
        <ArrowDown class={cn(props.class, props.activeClass)} />
      </Match>
    </Switch>
  );
};

export const columns = [
  columnHelper.accessor("threadId", {}),
  columnHelper.accessor("name", {
    header: (props) => {
      const sorting = () => props.column.getIsSorted();

      return (
        <Button
          variant="ghost"
          onClick={() => {
            props.column.toggleSorting();
          }}
        >
          Name
          <SortingDisplay sorting={sorting()} class="ml-2 h-4 w-4" activeClass="text-info-foreground" />
        </Button>
      );
    },
    cell: (props) => {
      const isArchived = props.row.getValue("archived");
      const isGroup = props.row.getValue("isGroup");
      const isCached = !dbLoaded() && rowIsAvailable(props.row.original.threadId);

      return (
        <Flex class="w-full" flexDirection="row">
          <span class="max-w-2xl overflow-hidden text-ellipsis whitespace-nowrap font-bold">
            {props.cell.getValue()}
          </span>
          <Show when={isArchived || isGroup || !isCached}>
            <Flex flexDirection="row" class="ml-auto gap-2">
              <Show when={isArchived}>
                <Badge variant="outline" class="ml-auto">
                  Archived
                </Badge>
              </Show>
              <Show when={isGroup}>
                <Badge variant="outline" class="ml-auto">
                  Group
                </Badge>
              </Show>
              <Show when={!isCached}>
                <Badge variant="outline" class="ml-auto">
                  Not available
                </Badge>
              </Show>
            </Flex>
          </Show>
        </Flex>
      );
    },
  }),
  columnHelper.accessor("messageCount", {
    id: "messageCount",
    header: (props) => {
      const sorting = () => props.column.getIsSorted();

      return (
        <Button
          variant="ghost"
          onClick={() => {
            props.column.toggleSorting();
          }}
        >
          Number of messages
          <SortingDisplay sorting={sorting()} class="ml-2 h-4 w-4" activeClass="text-info-foreground" />
        </Button>
      );
    },
    sortingFn: "basic",
  }),
  columnHelper.accessor("lastMessageDate", {
    header: (props) => {
      const sorting = () => props.column.getIsSorted();

      return (
        <Button
          variant="ghost"
          onClick={() => {
            props.column.toggleSorting();
          }}
        >
          Date of last message
          <SortingDisplay sorting={sorting()} class="ml-2 h-4 w-4" activeClass="text-info-foreground" />
        </Button>
      );
    },
    sortingFn: "datetime",
    cell: (props) => {
      const value = props.cell.getValue();
      if (value) {
        return intlFormatDistance(new Date(value), new Date());
      } else {
        return "";
      }
    },
  }),
  columnHelper.accessor("archived", {
    id: "archived",
    header: "Archived",
    cell: (props) => {
      return (
        <Show when={props.cell.getValue()}>
          <Badge>Archived</Badge>
        </Show>
      );
    },
    filterFn: archivedFilterFn,
  }),
  columnHelper.accessor("isGroup", {
    header: "isGroup",
    cell: (props) => {
      return (
        <Show when={props.cell.getValue()}>
          <Badge>Group</Badge>
        </Show>
      );
    },
    filterFn: isGroupFilterFn,
  }),
];

interface OverviewTableProps {
  data: RoomOverview[];
}

export const OverviewTable = (props: OverviewTableProps) => {
  const preload = usePreloadRoute();

  const [sorting, setSorting] = createSignal<SortingState>([
    {
      id: "messageCount",
      desc: true,
    },
  ]);
  const [columnFilters, setColumnFilters] = createSignal<ColumnFiltersState>([
    {
      id: "archived",
      value: false,
    },
    {
      id: "isGroup",
      value: false,
    },
  ]);

  const table = createSolidTable({
    get data() {
      return props.data;
    },
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      get sorting() {
        return sorting();
      },
      get columnFilters() {
        return columnFilters();
      },
      columnVisibility: {
        threadId: false,
        archived: false,
        isGroup: false,
      },
    },
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 25,
      },
    },
  });

  const navigate = useNavigate();

  return (
    <div>
      <div class="flex flex-row items-center gap-x-4">
        <div class="flex items-center py-4">
          <TextField
            value={(table.getColumn("name")?.getFilterValue() as string | undefined) ?? ""}
            onChange={(value) => table.getColumn("name")?.setFilterValue(value)}
          >
            <TextFieldInput placeholder="Filter by name..." class="max-w-sm" />
          </TextField>
        </div>
        <div class="flex items-start space-x-2">
          <Checkbox
            id="show-archived"
            checked={(table.getColumn("archived")?.getFilterValue() as boolean | undefined) ?? false}
            onChange={(value) => table.getColumn("archived")?.setFilterValue(value)}
          />
          <div class="grid gap-1.5 leading-none">
            <Label for="show-archived">Show archived chats</Label>
          </div>
        </div>
        <div class="flex items-start space-x-2">
          <Checkbox
            id="show-groups"
            checked={(table.getColumn("isGroup")?.getFilterValue() as boolean | undefined) ?? false}
            onChange={(value) => table.getColumn("isGroup")?.setFilterValue(value)}
          />
          <div class="grid gap-1.5 leading-none">
            <Label for="show-groups">Show group chats (detailed analysis not implemented)</Label>
          </div>
        </div>
      </div>
      <Table class="border-separate border-spacing-0">
        <TableHeader>
          <For each={table.getHeaderGroups()}>
            {(headerGroup) => (
              <TableRow>
                <For each={headerGroup.headers}>
                  {(header) => (
                    <TableHead
                      class="border-t border-r border-b first-of-type:rounded-tl-md first-of-type:border-l last-of-type:rounded-tr-md"
                      colSpan={header.colSpan}
                    >
                      <Show when={!header.isPlaceholder}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </Show>
                    </TableHead>
                  )}
                </For>
              </TableRow>
            )}
          </For>
        </TableHeader>
        <TableBody>
          <Show
            when={table.getRowModel().rows.length}
            fallback={
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  class="h-24 border-r border-b text-center first-of-type:rounded-tl-md first-of-type:border-l last-of-type:rounded-br-md"
                >
                  No results.
                </TableCell>
              </TableRow>
            }
          >
            <For each={table.getRowModel().rows}>
              {(row) => (
                <TableRow
                  class="cursor-pointer [&:last-of-type>td:first-of-type]:rounded-bl-md [&:last-of-type>td:last-of-type]:rounded-br-md"
                  classList={{
                    "text-muted-foreground": !rowIsAvailable(row.original.threadId),
                  }}
                  data-state={row.getIsSelected() && "selected"}
                  onPointerEnter={(event) => {
                    const threadId = row.original.threadId;
                    const isGroup = row.original.isGroup;

                    if (rowIsAvailable(threadId)) {
                      const preloadTimeout = setTimeout(() => {
                        preload(`/${isGroup ? "group" : "dm"}/${threadId.toString()}`, {
                          preloadData: true,
                        });
                      }, 20);

                      event.currentTarget.addEventListener(
                        "pointerout",
                        () => {
                          clearTimeout(preloadTimeout);
                        },
                        {
                          once: true,
                        },
                      );
                    }
                  }}
                  onClick={() => {
                    const threadId = row.original.threadId;
                    const isGroup = row.original.isGroup;

                    if (rowIsAvailable(threadId)) {
                      navigate(`/${isGroup ? "group" : "dm"}/${threadId.toString()}`);
                    }
                  }}
                >
                  <For each={row.getVisibleCells()}>
                    {(cell) => (
                      <TableCell class="border-r border-b first-of-type:border-l">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    )}
                  </For>
                </TableRow>
              )}
            </For>
          </Show>
        </TableBody>
      </Table>
      <div class="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            table.previousPage();
          }}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            table.nextPage();
          }}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
};
