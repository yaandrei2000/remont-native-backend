import {
	DeleteObjectCommand,
	type DeleteObjectCommandInput,
	GetObjectCommand,
	GetObjectCommandInput,
	PutObjectCommand,
	type PutObjectCommandInput,
	S3Client
} from '@aws-sdk/client-s3'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Readable } from 'stream'

@Injectable()
export class StorageService {
	private readonly client: S3Client
	private readonly bucket: string

	public constructor(private readonly configService: ConfigService) {
		this.client = new S3Client({
			endpoint: this.configService.getOrThrow<string>('S3_ENDPOINT'),
			region: this.configService.getOrThrow<string>('S3_REGION'),
			credentials: {
				accessKeyId:
					this.configService.getOrThrow<string>('S3_ACCESS_KEY_ID'),
				secretAccessKey: this.configService.getOrThrow<string>(
					'S3_SECRET_ACCESS_KEY'
				)
			}
		})

		this.bucket = this.configService.getOrThrow<string>('S3_BUCKET_NAME')
	}

	public async upload(buffer: Buffer, key: string, mimetype: string): Promise<void> {
		const command: PutObjectCommandInput = {
			Bucket: this.bucket,
			Key: String(key),
			Body: buffer,
			ContentType: mimetype
		}

		try {
			await this.client.send(new PutObjectCommand(command))
		} catch (error) {
			throw error
		}
	}

	public async remove(key: string): Promise<void> {
		const command: DeleteObjectCommandInput = {
			Bucket: this.bucket,
			Key: String(key)
		}

		try {
			await this.client.send(new DeleteObjectCommand(command))
		} catch (error) {
			throw error
		}
	}

	public async get(key: string): Promise<Buffer> {
		const command: GetObjectCommandInput = {
			Bucket: this.bucket,
			Key: String(key)
		}

		try {
			const { Body } = await this.client.send(new GetObjectCommand(command))

			if (!Body) {
				throw new Error('Файл не найден в S3')
			}

			const stream = Body as Readable

			const chunks: Buffer[] = []

			for await (const chunk of stream) {
				chunks.push(chunk as Buffer)
			}

			return Buffer.concat(chunks)
		} catch (error) {
			throw error
		}
	}
}
