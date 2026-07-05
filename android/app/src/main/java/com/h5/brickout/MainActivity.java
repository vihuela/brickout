package com.h5.brickout;

import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Android 15+ enforces edge-to-edge for apps targeting SDK 35+.
        // Pad the content view by the system bar / cutout insets so the game
        // keeps its layout, and paint the window dark behind the bars.
        if (Build.VERSION.SDK_INT >= 35) {
            getWindow().getDecorView().setBackgroundColor(Color.parseColor("#10131C"));
            View content = findViewById(android.R.id.content);
            ViewCompat.setOnApplyWindowInsetsListener(content, (v, insets) -> {
                Insets bars = insets.getInsets(
                        WindowInsetsCompat.Type.systemBars()
                                | WindowInsetsCompat.Type.displayCutout());
                v.setPadding(bars.left, bars.top, bars.right, bars.bottom);
                return WindowInsetsCompat.CONSUMED;
            });
        }
    }
}
