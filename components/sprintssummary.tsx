"use client"
import { Card, Metric, Text, AreaChart, BadgeDelta, Flex, DeltaType, Grid, DateRangePicker, DateRangePickerItem, DateRangePickerValue } from "@tremor/react";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import LastUpdate from "./lastupdate";
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"


const data = [
  {
    Day: "Jan 22",
    Launched: 2890,
    Winners: 2400,
    Unicorns: 4938,
  },
  {
    Day: "Jan 23",
    Launched: 1890,
    Winners: 1398,
    Unicorns: 2938,
  },
  {
    Day: "Jan 24",
    Launched: 3490,
    Winners: 4300,
    Unicorns: 2345,
  },
  {
    Day: "Jan 25",
    Launched: 3490,
    Winners: 4300,
    Unicorns: 2345,
  },
  {
    Day: "Jan 26",
    Launched: 3490,
    Winners: 4300,
    Unicorns: 2345,
  },
];

const categories = [
  {
    title: "Launched",
    metric: "792",
    metricPrev: "602",
    delta: "34.3%",
    deltaType: "moderateIncrease",
    info: "Number of ads launched",
  },
  {
    title: "Winners",
    metric: "158",
    metricPrev: "82",
    delta: "18.1%",
    deltaType: "moderateIncrease",
    info: "Number of ads that reached at minimum a 1.0 ROAS with $500 or more in spend",
  },
  {
    title: "Unicorns",
    metric: "4",
    metricPrev: "1,082",
    delta: "12.3%",
    deltaType: "moderateDecrease",
    info: "Number of ads that reached at minimum a 1.0 ROAS with $1,000 or more in spend",
  },
];

export default function SprintsSummary() {
    const [value, setValue] = useState<DateRangePickerValue>({
        from: new Date(2023, 1, 1),
        to: new Date(),
      });

      

  return (
<div className="flex flex-col gap-6">
  <div className="flex flex-row justify-between items-center">
  <div className="flex flex-row justify-between items-center">
<DateRangePicker className="justify-start" enableSelect={true} defaultValue={{selectValue: 't'}} />
<div className="flex items-center space-x-2 pl-8">
      <Switch id="airplane-mode" />
      <Label htmlFor="airplane-mode">Creative Testing Campaigns Only</Label>
    </div>
    </div>
<LastUpdate />
</div>


    <Grid numItemsSm={2} numItemsLg={3} className="gap-6">
      {categories.map((item) => (
        <Card key={item.title}>
          <Flex alignItems="start">
            <Text>{item.title}  <TooltipProvider>
  <Tooltip>
    <TooltipTrigger><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="10" />
  <line x1="12" y1="16" x2="12" y2="12" />
  <line x1="12" y1="8" x2="12" y2="8" />
</svg>
</TooltipTrigger>
    <TooltipContent>
    {item.info}
    </TooltipContent>
  </Tooltip>
</TooltipProvider></Text>
  

            <BadgeDelta deltaType={item.deltaType}>{item.delta}</BadgeDelta>
          </Flex>
          <Flex className="space-x-3 truncate" justifyContent="start" alignItems="baseline">
            <Metric>{item.metric}</Metric>
            <Text>from {item.metricPrev}</Text>
          </Flex>
          <AreaChart
            className="mt-6 h-28"
            data={data}
            index="Day"
            categories={[item.title]}
            colors={["blue"]}
            showXAxis={true}
            showGridLines={false}
            startEndOnly={true}
            showYAxis={false}
            showLegend={false}
            showAnimation={true}
          />
        </Card>
      ))}
    </Grid>
    </div>
  );
}