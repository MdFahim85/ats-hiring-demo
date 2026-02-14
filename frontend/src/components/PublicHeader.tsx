import { Link } from "react-router";
import { Briefcase } from "lucide-react";
import Client_ROUTEMAP from "../misc/Client_ROUTEMAP";

export function PublicHeader() {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to={Client_ROUTEMAP._.root} className="flex items-center gap-2">
            <Briefcase className="w-8 h-8 text-blue-600" />
            <span className="text-xl text-gray-900">Demo Software</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              to={`${Client_ROUTEMAP.auth.root}/${Client_ROUTEMAP.auth.register}`}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Sign Up
            </Link>
            <Link
              to={`${Client_ROUTEMAP.auth.root}/${Client_ROUTEMAP.auth.login}`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign In
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
