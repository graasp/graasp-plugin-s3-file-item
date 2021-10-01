import { FastifyLoggerInstance } from 'fastify';
import {
  Actor,
  DatabaseTransactionHandler,
  IndividualResultType,
  Item,
  PostHookHandlerType,
  PreHookHandlerType,
  TaskStatus,
} from 'graasp';
import { GRAASP_ACTOR } from '../constants';

// get from graasp
export interface Task<A extends Actor, T> {
  readonly name: string;
  readonly actor: A;
  targetId?: string;
  data?: Partial<IndividualResultType<T>>;
  status: TaskStatus;
  readonly result: T;
  readonly message?: string;
  readonly partialSubtasks?: boolean;
  run(
    handler: DatabaseTransactionHandler,
    log: FastifyLoggerInstance,
  ): Promise<void | Task<A, T>[]>;

  preHookHandler?: PreHookHandlerType<T>;
  postHookHandler?: PostHookHandlerType<T>;

  /**
   * skip the task if set to true
   */
  skip?: boolean;

  input?: unknown;

  /**
   * To to fetch and overwrite any values in the task's input
   */
  getInput?: () => unknown;
  /**
   * To get a modified "version" of what this task's result should be
   */
  getResult?: () => unknown;
}

type InputType = any;

export class MockTask implements Task<Actor, Item> {
  get name(): string {
    return 'name';
  }
  status = 'RUNNING' as TaskStatus;
  input: InputType;
  getInput: () => InputType;
  getResult: () => unknown;
  actor = GRAASP_ACTOR;
  result = null;
  _result = null;

  constructor(result?) {
    this.getResult = () => result;
    this.getInput = () => result;
  }

  async run(): Promise<void> {
    this.status = 'OK';
  }
}
