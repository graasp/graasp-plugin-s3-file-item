import { FastifyLoggerInstance } from 'fastify';
import { Task, TaskStatus, Actor, DatabaseTransactionHandler, PreHookHandlerType, PostHookHandlerType } from 'graasp';

export abstract class BaseTask<R> implements Task<Actor, R> {
  protected _result: R;
  protected _message: string;
  preHookHandler?: PreHookHandlerType<R>;
  postHookHandler?: PostHookHandlerType<R>;

  readonly actor: Actor;

  status: TaskStatus;
  targetId: string;

  constructor(actor: Actor) {
    this.actor = actor;
    this.status = 'NEW';
  }

  abstract get name(): string;
  get result(): R {
    return this._result;
  }
  get message(): string {
    return this._message;
  }

  getResult?: () => unknown;

  abstract run(
    handler: DatabaseTransactionHandler,
    log: FastifyLoggerInstance,
  ): Promise<void | BaseTask<R>[]>;
}
