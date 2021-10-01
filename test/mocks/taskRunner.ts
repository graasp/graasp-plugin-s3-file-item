import { FastifyLoggerInstance } from 'fastify';
import { Actor, Task, TaskRunner, PostHookHandlerType, PreHookHandlerType } from 'graasp';

export default class Runner implements TaskRunner<Actor> {
  runSingle<T>(task: Task<Actor, T>, log?: FastifyLoggerInstance): Promise<T> {
    throw new Error('Method not implemented.');
  }
  runMultiple(tasks: Task<Actor, unknown>[], log?: FastifyLoggerInstance): Promise<unknown[]> {
    throw new Error('Method not implemented.');
  }
  runSingleSequence(tasks: Task<Actor, unknown>[], log?: FastifyLoggerInstance): Promise<unknown> {
    throw new Error('Method not implemented.');
  }
  runMultipleSequences(
    tasks: Task<Actor, unknown>[][],
    log?: FastifyLoggerInstance,
  ): Promise<unknown> {
    throw new Error('Method not implemented.');
  }
  setTaskPreHookHandler<T>(taskName: string, handler: PreHookHandlerType<T, unknown>): void {}
  setTaskPostHookHandler<T>(taskName: string, handler: PostHookHandlerType<T, unknown>): void {}
  unsetTaskPreHookHandler<T>(taskName: string, handler: PreHookHandlerType<T, unknown>): void {
    throw new Error('Method not implemented.');
  }
  unsetTaskPostHookHandler<T>(taskName: string, handler: PostHookHandlerType<T, unknown>): void {
    throw new Error('Method not implemented.');
  }
}
