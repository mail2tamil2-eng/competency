import { motion } from 'motion/react';
import { Breadcrumb } from '../components/Breadcrumb';
import { Edit2, Upload, X, Mail, Globe, Calendar, Clock } from 'lucide-react';
import { useState, useRef } from 'react';
import svgPaths from '../../imports/svg-g6q6hkk7l8';

export function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: 'Admin Product Live',
    email: 'aravindan.v@nch.in',
    country: 'India',
    role: 'Instructor'
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = () => {
    // Save logic here
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  // Mock login activity data
  const loginActivity = {
    firstAccess: {
      date: 'Thursday, 13 February 2025, 12:33 PM',
      relative: '1 year 18 days ago'
    },
    lastAccess: {
      date: 'Wednesday, 4 March 2026, 10:36 AM',
      relative: '5 secs ago'
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: 'Profile' }]} />

      {/* Banner Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="h-[186px] overflow-clip relative rounded-[20px]"
        style={{ 
          background: 'linear-gradient(135deg, rgb(21, 93, 252) 0%, rgb(0, 102, 153) 100%)'
        }}
      >
        {/* Decorative Objects */}
        <div className="absolute h-[174px] left-[901.5px] top-[31px] w-[260px] opacity-10">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 260 174">
            <g clipPath="url(#clip0_76_1544)">
              <rect fill="white" height="174" width="260" />
              <path d={svgPaths.p34fb7580} fill="white" />
              <path d={svgPaths.p2e107040} fill="#E1E4FF" />
              <path d={svgPaths.p1a865800} fill="#E1E4FF" />
              <path d={svgPaths.p43a3c80} fill="#E1E4FF" />
              <path d={svgPaths.p1db6a180} fill="#E1E4FF" />
              <path d={svgPaths.p2156c400} fill="#E1E4FF" />
              <path d={svgPaths.p268c900} fill="#BABDF7" />
              <path d={svgPaths.p3b024c00} fill="#444BCC" />
              <path d={svgPaths.p233a6100} fill="#BABDF7" />
              <path d={svgPaths.p1c92c5c0} fill="#BABDF7" />
              <path d={svgPaths.p3ea1e3f0} fill="#444BCC" />
            </g>
            <defs>
              <clipPath id="clip0_76_1544">
                <rect fill="white" height="174" width="260" />
              </clipPath>
            </defs>
          </svg>
        </div>

        <div className="absolute h-[174px] left-[616.5px] top-[65px] w-[260px] opacity-10">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 260 174">
            <g clipPath="url(#clip0_76_1545)">
              <rect fill="white" height="174" width="260" />
              <path d={svgPaths.p34fb7580} fill="white" />
              <path d={svgPaths.p2e107040} fill="#E1E4FF" />
            </g>
            <defs>
              <clipPath id="clip0_76_1545">
                <rect fill="white" height="174" width="260" />
              </clipPath>
            </defs>
          </svg>
        </div>

        {/* Edit Button */}
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 text-white font-medium rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>
        ) : (
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 text-white font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-white hover:bg-gray-100 text-blue-600 font-medium rounded-lg transition-colors shadow-sm"
            >
              Save Changes
            </button>
          </div>
        )}

        {/* Profile Info */}
        <div className="absolute flex gap-6 items-center left-[46px] top-[29px]">
          {/* Profile Picture */}
          <div className="relative group">
            <div className="bg-white p-1 rounded-full shadow-lg">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="w-[120px] h-[120px] rounded-full object-cover"
                  style={{ backgroundImage: "linear-gradient(135deg, rgb(255, 137, 4) 0%, rgb(245, 73, 0) 100%)" }}
                />
              ) : (
                <div
                  className="w-[120px] h-[120px] rounded-full flex items-center justify-center"
                  style={{ backgroundImage: "linear-gradient(135deg, rgb(255, 137, 4) 0%, rgb(245, 73, 0) 100%)" }}
                >
                  <span className="text-white text-4xl font-bold">{formData.name.charAt(0)}</span>
                </div>
              )}
            </div>

            {isEditing && (
              <>
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 bg-white rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <Upload className="w-5 h-5 text-gray-700" />
                  </button>
                </div>
                {profileImage && (
                  <button
                    onClick={handleRemoveImage}
                    className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />

          {/* User Info */}
          <div className="flex flex-col gap-1">
            <h1 className="text-white text-2xl font-bold leading-8">{formData.name}</h1>
            
            <p className="text-[#f6f6f6] text-base leading-6">{formData.role}</p>
            
            <div className="flex items-center gap-6 mt-1">
              <div className="flex items-center gap-2 text-white text-sm">
                <Mail className="w-4 h-4" />
                <span>{formData.email}</span>
              </div>
              
              <div className="flex items-center gap-2 text-white text-sm">
                <Globe className="w-4 h-4" />
                <span>{formData.country}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Login History Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white border border-gray-200 rounded-lg shadow-sm p-8"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Login History</h2>
        
        <div className="space-y-4">
          {/* First Access */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-start gap-4">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 text-lg mb-1">First Access to Site</h3>
              <p className="text-sm text-gray-700">{loginActivity.firstAccess.date}</p>
              <p className="text-xs text-gray-500 mt-1">{loginActivity.firstAccess.relative}</p>
            </div>
          </div>

          {/* Last Access */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-4">
            <div className="bg-green-100 p-2 rounded-lg">
              <Clock className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 text-lg mb-1">Last Access to Site</h3>
              <p className="text-sm text-gray-700">{loginActivity.lastAccess.date}</p>
              <p className="text-xs text-gray-500 mt-1">{loginActivity.lastAccess.relative}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}