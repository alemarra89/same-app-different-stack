import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

/// Explicit mobile adapter. Web/desktop keep the manual check-in flow available.
Future<String?> scanQr(BuildContext context) => Navigator.of(
  context,
).push<String>(MaterialPageRoute(builder: (_) => const QrScannerPage()));

class QrScannerPage extends StatefulWidget {
  const QrScannerPage({super.key});

  @override
  State<QrScannerPage> createState() => _QrScannerPageState();
}

class _QrScannerPageState extends State<QrScannerPage>
    with WidgetsBindingObserver {
  MobileScannerController? _controller;
  Future<void> _operations = Future.value();
  bool _active = true;
  bool _closed = false;
  String? _error;

  bool get _supported =>
      !kIsWeb &&
      (defaultTargetPlatform == TargetPlatform.android ||
          defaultTargetPlatform == TargetPlatform.iOS);

  @override
  void initState() {
    super.initState();
    if (!_supported) return;
    WidgetsBinding.instance.addObserver(this);
    _controller = MobileScannerController(
      autoStart: false,
      formats: const [BarcodeFormat.qrCode],
      detectionSpeed: DetectionSpeed.normal,
      detectionTimeoutMs: 1000,
      returnImage: false,
    );
    WidgetsBinding.instance.addPostFrameCallback((_) => _syncCamera());
  }

  String _errorMessage(
    MobileScannerException error,
  ) => switch (error.errorCode) {
    MobileScannerErrorCode.permissionDenied =>
      'Permesso fotocamera negato. Puoi abilitarlo nelle impostazioni dell’app oppure inserire il codice manualmente.',
    MobileScannerErrorCode.unsupported =>
      'Fotocamera assente o scanner non supportato su questo dispositivo.',
    _ =>
      'Fotocamera non disponibile. Riprova oppure inserisci il codice manualmente.',
  };

  // Serialize start/stop: permission dialogs themselves trigger lifecycle events.
  void _syncCamera() {
    _operations = _operations.then((_) async {
      final controller = _controller;
      if (_closed || controller == null) return;
      try {
        if (_active) {
          if (!controller.value.isRunning) await controller.start();
          if (mounted && !_closed) setState(() => _error = null);
        } else if (controller.value.isRunning) {
          await controller.stop();
        }
      } on MobileScannerException catch (error) {
        if (mounted && !_closed) setState(() => _error = _errorMessage(error));
      } catch (_) {
        if (mounted && !_closed) {
          setState(
            () => _error = 'Fotocamera non disponibile. Usa il codice manuale.',
          );
        }
      }
    });
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    _active = state == AppLifecycleState.resumed;
    _syncCamera();
  }

  void _onDetect(BarcodeCapture capture) {
    if (_closed || !_active) return;
    for (final barcode in capture.barcodes) {
      final value = barcode.rawValue;
      if (value == null) continue;
      // One result per route, even if native callbacks arrive in the same frame.
      _closed = true;
      Navigator.of(context).pop(value);
      return;
    }
  }

  Widget _fallback(String message) => Center(
    child: SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.no_photography_outlined, size: 48),
          const SizedBox(height: 20),
          Text(message, textAlign: TextAlign.center),
          const SizedBox(height: 20),
          if (_supported)
            OutlinedButton.icon(
              onPressed: _syncCamera,
              icon: const Icon(Icons.refresh),
              label: const Text('Riprova fotocamera'),
            ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Inserisci codice manualmente'),
          ),
        ],
      ),
    ),
  );

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Scansiona QR')),
    body: SafeArea(
      child: !_supported
          ? _fallback(
              'Scanner non supportato su questa piattaforma. Usa il codice manuale.',
            )
          : Column(
              children: [
                const Padding(
                  padding: EdgeInsets.all(20),
                  child: Text(
                    'Inquadra il QR del partecipante. Il contenuto deve essere un ID, per esempio EVT-002.',
                  ),
                ),
                Expanded(
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      MobileScanner(
                        controller: _controller,
                        onDetect: _onDetect,
                        onDetectError: (_, _) {
                          if (mounted && !_closed) {
                            setState(
                              () => _error =
                                  'Lettura QR non riuscita. Riprova o usa il codice manuale.',
                            );
                          }
                        },
                        errorBuilder: (_, error) =>
                            _fallback(_errorMessage(error)),
                        placeholderBuilder: (_) =>
                            const Center(child: CircularProgressIndicator()),
                      ),
                      if (_error != null)
                        ColoredBox(
                          color: Theme.of(context).colorScheme.surface,
                          child: _fallback(_error!),
                        ),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: TextButton.icon(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.keyboard_outlined),
                    label: const Text('Torna all’inserimento manuale'),
                  ),
                ),
              ],
            ),
    ),
  );

  @override
  void dispose() {
    _closed = true;
    WidgetsBinding.instance.removeObserver(this);
    final controller = _controller;
    // Wait for any pending permission request/start before releasing the camera.
    unawaited(
      _operations.then((_) async {
        await controller?.dispose();
      }),
    );
    super.dispose();
  }
}
