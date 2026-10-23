/// Monotonic time, independent of wall-clock adjustments. Manual input bypasses it.
class ScanGate {
  final Map<String, Duration> _lastAccepted = {};

  bool accept(String rawCode, Duration elapsed) {
    final code = rawCode.trim();
    final previous = _lastAccepted[code];
    if (previous != null && elapsed - previous < const Duration(seconds: 1)) {
      return false;
    }
    // Keep only the current cooldown window; unknown QR values cannot grow it forever.
    _lastAccepted.removeWhere(
      (_, time) => elapsed - time >= const Duration(seconds: 1),
    );
    _lastAccepted[code] = elapsed;
    return true;
  }

  void clear() => _lastAccepted.clear();
}
