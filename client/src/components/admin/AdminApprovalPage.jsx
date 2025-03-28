import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../student/ui/card";
import { Button } from "../student/ui/button";
import { Input } from "../student/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../student/ui/table";
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  ChevronDown,
  External,
  User,
  Building,
  Mail,
} from "lucide-react";
import { Alert, AlertDescription } from "../student/ui/alert";

const AdminApprovalPage = () => {
  const [approvalRequests, setApprovalRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showAlert, setShowAlert] = useState({ show: false, message: "", type: "" });

  // Fetch data from backend
  useEffect(() => {
    const fetchApprovalRequests = async () => {
      try {
        const response = await fetch("/api/admin/company-approvals");
        const data = await response.json();
        setApprovalRequests(data);
        setFilteredRequests(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching approval requests:", error);
        setLoading(false);
      }
    };

    fetchApprovalRequests();
  }, []);

  // Handle search and filtering
  useEffect(() => {
    let filtered = approvalRequests;

    if (searchTerm) {
      filtered = filtered.filter(
        (request) =>
          request.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.companyName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter(
        (request) => request.approvalStatus === filterStatus
      );
    }

    setFilteredRequests(filtered);
  }, [searchTerm, filterStatus, approvalRequests]);

  const handleApproval = async (id, status, reason = "") => {
    try {
      const response = await fetch(`/api/admin/company-approvals/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          rejectionReason: reason,
        }),
      });

      if (response.ok) {
        // Update local state
        const updatedRequests = approvalRequests.map((request) =>
          request._id === id
            ? { ...request, approvalStatus: status, rejectionReason: reason }
            : request
        );
        setApprovalRequests(updatedRequests);
        setSelectedRequest(null);
        setRejectionReason("");
        setShowAlert({
          show: true,
          message: `Request ${status.toLowerCase()} successfully`,
          type: status === "Approved" ? "success" : "destructive",
        });
        setTimeout(() => setShowAlert({ show: false, message: "", type: "" }), 3000);
      }
    } catch (error) {
      console.error("Error updating approval status:", error);
      setShowAlert({
        show: true,
        message: "Error updating status. Please try again.",
        type: "destructive",
      });
    }
  };

  const RequestDetails = ({ request }) => (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Building className="h-5 w-5" />
          {request.companyName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-medium text-gray-800">Student Information</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Student ID:</span>
                <span className="font-medium">{request.studentId}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Email:</span>
                <span className="font-medium">{request.email}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-gray-800">Company Information</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-600">Website:</span>
                <a
                  href={request.companyWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-blue-600 hover:underline flex items-center gap-1"
                >
                  {request.companyWebsite} <External className="h-3 w-3" />
                </a>
              </div>
              <div>
                <span className="text-sm text-gray-600">Stipend:</span>
                <span className="ml-2 font-medium">₹{request.stipendAmount}/month</span>
              </div>
              <div>
                <span className="text-sm text-gray-600">Technologies:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {request.technology.map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-4 justify-end">
          {request.approvalStatus === "Pending" && (
            <>
              <Button
                variant="outline"
                className="border-red-500 text-red-500 hover:bg-red-50"
                onClick={() => setSelectedRequest(request)}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => handleApproval(request._id, "Approved")}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Company Approval Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by student name, ID or company..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                className="pl-10 pr-8 py-2 border rounded-md appearance-none bg-white"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {showAlert.show && (
            <Alert variant={showAlert.type} className="mb-4">
              <AlertDescription>{showAlert.message}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No approval requests found
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <RequestDetails key={request._id} request={request} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rejection Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Reject Company Approval</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Please provide a reason for rejecting the company approval request for{" "}
                  <span className="font-medium">{selectedRequest.companyName}</span>
                </p>
                <textarea
                  className="w-full h-32 p-2 border rounded-md"
                  placeholder="Enter rejection reason..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
                <div className="flex justify-end gap-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedRequest(null);
                      setRejectionReason("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() =>
                      handleApproval(
                        selectedRequest._id,
                        "Rejected",
                        rejectionReason
                      )
                    }
                    disabled={!rejectionReason.trim()}
                  >
                    Reject Request
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminApprovalPage;