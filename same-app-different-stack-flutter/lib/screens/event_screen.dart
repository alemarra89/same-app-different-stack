import 'dart:async';

import 'package:flutter/material.dart';

import '../data/event_seed.dart';
import '../logic/check_in_controller.dart';
import '../models/participant.dart';
import '../scanner/qr_scanner.dart';

class EventScreen extends StatefulWidget {
  const EventScreen({super.key, required this.controller});
  final CheckInController controller;

  @override
  State<EventScreen> createState() => _EventScreenState();
}

class _EventScreenState extends State<EventScreen> {
  final _code = TextEditingController();
  final _search = TextEditingController();
  final _codeFocus = FocusNode();
  String _query = '';
  bool _scanning = false;

  @override
  void initState() {
    super.initState();
    unawaited(widget.controller.initialize());
  }

  Future<void> _submit() async {
    await widget.controller.checkIn(_code.text);
    if (!mounted) return;
    _code.clear();
    _codeFocus.requestFocus();
  }

  Future<void> _scan() async {
    setState(() => _scanning = true);
    FocusScope.of(context).unfocus();
    final code = await scanQr(context);
    if (!mounted) return;
    setState(() => _scanning = false);
    if (code != null) {
      await widget.controller.checkIn(code, fromScanner: true);
    } else {
      _codeFocus.requestFocus();
    }
  }

