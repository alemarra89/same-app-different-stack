package it.eventcheckin.app

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import it.eventcheckin.data.CheckInRepository
import it.eventcheckin.storage.AndroidCheckInStore
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class LocalPersistenceTest {
    @Test fun realSharedPreferencesPersistsOnlyIdsAndResetIsDurable() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val name = "persistence_test"
        context.deleteSharedPreferences(name)
        try {
            val first = CheckInRepository(AndroidCheckInStore(context, name))
            assertEquals(0, first.load().count { it.isPresent })
            first.checkIn(" EVT-001 ", first.load())
            val reopened = CheckInRepository(AndroidCheckInStore(context, name))
            assertEquals(1, reopened.load().count { it.isPresent })
            assertTrue(reopened.load().first().isPresent)
            val stored = context.getSharedPreferences(name, 0).all
            assertEquals(setOf("present_ids"), stored.keys)
            assertEquals(setOf("EVT-001"), stored["present_ids"])
            val disk = java.io.File(context.applicationInfo.dataDir, "shared_prefs/$name.xml").readText()
            assertTrue(disk.contains("EVT-001"))
            assertFalse(disk.contains("Giulia"))
            reopened.reset()
            assertTrue(CheckInRepository(AndroidCheckInStore(context, name)).load().none { it.isPresent })
        } finally {
            context.deleteSharedPreferences(name)
        }
    }
}
