class Participant {
  const Participant({
    required this.id,
    required this.name,
    this.isPresent = false,
  });

  final String id;
  final String name;
  final bool isPresent;

  Participant withPresence(bool value) =>
      Participant(id: id, name: name, isPresent: value);
}
