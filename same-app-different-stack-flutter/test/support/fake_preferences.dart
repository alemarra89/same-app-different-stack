import 'package:shared_preferences/shared_preferences.dart';
import 'package:shared_preferences_platform_interface/in_memory_shared_preferences_async.dart';
import 'package:shared_preferences_platform_interface/shared_preferences_async_platform_interface.dart';

/// Fake of the platform boundary, not a claim about durable native storage.
class FakePreferences extends SharedPreferencesAsync {
  factory FakePreferences() {
    SharedPreferencesAsyncPlatform.instance =
        InMemorySharedPreferencesAsync.empty();
    return FakePreferences._();
  }

  FakePreferences._();
  final Map<String, List<String>> values = {};
  final _state = _PreferenceState();
  bool get failRead => _state.failRead;
  set failRead(bool value) => _state.failRead = value;
  bool get failWrite => _state.failWrite;
  set failWrite(bool value) => _state.failWrite = value;
  int get writes => _state.writes;

  @override
  Future<List<String>?> getStringList(String key) async {
    if (failRead) throw StateError('read failed');
    final value = values[key];
    return value == null ? null : List.of(value);
  }

  @override
  Future<void> setStringList(String key, List<String> value) async {
    if (failWrite) throw StateError('write failed');
    _state.writes++;
    values[key] = List.of(value);
  }
}

class _PreferenceState {
  bool failRead = false;
  bool failWrite = false;
  int writes = 0;
}
