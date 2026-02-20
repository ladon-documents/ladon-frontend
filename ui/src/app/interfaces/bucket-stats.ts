import { StatisticsModel } from '@ladon/api';

export interface BucketStatsExtended extends StatisticsModel {
  name: string;
  objects: number;
  favourite?: boolean;
}
