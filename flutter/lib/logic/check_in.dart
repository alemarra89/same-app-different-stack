import '../models/participant.dart';

enum CheckInStatus { success, alreadyPresent, invalid }

class CheckInResult {
  CheckInResult(
    this.status,
    Iterable<Participant> participants, [
    this.participant,
  ]) : participants = List.unmodifiable(participants);

  final CheckInStatus status;
  final List<Participant> participants;
  final Participant? participant;

  String get message => switch (status) {
    CheckInStatus.success => 'Check-in effettuato: ${participant!.name}',
    CheckInStatus.alreadyPresent => 'Check-in già effettuato',
    CheckInStatus.invalid => 'QR non valido',
  };
}

/// Pure: never mutates the supplied list or its participants.
CheckInResult processCheckIn(String id, List<Participant> participants) {
  final code = id.trim();
  final index = participants.indexWhere(
    (participant) => participant.id == code,
  );
  if (index < 0) return CheckInResult(CheckInStatus.invalid, participants);
  final participant = participants[index];
  if (participant.isPresent) {
    return CheckInResult(
      CheckInStatus.alreadyPresent,
      participants,
      participant,
    );
  }
  final updated = [...participants];
  updated[index] = participant.withPresence(true);
  return CheckInResult(CheckInStatus.success, updated, updated[index]);
}
