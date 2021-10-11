import { Actor, DatabaseTransactionHandler, Item, ItemService } from 'graasp';
import S3 from 'aws-sdk/clients/s3';
import type { FastifyLoggerInstance } from 'fastify';
import { NotS3FileItem } from '../utils/errors';
import { BaseTask } from './base-task';
import { S3FileItemExtra } from '../interfaces/common';

export type GetMetadataFromItemTaskInputType = {
  item: Item<S3FileItemExtra>;
};

class GetMetadataFromItemTask extends BaseTask<S3FileItemExtra> {
  private s3: S3;
  private itemService: ItemService;
  private bucket: string;

  get name(): string {
    return GetMetadataFromItemTask.name;
  }

  input: GetMetadataFromItemTaskInputType;
  getInput: () => GetMetadataFromItemTaskInputType;

  constructor(
    member: Actor,
    itemService: ItemService,
    s3: S3,
    bucket: string,
    input?: GetMetadataFromItemTaskInputType,
  ) {
    super(member);
    this.input = input;
    this.itemService = itemService;
    this.s3 = s3;
    this.bucket = bucket;
  }

  async run(handler: DatabaseTransactionHandler, log: FastifyLoggerInstance): Promise<void> {
    this.status = 'RUNNING';

    const { item } = this.input;

    const { id, extra } = item;
    const { s3File } = extra;

    if (!s3File) throw new NotS3FileItem(id);

    const { size, contenttype, key } = s3File;
    // metadata was previously fetch, return
    if ((size === 0 || size) && contenttype) {
      this._result = extra;
    } else {
      let itemData: Partial<Item<S3FileItemExtra>>;
      const params: S3.HeadObjectRequest = { Bucket: this.bucket, Key: key };

      try {
        const { ContentLength: cL, ContentType: cT } = await this.s3.headObject(params).promise();
        itemData = {
          extra: { s3File: Object.assign(s3File, { size: cL, contenttype: cT }) },
        };
        this._result = itemData.extra;
      } catch (error) {
        log.error(error, 'graasp-s3-file-item: failed to get s3 object metadata');
        throw error;
      }

      // update data
      await this.itemService.update(id, itemData, handler);
    }

    this.status = 'OK';
  }
}

export default GetMetadataFromItemTask;
