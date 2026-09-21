import { Info, AlertCircle } from 'lucide-react';
import { useCourseContext } from '../context/CourseContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';

export function LicenseInfo() {
  const { usedLicenses, totalLicenses, availableLicenses } = useCourseContext();

  const licensePercentage = (usedLicenses / totalLicenses) * 100;
  const isNearLimit = licensePercentage >= 80;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <Info className="w-4 h-4" />
          <span>License Info</span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            License Management
          </DialogTitle>
          <DialogDescription>
            Understanding how licenses are consumed in the Content Authoring Tool
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Usage */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <h4 className="font-semibold text-gray-900 mb-3">Current License Usage</h4>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Used: {usedLicenses}</span>
              <span className="text-sm text-gray-600">Available: {availableLicenses}</span>
              <span className="text-sm text-gray-600">Total: {totalLicenses}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full transition-all ${
                  isNearLimit ? 'bg-gradient-to-r from-amber-500 to-red-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                }`}
                style={{ width: `${licensePercentage}%` }}
              />
            </div>
            {isNearLimit && (
              <div className="flex items-start gap-2 mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>You are approaching your license limit. Contact your Administrator to increase allocation.</span>
              </div>
            )}
          </div>

          {/* License Consuming Behavior */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">License Consuming Behavior</h4>
            <div className="overflow-hidden border border-gray-200 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 border-b">Status / Behaviour</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 border-b">License Consumed?</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 border-b">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">Draft Creation</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">No</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">User may discard</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">Editing Draft</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">No</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">No final asset created</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">Publish</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Yes</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">Final usable course created</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">Download SCORM</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">No (if already published)</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">Already consumed</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">Re-download</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">No</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">Same asset</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">Re-Republish</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Yes</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">Final usable course created</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Copy Course Behavior */}
          <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
            <h4 className="font-semibold text-gray-900 mb-2">Copy Course Behavior</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-purple-600 mt-1">•</span>
                <span>Copied courses are always created as <strong>Draft</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 mt-1">•</span>
                <span>License is <strong>NOT consumed</strong> until the copied version is published</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 mt-1">•</span>
                <span>Courses in <strong>any status</strong> can be copied</span>
              </li>
            </ul>
          </div>

          {/* License Limit Reached */}
          <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-200">
            <h4 className="font-semibold text-gray-900 mb-2">When License Limit is Reached</h4>
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-red-900 mb-1">Restrictions:</p>
                <ul className="space-y-1 text-gray-700 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">✗</span>
                    <span>Publish and Re-publish buttons are <strong>disabled</strong> for new courses</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">✗</span>
                    <span>Error message: "License limit reached. Please contact your Administrator."</span>
                  </li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-green-900 mb-1">Allowed Actions:</p>
                <ul className="space-y-1 text-gray-700 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span>Create and save courses as <strong>Draft</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span>Edit already published courses (but cannot republish)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span>Download previously created/exported courses</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
