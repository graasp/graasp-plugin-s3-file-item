import { UnknownExtra } from 'graasp';
import S3 from 'aws-sdk/clients/s3';

export type S3FileExtraContent = {
  name: string;
  key: string;
  size?: number;
  contenttype?: string;
};

export interface S3FileItemExtra extends UnknownExtra {
  s3File: S3FileExtraContent;
}

export interface GraaspS3FileItemOptions {
  s3Region: string;
  s3Bucket: string;
  s3AccessKeyId: string;
  s3SecretAccessKey: string;
  s3UseAccelerateEndpoint?: boolean;
  s3Expiration?: number;
  s3Instance?: S3;
}
