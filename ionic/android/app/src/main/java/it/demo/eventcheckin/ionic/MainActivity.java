package it.demo.eventcheckin.ionic;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(CheckInCameraAvailabilityPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
