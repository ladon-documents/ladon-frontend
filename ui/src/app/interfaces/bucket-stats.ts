import { Statistics } from '@ladon/api';

export interface BucketStatsExtended extends Statistics {
  name: string;
  objects: number;
  favourite?: boolean;
}
