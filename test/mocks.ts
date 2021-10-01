import { Item } from "graasp";
import { MockTask } from "./mocks/task";
import TaskManager from "./mocks/taskManager";
import TaskRunner from './mocks/taskRunner';

// using multiple mocks updates runSingleSequence multiple times

export const mockCreateTaskSequence = (data: Partial<Item> | Error, shouldThrow?: boolean): jest.SpyInstance => {
    const mockCreateTask = jest.spyOn(TaskManager.prototype, 'createCreateTaskSequence').mockImplementation(() => {
        return [new MockTask(data)];
    });
    jest.spyOn(TaskRunner.prototype, 'runSingleSequence').mockImplementation(async () => {
        if (shouldThrow)
            throw data;
        return data;
    });
    return mockCreateTask;
};


export const mockGetTaskSequence = (data: Partial<Item> | Error, shouldThrow?: boolean): jest.SpyInstance => {
    const mockCreateTask = jest.spyOn(TaskManager.prototype, 'createGetTaskSequence').mockImplementation(() => {
        return [new MockTask(data)];
    });
    jest.spyOn(TaskRunner.prototype, 'runSingleSequence').mockImplementation(async () => {
        if (shouldThrow)
            throw data;
        return data;
    });
    return mockCreateTask;
};


export const mockUpdateTaskSequence = (item: Partial<Item> | Error): jest.SpyInstance => {

    const mockUpdateTask = jest.spyOn(TaskManager.prototype, 'createUpdateTaskSequence').mockImplementation((_m, _id, itemData) => {
        expect(itemData?.extra?.s3File).toHaveProperty('size');
        expect(itemData?.extra?.s3File).toHaveProperty('contenttype');
        return [new MockTask({ ...item, ...itemData })];
    });

    jest.spyOn(TaskRunner.prototype, 'runSingleSequence').mockImplementation(async (tasks) => {
        return tasks[0]?.getResult();
    });

    return mockUpdateTask;
};
