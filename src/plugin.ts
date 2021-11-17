import { FastifyPluginAsync } from 'fastify';
import { IdParam, Item, ParentIdParam } from 'graasp';
import graaspFileUploadLimiter from 'graasp-file-upload-limiter';
import S3 from 'aws-sdk/clients/s3';
import { upload as uploadSchema, getMetadata as getMetadataSchema } from './schemas/shared';
import { TaskManager } from './tasks/task-manager';
import { GraaspS3FileItemOptions, S3FileItemExtra } from './interfaces/common';

export const S3_ITEM_TYPE = 's3File';
const ORIGINAL_FILENAME_TRUNCATE_LIMIT = 100;
const randomHexOf4 = () => ((Math.random() * (1 << 16)) | 0).toString(16).padStart(4, '0');

const plugin: FastifyPluginAsync<GraaspS3FileItemOptions> = async (fastify, options) => {
  const {
    s3Region: region,
    s3Bucket: bucket,
    s3AccessKeyId: accessKeyId,
    s3SecretAccessKey: secretAccessKey,
    s3UseAccelerateEndpoint: useAccelerateEndpoint = false,
    s3Expiration: expiration = 60, // 1 minute,
    s3Instance,
  } = options;
  const {
    items: { taskManager, dbService: itemService },
    taskRunner: runner,
    log: defaultLogger,
  } = fastify;

  if (!region || !bucket || !accessKeyId || !secretAccessKey) {
    throw new Error('graasp-s3-file-item: mandatory options missing');
  }

  // TODO: a Cache-Control policy is missing and
  // it's necessary to check how that policy is kept while copying
  // also: https://www.aaronfagan.ca/blog/2017/how-to-configure-aws-lambda-to-automatically-set-cache-control-headers-on-s3-objects/
  const s3 =
    s3Instance ??
    new S3({
      region,
      useAccelerateEndpoint,
      credentials: { accessKeyId, secretAccessKey },
    }); // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html

  const S3FileItemTaskManager = new TaskManager(itemService, s3, options);

  // register post delete handler to remove the s3 file object after item delete
  const deleteItemTaskName = taskManager.getDeleteTaskName();
  runner.setTaskPostHookHandler<Item<S3FileItemExtra>>(
    deleteItemTaskName,
    (item, _actor, { log = defaultLogger }) => {
      const {
        type: itemType,
        extra: { s3File },
      } = item;
      if (itemType !== S3_ITEM_TYPE || !s3File) return;
      const { key } = s3File;
      const params: S3.HeadObjectRequest = { Bucket: bucket, Key: key };
      s3.deleteObject(params)
        .promise()
        // using request's logger instance. can't use arrow fn because 'log.error' uses 'this'.
        .catch(function (error) {
          log.error(error, `graasp-s3-file-item: failed to delete s3 object \'${key}\'`);
        });
    },
  );

  // set up file upload limit
  await fastify.register(graaspFileUploadLimiter, {
    type: S3_ITEM_TYPE,
    sizePath: 's3File.size',
  });

  // register pre copy handler to make a copy of the s3 file object before the copy is actually created
  const copyItemTaskName = taskManager.getCopyTaskName();
  runner.setTaskPreHookHandler<Item<S3FileItemExtra>>(copyItemTaskName, async (item, actor) => {
    const { id, type: itemType, extra: { s3File } = {} } = item; // full copy with new `id`
    if (!id || itemType !== S3_ITEM_TYPE || !s3File) return;

    const { key, contenttype, name } = s3File;
    const metadata: S3.Metadata = { member: actor.id, item: id };
    const newKey = `${randomHexOf4()}/${randomHexOf4()}/${randomHexOf4()}-${Date.now()}`;

    const params: S3.CopyObjectRequest = {
      CopySource: `${bucket}/${key}`,
      Bucket: bucket,
      Key: newKey,
      Metadata: metadata,
      MetadataDirective: 'REPLACE',
      ContentDisposition: `attachment; filename="${name}"`,
      ContentType: contenttype,
      CacheControl: 'no-cache', // TODO: improve?
    };

    // TODO: the Cache-Control policy metadata is lost. try to set a global policy for the bucket in aws.
    await s3.copyObject(params).promise();

    s3File.key = newKey;
  });

  interface S3UploadBody {
    filename: string;
  }

  // trigger s3 file upload
  fastify.post<{ Querystring: ParentIdParam; Body: S3UploadBody }>(
    '/s3-upload',
    { schema: uploadSchema },
    async ({ member, query: { parentId }, body: { filename }, log }) => {
      const name = filename.substring(0, ORIGINAL_FILENAME_TRUNCATE_LIMIT);
      const key = `${randomHexOf4()}/${randomHexOf4()}/${randomHexOf4()}-${Date.now()}`;

      const itemData: Partial<Item<S3FileItemExtra>> = {
        name,
        type: S3_ITEM_TYPE,
        extra: { s3File: { name: filename, key } },
      };
      // create item
      const task = taskManager.createCreateTaskSequence(member, itemData, parentId);
      const item = (await runner.runSingleSequence(task, log)) as Item;

      // add member and item info to S3 object metadata
      const metadata = { member: member.id, item: item.id };

      const params = {
        Bucket: bucket,
        Key: key,
        Expires: expiration,
        Metadata: metadata,
        // currently does not work. more info here: https://github.com/aws/aws-sdk-js/issues/1703
        // the workaround is to do the upload (PUT) from the client with this request header.
        // ContentDisposition: `attachment; filename="<filename>"`
        // also does not work. should the client always send it when uploading the file?
        // CacheControl: 'no-cache'
      };

      // request s3 signed url to upload file
      try {
        const uploadUrl = await s3.getSignedUrlPromise('putObject', params);
        return { item, uploadUrl };
      } catch (error) {
        log.error(error, 'graasp-s3-file-item: failed to get signed url for upload');
        throw error;
      }
    },
  );

  // get (and update) s3 file item metadata - item's 'extra'
  fastify.get<{ Params: IdParam }>(
    '/:id/s3-metadata',
    { schema: getMetadataSchema },
    async ({ member, params: { id }, log }) => {
      const t1 = taskManager.createGetTaskSequence(member, id);
      const t2 = S3FileItemTaskManager.createGetMetadataFromItemTask(member);
      t2.getInput = () => ({ item: t1[0].result });
      return runner.runSingleSequence([...t1, t2], log);
    },
  );
};

export default plugin;
