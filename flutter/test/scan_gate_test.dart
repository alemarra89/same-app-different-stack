import 'package:event_check_in/logic/scan_gate.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('stesso codice bloccato per 1000ms, anche con spazi', () {
    final gate = ScanGate();
    expect(gate.accept('EVT-001', Duration.zero), isTrue);
    expect(
      gate.accept(' EVT-001 ', const Duration(milliseconds: 999)),
      isFalse,
    );
    expect(gate.accept('EVT-001', const Duration(seconds: 1)), isTrue);
  });

  test('codici diversi accettati, alternare non aggira il blocco', () {
    final gate = ScanGate();
    expect(gate.accept('EVT-001', Duration.zero), isTrue);
    expect(gate.accept('EVT-002', Duration.zero), isTrue);
    expect(gate.accept('EVT-001', Duration.zero), isFalse);
    gate.clear();
    expect(gate.accept('EVT-001', Duration.zero), isTrue);
  });
}
