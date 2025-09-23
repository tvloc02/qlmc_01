import React, { useState, useRef, useEffect } from 'react';
import { User, Camera, Upload, Save, Edit3, Eye, EyeOff, Phone, Mail, MapPin, Briefcase, Shield, Award } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const UserProfile = () => {
    const { user: authUser, updateUser } = useAuth();
    const [user, setUser] = useState(authUser || {});

    const [isEditing, setIsEditing] = useState(false);
    const [isEditingSignature, setIsEditingSignature] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({});
    const [signatureData, setSignatureData] = useState({});
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', content: '' });

    const fileInputRef = useRef(null);
    const canvasRef = useRef(null);

    useEffect(() => {
        if (authUser) {
            setUser(authUser);
            setFormData({
                fullName: authUser.fullName || '',
                phoneNumber: authUser.phoneNumber || '',
                specializations: authUser.specializations || []
            });
            setSignatureData({
                settings: authUser.digitalSignature?.settings || {
                    showDate: true,
                    showReason: true,
                    showLocation: true,
                    defaultLocation: ''
                }
            });
        }
    }, [authUser]);

    const positionLabels = {
        'giang_vien': 'Giảng viên',
        'truong_khoa': 'Trưởng khoa',
        'pho_truong_khoa': 'Phó trưởng khoa',
        'truong_bo_mon': 'Trưởng bộ môn',
        'pho_truong_bo_mon': 'Phó trưởng bộ môn',
        'chu_nhiem_chuong_trinh': 'Chủ nhiệm chương trình',
        'giam_doc_trung_tam': 'Giám đốc trung tâm',
        'pho_giam_doc': 'Phó giám đốc',
        'thu_ky_khoa': 'Thư ký khoa',
        'chuyen_vien': 'Chuyên viên',
        'nhan_vien': 'Nhân viên'
    };

    const academicLevels = {
        'cu_nhan': 'Cử nhân',
        'thac_si': 'Thạc sĩ',
        'tien_si': 'Tiến sĩ',
        'pho_giao_su': 'Phó giáo sư',
        'giao_su': 'Giáo sư'
    };

    const roleLabels = {
        'admin': 'Quản trị viên',
        'manager': 'Quản lý',
        'staff': 'Nhân viên',
        'expert': 'Chuyên gia',
        'guest': 'Khách'
    };

    const getSignatureLabel = () => {
        return user.role === 'admin' ? 'Dấu' : 'Chữ ký';
    };

    const handleUpdateProfile = async () => {
        setLoading(true);
        try {
            const response = await profileService.updateProfile(formData);

            if (response.success) {
                const updatedUser = response.data;
                setUser(updatedUser);
                updateUser(updatedUser); // Cập nhật trong AuthContext
                setMessage({ type: 'success', content: 'Cập nhật thông tin thành công!' });
                setIsEditing(false);
            } else {
                setMessage({ type: 'error', content: response.message || 'Có lỗi xảy ra khi cập nhật thông tin!' });
            }
        } catch (error) {
            setMessage({ type: 'error', content: error.message || 'Có lỗi xảy ra khi cập nhật thông tin!' });
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setMessage({ type: 'error', content: 'Mật khẩu xác nhận không khớp!' });
            return;
        }

        if (passwordForm.newPassword.length < 6) {
            setMessage({ type: 'error', content: 'Mật khẩu mới phải có ít nhất 6 ký tự!' });
            return;
        }

        setLoading(true);
        try {
            const response = await profileService.changePassword({
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword
            });

            if (response.success) {
                setMessage({ type: 'success', content: 'Đổi mật khẩu thành công!' });
                setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                setMessage({ type: 'error', content: response.message || 'Có lỗi xảy ra khi đổi mật khẩu!' });
            }
        } catch (error) {
            setMessage({ type: 'error', content: error.message || 'Có lỗi xảy ra khi đổi mật khẩu!' });
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setMessage({ type: 'error', content: 'Vui lòng chọn file hình ảnh!' });
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setMessage({ type: 'error', content: 'Kích thước file không được vượt quá 5MB!' });
                return;
            }

            setLoading(true);
            try {
                const response = await profileService.uploadSignature(file);

                if (response.success) {
                    const updatedUser = {
                        ...user,
                        digitalSignature: {
                            ...user.digitalSignature,
                            signatureImage: response.data.signatureUrl,
                            isActive: true
                        }
                    };
                    setUser(updatedUser);
                    updateUser(updatedUser);
                    setMessage({ type: 'success', content: `${getSignatureLabel()} đã được tải lên thành công!` });
                } else {
                    setMessage({ type: 'error', content: response.message || 'Có lỗi xảy ra khi tải lên!' });
                }
            } catch (error) {
                setMessage({ type: 'error', content: error.message || 'Có lỗi xảy ra khi tải lên!' });
            } finally {
                setLoading(false);
            }
        }
    };

    const handleUpdateSignature = async () => {
        setLoading(true);
        try {
            const response = await profileService.updateDigitalSignature({
                settings: signatureData.settings
            });

            if (response.success) {
                const updatedUser = {
                    ...user,
                    digitalSignature: {
                        ...user.digitalSignature,
                        settings: signatureData.settings
                    }
                };
                setUser(updatedUser);
                updateUser(updatedUser);
                setMessage({ type: 'success', content: `Cập nhật cài đặt ${getSignatureLabel().toLowerCase()} thành công!` });
                setIsEditingSignature(false);
            } else {
                setMessage({ type: 'error', content: response.message || 'Có lỗi xảy ra khi cập nhật cài đặt!' });
            }
        } catch (error) {
            setMessage({ type: 'error', content: error.message || 'Có lỗi xảy ra khi cập nhật cài đặt!' });
        } finally {
            setLoading(false);
        }
    };

    const clearMessage = () => {
        setTimeout(() => setMessage({ type: '', content: '' }), 3000);
    };

    useEffect(() => {
        if (message.content) clearMessage();
    }, [message]);

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <User className="w-10 h-10 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{user.fullName}</h1>
                        <p className="text-gray-600">{user.getFullEmail ? user.getFullEmail() : `${user.email}@cmc.edu.vn`}</p>
                        <div className="flex items-center space-x-4 mt-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                {roleLabels[user.role]}
              </span>
                            <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                {academicLevels[user.academicLevel]}
              </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Message */}
            {message.content && (
                <div className={`rounded-lg p-4 ${
                    message.type === 'success'
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                    {message.content}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Thông tin cá nhân */}
                <div className="bg-white rounded-lg shadow-sm border">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-gray-900">Thông tin cá nhân</h2>
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center space-x-2"
                            >
                                <Edit3 className="w-4 h-4" />
                                <span>{isEditing ? 'Hủy' : 'Chỉnh sửa'}</span>
                            </button>
                        </div>
                    </div>

                    <div className="p-6 space-y-4">
                        {isEditing ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Họ và tên
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.fullName}
                                        onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Số điện thoại
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.phoneNumber}
                                        onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Chuyên môn
                                    </label>
                                    <textarea
                                        value={formData.specializations?.join(', ')}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            specializations: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                                        }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        rows="3"
                                        placeholder="Nhập các chuyên môn, cách nhau bằng dấu phẩy"
                                    />
                                </div>
                                <button
                                    onClick={handleUpdateProfile}
                                    disabled={loading}
                                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            <span>Lưu thay đổi</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center space-x-3">
                                    <Mail className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <p className="text-sm text-gray-500">Email</p>
                                        <p className="text-gray-900">{user.email}@cmc.edu.vn</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <Phone className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <p className="text-sm text-gray-500">Số điện thoại</p>
                                        <p className="text-gray-900">{user.phoneNumber || 'Chưa cập nhật'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <MapPin className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <p className="text-sm text-gray-500">Khoa - Bộ môn</p>
                                        <p className="text-gray-900">
                                            {user.facultyId?.name}
                                            {user.departmentId && ` - ${user.departmentId.name}`}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <Briefcase className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <p className="text-sm text-gray-500">Chức vụ</p>
                                        <p className="text-gray-900">
                                            {user.positions?.filter(p => p.isActive).map(p => positionLabels[p.title]).join(', ') || 'Chưa có'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <Award className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <p className="text-sm text-gray-500">Chuyên môn</p>
                                        <p className="text-gray-900">
                                            {user.specializations?.length > 0 ? user.specializations.join(', ') : 'Chưa cập nhật'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Chữ ký/Dấu số */}
                <div className="bg-white rounded-lg shadow-sm border">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-gray-900">{getSignatureLabel()} số</h2>
                            <button
                                onClick={() => setIsEditingSignature(!isEditingSignature)}
                                className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center space-x-2"
                            >
                                <Edit3 className="w-4 h-4" />
                                <span>{isEditingSignature ? 'Hủy' : 'Cài đặt'}</span>
                            </button>
                        </div>
                    </div>

                    <div className="p-6 space-y-4">
                        {/* Hình ảnh chữ ký/dấu */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Hình ảnh {getSignatureLabel().toLowerCase()}
                            </label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                {user.digitalSignature?.signatureImage ? (
                                    <div className="space-y-3">
                                        <img
                                            src={user.digitalSignature.signatureImage}
                                            alt={getSignatureLabel()}
                                            className="max-h-32 mx-auto border rounded"
                                        />
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
                                        >
                                            <Upload className="w-4 h-4" />
                                            <span>Thay đổi {getSignatureLabel().toLowerCase()}</span>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <Camera className="w-12 h-12 text-gray-400 mx-auto" />
                                        <div>
                                            <p className="text-gray-600">Chưa có {getSignatureLabel().toLowerCase()}</p>
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
                                            >
                                                <Upload className="w-4 h-4" />
                                                <span>Tải lên {getSignatureLabel().toLowerCase()}</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />
                            </div>
                        </div>

                        {/* Cài đặt */}
                        {isEditingSignature && (
                            <div className="space-y-4 border-t border-gray-200 pt-4">
                                <h3 className="font-medium text-gray-900">Cài đặt hiển thị</h3>

                                <div className="space-y-3">
                                    <label className="flex items-center space-x-3">
                                        <input
                                            type="checkbox"
                                            checked={signatureData.settings?.showDate || false}
                                            onChange={(e) => setSignatureData(prev => ({
                                                ...prev,
                                                settings: { ...prev.settings, showDate: e.target.checked }
                                            }))}
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700">Hiển thị ngày ký</span>
                                    </label>

                                    <label className="flex items-center space-x-3">
                                        <input
                                            type="checkbox"
                                            checked={signatureData.settings?.showReason || false}
                                            onChange={(e) => setSignatureData(prev => ({
                                                ...prev,
                                                settings: { ...prev.settings, showReason: e.target.checked }
                                            }))}
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700">Hiển thị lý do ký</span>
                                    </label>

                                    <label className="flex items-center space-x-3">
                                        <input
                                            type="checkbox"
                                            checked={signatureData.settings?.showLocation || false}
                                            onChange={(e) => setSignatureData(prev => ({
                                                ...prev,
                                                settings: { ...prev.settings, showLocation: e.target.checked }
                                            }))}
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700">Hiển thị địa điểm</span>
                                    </label>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Địa điểm mặc định
                                    </label>
                                    <input
                                        type="text"
                                        value={signatureData.settings?.defaultLocation || ''}
                                        onChange={(e) => setSignatureData(prev => ({
                                            ...prev,
                                            settings: { ...prev.settings, defaultLocation: e.target.value }
                                        }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Nhập địa điểm mặc định"
                                    />
                                </div>

                                <button
                                    onClick={handleUpdateSignature}
                                    disabled={loading}
                                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            <span>Lưu cài đặt</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {/* Trạng thái */}
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Trạng thái:</span>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                                user.digitalSignature?.isActive
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-600'
                            }`}>
                {user.digitalSignature?.isActive ? 'Đã kích hoạt' : 'Chưa kích hoạt'}
              </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Đổi mật khẩu */}
            <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                        <Shield className="w-5 h-5" />
                        <span>Bảo mật</span>
                    </h2>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Mật khẩu hiện tại
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={passwordForm.currentPassword}
                                onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Nhập mật khẩu hiện tại"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Mật khẩu mới
                        </label>
                        <input
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Xác nhận mật khẩu mới
                        </label>
                        <input
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Nhập lại mật khẩu mới"
                        />
                    </div>

                    <button
                        onClick={handleChangePassword}
                        disabled={loading || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                        className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <Shield className="w-4 h-4" />
                                <span>Đổi mật khẩu</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;