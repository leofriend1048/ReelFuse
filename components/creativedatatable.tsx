"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, ChevronUp, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Image from "next/image";

import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"





const CreativeDataTable: React.FC = () => {
  const [tableData, setTableData] = React.useState<Payment[]>([]);

  React.useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    let url = new URL(
      `https://api.us-east.tinybird.co/v0/pipes/northbeam_pipe.json?start_date=1/2/24&end_date&`
    );

    try {
      const response = await fetch(url, {
        headers: {
          Authorization:
            'Bearer p.eyJ1IjogImI1M2FlMWJmLTRjN2ItNGY3Mi1iNThmLWYyOTBhNzNjM2QxNyIsICJpZCI6ICIwZjAyOTNkMy0yNzQ3LTQ2N2UtOTBlNS1hNDU0YmQ0OTJjNzIiLCAiaG9zdCI6ICJ1c19lYXN0In0.ayANj3ay5RSoJVJWG3T6y6yOP2aDs8YO4jnFBWbuLeg',
        },
      });

      const responseData = await response.json();

      if (!responseData.data) {
        console.error(
          `There is a problem running the query: ${JSON.stringify(responseData)}`
        );
      } else {
        const formattedData = responseData.data.map((row) => ({
          spend: row.Spend,
          ecpc: row.eCPC,
          creative: row.Creative,
          roas: row.ROAS,
          imprs: row.Imprs,
          ctr: row.CTR,
          ecr: row.ECR,
        }));

        setTableData(formattedData);
      }
    } catch (error) {
      console.error(error.toString());
    }
  }

  const columns: ColumnDef<Payment>[] = [
    {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "thumbnail",
        header: "Thumbnail",
        cell: ({ row }) => (        

          <Popover>
          <PopoverTrigger><img width={50} height={50} src={row.getValue("thumbnail")} alt="Image" className="rounded-md object-cover" /></PopoverTrigger>
          <PopoverContent><iframe
                    src="https://developers.facebook.com/micro_site/url/?click_from_context_menu=true&country=noam&destination=https%3A%2F%2Fbusiness.facebook.com%2Fads%2Fapi%2Fpreview_iframe.php%3Fd%3DAQJpiq9WtuMXzEAt_oqTYPXckGpR70oZKZLPXhUe-pa_ZjY-cR982i26U1A81ir8yGIi_ESpQs4QuEngcO18Tj4ihrIGONVpLFJFTfkdubhO3ZlvzFKdy1tKGA9xI0Y7mUO5QECZrwYZfYWFbahKilsM_1FMPKOpC6zbzzqc8u2Oid46R8IseJ-2F32QP2FF1auHasbSdjlKclmyBfumDKXkPxxij1FQNpES-GiKmdH9dkiyHn1I6Q6GhLyZQEllZt5_X-2Ui3J6ttJyAycYH2sjJqR1Ds93FuBwvL4aWpJe1d6UcLO1loxAX8pO3iyMFY8HXwu7Mvldeqe7DOv-mP6VDpfYU2N2b-3X29ia3ZmgumQ5OY2ANzXrbqwGAGd0UzW1OSaoYgiW0YgeAbZxxRZZmDaFYzE-15LmsId7OAzuQk-sAaUyGp4pAKU5shSzWyI%26t%3DAQKucqAqwGAuhhUGWng&event_type=click&last_nav_impression_id=0DhCBvWNPvTnslcmY&max_percent_page_viewed=64&max_viewport_height_px=901&max_viewport_width_px=1728&orig_http_referrer=https%3A%2F%2Fdevelopers.facebook.com%2Ftools%2Fexplorer%2F%3Fmethod%3DGET%26path%3D6505231381867%252Fpreviews%253Fad_format%253DDESKTOP_FEED_STANDARD%26version%3Dv18.0&orig_request_uri=https%3A%2F%2Fdevelopers.facebook.com%2Ftools%2Fexplorer%2Fv2%2Fpreferences%2F&region=noam&scrolled=false&session_id=1LdFFCTAulFFaP90k&site=developers"
                    width="100%"
                    height="auto"
                    scrolling="no"
                    style={{ border: 'none' }}
                  ></iframe></PopoverContent>
        </Popover>
            
        ),
      },
      {
        accessorKey: "creative",
        header: "Creative",
        cell: ({ row }) => (
          <div className="capitalize overflow-x-auto whitespace-nowrap max-w-[25rem]">
            {row.getValue("creative")}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.getValue("status");
    
          let badge;
          if (status === "Active") {
            badge = (
              <Badge variant="outline" className="text-green-600">
                {status}
              </Badge>
            );
          } else if (status === "Inactive") {
            badge = (
              <Badge variant="secondary">
                {status}
              </Badge>
            );
          } else {
            // Handle other status values if needed
            badge = (
              <Badge variant="outline">
                {status}
              </Badge>
            );
          }
    
          return <div className="capitalize">{badge}</div>;
        },
      },
      {
        accessorKey: "opportunities",
        header: "Opportunities",
        cell: ({ row }) => (
        <div className="capitalize w-32">
          <Badge variant="outline">
            <div className="pr-2">
            <svg width="8" height="8" xmlns="http://www.w3.org/2000/svg">
      <circle cx="4" cy="4" r="4" fill="#E5484D" />
    </svg>
            </div>
            {row.getValue("opportunities")}
            </Badge>
          </div>
        ),
      },
      {
        accessorKey: "spend",
        header: () => <div className="text-left">Spend</div>,
        cell: ({ row }) => {
          const spend = parseFloat(row.getValue("spend"));
      
          // Format the amount with custom logic directly in the cell function
          const formatted = spend >= 1000
            ? new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              }).format(spend / 1000) + "k"
            : new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(spend);
      
          return <div className="text-left">{formatted}</div>;
        },
      },
      {
        accessorKey: "roas",
        header: "ROAS (1d)",
        cell: ({ row }) => (
        <div className="capitalize">{row.getValue("roas")}</div>
        ),
      },
      {
        accessorKey: "playtime",
        header: "Avg. Play Time",
        cell: ({ row }) => (
        <div className="capitalize">{row.getValue("playtime")}</div>
        ),
      },
      {
        accessorKey: "ctr",
        header: "Outbound CTR",
        cell: ({ row }) => (
        <div className="capitalize">{row.getValue("ctr") + "%"}</div>
        ),
      },
      {
        accessorKey: "thumbstop",
        header: "Thumbstop",
        cell: ({ row }) => (
        <div className="capitalize flex flex-row items-center w-32">
          <div className="basis 1/4 pr-4">{row.getValue("thumbstop") + "%"}</div>
        <div className="basis-3/4"><Progress value={row.getValue("thumbstop")} /></div>
        </div>
        ),
      },
      {
        accessorKey: "hold",
        header: "Hold Rate",
        cell: ({ row }) => (
        <div className="capitalize flex flex-row items-center	w-32">
          <div className="basis 1/4 pr-4">{row.getValue("hold") + "%"}</div>
        <div className="basis-3/4"><Progress value={row.getValue("hold")} /></div>
        </div>
        ),
      },
      {
        accessorKey: "ecpc",
      header: "eCPC",
      cell: ({ row }) => (
        <div className="capitalize">
          {parseFloat(row.getValue("ecpc")).toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
          })}
        </div>
      ),
      },
      {
        accessorKey: "ecr",
        header: "ECR (1d)",
        cell: ({ row }) => (
        <div className="capitalize">{row.getValue("ecr") + "%"}</div>
        ),
      },
      {
        accessorKey: "imprs",
        header: () => <div className="text-left">Imprs.</div>,
        cell: ({ row }) => {
          const imprs = parseFloat(row.getValue("imprs"));
      
          // Format the amount with custom logic directly in the cell function
          const formatted = imprs >= 1000
            ? (imprs / 1000).toFixed(1) + "k"
            : imprs.toString();
      
          return <div className="text-left capitalize">{formatted}</div>;
        },
      },

    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const payment = row.original;

        return (
          <Sheet>
            <SheetTrigger>
              <MoreHorizontal className="h-4 w-4" />
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px]">
              <SheetHeader>
                <SheetTitle>
                  <h1>{row.getValue("creative")}</h1>
                </SheetTitle>
                <SheetDescription>
                  <iframe
                    src="https://www.facebook.com/ads/api/preview_iframe.php?d=AQK6306Al9kCRnKXVrycNxVUwk5p3o7Muztxcg1lliBZBqoT7OT6KsmaDU2MaTo-BFJAmFrEYKwhSUGey7PeLZc-ToP5VRM1wp2LU7MoftagqmDGjEnNvOA8eSeVeNgyIAJ-fwcFHjEfTy2T8VlISJZLrcKHyJB8wXeIdABq-aRcBF5DkVw-3caDFOndmCBQGi_4on0c33CRxNyrwyEPZyQZaX0flsw26Q-BYsYhLOje9hvT7xj4BgK2DQZFcdOrznsGmr-TIvdoj6ROcnk6OFJpaC2aRFQ5iaqjdGGjaP6r4MSEjThmCKr3JWkShWEf5XH_cVTBfeFlX6OVrt2EaFuLpVt52C7fBImsvBlZK0JK7cAZpx3FmQU4QrWFVoPqwtAm5GbY3UpuEnR0qWUe98mYKx1sZ0lwLzTD43bUbmQXpGgUHtwzXplf8lF65Ms9uCo&t=AQIxUuWUUEqIvdFz0QU"
                    width="333"
                    height="800"
                    scrolling="no"
                    style={{ border: 'none' }}
                  ></iframe>
                  

                </SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
        );
      },
    },
  ];

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data: tableData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter ads..."
          value={(table.getColumn("creative")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("creative")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />

            <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreativeDataTable;

export type Payment = {
  id: string;
  spend: number;
  ecpc: number;
  creative: string;
  roas: number;
  imprs: number;
  thumbstop: number;
  hold: number;
  ctr: number;
  ecr: number;
  playtime: Date;
  adid: number;
  thumbnail: string;
  status: "Inactive" | "Active";
};
