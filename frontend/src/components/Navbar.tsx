import {
  Briefcase,
  BriefcaseBusiness,
  Briefcase as BriefcaseIcon,
  LayoutDashboard,
  User,
  Users,
} from "lucide-react";
import { Link } from "react-router";

import { useUserContext } from "@/contexts/UserContext";
import Client_ROUTEMAP from "../misc/Client_ROUTEMAP";
import Logout from "./shared/Logout";
import { API_URL } from "@/misc/modifiedFetch";
import Server_ROUTEMAP from "@/misc/Server_ROUTEMAP";

export default function Navbar() {
  const { user } = useUserContext();

  const getDashboardLink = () => {
    if (user?.role === "candidate")
      return `${Client_ROUTEMAP.candidate.root}/${Client_ROUTEMAP.candidate.dashboard}`;
    if (user?.role === "hr")
      return `${Client_ROUTEMAP.hr.root}/${Client_ROUTEMAP.hr.dashboard}`;
    if (user?.role === "admin")
      return `${Client_ROUTEMAP.admin.root}/${Client_ROUTEMAP.admin.dashboard}`;
    return Client_ROUTEMAP._.root;
  };

  const getNavigationItems = () => {
    if (user?.role === "candidate") {
      return [
        {
          to: `${Client_ROUTEMAP.candidate.root}/${Client_ROUTEMAP.candidate.dashboard}`,
          label: "My Applications",
          icon: LayoutDashboard,
        },
        {
          to: Client_ROUTEMAP._.root,
          label: "Browse Jobs",
          icon: BriefcaseIcon,
        },
      ];
    }
    if (user?.role === "hr") {
      return [
        {
          to: Client_ROUTEMAP._.root,
          label: "All Jobs",
          icon: BriefcaseBusiness,
        },
        {
          to: `${Client_ROUTEMAP.hr.root}/${Client_ROUTEMAP.hr.dashboard}`,
          label: "My Jobs",
          icon: BriefcaseIcon,
        },
      ];
    }
    if (user?.role === "admin") {
      return [
        {
          to: `${Client_ROUTEMAP.admin.root}/${Client_ROUTEMAP.admin.dashboard}`,
          label: "Dashboard",
          icon: LayoutDashboard,
        },
        {
          to: `${Client_ROUTEMAP.admin.root}/${Client_ROUTEMAP.admin.hrUsers}`,
          label: "HR Users",
          icon: Users,
        },
        {
          to: `${Client_ROUTEMAP.admin.root}/${Client_ROUTEMAP.admin.jobs}`,
          label: "All Jobs",
          icon: BriefcaseIcon,
        },
        {
          to: `${Client_ROUTEMAP.admin.root}/${Client_ROUTEMAP.admin.candidates}`,
          label: "All Candidates",
          icon: User,
        },
      ];
    }
    return [];
  };

  const navigationItems = getNavigationItems();

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to={getDashboardLink()} className="flex items-center gap-2">
            <Briefcase className="w-8 h-8 text-blue-600" />
            <span className="text-xl text-gray-900">Demo Software</span>
          </Link>

          <nav className="flex items-center gap-6">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <Icon className="w-5 h-5" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}

            <div className="flex items-center gap-4 pl-6 border-l border-gray-200">
              <div className="flex items-center gap-3">
                {user?.profilePicture ? (
                  <img
                    src={
                      API_URL +
                      Server_ROUTEMAP.uploads.root +
                      Server_ROUTEMAP.uploads.images +
                      "/" +
                      user.profilePicture
                    }
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                )}
                <div className="hidden md:block">
                  <p className="text-sm text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500 capitalize">
                    {user?.role}
                  </p>
                </div>
              </div>

              <Logout />
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
