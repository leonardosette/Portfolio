package com.example.receitafacil.repository;

import android.os.Handler;
import android.os.Looper;

import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

/**
 * Reaproveitado do Google samples.
 * Três executores: diskIO, networkIO (não usado aqui) e mainThread.
 */
public class AppExecutors {

    private static final int THREAD_COUNT = 3;

    private final Executor diskIO;
    private final Executor mainThread;

    private static volatile AppExecutors INSTANCE;

    private AppExecutors() {
        this.diskIO     = Executors.newSingleThreadExecutor();
        this.mainThread = new MainThreadExecutor();
    }

    public static AppExecutors get() {
        if (INSTANCE == null) {
            synchronized (AppExecutors.class) {
                if (INSTANCE == null) {
                    INSTANCE = new AppExecutors();
                }
            }
        }
        return INSTANCE;
    }

    public Executor diskIO()     { return diskIO;     }
    public Executor mainThread() { return mainThread; }

    private static class MainThreadExecutor implements Executor {
        private final Handler mainHandler = new Handler(Looper.getMainLooper());
        @Override public void execute(Runnable command) { mainHandler.post(command); }
    }
}