  Future<void> _reset() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Reimposta demo?'),
        content: const Text(
          'Tutti e sei i partecipanti torneranno In attesa. I check-in salvati saranno azzerati.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Annulla'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Reimposta'),
          ),
        ],
      ),
    );
    if (confirmed == true && mounted) await widget.controller.reset();
  }

  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: widget.controller,
    builder: (context, _) {
      final controller = widget.controller;
      final enabled = controller.ready && !controller.busy && !_scanning;
      final visible = controller.participants
          .where(
            (p) =>
                p.name.toLowerCase().contains(_query) ||
                p.id.toLowerCase().contains(_query),
          )
          .toList();
      final theme = Theme.of(context);
      return Scaffold(
        appBar: AppBar(
          title: const Text('Event Check-in'),
          centerTitle: false,
          actions: const [
            Padding(
              padding: EdgeInsets.only(right: 20),
              child: Icon(Icons.confirmation_number_outlined),
            ),
          ],
        ),
        body: SafeArea(
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 760),
              child: ListView(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
                children: [
                  Text(
                    'CONTROLLO ACCESSI',
                    style: theme.textTheme.labelMedium?.copyWith(
                      letterSpacing: 1.7,
                      color: theme.colorScheme.primary,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    eventName,
                    style: theme.textTheme.headlineMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Row(
                    children: [
                      Icon(Icons.calendar_today_outlined, size: 16),
                      SizedBox(width: 8),
                      Expanded(child: Text(eventDate)),
                    ],
                  ),
                  const SizedBox(height: 24),
                  Card(
                    color: const Color(0xFFE7F1EC),
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'PARTECIPANTI PRESENTI',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              letterSpacing: 1,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Semantics(
                            liveRegion: true,
                            child: Text(
                              '${controller.presentCount} / 6 presenti',
                              style: theme.textTheme.headlineSmall?.copyWith(
                                fontWeight: FontWeight.w700,
                                color: theme.colorScheme.primary,
                              ),
                            ),
                          ),
                          const SizedBox(height: 14),
                          ClipRRect(
                            borderRadius: BorderRadius.circular(6),
                            child: LinearProgressIndicator(
                              value: controller.presentCount / 6,
                              minHeight: 6,
                              backgroundColor: const Color(0xFFCEDFD5),
                              semanticsLabel: 'Partecipanti presenti',
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  FilledButton.icon(
                    onPressed: enabled ? _scan : null,
                    icon: const Icon(Icons.qr_code_scanner),
                    label: const Text('Scansiona QR'),
                  ),
                  const SizedBox(height: 12),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Text(
                            'Oppure inserisci il codice',
                            style: theme.textTheme.titleSmall,
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'Disponibile anche senza fotocamera.',
                            style: TextStyle(fontSize: 13),
                          ),
                          const SizedBox(height: 16),
                          TextField(
                            key: const Key('manual-code'),
                            controller: _code,
                            focusNode: _codeFocus,
                            enabled: enabled,
                            autocorrect: false,
                            enableSuggestions: false,
                            textInputAction: TextInputAction.done,
                            onSubmitted: (_) => _submit(),
                            decoration: const InputDecoration(
                              labelText: 'Codice partecipante',
                              hintText: 'EVT-001',
                              prefixIcon: Icon(Icons.badge_outlined),
                            ),
                          ),
                          const SizedBox(height: 12),
                          OutlinedButton(
                            onPressed: enabled ? _submit : null,
                            child: const Text('Registra check-in'),
                          ),
                        ],
                      ),
                    ),
                  ),
                  if (controller.busy)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 12),
                      child: LinearProgressIndicator(
                        semanticsLabel: 'Salvataggio o caricamento',
                      ),
                    ),
                  if (controller.message != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 12),
                      child: Semantics(
                        liveRegion: true,
                        child: Container(
                          key: const Key('feedback'),
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: controller.messageIsError
                                ? const Color(0xFFFFF0DD)
                                : const Color(0xFFE7F1EC),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Icon(
                                controller.messageIsError
                                    ? Icons.info_outline
                                    : Icons.check_circle_outline,
                                size: 22,
                              ),
                              const SizedBox(width: 10),
                              Expanded(child: Text(controller.message!)),
                            ],
                          ),
                        ),
                      ),
                    ),
                  if (!controller.ready && !controller.busy)
                    TextButton.icon(
                      onPressed: controller.initialize,
                      icon: const Icon(Icons.refresh),
                      label: const Text('Riprova caricamento'),
                    ),
                  const SizedBox(height: 28),
                  Text(
                    'Elenco partecipanti',
                    style: theme.textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 14),
                  TextField(
                    controller: _search,
                    onChanged: (value) =>
                        setState(() => _query = value.trim().toLowerCase()),
                    decoration: InputDecoration(
                      labelText: 'Cerca per nome o ID',
                      prefixIcon: const Icon(Icons.search),
                      suffixIcon: _query.isEmpty
                          ? null
                          : IconButton(
                              tooltip: 'Cancella ricerca',
                              onPressed: () {
                                _search.clear();
                                setState(() => _query = '');
                              },
                              icon: const Icon(Icons.close),
                            ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  if (visible.isEmpty)
                    const Padding(
                      padding: EdgeInsets.all(20),
                      child: Text('Nessun partecipante trovato'),
                    ),
                  for (final participant in visible)
                    _ParticipantRow(participant: participant),
                  const SizedBox(height: 20),
                  TextButton.icon(
                    onPressed: enabled ? _reset : null,
                    icon: const Icon(Icons.restart_alt),
                    label: const Text('Reimposta demo'),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Dati salvati solo su questo dispositivo',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 12, color: Color(0xFF53645B)),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    },
  );

  @override
  void dispose() {
    _code.dispose();
    _search.dispose();
    _codeFocus.dispose();
    super.dispose();
  }
}

class _ParticipantRow extends StatelessWidget {
  const _ParticipantRow({required this.participant});
  final Participant participant;

  @override
  Widget build(BuildContext context) => Card(
    margin: const EdgeInsets.only(bottom: 8),
    child: Padding(
      padding: const EdgeInsets.all(16),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final details = Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                participant.name,
                style: const TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 16,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                participant.id,
                style: const TextStyle(fontSize: 13, color: Color(0xFF53645B)),
              ),
            ],
          );
          final status = Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                participant.isPresent ? Icons.check_circle : Icons.schedule,
                size: 16,
                color: participant.isPresent
                    ? const Color(0xFF25785B)
                    : const Color(0xFF53645B),
              ),
              const SizedBox(width: 6),
              Flexible(
                child: Text(
                  participant.isPresent ? 'Presente' : 'In attesa',
                  style: TextStyle(
                    fontWeight: FontWeight.w500,
                    color: participant.isPresent
                        ? const Color(0xFF25785B)
                        : const Color(0xFF53645B),
                  ),
                ),
              ),
            ],
          );
          if (constraints.maxWidth < 330 ||
              MediaQuery.textScalerOf(context).scale(1) > 1.3) {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [details, const SizedBox(height: 12), status],
            );
          }
          return Row(
            children: [
              Expanded(child: details),
              const SizedBox(width: 12),
              status,
            ],
          );
        },
      ),
    ),
  );
}
