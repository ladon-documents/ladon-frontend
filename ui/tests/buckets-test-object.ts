import { BucketItem } from '../src/app/interfaces/bucket-item';
import { BucketStatsExtended } from '../src/app/interfaces/bucket-stats';

export class BucketsTestObject {
  getBucketsMock(): BucketItem[] {
    return [
      {
        id: '8e30fd8c-ab79-4519-9bf0-1323ba6123c8',
        createdBy: '944aa9ab-b075-469c-b55d-10110443cd08',
        size: 0,
        versioned: true,
        favourite: false,
        created: '2022-03-01T20:10:08.275',
        createdDate: 1646165408,
      },
      {
        id: '944aa9ab-b075-469c-b55d-10110443cd08',
        createdBy: '944aa9ab-b075-469c-b55d-10110443cd08',
        size: 0,
        versioned: true,
        favourite: true,
        created: '2022-03-01T20:08:56.784',
        createdDate: 1646165336,
      },
      {
        id: 'achim-voigt',
        createdBy: '944aa9ab-b075-469c-b55d-10110443cd08',
        size: 0,
        versioned: true,
        favourite: false,
        created: '2022-09-09T20:20:30.813',
        createdDate: 1662754830,
      },
      {
        id: 'admin',
        createdBy: 'system',
        size: 0,
        versioned: true,
        favourite: false,
        created: '2022-07-04T22:16:11.480',
        createdDate: 1656972971,
      },
      {
        id: 'charton-capital',
        createdBy: '944aa9ab-b075-469c-b55d-10110443cd08',
        size: 0,
        versioned: true,
        favourite: false,
        created: '2022-03-15T19:39:56.616',
        createdDate: 1647373196,
      },
      {
        id: 'flyer',
        createdBy: '944aa9ab-b075-469c-b55d-10110443cd08',
        size: 0,
        versioned: true,
        favourite: false,
        created: '2022-06-14T22:40:00.934',
        createdDate: 1655246400,
      },
      {
        id: 'icepole-dot-de',
        createdBy: '944aa9ab-b075-469c-b55d-10110443cd08',
        size: 0,
        versioned: true,
        favourite: true,
        created: '2023-02-10T19:33:59.092',
        createdDate: 1676057639,
      },
      {
        id: 'ivo-ackermann',
        createdBy: '944aa9ab-b075-469c-b55d-10110443cd08',
        size: 0,
        versioned: true,
        favourite: false,
        created: '2023-02-11T21:05:40.242',
        createdDate: 1676149540,
      },
      {
        id: 'moped',
        createdBy: '944aa9ab-b075-469c-b55d-10110443cd08',
        size: 0,
        versioned: true,
        favourite: false,
        created: '2022-05-08T21:19:47.696',
        createdDate: 1652044787,
      },
      {
        id: 'sbalatto',
        createdBy: '944aa9ab-b075-469c-b55d-10110443cd08',
        size: 0,
        versioned: true,
        favourite: false,
        created: '2022-06-20T21:23:49.036',
        createdDate: 1655760229,
      },
      {
        id: 'solar',
        createdBy: '944aa9ab-b075-469c-b55d-10110443cd08',
        size: 0,
        versioned: true,
        favourite: false,
        created: '2022-02-15T21:03:42.704',
        createdDate: 1644959022,
      },
    ];
  }

  getBucketStats(): BucketStatsExtended {
    return {
      size: 3014479,
      versions: 17,
      objects: 15,
      name: '8e30fd8c-ab79-4519-9bf0-1323ba6123c8',
      lastModified: '2024-06-24T17:48:18.926Z',
      folderCount: 4,
      fileCount: 11,
      favourite: false,
    };
  }
}
