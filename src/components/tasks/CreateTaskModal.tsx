"use client";

import { useState } from "react";
import { useRepository } from "@/contexts/RepositoryContext";
import { useCreateTask } from "@/hooks/useCreateTask";
import { X, Loader2 } from "lucide-react";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateTaskModal({ isOpen, onClose }: CreateTaskModalProps) {
  const { owner, repo } = useRepository();
  const createTask = useCreateTask();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "new",
    start_date: "",
    end_date: "",
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!owner || !repo) {
      return;
    }

    // Convert date strings to ISO format if provided
    const start_date = formData.start_date
      ? new Date(formData.start_date).toISOString()
      : undefined;
    const end_date = formData.end_date
      ? new Date(formData.end_date).toISOString()
      : undefined;

    try {
      await createTask.mutateAsync({
        owner,
        repo,
        title: formData.title,
        description: formData.description || undefined,
        status: formData.status,
        start_date,
        end_date,
      });

      // Reset form and close modal
      setFormData({
        title: "",
        description: "",
        status: "new",
        start_date: "",
        end_date: "",
      });
      onClose();
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleClose = () => {
    if (!createTask.isPending) {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Create New Task</h2>
            <button
              onClick={handleClose}
              disabled={createTask.isPending}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              aria-label="Close modal"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter task title"
                disabled={createTask.isPending}
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Enter task description (optional)"
                disabled={createTask.isPending}
              />
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={createTask.isPending}
              >
                <option value="new">New</option>
                <option value="open">Open</option>
                <option value="inprogress">In Progress</option>
                <option value="pending">Pending</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {/* Dates */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  id="start_date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={createTask.isPending}
                />
              </div>

              <div>
                <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  id="end_date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={createTask.isPending}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={createTask.isPending}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createTask.isPending || !formData.title.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {createTask.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Task"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
