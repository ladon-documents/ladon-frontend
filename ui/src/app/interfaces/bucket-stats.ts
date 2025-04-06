import {StatisticsModel} from "../../api";

export interface BucketStatsExtended  extends StatisticsModel{
  name: string;
  objects: number;
  favourite?: boolean;
}
