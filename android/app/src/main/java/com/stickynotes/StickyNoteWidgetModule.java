package com.stickynotes;

import android.app.Activity;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

public class StickyNoteWidgetModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;

    public StickyNoteWidgetModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "StickyNoteWidget";
    }

    @ReactMethod
    public void updateWidget(Promise promise) {
        try {
            Context context = reactContext.getApplicationContext();
            AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
            ComponentName thisWidget = new ComponentName(context, StickyNoteWidgetProvider.class);
            int[] appWidgetIds = appWidgetManager.getAppWidgetIds(thisWidget);
            
            // Update all widgets
            Intent intent = new Intent(context, StickyNoteWidgetProvider.class);
            intent.setAction(StickyNoteWidgetProvider.ACTION_WIDGET_UPDATE);
            intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, appWidgetIds);
            context.sendBroadcast(intent);
            
            // Notify data changed
            appWidgetManager.notifyAppWidgetViewDataChanged(appWidgetIds, R.id.widget_list);
            
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void openNoteFromWidget(String noteId, Promise promise) {
        try {
            Activity currentActivity = getCurrentActivity();
            if (currentActivity != null) {
                // Handle opening a specific note from the widget
                // This would typically navigate to the note detail screen
                promise.resolve(true);
            } else {
                promise.reject("ERROR", "No activity available");
            }
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }
}
