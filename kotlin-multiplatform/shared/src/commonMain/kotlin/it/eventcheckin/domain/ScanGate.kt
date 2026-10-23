package it.eventcheckin.domain

import kotlin.time.TimeSource

/** Sliding one-second window, per trimmed code. Manual entry is never throttled. */
class ScanGate(private val nowMillis: () -> Long = monotonicMillis()) {
    private val recent = mutableMapOf<String, Long>()

    fun accept(code: String): Boolean {
        val now = nowMillis()
        recent.entries.removeAll { now - it.value >= 1_000 }
        val normalized = code.trim()
        if (normalized in recent) return false
        recent[normalized] = now
        return true
    }

    fun clear() = recent.clear()
}

private fun monotonicMillis(): () -> Long {
    val start = TimeSource.Monotonic.markNow()
    return { start.elapsedNow().inWholeMilliseconds }
}
