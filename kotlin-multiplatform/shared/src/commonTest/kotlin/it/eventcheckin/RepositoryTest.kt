package it.eventcheckin

import it.eventcheckin.data.CheckInRepository
import it.eventcheckin.data.EventSeed
import it.eventcheckin.domain.CheckInResult
import it.eventcheckin.storage.CheckInStore
import kotlin.test.*

class RepositoryTest {
    private class MemoryStore : CheckInStore {
        var ids = emptySet<String>()
        var writes = 0
        override fun readPresentIds() = ids
        override fun writePresentIds(ids: Set<String>) { this.ids = ids.toSet(); writes++ }
    }
    @Test fun restoresAcrossRepositoryInstancesAndResets() {
        val store = MemoryStore()
        val repository = CheckInRepository(store)
        assertEquals(0, repository.load().count { it.isPresent })
        repository.checkIn("EVT-001", repository.load())
        assertEquals(setOf("EVT-001"), store.ids)
        val reopened = CheckInRepository(store)
        assertEquals(1, reopened.load().count { it.isPresent })
        assertEquals(EventSeed.participants, reopened.reset())
        assertTrue(CheckInRepository(store).load().none { it.isPresent })
    }
    @Test fun invalidAndDuplicateDoNotWrite() {
        val store = MemoryStore()
        val repository = CheckInRepository(store)
        val accepted = assertIs<CheckInResult.Accepted>(repository.checkIn("EVT-002", repository.load()))
        repository.checkIn("EVT-002", accepted.participants)
        repository.checkIn("ERR-999", accepted.participants)
        assertEquals(1, store.writes)
    }
    @Test fun unknownPersistedIdsCannotCreateParticipants() {
        val store = MemoryStore().apply { ids = setOf("EVT-003", "ERR-999") }
        val state = CheckInRepository(store).load()
        assertEquals(6, state.size)
        assertEquals(listOf("EVT-003"), state.filter { it.isPresent }.map { it.id })
    }
    @Test fun failedWriteIsPropagatedAndInputRemainsUnchanged() {
        val store = object : CheckInStore {
            override fun readPresentIds() = emptySet<String>()
            override fun writePresentIds(ids: Set<String>) { error("Disk full") }
        }
        val repository = CheckInRepository(store)
        val input = repository.load()
        assertFailsWith<IllegalStateException> { repository.checkIn("EVT-001", input) }
        assertTrue(input.none { it.isPresent })
        assertFailsWith<IllegalStateException> { repository.reset() }
    }
}
