import fastify from 'fastify';
import { Item, ItemTaskManager, TaskRunner } from 'graasp';
import plugin from '../src/index';
import { GRAASP_ACTOR, PLUGIN_OPTIONS } from './constants';

const schemas = {
  $id: 'http://graasp.org/',
  definitions: {
    uuid: {
      type: 'string',
      pattern: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$',
    },
    idParam: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { $ref: '#/definitions/uuid' },
      },
      additionalProperties: false,
    },
  },
};

const build = async ({
  runner,
  taskManager,
  options,
}: {
  runner: TaskRunner<Item>;
  taskManager: ItemTaskManager;
  options?: any;
}) => {
  const app = fastify();
  app.addSchema(schemas);
  app.decorateRequest('member', GRAASP_ACTOR);

  app.decorate('taskRunner', runner);
  app.decorate('items', {
    taskManager,
  });

  await app.register(plugin, options ?? PLUGIN_OPTIONS);

  return app;
};
export default build;
