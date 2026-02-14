import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

import { JobCard } from "../components/JobCard";
import Navbar from "../components/Navbar";
import { PublicHeader } from "../components/PublicHeader";
import { useAuth } from "../contexts/AuthContext";
import { mockJobs } from "../lib/mockData";

export default function PublicJobBoard() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");

  // Get unique departments
  const departments = useMemo(() => {
    const depts = new Set(mockJobs.map((job) => job.department));
    return ["all", ...Array.from(depts)];
  }, []);

  // Filter jobs
  const filteredJobs = useMemo(() => {
    return mockJobs.filter((job) => {
      if (job.status !== "active") return false;

      const matchesSearch =
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDepartment =
        selectedDepartment === "all" || job.department === selectedDepartment;

      return matchesSearch && matchesDepartment;
    });
  }, [searchTerm, selectedDepartment]);

  return (
    <div className="min-h-screen bg-gray-50">
      {user ? <Navbar /> : <PublicHeader />}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="mb-12">
          <h1 className="text-4xl text-gray-900 mb-4">
            Find Your Next Opportunity
          </h1>
          <p className="text-xl text-gray-600">
            Explore open positions and join our growing team
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Department Filter */}
            <Select
              value={selectedDepartment}
              onValueChange={(value: string) => setSelectedDepartment(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>

              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept === "all" ? "All Departments" : dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-sm text-gray-600">
            {filteredJobs.length}{" "}
            {filteredJobs.length === 1 ? "position" : "positions"} available
          </p>
        </div>

        {/* Job Grid */}
        {filteredJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">
              No positions match your search criteria
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
