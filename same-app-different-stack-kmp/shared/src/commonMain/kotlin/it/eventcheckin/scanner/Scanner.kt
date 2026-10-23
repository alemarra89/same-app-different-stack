package it.eventcheckin.scanner

/** Native modal scanner. Callbacks are delivered on the UI thread, once per start. */
interface Scanner {
    fun start(listener: ScanListener)
    /** Idempotent; releases camera and drops pending callbacks. */
    fun stop()
}

/** Methods instead of nested lambdas keep the Swift/Objective-C bridge straightforward. */
interface ScanListener {
    fun onCode(code: String)
    fun onError(message: String)
    fun onCancel()
}
