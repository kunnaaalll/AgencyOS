"""
AgencyOS V2.1 — Token Blacklist (Redis-backed)
Supports token revocation via jti (JWT ID) stored in Redis with TTL.
"""

from datetime import UTC, datetime

import structlog

from core.redis import get_redis

logger = structlog.get_logger(__name__)

TOKEN_BLACKLIST_PREFIX = "token:revoked:"


async def revoke_token(jti: str, expires_at: datetime) -> None:
    """
    Add a token's jti to the revocation list.
    TTL is set to the token's remaining lifetime so Redis auto-cleans.
    """
    redis = await get_redis()
    now = datetime.now(UTC)
    ttl_seconds = max(int((expires_at - now).total_seconds()), 1)

    key = f"{TOKEN_BLACKLIST_PREFIX}{jti}"
    await redis.setex(key, ttl_seconds, "1")
    logger.info("Token revoked", jti=jti, ttl_seconds=ttl_seconds)


async def is_token_revoked(jti: str) -> bool:
    """Check if a token's jti is in the revocation list."""
    if not jti:
        return False
    redis = await get_redis()
    key = f"{TOKEN_BLACKLIST_PREFIX}{jti}"
    result = await redis.exists(key)
    return bool(result)


async def revoke_all_user_tokens(user_id: str) -> None:
    """
    Mark all tokens for a user as revoked by storing user_id.
    Uses a separate key pattern for bulk revocation.
    """
    redis = await get_redis()
    key = f"user:tokens_revoked:{user_id}"
    # Set with 24h TTL (covers max refresh token lifetime)
    await redis.setex(key, 86400, str(datetime.now(UTC).timestamp()))
    logger.info("All user tokens revoked", user_id=user_id)


async def is_user_tokens_revoked(user_id: str, token_iat: datetime) -> bool:
    """Check if a user's tokens were bulk-revoked after this token was issued."""
    redis = await get_redis()
    key = f"user:tokens_revoked:{user_id}"
    revoked_at = await redis.get(key)
    if not revoked_at:
        return False
    return token_iat.timestamp() < float(revoked_at)
