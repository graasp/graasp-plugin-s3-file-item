import S3 from 'aws-sdk/clients/s3';
import { ItemTaskManager, TaskRunner } from 'graasp-test';
import { StatusCodes } from 'http-status-codes';
import { GRAASP_ACTOR, ITEM_FILE, ITEM_FOLDER, PLUGIN_OPTIONS } from './constants';
import build from './app';
import { ITEM_TYPE } from '../src';
import { mockCreateTaskSequence, mockGetTaskSequence } from './mocks';

let s3Instance;
const taskManager = new ItemTaskManager();
const runner = new TaskRunner();

// todo: mock graasp-file-upload-limiter to avoid conflict in copy posthook
// this needs the module options type
// jest.spyOn(graaspFileUploadLimiter, 'default').mockImplementation(
//   async (_instance:FastifyInstance, _opts: GraaspFileUploadLimiterOptions, done) => {
//   done();
// })

describe('Plugin Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    s3Instance = new S3();
  });

  describe('Options', () => {
    it('Missing a parameter should throw', async () => {
      expect(
        async () =>
          await build({
            taskManager,
            runner,
            options: {
              s3Bucket: 's3Bucket',
              s3AccessKeyId: 's3Bucket',
              s3SecretAccessKey: 's3SecretAccessKey',
            },
          }),
      ).rejects.toThrow(Error);
      expect(
        async () =>
          await build({
            taskManager,
            runner,
            options: {
              s3Region: 's3Region',
              s3AccessKeyId: 's3AccessKeyId',
              s3SecretAccessKey: 's3SecretAccessKey',
            },
          }),
      ).rejects.toThrow(Error);
      expect(
        async () =>
          await build({
            taskManager,
            runner,
            options: {
              s3Region: 's3Region',
              s3Bucket: 's3Bucket',
              s3SecretAccessKey: 's3SecretAccessKey',
            },
          }),
      ).rejects.toThrow(Error);
      expect(
        async () =>
          await build({
            taskManager,
            runner,
            options: {
              s3Region: 's3Region',
              s3Bucket: 's3Bucket',
              s3AccessKeyId: 's3AccessKeyId',
            },
          }),
      ).rejects.toThrow(Error);
    });
  });

  describe('POST /s3-upload', () => {
    beforeEach(() => {
      jest.spyOn(runner, 'setTaskPostHookHandler').mockReturnValue();
      jest.spyOn(runner, 'setTaskPreHookHandler').mockReturnValue();
    });

    it('Successfully get S3 upload URL', async () => {
      const app = await build({ taskManager, runner });
      const item = ITEM_FILE;

      mockCreateTaskSequence(item);

      const res = await app.inject({
        method: 'POST',
        url: '/s3-upload',
        payload: { filename: item.name },
      });

      const response = res.json();
      expect(res.statusCode).toBe(StatusCodes.OK);
      expect(response.item.name).toEqual(item.name);
      expect(response.item.type).toEqual(ITEM_TYPE);
      expect(response.uploadUrl).toContain('string.s3.string.amazonaws.com');
      expect(response.uploadUrl).toContain(item.id);
    });

    it('Bad request if body is empty', async () => {
      const app = await build({ taskManager, runner });

      const res = await app.inject({
        method: 'POST',
        url: '/s3-upload',
      });

      expect(res.statusCode).toBe(StatusCodes.BAD_REQUEST);
    });

    it('Throw an error if S3 throws an error', async () => {
      const app = await build({ taskManager, runner });
      const item = ITEM_FILE;

      mockCreateTaskSequence(item);
      // mock getSignedUrlPromise
      const s3Error = 'this is an error from s3';
      jest.spyOn(S3.prototype, 'getSignedUrlPromise').mockImplementation(async () => {
        throw new Error(s3Error);
      });

      const res = await app.inject({
        method: 'POST',
        url: '/s3-upload',
        payload: { filename: item.name },
      });

      expect(res.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(res.json().message).toBe(s3Error);
    });

    it('Throw an error if task manager throws an error', async () => {
      const app = await build({ taskManager, runner });
      const item = ITEM_FILE;

      const taskManagerError = 'this is a task manager error';

      mockCreateTaskSequence(new Error(taskManagerError), true);

      const res = await app.inject({
        method: 'POST',
        url: '/s3-upload',
        payload: { filename: item.name },
      });

      expect(res.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(res.json().message).toBe(taskManagerError);
    });
  });

  describe('GET /s3-metadata', () => {
    beforeEach(() => {
      jest.spyOn(runner, 'setTaskPostHookHandler').mockReturnValue();
      jest.spyOn(runner, 'setTaskPreHookHandler').mockReturnValue();
    });

    it('Successfully get S3 upload URL', async () => {
      const item = ITEM_FILE;

      mockGetTaskSequence(item);

      const app = await build({ taskManager, runner, options: { s3Instance, ...PLUGIN_OPTIONS } });

      const res = await app.inject({
        method: 'GET',
        url: `${item.id}/s3-metadata`,
        payload: { filename: item.name },
      });

      expect(res.statusCode).toBe(StatusCodes.OK);
      // since size and contenttype are indefined, the return value is meaningless
    });
  });

  describe('Copy Pre Hook Handler', () => {
    it('Copy corresponding file on copy task', async () => {
      jest.spyOn(runner, 'setTaskPreHookHandler').mockImplementation(async (name, fn) => {
        if (name === taskManager.getCopyTaskName()) {
          const item = ITEM_FILE;
          const actor = GRAASP_ACTOR;
          s3Instance.copyObject = jest.fn().mockImplementation(() => ({ promise: jest.fn() }));
          await fn(item, actor, { log: undefined });
          expect(s3Instance.copyObject).toHaveBeenCalled();
        }
      });
      await build({ taskManager, runner, options: { s3Instance, ...PLUGIN_OPTIONS } });
    });

    it('Does nothing if item is not an s3file', async () => {
      jest.spyOn(runner, 'setTaskPreHookHandler').mockImplementation(async (name, fn) => {
        if (name === taskManager.getCopyTaskName()) {
          const item = ITEM_FOLDER;
          const actor = GRAASP_ACTOR;
          s3Instance.copyObject = jest.fn().mockImplementation(() => ({ promise: jest.fn() }));
          await fn(item, actor, { log: undefined });
          expect(s3Instance.copyObject).not.toHaveBeenCalled();
        }
      });
      await build({ taskManager, runner, options: { s3Instance, ...PLUGIN_OPTIONS } });
    });
  });

  describe('Delete Post Hook Handler', () => {
    it('Delete corresponding file on delete task', async () => {
      jest.spyOn(runner, 'setTaskPostHookHandler').mockImplementation((name, fn) => {
        if (name === taskManager.getDeleteTaskName()) {
          const item = ITEM_FILE;
          const actor = GRAASP_ACTOR;
          s3Instance.deleteObject = jest.fn().mockImplementation(() => ({
            promise: jest.fn().mockImplementation(() => ({ catch: jest.fn() })),
          }));
          fn(item, actor, { log: undefined });
          expect(s3Instance.deleteObject).toHaveBeenCalled();
        }
      });

      await build({ taskManager, runner, options: { s3Instance, ...PLUGIN_OPTIONS } });
    });

    it('Does nothing if item is not an s3file', async () => {
      jest.spyOn(runner, 'setTaskPostHookHandler').mockImplementation((name, fn) => {
        if (name === taskManager.getDeleteTaskName()) {
          const item = ITEM_FOLDER;
          const actor = GRAASP_ACTOR;
          s3Instance.deleteObject = jest.fn().mockImplementation(() => ({
            promise: jest.fn().mockImplementation(() => ({ catch: jest.fn() })),
          }));
          fn(item, actor, { log: undefined });
          expect(s3Instance.deleteObject).not.toHaveBeenCalled();
        }
      });

      await build({ taskManager, runner, options: { s3Instance, ...PLUGIN_OPTIONS } });
    });
  });
});
