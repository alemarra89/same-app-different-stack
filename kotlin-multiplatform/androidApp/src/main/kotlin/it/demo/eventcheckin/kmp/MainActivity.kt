package it.demo.eventcheckin.kmp

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import it.eventcheckin.data.CheckInRepository
import it.eventcheckin.scanner.AndroidScanner
import it.eventcheckin.storage.AndroidCheckInStore
import it.eventcheckin.ui.EventCheckInApp

class MainActivity : ComponentActivity() {
    private val scanner = AndroidScanner(this)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        val repository = CheckInRepository(AndroidCheckInStore(this))
        setContent { EventCheckInApp(repository, scanner) }
    }

    override fun onDestroy() {
        scanner.stop()
        super.onDestroy()
    }
}
