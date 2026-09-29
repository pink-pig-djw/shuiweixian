package com.pinkpigdjw.shuiweixian;

import android.app.Activity;
import android.app.AlertDialog;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import androidx.webkit.WebViewAssetLoader;
import java.io.ByteArrayInputStream;

public final class MainActivity extends Activity {
    private WebView web;
    private boolean paused;
    private static final String HOST = "appassets.androidplatform.net";
    private static final String HOME = "https://" + HOST + "/assets/index.html";

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        FrameLayout container = new FrameLayout(this);
        container.setBackgroundColor(Color.rgb(5,8,9));
        web = new WebView(this);
        web.setBackgroundColor(Color.rgb(5,8,9));
        container.addView(web, new FrameLayout.LayoutParams(-1, -1));
        setContentView(container);
        // Keep content clear of system bars and display cutouts, including Android 15 edge-to-edge.
        container.setOnApplyWindowInsetsListener((view, insets) -> {
            if (Build.VERSION.SDK_INT >= 30) {
                android.graphics.Insets safe = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                view.setPadding(safe.left, safe.top, safe.right, safe.bottom);
            } else {
                view.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(), insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
            }
            return insets;
        });
        container.requestApplyInsets();
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setSupportZoom(false);
        settings.setTextZoom(100);
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);
        WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this)).build();
        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                WebResourceResponse local = loader.shouldInterceptRequest(request.getUrl());
                return local != null ? local : new WebResourceResponse("text/plain", "UTF-8", 403, "Blocked", null, new ByteArrayInputStream(new byte[0]));
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri url = request.getUrl();
                return !("https".equals(url.getScheme()) && HOST.equals(url.getHost()) && "/assets/index.html".equals(url.getPath()));
            }
            @Override public void onPageFinished(WebView view, String url) {
                if (paused) view.evaluateJavascript("window.swlNative?.pause()", null);
            }
        });
        web.loadUrl(HOME);
        if (Build.VERSION.SDK_INT >= 33) getOnBackInvokedDispatcher().registerOnBackInvokedCallback(0, this::handleBack);
    }

    private void handleBack() {
        web.evaluateJavascript("window.swlNative ? window.swlNative.back() : false", handled -> {
            if (!"true".equals(handled) && !isFinishing()) {
                new AlertDialog.Builder(this).setTitle("离开水位线？").setMessage("当前进度会自动保存。")
                    .setNegativeButton("继续游玩", null)
                    .setPositiveButton("退出", (dialog, which) -> web.evaluateJavascript("window.swlNative?.pause()", value -> finish()))
                    .show();
            }
        });
    }
    @Override public void onBackPressed() { handleBack(); }
    @Override protected void onPause() {
        paused = true;
        web.evaluateJavascript("window.swlNative?.pause()", null);
        web.onPause();
        super.onPause();
    }
    @Override protected void onResume() {
        super.onResume();
        paused = false;
        if (web != null) { web.onResume(); web.evaluateJavascript("window.swlNative?.resume()", null); }
    }
    @Override protected void onDestroy() {
        if (web != null) { ((FrameLayout) web.getParent()).removeView(web); web.destroy(); web = null; }
        super.onDestroy();
    }
}
