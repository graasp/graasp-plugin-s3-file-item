import type { Actor, Task } from 'graasp';
import { GetMetadataFromItemTaskInputType } from '../tasks/get-metadata-from-item-task';

export interface S3FileItemTaskManager<A extends Actor = Actor> {
  public static getGetMetadataFromItemTask(): string;

  createGetMetadataFromItemTask(
    actor: A,
    input: GetMetadataFromItemTaskInputType,
  ): Task<A, unknown>;
}
