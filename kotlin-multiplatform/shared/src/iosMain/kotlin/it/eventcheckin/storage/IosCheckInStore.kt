package it.eventcheckin.storage

import platform.Foundation.NSUserDefaults

class IosCheckInStore(private val defaults: NSUserDefaults = NSUserDefaults.standardUserDefaults) : CheckInStore {
    override fun readPresentIds(): Set<String> = defaults.stringArrayForKey("event_check_in.present_ids")
        ?.mapNotNull { it as? String }?.toSet() ?: emptySet()

    override fun writePresentIds(ids: Set<String>) {
        defaults.setObject(ids.sorted(), forKey = "event_check_in.present_ids")
    }
}
