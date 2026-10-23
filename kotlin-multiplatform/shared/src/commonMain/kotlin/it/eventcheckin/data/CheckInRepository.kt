package it.eventcheckin.data

import it.eventcheckin.domain.CheckInResult
import it.eventcheckin.domain.processCheckIn
import it.eventcheckin.model.Participant
import it.eventcheckin.storage.CheckInStore

class CheckInRepository(private val store: CheckInStore) {
    fun load(): List<Participant> {
        val ids = store.readPresentIds()
        return EventSeed.participants.map { it.copy(isPresent = it.id in ids) }
    }

    /** Persist before publishing the next state to the UI. A failed write cannot report success. */
    fun checkIn(id: String, current: List<Participant>): CheckInResult {
        val result = processCheckIn(id, current)
        if (result is CheckInResult.Accepted) {
            store.writePresentIds(result.participants.filter { it.isPresent }.map { it.id }.toSet())
        }
        return result
    }

    fun reset(): List<Participant> {
        store.writePresentIds(emptySet())
        return EventSeed.participants
    }
}
