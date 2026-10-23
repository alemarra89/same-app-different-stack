import 'package:event_check_in/data/event_seed.dart';
import 'package:event_check_in/logic/check_in.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('seed invariabile e nessun presente', () {
    expect(initialParticipants.map((p) => '${p.id}:${p.name}'), [
      'EVT-001:Giulia Rossi',
      'EVT-002:Marco Bianchi',
      'EVT-003:Sara De Luca',
      'EVT-004:Davide Greco',
      'EVT-005:Fabio Conti',
      'EVT-006:Ivan Moretti',
    ]);
    expect(initialParticipants.any((p) => p.isPresent), isFalse);
  });

  test('valido: nuova lista, Giulia presente, input immutato', () {
    final result = processCheckIn('EVT-001', initialParticipants);
    expect(result.status, CheckInStatus.success);
    expect(result.participant!.name, 'Giulia Rossi');
    expect(result.participants.where((p) => p.isPresent).length, 1);
    expect(initialParticipants.first.isPresent, isFalse);
    expect(() => result.participants.clear(), throwsUnsupportedError);
  });

  test('duplicato: nessun incremento, messaggio esatto', () {
    final first = processCheckIn('EVT-001', initialParticipants);
    final result = processCheckIn('EVT-001', first.participants);
    expect(result.status, CheckInStatus.alreadyPresent);
    expect(result.message, 'Check-in già effettuato');
    expect(result.participants.where((p) => p.isPresent).length, 1);
  });

  test('sconosciuto: stato invariato, messaggio esatto', () {
    final result = processCheckIn('ERR-999', initialParticipants);
    expect(result.status, CheckInStatus.invalid);
    expect(result.message, 'QR non valido');
    expect(result.participants.any((p) => p.isPresent), isFalse);
  });

  test('trim di spazi, tab e newline', () {
    expect(
      processCheckIn(' \tEVT-001\n ', initialParticipants).status,
      CheckInStatus.success,
    );
  });

  test('payload strettamente ID: niente URL, JSON o case conversion', () {
    for (final code in [
      '',
      '   ',
      'evt-001',
      'https://example.org/EVT-001',
      '{"id":"EVT-001"}',
    ]) {
      expect(
        processCheckIn(code, initialParticipants).status,
        CheckInStatus.invalid,
      );
    }
  });
}
