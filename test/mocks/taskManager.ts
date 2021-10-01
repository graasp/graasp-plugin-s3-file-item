import { Actor, Item, ItemTaskManager, Task, UnknownExtra } from 'graasp';

export default class TaskManager implements ItemTaskManager {
  createCreateTaskSequence(
    actor: Actor,
    object: Partial<Item<UnknownExtra>>,
    extra?: unknown,
  ): Task<Actor, unknown>[] {
    throw new Error('Method create not implemented.');
  }
  createGetTaskSequence(actor: Actor, objectId: string): Task<Actor, unknown>[] {
    throw new Error('Method get not implemented.');
  }
  createUpdateTaskSequence(
    actor: Actor,
    objectId: string,
    object: Partial<Item<UnknownExtra>>,
  ): Task<Actor, unknown>[] {
    throw new Error('Method update not implemented.');
  }
  createDeleteTaskSequence(
    actor: Actor,
    objectId: string,
    extra?: unknown,
  ): Task<Actor, unknown>[] {
    throw new Error('Method delete not implemented.');
  }
  createMoveTaskSequence(actor: Actor, itemId: string, parentId?: string): Task<Actor, unknown>[] {
    throw new Error('Method not implemented.');
  }
  createCopyTaskSequence(actor: Actor, itemId: string, parentId?: string): Task<Actor, unknown>[] {
    throw new Error('Method not implemented.');
  }
  createGetChildrenTaskSequence(
    actor: Actor,
    itemId: string,
    ordered?: boolean,
  ): Task<Actor, unknown>[] {
    throw new Error('Method not implemented.');
  }

  getCreateTaskName(): string {
    return 'Create';
  }
  getGetTaskName(): string {
    throw new Error('Method not implemented.');
  }
  getUpdateTaskName(): string {
    throw new Error('Method not implemented.');
  }
  getDeleteTaskName(): string {
    return 'Deleted';
  }
  getMoveTaskName(): string {
    throw new Error('Method not implemented.');
  }
  getCopyTaskName(): string {
    return 'Copy';
  }
  getGetChildrenTaskName(): string {
    throw new Error('Method not implemented.');
  }
  getGetOwnTaskName(): string {
    throw new Error('Method not implemented.');
  }
  getGetSharedWithTaskName(): string {
    throw new Error('Method not implemented.');
  }
  createCreateTask<E extends UnknownExtra>(
    actor: Actor,
    object: Partial<Item<E>>,
    extra?: unknown,
  ): Task<Actor, Item<E>> {
    throw new Error('Method not implemented.');
  }
  createGetTask<E extends UnknownExtra>(actor: Actor, objectId: string): Task<Actor, Item<E>> {
    throw new Error('Method not implemented.');
  }
  createUpdateTask<E extends UnknownExtra>(
    actor: Actor,
    objectId: string,
    object: Partial<Item<E>>,
  ): Task<Actor, Item<E>> {
    throw new Error('Method not implemented.');
  }
  createDeleteTask(
    actor: Actor,
    objectId: string,
    extra?: unknown,
  ): Task<Actor, Item<UnknownExtra>> {
    throw new Error('Method not implemented.');
  }
  createMoveTask(actor: Actor, itemId: string, parentId?: string): Task<Actor, Item<UnknownExtra>> {
    throw new Error('Method not implemented.');
  }
  createCopyTask(actor: Actor, itemId: string, parentId?: string): Task<Actor, Item<UnknownExtra>> {
    throw new Error('Method not implemented.');
  }
  createGetChildrenTask(
    actor: Actor,
    itemId: string,
    ordered?: boolean,
  ): Task<Actor, Item<UnknownExtra>[]> {
    throw new Error('Method not implemented.');
  }
  createGetOwnTask(actor: Actor): Task<Actor, Item<UnknownExtra>[]> {
    throw new Error('Method not implemented.');
  }
  createGetSharedWithTask(actor: Actor): Task<Actor, Item<UnknownExtra>[]> {
    throw new Error('Method not implemented.');
  }
}
