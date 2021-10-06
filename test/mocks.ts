import { Item } from "graasp";
import {Task as MockTask, TaskRunner as MockTaskRunner, TaskManager as MockTaskManager} from 'graasp-test';

// using multiple mocks updates runSingleSequence multiple times

export const mockCreateTaskSequence = (data: Partial<Item> | Error, shouldThrow?: boolean): jest.SpyInstance => {
    const mockCreateTask = jest.spyOn(MockTaskManager.prototype, 'createCreateTaskSequence').mockImplementation(() => {
        return [new MockTask(data)];
    });
    jest.spyOn(MockTaskRunner.prototype, 'runSingleSequence').mockImplementation(async () => {
        if (shouldThrow)
            throw data;
        return data;
    });
    return mockCreateTask;
};


export const mockGetTaskSequence = (data: Partial<Item> | Error, shouldThrow?: boolean): jest.SpyInstance => {
    const mockCreateTask = jest.spyOn(MockTaskManager.prototype, 'createGetTaskSequence').mockImplementation(() => {
        return [new MockTask(data)];
    });
    jest.spyOn(MockTaskRunner.prototype, 'runSingleSequence').mockImplementation(async () => {
        if (shouldThrow)
            throw data;
        return data;
    });
    return mockCreateTask;
};


export const mockUpdateTaskSequence = (item: Partial<Item> | Error): jest.SpyInstance => {

    const mockUpdateTask = jest.spyOn(MockTaskManager.prototype, 'createUpdateTaskSequence').mockImplementation((_m, _id, itemData) => {
        expect(itemData?.extra?.s3File).toHaveProperty('size');
        expect(itemData?.extra?.s3File).toHaveProperty('contenttype');
        return [new MockTask({ ...item, ...itemData })];
    });

    jest.spyOn(MockTaskRunner.prototype, 'runSingleSequence').mockImplementation(async (tasks) => {
        return tasks[0]?.getResult();
    });

    return mockUpdateTask;
};
