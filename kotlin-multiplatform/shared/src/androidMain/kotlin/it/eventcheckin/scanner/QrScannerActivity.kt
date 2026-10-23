package it.eventcheckin.scanner

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.Button
import androidx.compose.material.MaterialTheme
import androidx.compose.material.Text
import androidx.compose.material.lightColors
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.lifecycle.Lifecycle
import com.google.zxing.BinaryBitmap
import com.google.zxing.DecodeHintType
import com.google.zxing.NotFoundException
import com.google.zxing.PlanarYUVLuminanceSource
import com.google.zxing.common.HybridBinarizer
import com.google.zxing.qrcode.QRCodeReader
import java.lang.ref.WeakReference
import java.util.concurrent.Executors

class QrScannerActivity : ComponentActivity() {
    private var hasPermission by mutableStateOf(false)
    private var completed = false
    private val permission = registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        if (granted) hasPermission = true else fail("Permesso fotocamera negato. Abilitalo nelle impostazioni dell’app.")
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        active = WeakReference(this)
        enableEdgeToEdge()
        hasPermission = checkSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED
        setContent {
            MaterialTheme(colors = lightColors(primary = Color(0xFF25785B))) {
                Column(Modifier.fillMaxSize().background(Color(0xFF17372C)).safeDrawingPadding().padding(16.dp)) {
                    Text("Scansiona QR", color = Color.White, style = MaterialTheme.typography.h5)
                    Spacer(Modifier.height(8.dp))
                    Text("Inquadra il codice sul biglietto. Verrà letto solo il QR.", color = Color.White)
                    Spacer(Modifier.height(16.dp))
                    Box(Modifier.weight(1f).fillMaxWidth()) { if (hasPermission) CameraPreview() }
                    Button(onClick = { finish() }, modifier = Modifier.fillMaxWidth().heightIn(min = 52.dp)) {
                        Text("Annulla scansione")
                    }
                }
            }
        }
        if (!hasPermission) permission.launch(Manifest.permission.CAMERA)
    }

    @Composable
    private fun CameraPreview() {
        val view = remember { PreviewView(this).apply { implementationMode = PreviewView.ImplementationMode.COMPATIBLE } }
        AndroidView(factory = { view }, modifier = Modifier.fillMaxSize())
        DisposableEffect(view) {
            var disposed = false
            var provider: ProcessCameraProvider? = null
            val executor = Executors.newSingleThreadExecutor()
            val preview = Preview.Builder().build().also { it.surfaceProvider = view.surfaceProvider }
            val analysis = ImageAnalysis.Builder().setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST).build()
            val reader = QRCodeReader()
            analysis.setAnalyzer(executor) { image ->
                try {
                    val plane = image.planes[0]
                    val buffer = plane.buffer
                    val offset = buffer.position()
                    val width = image.width
                    val height = image.height
                    val pixels = ByteArray(width * height)
                    for (y in 0 until height) for (x in 0 until width) {
                        pixels[y * width + x] = buffer.get(offset + y * plane.rowStride + x * plane.pixelStride)
                    }
                    val source = PlanarYUVLuminanceSource(pixels, width, height, 0, 0, width, height, false)
                    val result = reader.decode(BinaryBitmap(HybridBinarizer(source)), mapOf(DecodeHintType.TRY_HARDER to true))
                    runOnUiThread {
                        if (!disposed && !completed && lifecycle.currentState.isAtLeast(Lifecycle.State.RESUMED)) {
                            completed = true
                            setResult(Activity.RESULT_OK, Intent().putExtra(CODE, result.text))
                            finish()
                        }
                    }
                } catch (_: NotFoundException) {
                    // Most frames do not contain a QR; this is normal.
                } catch (_: com.google.zxing.ReaderException) {
                    // A partial QR is not yet a decodable QR.
                } catch (_: Exception) {
                    runOnUiThread { if (!disposed) fail("Errore durante la lettura della fotocamera.") }
                } finally {
                    reader.reset()
                    image.close()
                }
            }
            val future = ProcessCameraProvider.getInstance(this@QrScannerActivity)
            future.addListener({
                if (!disposed) {
                    try {
                        val cameraProvider = future.get()
                        provider = cameraProvider
                        val selector = when {
                            cameraProvider.hasCamera(CameraSelector.DEFAULT_BACK_CAMERA) -> CameraSelector.DEFAULT_BACK_CAMERA
                            cameraProvider.hasCamera(CameraSelector.DEFAULT_FRONT_CAMERA) -> CameraSelector.DEFAULT_FRONT_CAMERA
                            else -> null
                        }
                        if (selector == null) fail("Nessuna fotocamera disponibile.") else {
                            val camera = cameraProvider.bindToLifecycle(this@QrScannerActivity, selector, preview, analysis)
                            camera.cameraInfo.cameraState.observe(this@QrScannerActivity) {
                                if (!disposed && it.error != null) fail("Fotocamera non disponibile o già in uso.")
                            }
                        }
                    } catch (_: Exception) {
                        fail("Fotocamera non disponibile o scanner non supportato.")
                    }
                }
            }, ContextCompat.getMainExecutor(this@QrScannerActivity))
            onDispose {
                disposed = true
                analysis.clearAnalyzer()
                provider?.unbind(preview, analysis)
                executor.shutdown()
            }
        }
    }

    private fun fail(message: String) {
        if (completed || isFinishing) return
        completed = true
        setResult(Activity.RESULT_CANCELED, Intent().putExtra(ERROR, message))
        finish()
    }

    override fun onDestroy() {
        if (active?.get() === this) active = null
        super.onDestroy()
    }

    companion object {
        const val CODE = "qr_code"
        const val ERROR = "scanner_error"
        private var active: WeakReference<QrScannerActivity>? = null
        internal fun closeActive() { active?.get()?.finish() }
    }
}
