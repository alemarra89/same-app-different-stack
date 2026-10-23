import 'package:flutter/foundation.dart';

import '../data/event_seed.dart';
import '../models/participant.dart';
import '../storage/check_in_store.dart';
import 'check_in.dart';
import 'scan_gate.dart';

class CheckInController extends ChangeNotifier {
  CheckInController(this._store);

  final CheckInStore _store;
  final ScanGate _scanGate = ScanGate();
  final Stopwatch _clock = Stopwatch()..start();
  List<Participant> _participants = initialParticipants;
  bool _disposed = false;
  bool ready = false;
  bool busy = false;
  String? message;
  bool messageIsError = false;

  List<Participant> get participants => List.unmodifiable(_participants);
  int get presentCount => _participants.where((p) => p.isPresent).length;

  void _emit() {
    if (!_disposed) notifyListeners();
  }

  Future<void> initialize() async {
    if (busy || ready) return;
    busy = true;
    _emit();
    try {
      final ids = await _store.load();
      _participants = [
        for (final p in initialParticipants) p.withPresence(ids.contains(p.id)),
      ];
      ready = true;
      message = null;
      messageIsError = false;
    } catch (_) {
      message = 'Impossibile leggere i check-in salvati. Riprova.';
      messageIsError = true;
    } finally {
      busy = false;
      _emit();
    }
  }

  Future<void> checkIn(String code, {bool fromScanner = false}) async {
    if (!ready || busy) return;
    if (fromScanner && !_scanGate.accept(code, _clock.elapsed)) return;
    busy = true;
    _emit();
    final result = processCheckIn(code, _participants);
    try {
      if (result.status == CheckInStatus.success) {
        await _store.save({
          for (final p in result.participants)
            if (p.isPresent) p.id,
        });
        _participants = result.participants;
      }
      message = result.message;
      messageIsError = result.status != CheckInStatus.success;
    } catch (_) {
      message = 'Salvataggio non riuscito. Check-in non registrato: riprova.';
      messageIsError = true;
      _scanGate.clear();
    } finally {
      busy = false;
      _emit();
    }
  }

  Future<void> reset() async {
    if (!ready || busy) return;
    busy = true;
    _emit();
    try {
      await _store.save({});
      _participants = initialParticipants;
      _scanGate.clear();
      message = 'Demo reimpostata';
      messageIsError = false;
    } catch (_) {
      message = 'Reimpostazione non riuscita. Riprova.';
      messageIsError = true;
    } finally {
      busy = false;
      _emit();
    }
  }

  @override
  void dispose() {
    _disposed = true;
    _clock.stop();
    super.dispose();
  }
}
