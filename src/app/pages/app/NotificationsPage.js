import { useEffect, useMemo, useState } from 'react';
import { apiClient } from '../../lib/api';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [pushEnabled, setPushEnabled] = useState(true);
  const [status, setStatus] = useState('');

  useEffect(() => {
    loadNotifications();
    loadSettings();
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'unread') return notifications.filter((item) => !item.read);
    return notifications;
  }, [filter, notifications]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications],
  );

  const loadNotifications = async () => {
    try {
      const payload = await apiClient.notifications();
      if (payload?.success) {
        setNotifications(payload.notifications || []);
      }
    } catch (error) {
      setStatus(error.message || 'Failed to load notifications.');
    }
  };

  const loadSettings = async () => {
    try {
      const payload = await apiClient.getNotificationSettings();
      if (payload?.success) {
        setPushEnabled(Boolean(payload.settings?.pushEnabled));
      }
    } catch (_error) {
      // Ignore settings failure to keep page usable.
    }
  };

  const markAllRead = async () => {
    try {
      await apiClient.markAllNotificationsRead();
      setStatus('All notifications marked as read.');
      await loadNotifications();
    } catch (error) {
      setStatus(error.message || 'Unable to mark notifications as read.');
    }
  };

  const togglePush = async () => {
    const next = !pushEnabled;
    setPushEnabled(next);

    try {
      await apiClient.updateNotificationSettings({ pushEnabled: next });
      setStatus(
        next ? 'Push notifications enabled.' : 'Push notifications disabled.',
      );
    } catch (error) {
      setPushEnabled((prev) => !prev);
      setStatus(
        error.message || 'Unable to update push notification settings.',
      );
    }
  };

  const openNotification = async (notification) => {
    if (notification.read) return;

    try {
      await apiClient.markNotificationRead(notification.id);
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notification.id ? { ...item, read: true } : item,
        ),
      );
    } catch (_error) {
      // Keep UI usable even if the request fails.
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={loadNotifications}
              className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 sm:w-auto"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={markAllRead}
              className="w-full rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 sm:w-auto"
            >
              Mark All Read
            </button>
          </div>
        </div>

        {status && <p className="mt-3 text-sm text-slate-600">{status}</p>}
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex w-full gap-2 sm:w-auto">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={[
              'flex-1 rounded-xl px-3 py-2 text-sm font-semibold sm:flex-none',
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700',
            ].join(' ')}
          >
            All
          </button>

          <button
            type="button"
            onClick={() => setFilter('unread')}
            className={[
              'flex-1 rounded-xl px-3 py-2 text-sm font-semibold sm:flex-none',
              filter === 'unread'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700',
            ].join(' ')}
          >
            Unread ({unreadCount})
          </button>
        </div>

        <button
          type="button"
          onClick={togglePush}
          className={[
            'w-full rounded-xl px-3 py-2 text-sm font-semibold sm:w-auto',
            pushEnabled
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-slate-100 text-slate-700',
          ].join(' ')}
        >
          Push {pushEnabled ? 'On' : 'Off'}
        </button>
      </section>

      <section className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        {filtered.length === 0 ? (
          <p className="text-sm text-slate-500">
            No notifications in this filter.
          </p>
        ) : (
          filtered.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => openNotification(notification)}
              className={[
                'w-full rounded-xl border px-3 py-3 text-left transition-colors',
                notification.read
                  ? 'border-slate-200 bg-white'
                  : 'border-blue-100 bg-blue-50',
              ].join(' ')}
            >
              <p className="text-sm font-semibold text-slate-900">
                {notification.title}
              </p>
              <p className="mt-1 text-xs text-slate-600">
                {notification.description}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                {notification.timestamp}
              </p>
            </button>
          ))
        )}
      </section>
    </div>
  );
}
