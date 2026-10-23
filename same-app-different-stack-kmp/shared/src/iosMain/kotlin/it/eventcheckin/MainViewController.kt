package it.eventcheckin

import androidx.compose.ui.window.ComposeUIViewController
import it.eventcheckin.data.CheckInRepository
import it.eventcheckin.scanner.Scanner
import it.eventcheckin.storage.IosCheckInStore
import it.eventcheckin.ui.EventCheckInApp

fun MainViewController(scanner: Scanner) = ComposeUIViewController {
    val repository = androidx.compose.runtime.remember { CheckInRepository(IosCheckInStore()) }
    EventCheckInApp(repository, scanner)
}
