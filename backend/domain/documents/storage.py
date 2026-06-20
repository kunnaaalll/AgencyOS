"""
AgencyOS V2 — Storage Service
"""

import uuid
from datetime import timedelta

from fastapi import UploadFile
from minio.error import S3Error

from core.config import settings
from core.minio import get_minio_client


class StorageService:
    @staticmethod
    async def upload_file(
        file: UploadFile,
        bucket: str = settings.MINIO_BUCKET_NAME,
        prefix: str = ""
    ) -> str:
        """
        Uploads a file to MinIO and returns the storage key.
        """
        client = get_minio_client()
        if not client.bucket_exists(bucket):
            client.make_bucket(bucket)

        file_id = str(uuid.uuid4())
        ext = ""
        if file.filename and "." in file.filename:
            ext = f".{file.filename.split('.')[-1]}"

        storage_key = f"{prefix}{file_id}{ext}" if prefix else f"{file_id}{ext}"

        # Read file into memory or stream it
        file_size = -1
        client.put_object(
            bucket_name=bucket,
            object_name=storage_key,
            data=file.file,
            length=file_size,
            part_size=10*1024*1024, # 10MB chunks
            content_type=file.content_type
        )
        return storage_key

    @staticmethod
    async def generate_presigned_url(
        storage_key: str,
        bucket: str = settings.MINIO_BUCKET_NAME,
        expires_in_hours: int = 24
    ) -> str:
        """
        Generate a presigned GET URL for a file.
        """
        client = get_minio_client()
        return client.presigned_get_object(
            bucket_name=bucket,
            object_name=storage_key,
            expires=timedelta(hours=expires_in_hours)
        )

    @staticmethod
    async def delete_file(
        storage_key: str,
        bucket: str = settings.MINIO_BUCKET_NAME
    ) -> None:
        """
        Delete a file from MinIO.
        """
        client = get_minio_client()
        try:
            client.remove_object(bucket, storage_key)
        except S3Error:
            pass # Ignore if not found
