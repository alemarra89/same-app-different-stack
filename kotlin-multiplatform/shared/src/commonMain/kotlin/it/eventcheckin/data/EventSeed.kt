package it.eventcheckin.data

import it.eventcheckin.model.Participant

object EventSeed {
    const val title = "Tech Meetup 2026"
    const val date = "23/10/2026"
    val participants: List<Participant> = listOf(
        Participant("EVT-001", "Giulia Rossi"),
        Participant("EVT-002", "Marco Bianchi"),
        Participant("EVT-003", "Sara De Luca"),
        Participant("EVT-004", "Davide Greco"),
        Participant("EVT-005", "Fabio Conti"),
        Participant("EVT-006", "Ivan Moretti"),
    )
}
