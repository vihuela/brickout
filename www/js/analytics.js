// ============================================================
// Brick Out - Firebase Analytics + Crashlytics bridge
// No-ops on web / dev builds without google-services.json.
// ============================================================
(function () {
  function plugin(name) {
    const C = window.Capacitor;
    return (C && C.Plugins && C.Plugins[name]) || null;
  }

  let failed = false; // stop hammering the bridge if firebase is not configured

  BO.track = function (name, params) {
    if (failed) return;
    const A = plugin('FirebaseAnalytics');
    if (!A) return;
    try {
      A.logEvent({ name, params: params || {} }).catch(() => { failed = true; });
    } catch (e) { failed = true; }
  };

  BO.crash = {
    log(msg) {
      const Cr = plugin('FirebaseCrashlytics');
      if (!Cr) return;
      try { Cr.log({ message: String(msg).slice(0, 500) }).catch(() => {}); } catch (e) {}
    },
    // report a JS error as a non-fatal exception
    record(err, context) {
      const Cr = plugin('FirebaseCrashlytics');
      if (!Cr) return;
      try {
        const message = (context ? context + ': ' : '')
          + (err && err.message ? err.message : String(err));
        const stack = err && err.stack ? String(err.stack) : '';
        Cr.recordException({ message: (message + ' | ' + stack).slice(0, 1000) }).catch(() => {});
      } catch (e) {}
    },
  };

  // global JS error hooks -> non-fatal crash reports
  window.addEventListener('error', e => {
    BO.crash.record(e.error || e.message, 'window.onerror');
  });
  window.addEventListener('unhandledrejection', e => {
    BO.crash.record(e.reason || 'unhandled rejection', 'promise');
  });
})();
