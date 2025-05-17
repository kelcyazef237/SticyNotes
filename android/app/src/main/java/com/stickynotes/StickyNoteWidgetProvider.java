package com.stickynotes;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.widget.RemoteViews;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

/**
 * Implementation of App Widget functionality.
 */
public class StickyNoteWidgetProvider extends AppWidgetProvider {

    public static final String ACTION_WIDGET_UPDATE = "com.stickynotes.ACTION_WIDGET_UPDATE";
    public static final String ACTION_WIDGET_CLICK = "com.stickynotes.ACTION_WIDGET_CLICK";
    public static final String EXTRA_NOTE_ID = "com.stickynotes.EXTRA_NOTE_ID";

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager,
                                int appWidgetId) {
        android.util.Log.d("StickyWidget", "Updating widget with ID: " + appWidgetId);

        // Construct the RemoteViews object
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.sticky_note_widget);

        // Set up the intent for the widget service
        Intent intent = new Intent(context, StickyNoteWidgetService.class);
        intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId);
        // Use a unique Uri to avoid intent reuse
        intent.setData(Uri.parse(intent.toUri(Intent.URI_INTENT_SCHEME)));

        // Force a refresh of data
        views.setRemoteAdapter(R.id.widget_list, intent);

        // Configure empty view
        views.setEmptyView(R.id.widget_list, R.id.empty_view);

        // Since we can't directly check if there are notes here, let's show the empty view
        // only when the list adapter tells us it's empty (via the setEmptyView connection)
        
        // Set up the intent for when a note is clicked
        Intent clickIntent = new Intent(context, StickyNoteWidgetProvider.class);
        clickIntent.setAction(ACTION_WIDGET_CLICK);
        clickIntent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId);
        PendingIntent clickPendingIntent = PendingIntent.getBroadcast(context, 0,
                clickIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setPendingIntentTemplate(R.id.widget_list, clickPendingIntent);

        // Add refresh action when widget is tapped in an empty area
        Intent refreshIntent = new Intent(context, StickyNoteWidgetProvider.class);
        refreshIntent.setAction(ACTION_WIDGET_UPDATE);
        PendingIntent refreshPendingIntent = PendingIntent.getBroadcast(context, 0,
                refreshIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_title, refreshPendingIntent);

        // Instruct the widget manager to update the widget
        appWidgetManager.updateAppWidget(appWidgetId, views);
        
        // Immediately notify the widget that data might have changed
        appWidgetManager.notifyAppWidgetViewDataChanged(appWidgetId, R.id.widget_list);
        android.util.Log.d("StickyWidget", "Widget update completed and data change notified");
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        android.util.Log.d("StickyWidget", "onUpdate called for " + appWidgetIds.length + " widgets");
        // There may be multiple widgets active, so update all of them
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);

        android.util.Log.d("StickyWidget", "onReceive action: " + intent.getAction());

        if (ACTION_WIDGET_UPDATE.equals(intent.getAction())) {
            // Update all widgets
            android.util.Log.d("StickyWidget", "Processing widget update action");
            AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
            int[] appWidgetIds = appWidgetManager.getAppWidgetIds(
                    intent.getComponent());
            android.util.Log.d("StickyWidget", "Found " + appWidgetIds.length + " widgets to update");
            
            // Force data reload in widget service
            for (int appWidgetId : appWidgetIds) {
                updateAppWidget(context, appWidgetManager, appWidgetId);
            }
            
            appWidgetManager.notifyAppWidgetViewDataChanged(appWidgetIds, R.id.widget_list);
        } else if (ACTION_WIDGET_CLICK.equals(intent.getAction())) {
            // Handle note click - launch the app with the specific note
            android.util.Log.d("StickyWidget", "Processing widget click action");
            String noteId = intent.getStringExtra(EXTRA_NOTE_ID);
            if (noteId != null) {
                android.util.Log.d("StickyWidget", "Opening note with ID: " + noteId);
                
                // Launch the main activity with the note ID and edit flag
                Intent launchIntent = new Intent(context, MainActivity.class);
                launchIntent.putExtra("note_id", noteId);
                launchIntent.putExtra("edit_mode", true); // Add flag to open note in edit mode
                launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                
                // Start the activity directly - we can't use animations from a non-activity context
                context.startActivity(launchIntent);
            } else {
                android.util.Log.w("StickyWidget", "Note click received but no note ID found");
                
                // If no note ID, just open the app
                Intent launchIntent = new Intent(context, MainActivity.class);
                launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(launchIntent);
            }
        }
    }

    @Override
    public void onEnabled(Context context) {
        android.util.Log.d("StickyWidget", "Widget enabled for the first time");
        // Trigger an update when widget is first enabled
        Intent updateIntent = new Intent(context, StickyNoteWidgetProvider.class);
        updateIntent.setAction(ACTION_WIDGET_UPDATE);
        context.sendBroadcast(updateIntent);
    }

    @Override
    public void onDisabled(Context context) {
        // Enter relevant functionality for when the last widget is disabled
    }
}
