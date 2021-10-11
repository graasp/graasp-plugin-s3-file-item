import S3 from 'aws-sdk/clients/s3';
import { FastifyLoggerInstance } from 'fastify';
import { DatabaseTransactionHandler, Item, ItemService } from 'graasp';
import {
  GRAASP_ACTOR,
  ITEM_FILE,
  ITEM_FILE_WITH_METADATA,
  ITEM_FOLDER,
} from '../../test/constants';
import { S3FileItemExtra } from '../interfaces/common';
import { NotS3FileItem } from '../utils/errors';
import GetMetadataFromItemTask from './get-metadata-from-item-task';

let s3Instance;
const bucket = 'bucket';

const dbService = { update: jest.fn() };
const handler = {} as unknown as DatabaseTransactionHandler;
const log = {} as unknown as FastifyLoggerInstance;

describe('GetMetadataFromItemTask', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    s3Instance = new S3();
    s3Instance.headObject = jest.fn(() => ({
      promise: async () => ({ ContentLength: 'cL', ContentType: 'cT' }),
    }));
  });

  it('Successfully get S3 upload URL', async () => {
    const item = ITEM_FILE as Item<S3FileItemExtra>;

    const task = new GetMetadataFromItemTask(
      GRAASP_ACTOR,
      dbService as unknown as ItemService,
      s3Instance,
      bucket,
      { item },
    );

    await task.run(handler, log);

    expect(dbService.update).toHaveBeenCalled();
    expect(s3Instance.headObject).toHaveBeenCalled();
    expect(task.result).toEqual(item.extra);
  });

  it('Does not update if item already has metadata', async () => {
    const item = ITEM_FILE_WITH_METADATA as Item<S3FileItemExtra>;

    const task = new GetMetadataFromItemTask(
      GRAASP_ACTOR,
      dbService as unknown as ItemService,
      s3Instance,
      bucket,
      { item },
    );

    await task.run(handler, log);
    expect(dbService.update).not.toHaveBeenCalled();
    expect(s3Instance.headObject).not.toHaveBeenCalled();
    expect(task.result).toEqual(item.extra);
  });

  it('Throw if item is not a s3file', async () => {
    const item = ITEM_FOLDER as Item<S3FileItemExtra>;

    const task = new GetMetadataFromItemTask(
      GRAASP_ACTOR,
      dbService as unknown as ItemService,
      s3Instance,
      bucket,
      { item },
    );

    await task.run(handler, log).catch((e) => {
      expect(e).toEqual(new NotS3FileItem(item.id));
    });
  });

  it('Throw if s3 throws an error', async () => {
    const item = ITEM_FILE as Item<S3FileItemExtra>;

    // mock s3 call, it throws an error
    const error = 'this is a s3 error';
    s3Instance.headObject = jest
      .fn()
      .mockImplementation(() => ({ promise: jest.fn().mockRejectedValue(new Error(error)) }));

    const task = new GetMetadataFromItemTask(
      GRAASP_ACTOR,
      dbService as unknown as ItemService,
      s3Instance,
      bucket,
      { item },
    );

    await task.run(handler, log).catch((e) => {
      expect(e.message).toContain('s3');
    });
  });
});
