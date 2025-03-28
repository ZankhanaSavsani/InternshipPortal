import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";

const RejectionModal = ({
  showRejectionModal,
  rejectionReason,
  setRejectionReason,
  closeRejectionModal,
  submitRejection,
  actionLoading,
}) => {
  const textareaRef = useRef(null);

  // Focus the textarea when the modal opens
  useEffect(() => {
    if (showRejectionModal && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [showRejectionModal]);

  if (!showRejectionModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-lg shadow-xl p-6 m-4 max-w-md w-full transform transition-all animate-scaleIn">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Rejection Reason
          </h3>
          <button
            onClick={closeRejectionModal}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-2">
            Please provide a reason for rejecting this company approval request.
          </p>
          <Textarea
            ref={textareaRef} // Ref for focusing
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Enter rejection reason..."
            className="w-full h-24 transition-all focus:border-blue-500 focus:ring focus:ring-blue-200"
          />
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            onClick={closeRejectionModal}
            className="transition-all hover:bg-gray-100"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={submitRejection}
            disabled={!rejectionReason.trim() || actionLoading}
            className="transition-all"
          >
            {actionLoading ? "Processing..." : "Reject Request"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RejectionModal;