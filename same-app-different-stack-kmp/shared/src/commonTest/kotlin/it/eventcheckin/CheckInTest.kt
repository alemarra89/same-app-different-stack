package it.eventcheckin

import it.eventcheckin.data.EventSeed
import it.eventcheckin.domain.CheckInResult
import it.eventcheckin.domain.processCheckIn
import kotlin.test.*

class CheckInTest {
    @Test fun validCodeRegistersOnlyGiuliaWithoutMutatingInput() {
        val original = EventSeed.participants
        val result = assertIs<CheckInResult.Accepted>(processCheckIn("EVT-001", original))
        assertEquals("Giulia Rossi", result.participant.name)
        assertEquals(1, result.participants.count { it.isPresent })
        assertTrue(result.participants.first().isPresent)
        assertTrue(original.none { it.isPresent })
        assertEquals(original.drop(1), result.participants.drop(1))
    }
    @Test fun duplicateDoesNotIncrement() {
        val first = assertIs<CheckInResult.Accepted>(processCheckIn("EVT-001", EventSeed.participants))
        assertIs<CheckInResult.AlreadyPresent>(processCheckIn("EVT-001", first.participants))
        assertEquals(1, first.participants.count { it.isPresent })
    }
    @Test fun unknownCodeIsInvalid() {
        assertEquals(CheckInResult.InvalidCode, processCheckIn("ERR-999", EventSeed.participants))
    }
    @Test fun trimsWhitespace() {
        assertIs<CheckInResult.Accepted>(processCheckIn(" \nEVT-001\t ", EventSeed.participants))
    }
    @Test fun acceptsOnlyExactIdSchema() {
        listOf("", "evt-001", "https://example.test/EVT-001", "{\"id\":\"EVT-001\"}").forEach {
            assertEquals(CheckInResult.InvalidCode, processCheckIn(it, EventSeed.participants))
        }
    }
    @Test fun seedIsExactlyTheInvariantDataset() {
        assertEquals(listOf("Giulia Rossi", "Marco Bianchi", "Sara De Luca", "Davide Greco", "Fabio Conti", "Ivan Moretti"), EventSeed.participants.map { it.name })
        assertEquals((1..6).map { "EVT-00$it" }, EventSeed.participants.map { it.id })
        assertTrue(EventSeed.participants.none { it.isPresent })
    }
}
