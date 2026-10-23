import 'package:shared_preferences/shared_preferences.dart';

abstract interface class CheckInStore {
  Future<Set<String>> load();
  Future<void> save(Set<String> presentIds);
}

class PreferencesCheckInStore implements CheckInStore {
  PreferencesCheckInStore({SharedPreferencesAsync? preferences})
    : _preferences = preferences ?? SharedPreferencesAsync();

  static const storageKey = 'event_check_in.tech_meetup_2026.present_ids';
  final SharedPreferencesAsync _preferences;

  @override
  Future<Set<String>> load() async =>
      (await _preferences.getStringList(storageKey) ?? <String>[]).toSet();

  @override
  Future<void> save(Set<String> presentIds) async {
    // Persist only IDs; names, event details and search stay out of storage.
    await _preferences.setStringList(storageKey, presentIds.toList()..sort());
  }
}
