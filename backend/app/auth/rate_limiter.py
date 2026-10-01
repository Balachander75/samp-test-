"""
In-memory thread-safe sliding window rate limiter for authentication endpoints.
Protects against brute-force and dictionary attacks without external Redis dependency.
"""
import time
import threading
from typing import Dict, List, Tuple


class SlidingWindowRateLimiter:
    def __init__(self):
        self._lock = threading.Lock()
        self._buckets: Dict[str, List[float]] = {}
        self._last_pruned: float = time.time()

    def _prune_stale(self, now: float, max_age: float = 300.0) -> None:
        """Periodic cleanup to prevent memory bloat from old IPs."""
        if now - self._last_pruned < 60.0:
            return
        self._last_pruned = now
        stale_keys = [
            k for k, timestamps in self._buckets.items()
            if not timestamps or (now - timestamps[-1] > max_age)
        ]
        for k in stale_keys:
            self._buckets.pop(k, None)

    def is_rate_limited(self, key: str, max_attempts: int = 5, window_seconds: int = 60) -> Tuple[bool, int]:
        """
        Check if a given key has exceeded the maximum attempts within the window.
        Returns (is_limited, retry_after_seconds).
        """
        now = time.time()
        with self._lock:
            self._prune_stale(now)
            timestamps = self._buckets.get(key, [])
            # Keep only timestamps within window
            valid_timestamps = [t for t in timestamps if now - t < window_seconds]
            self._buckets[key] = valid_timestamps

            if len(valid_timestamps) >= max_attempts:
                oldest_in_window = valid_timestamps[0]
                retry_after = max(1, int(window_seconds - (now - oldest_in_window)))
                return True, retry_after

            return False, 0

    def record_attempt(self, key: str) -> None:
        """Record an attempt timestamp for the key."""
        now = time.time()
        with self._lock:
            if key not in self._buckets:
                self._buckets[key] = []
            self._buckets[key].append(now)

    def reset_key(self, key: str) -> None:
        """Clear attempts for a key (typically called on successful authentication)."""
        with self._lock:
            self._buckets.pop(key, None)


login_rate_limiter = SlidingWindowRateLimiter()
