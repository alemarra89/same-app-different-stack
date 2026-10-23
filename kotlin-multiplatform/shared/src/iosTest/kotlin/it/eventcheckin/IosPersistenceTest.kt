package it.eventcheckin

import it.eventcheckin.data.CheckInRepository
import it.eventcheckin.storage.IosCheckInStore
import platform.Foundation.NSUserDefaults
import kotlin.test.*

class IosPersistenceTest {
    @Test fun restoresFromRealUserDefaultsAndResets() {
        val suite = "it.eventcheckin.persistence.test"
        val defaults = NSUserDefaults(suiteName = suite)
        defaults.removePersistentDomainForName(suite)
        try {
            val repository = CheckInRepository(IosCheckInStore(defaults))
            repository.checkIn("EVT-001", repository.load())
            assertEquals(1, CheckInRepository(IosCheckInStore(defaults)).load().count { it.isPresent })
            repository.reset()
            assertTrue(CheckInRepository(IosCheckInStore(defaults)).load().none { it.isPresent })
        } finally {
            defaults.removePersistentDomainForName(suite)
        }
    }
}
