import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import 'logic/check_in_controller.dart';
import 'screens/event_screen.dart';
import 'storage/check_in_store.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const EventCheckInApp());
}

class EventCheckInApp extends StatefulWidget {
  const EventCheckInApp({super.key, this.store});
  final CheckInStore? store;

  @override
  State<EventCheckInApp> createState() => _EventCheckInAppState();
}

class _EventCheckInAppState extends State<EventCheckInApp> {
  late final _controller = CheckInController(
    widget.store ?? PreferencesCheckInStore(),
  );

  @override
  Widget build(BuildContext context) => MaterialApp(
    title: 'Event Check-in',
    debugShowCheckedModeBanner: false,
    locale: const Locale('it'),
    supportedLocales: const [Locale('it')],
    localizationsDelegates: GlobalMaterialLocalizations.delegates,
    theme: ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF25785B))
          .copyWith(
            primary: const Color(0xFF25785B),
            onPrimary: Colors.white,
            surface: const Color(0xFFF6F8F5),
            onSurface: const Color(0xFF20372C),
          ),
      scaffoldBackgroundColor: const Color(0xFFF6F8F5),
      appBarTheme: const AppBarTheme(
        backgroundColor: Color(0xFFF6F8F5),
        surfaceTintColor: Colors.transparent,
        titleTextStyle: TextStyle(
          fontSize: 17,
          fontWeight: FontWeight.w600,
          color: Color(0xFF20372C),
        ),
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        color: Colors.white,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: Color(0xFFE0E7E1)),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFF81958A)),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size(48, 52),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          minimumSize: const Size(48, 48),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(minimumSize: const Size(48, 48)),
      ),
    ),
    home: EventScreen(controller: _controller),
  );

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
}
