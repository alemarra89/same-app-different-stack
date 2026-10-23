package it.eventcheckin.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import it.eventcheckin.data.CheckInRepository
import it.eventcheckin.data.EventSeed
import it.eventcheckin.domain.CheckInResult
import it.eventcheckin.domain.ScanGate
import it.eventcheckin.model.Participant
import it.eventcheckin.scanner.Scanner
import it.eventcheckin.scanner.ScanListener

private val Petrol = Color(0xFF25785B)
private val Ink = Color(0xFF17372C)
private val Muted = Color(0xFF52635B)
private val Background = Color(0xFFF4F7F5)

private data class Notice(val text: String, val error: Boolean = false)

@Composable
fun EventCheckInApp(repository: CheckInRepository, scanner: Scanner) {
    MaterialTheme(
        colors = lightColors(
            primary = Petrol, primaryVariant = Ink, secondary = Petrol,
            background = Background, surface = Color.White,
            onPrimary = Color.White, onSurface = Ink, onBackground = Ink,
            error = Color(0xFFAD2929),
        ),
        shapes = Shapes(medium = RoundedCornerShape(16.dp), small = RoundedCornerShape(12.dp)),
    ) {
        EventCheckInScreen(repository, scanner)
    }
}

@Composable
private fun EventCheckInScreen(repository: CheckInRepository, scanner: Scanner) {
    var participants by remember(repository) { mutableStateOf(EventSeed.participants) }
    var ready by remember(repository) { mutableStateOf(false) }
    var query by remember { mutableStateOf("") }
    var code by remember { mutableStateOf("") }
    var notice by remember { mutableStateOf<Notice?>(null) }
    var resetConfirmation by remember { mutableStateOf(false) }
    var scanning by remember { mutableStateOf(false) }
    val scanGate = remember { ScanGate() }
    val focus = LocalFocusManager.current

    fun load() {
        try {
            participants = repository.load()
            ready = true
            notice = null
        } catch (_: Exception) {
            ready = false
            notice = Notice("Impossibile leggere i check-in salvati. Riprova.", error = true)
        }
    }

    LaunchedEffect(repository) { load() }
    DisposableEffect(scanner) { onDispose { scanner.stop() } }

    fun submit(rawCode: String) {
        if (!ready) return
        try {
            when (val result = repository.checkIn(rawCode, participants)) {
                is CheckInResult.Accepted -> {
                    participants = result.participants
                    notice = Notice("Check-in effettuato: ${result.participant.name}")
                }
                is CheckInResult.AlreadyPresent -> notice = Notice("Check-in già effettuato")
                CheckInResult.InvalidCode -> notice = Notice("QR non valido", error = true)
            }
        } catch (_: Exception) {
            notice = Notice("Salvataggio non riuscito. Check-in non registrato: riprova.", error = true)
        }
    }

    val visible = participants.filter {
        it.name.contains(query.trim(), ignoreCase = true) || it.id.contains(query.trim(), ignoreCase = true)
    }
    Surface(color = Background, modifier = Modifier.fillMaxSize()) {
        Box(Modifier.fillMaxSize().safeDrawingPadding().imePadding(), contentAlignment = Alignment.TopCenter) {
            LazyColumn(
                modifier = Modifier.widthIn(max = 680.dp).fillMaxSize(),
                contentPadding = PaddingValues(horizontal = 20.dp, vertical = 24.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                item {
                    Text("EVENT CHECK-IN", style = MaterialTheme.typography.overline, color = Petrol, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(8.dp))
                    Text(EventSeed.title, style = MaterialTheme.typography.h4, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(6.dp))
                    Text("${EventSeed.date}  ·  Accoglienza partecipanti", color = Muted)
                }
                item {
                    Card(elevation = 0.dp, backgroundColor = Petrol) {
                        Column(Modifier.fillMaxWidth().padding(20.dp)) {
                            Text(
                                "${participants.count { it.isPresent }} / ${participants.size} presenti",
                                style = MaterialTheme.typography.h5, color = Color.White,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite },
                            )
                            Spacer(Modifier.height(8.dp))
                            Text("Un benvenuto, una scansione.", color = Color.White)
                        }
                    }
                }
                item {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Button(
                            onClick = {
                                focus.clearFocus()
                                scanning = true
                                try {
                                    scanner.start(object : ScanListener {
                                        override fun onCode(code: String) {
                                            scanning = false
                                            if (scanGate.accept(code)) submit(code)
                                        }
                                        override fun onError(message: String) {
                                            scanning = false
                                            notice = Notice("$message Puoi inserire il codice manualmente.", error = true)
                                        }
                                        override fun onCancel() { scanning = false }
                                    })
                                } catch (_: Exception) {
                                    scanning = false
                                    notice = Notice("Scanner non disponibile. Puoi inserire il codice manualmente.", true)
                                }
                            },
                            enabled = ready && !scanning,
                            modifier = Modifier.fillMaxWidth().heightIn(min = 52.dp),
                        ) { Text(if (scanning) "Scansione in corso…" else "Scansiona QR") }
                        Card(elevation = 0.dp, border = BorderStroke(1.dp, Color(0xFFD6E1DA))) {
                            Column(Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                Text("Inserimento manuale", style = MaterialTheme.typography.subtitle1, fontWeight = FontWeight.Bold)
                                Text("Usa l’ID sul biglietto, anche senza fotocamera.", style = MaterialTheme.typography.body2, color = Muted)
                                OutlinedTextField(
                                    value = code, onValueChange = { code = it },
                                    label = { Text("Codice partecipante") },
                                    placeholder = { Text("EVT-001") },
                                    singleLine = true, enabled = ready,
                                    keyboardOptions = KeyboardOptions(
                                        capitalization = KeyboardCapitalization.Characters,
                                        autoCorrectEnabled = false, keyboardType = KeyboardType.Ascii, imeAction = ImeAction.Done,
                                    ),
                                    keyboardActions = KeyboardActions(onDone = { focus.clearFocus(); submit(code) }),
                                    modifier = Modifier.fillMaxWidth(),
                                )
                                OutlinedButton(
                                    onClick = { focus.clearFocus(); submit(code) },
                                    enabled = ready, modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp),
                                ) { Text("Registra check-in") }
                            }
                        }
                    }
                }
                notice?.let { message ->
                    item {
                        Card(
                            elevation = 0.dp,
                            backgroundColor = if (message.error) Color(0xFFFFECEA) else Color(0xFFE0F0E6),
                        ) {
                            Text(
                                message.text, color = if (message.error) Color(0xFF8C2020) else Ink,
                                modifier = Modifier.fillMaxWidth().padding(16.dp).semantics { liveRegion = LiveRegionMode.Assertive },
                            )
                        }
                    }
                }
                if (!ready) {
                    item { OutlinedButton(onClick = { load() }) { Text("Riprova caricamento") } }
                }
                item {
                    Text("Partecipanti", style = MaterialTheme.typography.h6, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(10.dp))
                    OutlinedTextField(
                        value = query, onValueChange = { query = it },
                        label = { Text("Cerca per nome o ID") }, singleLine = true,
                        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
                        keyboardActions = KeyboardActions(onSearch = { focus.clearFocus() }),
                        modifier = Modifier.fillMaxWidth(),
                    )
                }
                if (visible.isEmpty()) item { Text("Nessun partecipante trovato", color = Muted) }
                items(visible, key = { it.id }) { ParticipantRow(it) }
                item {
                    Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
                        TextButton(
                            onClick = { resetConfirmation = true }, enabled = ready,
                            modifier = Modifier.heightIn(min = 48.dp),
                        ) { Text("Reimposta demo") }
                        Text("I check-in sono salvati solo su questo dispositivo.", style = MaterialTheme.typography.caption, color = Muted)
                    }
                }
            }
        }
    }
    if (resetConfirmation) {
        AlertDialog(
            onDismissRequest = { resetConfirmation = false },
            title = { Text("Reimpostare la demo?") },
            text = { Text("Tutti i partecipanti torneranno In attesa. I check-in salvati saranno cancellati.") },
            confirmButton = {
                TextButton(onClick = {
                    resetConfirmation = false
                    try {
                        participants = repository.reset()
                        scanGate.clear()
                        notice = Notice("Demo reimpostata")
                    } catch (_: Exception) {
                        notice = Notice("Impossibile reimpostare la demo. Riprova.", true)
                    }
                }) { Text("Reimposta") }
            },
            dismissButton = { TextButton(onClick = { resetConfirmation = false }) { Text("Annulla") } },
        )
    }
}

@Composable
private fun ParticipantRow(participant: Participant) {
    Card(elevation = 0.dp, border = BorderStroke(1.dp, Color(0xFFE0E8E2))) {
        Column(Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(participant.name, style = MaterialTheme.typography.subtitle1, fontWeight = FontWeight.SemiBold)
            FlowRow(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(participant.id, color = Muted, style = MaterialTheme.typography.body2)
                Text(
                    if (participant.isPresent) "Presente" else "In attesa",
                    color = if (participant.isPresent) Ink else Muted,
                    style = MaterialTheme.typography.body2,
                    modifier = Modifier.background(
                        if (participant.isPresent) Color(0xFFE0F0E6) else Color(0xFFF0F3F1), RoundedCornerShape(20.dp),
                    ).padding(horizontal = 12.dp, vertical = 6.dp),
                )
            }
        }
    }
}
