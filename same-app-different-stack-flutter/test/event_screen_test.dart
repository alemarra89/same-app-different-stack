import 'package:event_check_in/main.dart';
import 'package:event_check_in/storage/check_in_store.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'support/fake_preferences.dart';

void main() {
  testWidgets(
    'flusso manuale: valido, duplicato, sconosciuto, ricerca e reset con conferma',
    (tester) async {
      tester.view.physicalSize = const Size(800, 2400);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      final preferences = FakePreferences();
      await tester.pumpWidget(
        EventCheckInApp(
          store: PreferencesCheckInStore(preferences: preferences),
        ),
      );
      await tester.pumpAndSettle();
      expect(find.text('0 / 6 presenti'), findsOneWidget);

      Future<void> submit(String value) async {
        await tester.ensureVisible(find.byKey(const Key('manual-code')));
        await tester.enterText(find.byKey(const Key('manual-code')), value);
        await tester.testTextInput.receiveAction(TextInputAction.done);
        await tester.pumpAndSettle();
      }

      await submit(' EVT-001 ');
      expect(find.text('1 / 6 presenti'), findsOneWidget);
      expect(find.text('Check-in effettuato: Giulia Rossi'), findsOneWidget);
      await submit('EVT-001');
      expect(find.text('Check-in già effettuato'), findsOneWidget);
      expect(find.text('1 / 6 presenti'), findsOneWidget);
      await submit('ERR-999');
      expect(find.text('QR non valido'), findsOneWidget);
      expect(find.text('1 / 6 presenti'), findsOneWidget);

      final search = find.widgetWithText(TextField, 'Cerca per nome o ID');
      await tester.ensureVisible(search);
      await tester.enterText(search, 'giulia');
      await tester.pumpAndSettle();
      expect(find.text('Giulia Rossi'), findsOneWidget);
      expect(find.text('Presente'), findsOneWidget);
      expect(find.text('Marco Bianchi'), findsNothing);

      await tester.ensureVisible(find.text('Reimposta demo'));
      await tester.tap(find.text('Reimposta demo'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Annulla'));
      await tester.pumpAndSettle();
      expect(find.text('1 / 6 presenti'), findsOneWidget);
      await tester.tap(find.text('Reimposta demo'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Reimposta'));
      await tester.pumpAndSettle();
      expect(find.text('0 / 6 presenti'), findsOneWidget);
      expect(tester.takeException(), isNull);
    },
  );

  testWidgets('schermo 320px e testo ingrandito: nessun overflow', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(320, 700);
    tester.view.devicePixelRatio = 1;
    tester.platformDispatcher.textScaleFactorTestValue = 2;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    addTearDown(tester.platformDispatcher.clearTextScaleFactorTestValue);
    await tester.pumpWidget(
      EventCheckInApp(
        store: PreferencesCheckInStore(preferences: FakePreferences()),
      ),
    );
    await tester.pumpAndSettle();
    await tester.scrollUntilVisible(
      find.text('Reimposta demo'),
      200,
      scrollable: find.byType(Scrollable).first,
    );
    expect(tester.takeException(), isNull);
  });

  testWidgets(
    'scanner non supportato: ritorno al modulo manuale',
    (tester) async {
      await tester.pumpWidget(
        EventCheckInApp(
          store: PreferencesCheckInStore(preferences: FakePreferences()),
        ),
      );
      await tester.pumpAndSettle();
      await tester.tap(find.text('Scansiona QR'));
      await tester.pumpAndSettle();
      expect(find.textContaining('Scanner non supportato'), findsOneWidget);
      await tester.tap(find.text('Inserisci codice manualmente'));
      await tester.pumpAndSettle();
      expect(find.byKey(const Key('manual-code')), findsOneWidget);
      expect(tester.takeException(), isNull);
    },
    variant: TargetPlatformVariant({TargetPlatform.windows}),
  );
}
