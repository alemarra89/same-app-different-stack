package it.eventcheckin.domain

import it.eventcheckin.model.Participant

sealed interface CheckInResult {
    data class Accepted(val participant: Participant, val participants: List<Participant>) : CheckInResult
    data class AlreadyPresent(val participant: Participant) : CheckInResult
    data object InvalidCode : CheckInResult
}

/** Pure: does not mutate the input, access storage, the clock, or the camera. */
fun processCheckIn(id: String, participants: List<Participant>): CheckInResult {
    val participant = participants.find { it.id == id.trim() } ?: return CheckInResult.InvalidCode
    if (participant.isPresent) return CheckInResult.AlreadyPresent(participant)
    val present = participant.copy(isPresent = true)
    return CheckInResult.Accepted(present, participants.map { if (it.id == present.id) present else it })
}
