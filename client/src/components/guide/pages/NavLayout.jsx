import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  ClipboardCheck,
  FileBarChart,
  ClipboardList,
  UserCheck,
  Menu,
  X,
  Bell,
  LogOut,
  User,
  ChevronDown,
  UserCog,
  ShieldCheck,
  UsersRound,
  CalendarClock,
  ListChecks,
  Download,
} from "lucide-react";
import {
  DropdownMenu,
  // RadixDropdownMenuTrigger,
  // RadixDropdownMenuContent,
  CustomDropdownMenuItem,
  CustomDropdownMenuSeparator,
} from "../../ui/dropdown-menu";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { useAuth } from "../../layouts/AuthProvider";
import Cookies from "js-cookie"; // Import js-cookie

const NavLayout = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [username, setUsername] = useState(""); // State to store the username
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Fetch the username from the cookie when the component mounts
  useEffect(() => {
    const userCookie = Cookies.get("user"); // Assuming the username is stored in a cookie named "user"
    if (userCookie) {
      const userData = JSON.parse(userCookie); // Parse the cookie data
      setUsername(userData.guideName || "User"); // Set the username from the cookie
    }
  }, []);

  // Function to fetch unread notification count
  const fetchUnreadCount = async () => {
    try {
      const token = Cookies.get("token"); // Get auth token from cookies
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_BASEURL}/api/notifications/unread-count`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`, // Send auth token
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setNotificationCount(data.unreadCount);
      } else {
        console.error("Failed to fetch unread count:", data.message);
      }
    } catch (error) {
      console.error("Error fetching unread notification count:", error);
    }
  };

  // Fetch unread count on mount & refresh every 30 seconds
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Refresh every 30 sec
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    {
      icon: <ClipboardList size={20} />,
      text: "Weekly Reports",
      path: "/guide/ManageWeeklyReports",
    },
  ];

  const handleLogout = async () => {
    await logout(); // Call the logout function from AuthProvider
    navigate("/login"); // Redirect to login
  };

  const handleGuideProfile = () => {
    navigate("/guide/GuideProfile");
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 w-full bg-white z-50 px-4 py-3 shadow-md flex justify-between items-center">
        <div className="h-12 flex items-center">
          {" "}
          {/* Reduced height from h-20 to h-12 for better proportion */}
          <img
            src="/images/logo.png"
            alt="Institution Logo"
            className="h-full w-auto object-contain"
          />
        </div>
        <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => navigate("/guide/GuideNotificationsPage")}
        >
          <Bell size={20} className="text-gray-600" />
          {notificationCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-600 text-white">
              {notificationCount}
            </Badge>
          )}
        </Button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 focus:outline-none"
          >
            {isOpen ? (
              <X size={24} className="text-gray-700" />
            ) : (
              <Menu size={24} className="text-gray-700" />
            )}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={`
        fixed lg:static 
        w-64 h-[calc(100vh-4rem)] lg:h-screen
        bg-white shadow-lg 
        transition-transform duration-300 ease-in-out
        z-40
        flex flex-col
        ${
          isOpen
            ? "translate-x-0 mt-16 lg:mt-0"
            : "-translate-x-full lg:translate-x-0"
        }
      `}
      >
        <div className="hidden lg:flex p-4 justify-center items-center">
          {" "}
          {/* Changed to justify-center */}
          <div className="h-16 flex items-center">
            {" "}
            {/* Increased height from h-12 to h-16 */}
            <img
              src="/images/logo.png"
              alt="Institution Logo"
              className="h-full w-auto object-contain"
            />
          </div>
        </div>

        {/* Rest of the component remains the same */}
        <nav className="flex-1 overflow-y-auto">
          <ul className="p-4 space-y-2">
            {navItems.map((item, index) => (
              <li key={index}>
                <a
                  href={item.path}
                  className="w-full flex items-center space-x-3 p-3 rounded-lg text-gray-700 hover:bg-gray-200 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {item.icon}
                  <span className="font-medium">{item.text}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4">
          <div className="hidden lg:flex justify-between items-center mb-4">
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => navigate("/guide/GuideNotificationsPage")}
          >
            <Bell size={20} className="text-gray-600" />
            {notificationCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-600 text-white">
                {notificationCount}
              </Badge>
            )}
          </Button>
          </div>

          <DropdownMenu
            trigger={
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                  <User size={20} className="text-gray-700" />
                </div>
                <span className="font-medium text-gray-700">{username}</span>
                <ChevronDown size={16} className="text-gray-600" />
              </div>
            }
          >
            <CustomDropdownMenuItem
              className="cursor-pointer hover:bg-gray-100 p-3 rounded-lg"
              onClick={handleGuideProfile}
            >
              <User className="mr-2 h-4 w-4 text-gray-600" />
              <span>Profile</span>
            </CustomDropdownMenuItem>
            <CustomDropdownMenuSeparator />
            <CustomDropdownMenuItem
              className="cursor-pointer text-red-600 hover:bg-gray-100 p-3 rounded-lg"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </CustomDropdownMenuItem>
          </DropdownMenu>
        </div>
      </aside>

      <main className="flex-1 lg:min-h-screen bg-gray-50 mt-16 lg:mt-0">
        {children}
      </main>
    </div>
  );
};

export default NavLayout;