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
    Bookmark
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

    // Fetch notifications specifically for guides
    const fetchNotifications = async () => {
        setLoading(true);
        setError(null);
        try {
            // Using direct endpoint to fetch guide notifications
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_BASEURL}/api/notifications`, {
                withCredentials: true
            });

            if (response.data.success) {
                setNotifications(response.data.notifications || []);
            } else {
                setError(response.data.message || 'Failed to load notifications');
            }
        } catch (err) {
            setError('Failed to load notifications. Please try again later.');
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

        // Auto-refresh every 2 minutes
        const intervalId = setInterval(fetchData, 120000);

        return () => {
            isMounted = false;
            abortController.abort();
            clearInterval(intervalId);
        };
    }, [user]);

    // Mark a notification as read
    const markAsRead = async (notificationId) => {
        try {
            await axios.put(
                `${process.env.REACT_APP_BACKEND_BASEURL}/api/notifications/${notificationId}/mark-read`,
                {},
                { withCredentials: true }
            );

            // Update local state to reflect the change
            setNotifications(prevNotifications =>
                prevNotifications.map(notification =>
                    notification._id === notificationId
                        ? {
                            ...notification,
                            recipients: notification.recipients.map(recipient =>
                                recipient.id === user._id && recipient.model === 'guide'
                                    ? { ...recipient, isRead: true, readAt: new Date() }
                                    : recipient
                            ),
                            isUnread: false
                        }
                        : notification
                )
            );
        } catch (err) {
            console.error('Error marking notification as read:', err);
            setError('Failed to mark notification as read');
        }
    };

    // Mark all notifications as read
    const markAllAsRead = async () => {
        try {
            await axios.put(
                `${process.env.REACT_APP_BACKEND_BASEURL}/api/notifications/mark-all-read`,
                {},
                { withCredentials: true }
            );

            // Update local state to reflect all notifications as read
            setNotifications(prevNotifications =>
                prevNotifications.map(notification => ({
                    ...notification,
                    recipients: notification.recipients.map(recipient =>
                        recipient.id === user._id && recipient.model === 'guide'
                            ? { ...recipient, isRead: true, readAt: new Date() }
                            : recipient
                    ),
                    isUnread: false
                }))
            );
        } catch (err) {
            console.error('Error marking all notifications as read:', err);
            setError('Failed to mark all notifications as read');
        }
    };

    // Format the notification timestamp
    const formatTimestamp = (timestamp) => {
        if (isToday(new Date(timestamp))) {
            return `Today at ${format(new Date(timestamp), 'h:mm a')}`;
        } else if (isYesterday(new Date(timestamp))) {
            return `Yesterday at ${format(new Date(timestamp), 'h:mm a')}`;
        } else {
            return format(new Date(timestamp), 'MMM d, yyyy • h:mm a');
        }
    };

    // Get appropriate icon for guide-specific notifications
    const getNotificationIcon = (type, priority) => {
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
                return <ClipboardList className={`${color} h-5 w-5`} />;
            case "STUDENT_ASSIGNMENT":
                return <UserCheck className={`${color} h-5 w-5`} />;
            case "GUIDE_SPECIFIC_ANNOUNCEMENT":
                return <Bookmark className={`${color} h-5 w-5`} />;
            default:
                return <Bell className={`${color} h-5 w-5`} />;
        }
    };

    // Get human-readable names for notification types
    const getNotificationTypeName = (type) => {
        switch (type) {
            case "WEEKLY_REPORT_SUBMISSION":
                return "Weekly Report Submitted";
            case "WEEKLY_REPORT_STATUS_CHANGE":
                return "Weekly Report Feedback";
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

    // Filter notifications
    const filteredNotifications = notifications.filter(notification => {
        if (filterType !== 'all' && notification.type !== filterType) {
            return false;
        }

        if (priorityFilter !== 'all' && notification.priority !== priorityFilter) {
            return false;
        }

        return true;
    });

    // Guide-specific notification types
    const notificationTypes = [
        { value: 'all', label: 'All Notifications' },
        { value: 'WEEKLY_REPORT_SUBMISSION', label: 'Weekly Reports' },
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

    // Count unread notifications
    const unreadCount = notifications.filter(n => n.isUnread).length;

    // Better error handling for UI display
    const handleRetry = () => {
        setError(null);
        fetchNotifications();
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">My Notifications</h1>
                    <p className="text-gray-500 mt-1">
                        {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
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

            {/* Filter panel */}
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

            {/* Loading state */}
            {loading && notifications.length === 0 && (
                <div className="flex justify-center items-center py-12 bg-white rounded-lg border border-gray-200">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
                </div>
            )}

            {/* Error state with retry button */}
            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md mb-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <AlertCircle className="h-5 w-5 text-red-500" />
                        </div>
                        <div className="ml-3 flex-1">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                        <button 
                            onClick={handleRetry}
                            className="ml-auto px-3 py-1 text-sm font-medium text-red-700 border border-red-500 rounded-md hover:bg-red-100"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            )}

            {/* Empty state */}
            {!loading && !error && filteredNotifications.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 bg-white rounded-lg border border-gray-200">
                    <Bell className="h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No notifications</h3>
                    <p className="text-gray-500 mt-2">You don't have any notifications yet</p>
                </div>
            )}

            {/* Notifications list */}
            {filteredNotifications.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    {filteredNotifications.map((notification) => {
                        const isUnread = notification.isUnread;

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
                                            {getNotificationIcon(notification.type, notification.priority)}
                                        </div>

                                        <div className="ml-3 flex-1">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-sm text-gray-500">
                                                        {getNotificationTypeName(notification.type)}
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

                                            <p className={`mt-1 text-sm ${isUnread ? 'text-gray-700' : 'text-gray-500'}`}>
                                                {notification.message}
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