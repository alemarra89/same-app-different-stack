package it.demo.eventcheckin;

import android.content.Context;
import android.hardware.camera2.CameraAccessException;
import android.hardware.camera2.CameraManager;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Detects absent hardware before opening the native scanner Activity. */
@CapacitorPlugin(name = "CheckInCameraAvailability")
public class CheckInCameraAvailabilityPlugin extends Plugin {
    @PluginMethod
    public void check(PluginCall call) {
        CameraManager manager = (CameraManager) getContext().getSystemService(Context.CAMERA_SERVICE);
        boolean available = false;
        try {
            available = manager != null && manager.getCameraIdList().length > 0;
        } catch (CameraAccessException | SecurityException ignored) {
            // A busy or inaccessible camera uses the same manual-entry fallback.
        }
        JSObject result = new JSObject();
        result.put("available", available);
        call.resolve(result);
    }
}
