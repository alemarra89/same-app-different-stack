package it.eventcheckin.storage

/** Stores only the IDs marked present. Implementations must replace the complete set. */
interface CheckInStore {
    fun readPresentIds(): Set<String>
    fun writePresentIds(ids: Set<String>)
}
