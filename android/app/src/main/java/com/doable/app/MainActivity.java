package com.doable.app;

import android.webkit.PermissionRequest;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;

public class MainActivity extends BridgeActivity {
    @Override
    public void onStart() {
        super.onStart();
        // Grant microphone access to the WebView so Web Speech API works.
        // BridgeWebChromeClient preserves all existing Capacitor WebView behaviour.
        getBridge().getWebView().setWebChromeClient(new BridgeWebChromeClient(getBridge()) {
            @Override
            public void onPermissionRequest(PermissionRequest request) {
                request.grant(request.getResources());
            }
        });
    }
}
