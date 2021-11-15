import { v4 } from 'uuid';
import { Actor, Item } from 'graasp';
import { ITEM_TYPE } from '../src/plugin';

export const ROOT_PATH = './test/files';
export const FILE_PATHS = ['./test/files/1.txt', './test/files/2.pdf'];

export const ITEM_FILE: Partial<Item> = {
  id: v4(),
  name: 'item-file',
  type: ITEM_TYPE,
  extra: {
    s3File: {},
  },
};

export const ITEM_FILE_WITH_METADATA: Partial<Item> = {
  id: v4(),
  name: 'item-file-with-metadata',
  type: ITEM_TYPE,
  extra: {
    s3File: {
      name: '1.txt',
      path: '1.txt',
      size: 1594447,
      key: 'key',
      contenttype: 'contenttype',
    },
  },
};

export const ITEM_FOLDER = {
  id: v4(),
  name: 'item-folder',
  type: 'folder',
  extra: {},
};

export const GRAASP_ACTOR: Actor = {
  id: 'actorid',
};

export const PLUGIN_OPTIONS = {
  s3Region: 'string',
  s3Bucket: 'string',
  s3AccessKeyId: 'string',
  s3SecretAccessKey: 'string',
  onFileUploaded: () => [],
  downloadValidation: () => []
};
