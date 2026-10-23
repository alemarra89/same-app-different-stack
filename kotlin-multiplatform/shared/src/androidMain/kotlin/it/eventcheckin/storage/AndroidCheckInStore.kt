package it.eventcheckin.storage

import android.content.Context

class AndroidCheckInStore(context: Context, name: String = "event_check_in") : CheckInStore {
    private val preferences = context.applicationContext.getSharedPreferences(name, Context.MODE_PRIVATE)

    override fun readPresentIds(): Set<String> = preferences.getStringSet("present_ids", emptySet())!!.toSet()

    override fun writePresentIds(ids: Set<String>) {
        // Six IDs: a synchronous commit makes failure observable before reporting success.
        check(preferences.edit().putStringSet("present_ids", ids.toSet()).commit()) { "Local storage write failed" }
    }
}
