import { Actor, ItemService, Member, Task } from 'graasp';
import S3 from 'aws-sdk/clients/s3';
import { S3FileItemTaskManager } from '../interfaces/s3-file-item-task-manager';
import GetMetadataFromItemTask, {
  GetMetadataFromItemTaskInputType,
} from './get-metadata-from-item-task';
import { GraaspS3FileItemOptions } from '../interfaces/common';

export class TaskManager implements S3FileItemTaskManager<Actor> {
  private itemService: ItemService;
  private s3: S3;
  private options: GraaspS3FileItemOptions;

  constructor(itemService: ItemService, s3: S3, options: GraaspS3FileItemOptions) {
    this.itemService = itemService;
    this.s3 = s3;
    this.options = options;
  }

  public static getGetMetadataFromItemTask(): string {
    return GetMetadataFromItemTask.name;
  }

  createGetMetadataFromItemTask(
    member: Member,
    input?: GetMetadataFromItemTaskInputType,
  ): Task<Actor, unknown> {
    return new GetMetadataFromItemTask(
      member,
      this.itemService,
      this.s3,
      this.options?.s3Bucket,
      input,
    );
  }
}
