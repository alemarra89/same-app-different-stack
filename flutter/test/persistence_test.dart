import 'package:event_check_in/logic/check_in_controller.dart';
import 'package:event_check_in/storage/check_in_store.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences_platform_interface/in_memory_shared_preferences_async.dart';
import 'package:shared_preferences_platform_interface/shared_preferences_async_platform_interface.dart';

import 'support/fake_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test(
    'adapter reale SharedPreferencesAsync su backend ufficiale in memoria',
    () async {
      SharedPreferencesAsyncPlatform.instance =
          InMemorySharedPreferencesAsync.empty();
      final store = PreferencesCheckInStore();
      expect(await store.load(), isEmpty);
      await store.save({'EVT-002', 'EVT-001'});
      final reopened = PreferencesCheckInStore();
      expect(await reopened.load(), {'EVT-001', 'EVT-002'});
      await reopened.save({});
      expect(await store.load(), isEmpty);
    },
  );

  test(
    'persistenza: nuovo store e controller ripristinano i check-in; reset persistito',
    () async {
      final preferences = FakePreferences();
      final first = CheckInController(
        PreferencesCheckInStore(preferences: preferences),
      );
      await first.initialize();
      expect(first.presentCount, 0);
      await first.checkIn('EVT-001');
      await first.checkIn('EVT-001');
      await first.checkIn('ERR-999');
      expect(first.presentCount, 1);
      expect(preferences.writes, 1);
      expect(preferences.values, {
        PreferencesCheckInStore.storageKey: ['EVT-001'],
      });
      first.dispose();

      final second = CheckInController(
        PreferencesCheckInStore(preferences: preferences),
      );
      await second.initialize();
      expect(second.presentCount, 1);
      expect(second.participants.first.isPresent, isTrue);
      await second.reset();
      second.dispose();

      final third = CheckInController(
        PreferencesCheckInStore(preferences: preferences),
      );
      await third.initialize();
      expect(third.presentCount, 0);
      third.dispose();
    },
  );

  test(
    'errore scrittura: niente falso successo, reset fallito conserva stato',
    () async {
      final preferences = FakePreferences();
      final controller = CheckInController(
        PreferencesCheckInStore(preferences: preferences),
      );
      await controller.initialize();
      preferences.failWrite = true;
      await controller.checkIn('EVT-001');
      expect(controller.presentCount, 0);
      expect(controller.messageIsError, isTrue);
      preferences.failWrite = false;
      await controller.checkIn('EVT-001');
      preferences.failWrite = true;
      await controller.reset();
      expect(controller.presentCount, 1);
      expect(controller.messageIsError, isTrue);
      controller.dispose();
    },
  );

  test(
    'errore lettura: blocca modifiche fino a un caricamento riuscito',
    () async {
      final preferences = FakePreferences()..failRead = true;
      final controller = CheckInController(
        PreferencesCheckInStore(preferences: preferences),
      );
      await controller.initialize();
      expect(controller.ready, isFalse);
      await controller.checkIn('EVT-001');
      expect(preferences.writes, 0);
      preferences.failRead = false;
      await controller.initialize();
      expect(controller.ready, isTrue);
      controller.dispose();
    },
  );

  test(
    'ID sconosciuti salvati sono ignorati, niente partecipanti aggiunti',
    () async {
      final preferences = FakePreferences();
      preferences.values[PreferencesCheckInStore.storageKey] = [
        'EVT-002',
        'ERR-999',
      ];
      final controller = CheckInController(
        PreferencesCheckInStore(preferences: preferences),
      );
      await controller.initialize();
      expect(controller.participants.length, 6);
      expect(controller.presentCount, 1);
      controller.dispose();
    },
  );

  test('scritture sovrapposte bloccate', () async {
    final controller = CheckInController(
      PreferencesCheckInStore(preferences: FakePreferences()),
    );
    await controller.initialize();
    final pending = controller.checkIn('EVT-001');
    await controller.checkIn('EVT-002');
    await pending;
    expect(controller.presentCount, 1);
    controller.dispose();
  });
}
