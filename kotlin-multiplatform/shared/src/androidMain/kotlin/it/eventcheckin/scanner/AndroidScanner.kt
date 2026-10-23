package it.eventcheckin.scanner

import android.app.Activity
import android.content.Intent
import androidx.activity.ComponentActivity
import androidx.activity.result.contract.ActivityResultContracts

class AndroidScanner(private val activity: ComponentActivity) : Scanner {
    private var listener: ScanListener? = null
    private val launcher = activity.registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        val callback = listener
        clear()
        val code = result.data?.getStringExtra(QrScannerActivity.CODE)
        val error = result.data?.getStringExtra(QrScannerActivity.ERROR)
        when {
            error != null -> callback?.onError(error)
            result.resultCode == Activity.RESULT_OK && code != null -> callback?.onCode(code)
            else -> callback?.onCancel()
        }
    }

    override fun start(listener: ScanListener) {
        if (this.listener != null) return
        this.listener = listener
        try {
            launcher.launch(Intent(activity, QrScannerActivity::class.java))
        } catch (_: Exception) {
            clear()
            listener.onError("Scanner non supportato.")
        }
    }

    override fun stop() {
        clear()
        // The child Activity owns its resources and is destroyed with its parent task.
        QrScannerActivity.closeActive()
    }

    private fun clear() {
        listener = null
    }
}
