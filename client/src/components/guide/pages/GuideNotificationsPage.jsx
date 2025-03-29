import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, isToday, isYesterday } from 'date-fns';
import {
  Bell,
  CheckCircle,
  AlertCircle,
  Filter,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  FileText,
  ClipboardList,
  UserCheck,
  Bookmark,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { useAuth } from '../../layouts/AuthProvider';

const GuideNotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState('all');
  const { user } = useAuth();

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_BASEURL}/api/notifications`, {
        withCredentials: true
      });

      if (response.data.success) {
        setNotifications(response.data.notifications || []);
      } else {
        setError(response.data.message || 'Failed to load notifications');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to load notifications. Please try again later.';
      setError(errorMsg);
      console.error('Error fetching guide notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    const abortController = new AbortController();

    const fetchData = async () => {
      if (isMounted) {
        await fetchNotifications();
      }
    };

    fetchData();

    const intervalId = setInterval(fetchData, 120000);

    return () => {
      isMounted = false;
      abortController.abort();
      clearInterval(intervalId);
    };
  }, [user]);

  const isForCurrentGuide = (notification) => {
    if (!user) return false;
    return notification.recipients.some(r => 
      r.id === user._id && r.model === 'Guide'
    );
  };

  const isUnreadForGuide = (notification) => {
    if (!user) return false;
    const recipient = notification.recipients.find(r => 
      r.id === user._id && r.model === 'Guide'
    );
    return recipient && !recipient.isRead;
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.put(
        `${process.env.REACT_APP_BACKEND_BASEURL}/api/notifications/${notificationId}/mark-read/guide`,
        {},
        { withCredentials: true }
      );

      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification._id === notificationId
            ? {
                ...notification,
                recipients: notification.recipients.map(recipient => {
                  if (recipient.id === user._id && recipient.model === 'Guide') {
                    return { ...recipient, isRead: true, readAt: new Date() };
                  }
                  return recipient;
                })
              }
            : notification
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(
        `${process.env.REACT_APP_BACKEND_BASEURL}/api/notifications/mark-all-read/guide`,
        {},
        { withCredentials: true }
      );

      setNotifications(prevNotifications =>
        prevNotifications.map(notification => ({
          ...notification,
          recipients: notification.recipients.map(recipient => {
            if (recipient.id === user._id && recipient.model === 'Guide') {
              return { ...recipient, isRead: true, readAt: new Date() };
            }
            return recipient;
          })
        }))
      );
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      setError('Failed to mark all notifications as read');
    }
  };

  const formatTimestamp = (timestamp) => {
    if (isToday(new Date(timestamp))) {
      return `Today at ${format(new Date(timestamp), 'h:mm a')}`;
    } else if (isYesterday(new Date(timestamp))) {
      return `Yesterday at ${format(new Date(timestamp), 'h:mm a')}`;
    } else {
      return format(new Date(timestamp), 'MMM d, yyyy • h:mm a');
    }
  };

  const getNotificationIcon = (type, priority, notification) => {
    const priorityColors = {
      high: "text-red-500",
      medium: "text-amber-500",
      low: "text-blue-500"
    };

    const color = priorityColors[priority] || "text-gray-500";

    switch (type) {
      case "WEEKLY_REPORT_SUBMISSION":
        return <FileText className={`${color} h-5 w-5`} />;
      case "WEEKLY_REPORT_STATUS_CHANGE":
        return notification?.statusChange?.to === "Approved" 
          ? <ThumbsUp className={`${color} h-5 w-5`} />
          : <ThumbsDown className={`${color} h-5 w-5`} />;
      case "STUDENT_ASSIGNMENT":
        return <UserCheck className={`${color} h-5 w-5`} />;
      case "GUIDE_SPECIFIC_ANNOUNCEMENT":
        return <Bookmark className={`${color} h-5 w-5`} />;
      case "BROADCAST_MESSAGE":
        return <Bell className={`${color} h-5 w-5`} />;
      default:
        return <Bell className={`${color} h-5 w-5`} />;
    }
  };

  const getNotificationTypeName = (type, notification) => {
    switch (type) {
      case "WEEKLY_REPORT_SUBMISSION":
        return "Weekly Report Submitted";
      case "WEEKLY_REPORT_STATUS_CHANGE":
        return notification?.statusChange?.to === "Approved" 
          ? "Weekly Report Approved" 
          : "Weekly Report Rejected";
      case "STUDENT_ASSIGNMENT":
        return "New Student Assignment";
      case "GUIDE_SPECIFIC_ANNOUNCEMENT":
        return "Guide Announcement";
      case "BROADCAST_MESSAGE":
        return "Broadcast Message";
      default:
        return type.replace(/_/g, ' ').toLowerCase();
    }
  };

  const renderNotificationContent = (notification) => {
    const isUnread = isUnreadForGuide(notification);
    
    switch (notification.type) {
      case "WEEKLY_REPORT_STATUS_CHANGE":
        return (
          <>
            <p className={`mt-1 text-sm ${isUnread ? 'text-gray-700' : 'text-gray-500'}`}>
              {notification.message}
              {notification.statusChange?.reason && (
                <div className="mt-2 p-2 bg-gray-100 rounded">
                  <p className="text-sm font-medium">Feedback:</p>
                  <p className="text-sm">{notification.statusChange.reason}</p>
                </div>
              )}
            </p>
            {notification.link && (
              <a
                href={notification.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center mt-2 text-sm text-blue-600 hover:text-blue-800"
              >
                View details <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            )}
          </>
        );

      case "STUDENT_ASSIGNMENT":
        return (
          <>
            <p className={`mt-1 text-sm ${isUnread ? 'text-gray-700' : 'text-gray-500'}`}>
              {notification.message}
            </p>
            {notification.studentData && (
              <div className="mt-2 p-2 bg-gray-100 rounded">
                <p className="text-sm font-medium">Student: {notification.studentData.name}</p>
                {notification.studentData.year && (
                  <p className="text-sm">Year: {notification.studentData.year}</p>
                )}
              </div>
            )}
            {notification.link && (
              <a
                href={notification.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center mt-2 text-sm text-blue-600 hover:text-blue-800"
              >
                View student details <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            )}
          </>
        );

      default:
        return (
          <p className={`mt-1 text-sm ${isUnread ? 'text-gray-700' : 'text-gray-500'}`}>
            {notification.message}
          </p>
        );
    }
  };

  const relevantNotifications = notifications.filter(isForCurrentGuide);
  const filteredNotifications = relevantNotifications.filter(notification => {
    if (filterType !== 'all' && notification.type !== filterType) {
      return false;
    }
    if (priorityFilter !== 'all' && notification.priority !== priorityFilter) {
      return false;
    }
    return true;
  });

  const notificationTypes = [
    { value: 'all', label: 'All Notifications' },
    { value: 'WEEKLY_REPORT_SUBMISSION', label: 'Report Submissions' },
    { value: 'WEEKLY_REPORT_STATUS_CHANGE', label: 'Report Feedback' },
    { value: 'STUDENT_ASSIGNMENT', label: 'Student Assignments' },
    { value: 'GUIDE_SPECIFIC_ANNOUNCEMENT', label: 'Announcements' },
    { value: 'BROADCAST_MESSAGE', label: 'Broadcast Messages' },
  ];

  const priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    { value: 'high', label: 'High Priority' },
    { value: 'medium', label: 'Medium Priority' },
    { value: 'low', label: 'Low Priority' },
  ];

  const unreadCount = notifications.filter(isUnreadForGuide).length;

  const handleRetry = () => {
    setError(null);
    fetchNotifications();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
          <p className="text-gray-500 mt-1">
            You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            aria-expanded={showFilters}
            aria-label="Filter notifications"
          >
            <Filter className="h-4 w-4" />
            <span>Filter</span>
            <ChevronDown className="h-4 w-4" />
          </button>

          <button
            onClick={markAllAsRead}
            className="px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2"
            disabled={unreadCount === 0}
            aria-label="Mark all notifications as read"
          >
            <CheckCircle className="h-4 w-4" />
            <span>Mark all read</span>
          </button>

          <button
            onClick={fetchNotifications}
            className="p-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            aria-label="Refresh notifications"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 flex flex-wrap gap-4">
          <div className="flex-1 min-w-48">
            <label htmlFor="notification-type-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Notification Type
            </label>
            <select
              id="notification-type-filter"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {notificationTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-48">
            <label htmlFor="priority-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              id="priority-filter"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {priorityOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <strong>Error: </strong> {error}
          <button 
            onClick={handleRetry}
            className="ml-2 px-2 py-1 text-sm font-medium text-red-700 border border-red-500 rounded-md hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      )}

      {loading && notifications.length === 0 && (
        <div className="flex justify-center items-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
        </div>
      )}

      {filteredNotifications.length === 0 && !loading && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <Bell className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filterType !== 'all' || priorityFilter !== 'all' 
              ? "No notifications match your current filters" 
              : "You don't have any notifications yet"}
          </p>
        </div>
      )}

      {filteredNotifications.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {filteredNotifications.map((notification) => {
            const isUnread = isUnreadForGuide(notification);

            return (
              <div
                key={notification._id}
                className={`
                  border-b border-gray-200 last:border-0
                  ${isUnread ? 'bg-blue-50' : ''}
                  transition-colors hover:bg-gray-50
                `}
              >
                <div className="p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 pt-0.5">
                      {getNotificationIcon(notification.type, notification.priority, notification)}
                    </div>

                    <div className="ml-3 flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm text-gray-500">
                            {getNotificationTypeName(notification.type, notification)}
                          </p>
                          <h3 className={`font-medium ${isUnread ? 'text-gray-900' : 'text-gray-600'}`}>
                            {notification.title}
                          </h3>
                        </div>

                        {isUnread && (
                          <button
                            onClick={() => markAsRead(notification._id)}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="Mark as read"
                            aria-label={`Mark notification "${notification.title}" as read`}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      {renderNotificationContent(notification)}

                      <div className="mt-2 flex items-center text-xs text-gray-500">
                        <p>
                          From: {notification.sender?.name || `${notification.sender?.model?.charAt(0).toUpperCase() + notification.sender?.model?.slice(1)}`}
                        </p>
                        <span className="mx-2">•</span>
                        <p>{formatTimestamp(notification.createdAt)}</p>

                        {notification.priority !== 'medium' && (
                          <>
                            <span className="mx-2">•</span>
                            <span
                              className={`
                                ${notification.priority === 'high' ? 'text-red-600 bg-red-100' : 'text-blue-600 bg-blue-100'}
                                px-1.5 py-0.5 rounded-full text-xs
                              `}
                            >
                              {notification.priority.charAt(0).toUpperCase() + notification.priority.slice(1)} priority
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GuideNotificationsPage;