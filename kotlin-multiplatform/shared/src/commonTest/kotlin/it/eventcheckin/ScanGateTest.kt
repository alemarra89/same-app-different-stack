package it.eventcheckin

import it.eventcheckin.domain.ScanGate
import kotlin.test.*

class ScanGateTest {
    @Test fun blocksSameTrimmedCodeForOneSecond() {
        var now = 0L
        val gate = ScanGate { now }
        assertTrue(gate.accept("EVT-001"))
        now = 999
        assertFalse(gate.accept(" EVT-001 "))
        now = 1000
        assertTrue(gate.accept("EVT-001"))
    }
    @Test fun differentCodesAreNotBlockedAndInterleavedDuplicatesAreBlocked() {
        val gate = ScanGate { 100L }
        assertTrue(gate.accept("EVT-001"))
        assertTrue(gate.accept("EVT-002"))
        assertFalse(gate.accept("EVT-001"))
        gate.clear()
        assertTrue(gate.accept("EVT-001"))
    }
}
