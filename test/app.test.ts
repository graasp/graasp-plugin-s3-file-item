import S3 from 'aws-sdk/clients/s3';
import { TaskManager, TaskRunner } from 'graasp-test';
import { Request, Service } from 'aws-sdk';
import { StatusCodes } from 'http-status-codes';
import {
  GRAASP_ACTOR,
  ITEM_FILE,
  ITEM_FILE_WITH_METADATA,
  ITEM_FOLDER,
  PLUGIN_OPTIONS,
} from './constants';
import build from './app';
import { ITEM_TYPE } from '../src';
import { NotS3FileItem } from '../src/utils/errors';
import { mockCreateTaskSequence, mockGetTaskSequence, mockUpdateTaskSequence } from './mocks';

let s3Instance;
const taskManager = new TaskManager();
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
      jest.clearAllMocks();
    });

    it('Successfully get S3 upload URL', async () => {
      const item = ITEM_FILE;

      mockGetTaskSequence(item);
      const mockUpdateTask = mockUpdateTaskSequence(item);

      // mock s3 call, it returns anything
      s3Instance.headObject = jest.fn(() => new Request(new Service(), 'string'));

      const app = await build({ taskManager, runner, options: { s3Instance, ...PLUGIN_OPTIONS } });

      const res = await app.inject({
        method: 'GET',
        url: `${item.id}/s3-metadata`,
        payload: { filename: item.name },
      });

      expect(res.statusCode).toBe(StatusCodes.OK);
      expect(mockUpdateTask).toHaveBeenCalled();
      // since size and contenttype are indefined, the return value is empty
    });

    it('Does not update if item already has metadata', async () => {
      const item = ITEM_FILE_WITH_METADATA;

      mockGetTaskSequence(item);
      const mockUpdateTask = mockUpdateTaskSequence(item);

      const app = await build({ taskManager, runner, options: { s3Instance, ...PLUGIN_OPTIONS } });

      const res = await app.inject({
        method: 'GET',
        url: `${item.id}/s3-metadata`,
        payload: { filename: item.name },
      });
      const response = res.json();
      expect(response).toMatchObject(item.extra.s3File);
      expect(mockUpdateTask).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(StatusCodes.OK);
    });

    it('Throw if item is not a s3file', async () => {
      const item = ITEM_FOLDER;

      mockGetTaskSequence(item);
      const app = await build({ taskManager, runner });

      const res = await app.inject({
        method: 'GET',
        url: `${item.id}/s3-metadata`,
        payload: { filename: item.name },
      });

      const response = res.json();
      expect(response).toEqual(new NotS3FileItem(item.id));
    });

    it('Throw if s3 throws an error', async () => {
      const item = ITEM_FILE;

      mockGetTaskSequence(item);

      // mock s3 call, it throws an error
      const error = 'this is a s3 error';
      s3Instance.headObject = jest
        .fn()
        .mockImplementation(() => ({ promise: jest.fn().mockRejectedValue(new Error(error)) }));

      const app = await build({ taskManager, runner, options: { s3Instance, ...PLUGIN_OPTIONS } });

      const res = await app.inject({
        method: 'GET',
        url: `${item.id}/s3-metadata`,
        payload: { filename: item.name },
      });

      const response = res.json();
      expect(response.message).toEqual(error);
      expect(res.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
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
