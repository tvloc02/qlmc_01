import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import Modal from '../../components/common/Modal'
import Pagination from '../../components/common/Pagination'
import {
    Users,
    Plus,
    Search,
    Filter,
    MoreHorizontal,
    Edit,
    Trash2,
    User,
    Settings,
    Shield,
    Eye,
    UserPlus,
    UserMinus,
    Building,
    Department,
    Copy,
    Download,
    Upload
} from 'lucide-react'
import { formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'

export default function UserGroupsPage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()

    const [userGroups, setUserGroups] = useState([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedStatus, setSelectedStatus] = useState('')
    const [selectedOrgLevel, setSelectedOrgLevel] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [pagination, setPagination] = useState({})

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [showMembersModal, setShowMembersModal] = useState(false)
    const [selectedGroup, setSelectedGroup] = useState(null)

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        organizationLevel: 'university',
        facultyId: '',
        departmentId: '',
        permissions: [],
        signingPermissions: {
            canSign: false,
            canStamp: false,
            allowedDocumentTypes: [],
            approvalLevel: 1
        },
        priority: 1,
        notificationSettings: {
            emailNotifications: true,
            systemNotifications: true,
            events: []
        },
        autoAssignmentRules: [],
        tags: []
    })

    // Module và action definitions
    const availableModules = [
        { key: 'workflow', name: 'Trình ký minh chứng' },
        { key: 'evidence-lookup', name: 'Tra cứu minh chứng' },
        { key: 'publishing', name: 'Ban hành' },
        { key: 'standard', name: 'Tiêu chuẩn' },
        { key: 'criteria', name: 'Tiêu chí' },
        { key: 'stemp', name: 'Đóng dấu' },
        { key: 'reports', name: 'Báo cáo' },
        { key: 'evidence-tree', name: 'Danh mục số' },
        { key: 'configuration', name: 'Cấu hình' },
        { key: 'unit-data', name: 'Dữ liệu đơn vị' },
        { key: 'history', name: 'Lịch sử dử dụng' }
    ]

    const availableActions = [
        { key: 'view', name: 'Hiển thị' },
        { key: 'create', name: 'Thêm' },
        { key: 'edit', name: 'Sửa' },
        { key: 'delete', name: 'Xóa' }
    ]

    // Options
    const [facultyOptions, setFacultyOptions] = useState([])
    const [departmentOptions, setDepartmentOptions] = useState([])

    const organizationLevels = [
        { value: 'university', label: 'Cấp trường' },
        { value: 'faculty', label: 'Cấp khoa' },
        { value: 'department', label: 'Cấp bộ môn' }
    ]

    const breadcrumbItems = [
        { name: 'Cấu hình', icon: Settings },
        { name: 'Nhóm người dùng', icon: Users }
    ]

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (user && user.role === 'admin') {
            fetchUserGroups()
            fetchOptions()
        }
    }, [user, searchTerm, selectedStatus, selectedOrgLevel, currentPage])

    const fetchUserGroups = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams({
                page: currentPage,
                limit: 10,
                search: searchTerm,
                status: selectedStatus,
                organizationLevel: selectedOrgLevel
            })

            const response = await fetch(`/api/user-groups?${params}`)
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`)
            }
            const data = await response.json()

            if (data.success) {
                setUserGroups(data.data.userGroups)
                setPagination(data.data.pagination)
                setTotalPages(data.data.pagination.pages)
            }
        } catch (error) {
            console.error('Lỗi tải danh sách nhóm người dùng:', error)
            // Set default data when API is not available
            setUserGroups([])
            setPagination({ current: 1, total: 0, pages: 1 })
            setTotalPages(1)
            if (error.message.includes('HTTP') || error.message.includes('fetch')) {
                toast.error('Không thể kết nối đến server. Vui lòng kiểm tra backend server.')
            } else {
                toast.error('Lỗi tải danh sách nhóm người dùng')
            }
        } finally {
            setLoading(false)
        }
    }

    const fetchOptions = async () => {
        try {
            const response = await fetch('/api/faculties')
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`)
            }
            const data = await response.json()
            if (data.success) {
                setFacultyOptions(data.data)
            }
        } catch (error) {
            console.error('Lỗi tải options:', error)
            // Set default faculty options
            setFacultyOptions([])
        }
    }

    const fetchDepartments = async (facultyId) => {
        try {
            const response = await fetch(`/api/departments?facultyId=${facultyId}`)
            const data = await response.json()
            if (data.success) {
                setDepartmentOptions(data.data)
            }
        } catch (error) {
            console.error('Lỗi tải danh sách bộ môn:', error)
        }
    }

    const handleCreate = () => {
        setFormData({
            name: '',
            code: '',
            description: '',
            organizationLevel: 'university',
            facultyId: '',
            departmentId: '',
            permissions: [],
            signingPermissions: {
                canSign: false,
                canStamp: false,
                allowedDocumentTypes: [],
                approvalLevel: 1
            },
            priority: 1,
            notificationSettings: {
                emailNotifications: true,
                systemNotifications: true,
                events: []
            },
            autoAssignmentRules: [],
            tags: []
        })
        setSelectedGroup(null)
        setShowCreateModal(true)
    }

    const handleEdit = (group) => {
        setSelectedGroup(group)
        setFormData({
            name: group.name,
            code: group.code,
            description: group.description || '',
            organizationLevel: group.organizationLevel,
            facultyId: group.facultyId?._id || '',
            departmentId: group.departmentId?._id || '',
            permissions: group.permissions || [],
            signingPermissions: group.signingPermissions || {
                canSign: false,
                canStamp: false,
                allowedDocumentTypes: [],
                approvalLevel: 1
            },
            priority: group.priority || 1,
            notificationSettings: group.notificationSettings || {
                emailNotifications: true,
                systemNotifications: true,
                events: []
            },
            autoAssignmentRules: group.autoAssignmentRules || [],
            tags: group.tags || []
        })
        setShowEditModal(true)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            // Validate permissions before submit
            const validModuleKeys = availableModules.map(m => m.key)
            const validActionKeys = availableActions.map(a => a.key)

            for (const permission of formData.permissions) {
                if (!validModuleKeys.includes(permission.module)) {
                    toast.error(`Module không hợp lệ: ${permission.module}`)
                    return
                }

                for (const actionKey of Object.keys(permission.actions)) {
                    if (!validActionKeys.includes(actionKey)) {
                        toast.error(`Action không hợp lệ: ${actionKey}`)
                        return
                    }
                }
            }

            let response, data
            if (selectedGroup) {
                // Update group
                response = await fetch(`/api/user-groups/${selectedGroup._id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                })
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`)
                }
                data = await response.json()
                if (data.success) {
                    toast.success('Cập nhật nhóm người dùng thành công')
                    setShowEditModal(false)
                } else {
                    toast.error(data.message || 'Lỗi cập nhật nhóm')
                }
            } else {
                // Create group
                response = await fetch('/api/user-groups', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                })
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`)
                }
                data = await response.json()
                if (data.success) {
                    toast.success('Tạo nhóm người dùng thành công')
                    setShowCreateModal(false)
                } else {
                    toast.error(data.message || 'Lỗi tạo nhóm')
                }
            }

            fetchUserGroups()
            setSelectedGroup(null)
        } catch (error) {
            console.error('Lỗi lưu thông tin nhóm:', error)
            if (error.message.includes('HTTP') || error.message.includes('fetch')) {
                toast.error('Không thể kết nối đến server. Vui lòng kiểm tra backend server.')
            } else {
                toast.error('Lỗi lưu thông tin nhóm')
            }
        }
    }

    const handleDelete = async () => {
        try {
            const response = await fetch(`/api/user-groups/${selectedGroup._id}`, {
                method: 'DELETE'
            })
            const data = await response.json()
            if (data.success) {
                toast.success('Xóa nhóm người dùng thành công')
                setShowDeleteModal(false)
                setSelectedGroup(null)
                fetchUserGroups()
            }
        } catch (error) {
            console.error('Lỗi xóa nhóm:', error)
            toast.error('Lỗi xóa nhóm')
        }
    }

    const handleViewDetail = async (group) => {
        try {
            const response = await fetch(`/api/user-groups/${group._id}`)
            const data = await response.json()
            if (data.success) {
                setSelectedGroup(data.data)
                setShowDetailModal(true)
            }
        } catch (error) {
            console.error('Lỗi tải chi tiết nhóm:', error)
            toast.error('Lỗi tải chi tiết nhóm')
        }
    }

    const handleManageMembers = async (group) => {
        try {
            const response = await fetch(`/api/user-groups/${group._id}/members`)
            const data = await response.json()
            if (data.success) {
                setSelectedGroup({
                    ...group,
                    members: data.data.members
                })
                setShowMembersModal(true)
            }
        } catch (error) {
            console.error('Lỗi tải thành viên nhóm:', error)
            toast.error('Lỗi tải thành viên nhóm')
        }
    }

    const getStatusBadge = (status) => {
        return (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
            }`}>
                {status === 'active' ? 'Hoạt động' : 'Ngừng hoạt động'}
            </span>
        )
    }

    const getOrgLevelBadge = (level) => {
        const config = organizationLevels.find(l => l.value === level)
        return (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {config?.label || level}
            </span>
        )
    }

    const UserGroupForm = ({ onSubmit, onClose }) => {
        // Helper functions for permissions
        const toggleModulePermission = (moduleKey, actionKey) => {
            const newPermissions = [...formData.permissions]
            const moduleIndex = newPermissions.findIndex(p => p.module === moduleKey)

            if (moduleIndex === -1) {
                // Add new module permission
                newPermissions.push({
                    module: moduleKey,
                    actions: {
                        view: actionKey === 'view',
                        create: actionKey === 'create',
                        edit: actionKey === 'edit',
                        delete: actionKey === 'delete'
                    }
                })
            } else {
                // Update existing module permission
                newPermissions[moduleIndex].actions[actionKey] = !newPermissions[moduleIndex].actions[actionKey]

                // Remove module if no actions are selected
                const hasAnyAction = Object.values(newPermissions[moduleIndex].actions).some(v => v)
                if (!hasAnyAction) {
                    newPermissions.splice(moduleIndex, 1)
                }
            }

            setFormData({ ...formData, permissions: newPermissions })
        }

        const hasModuleAction = (moduleKey, actionKey) => {
            const modulePermission = formData.permissions.find(p => p.module === moduleKey)
            return modulePermission?.actions?.[actionKey] || false
        }

        const toggleAllActionsForModule = (moduleKey, enable) => {
            const newPermissions = [...formData.permissions]
            const moduleIndex = newPermissions.findIndex(p => p.module === moduleKey)

            if (enable) {
                if (moduleIndex === -1) {
                    newPermissions.push({
                        module: moduleKey,
                        actions: {
                            view: true,
                            create: true,
                            edit: true,
                            delete: true
                        }
                    })
                } else {
                    newPermissions[moduleIndex].actions = {
                        view: true,
                        create: true,
                        edit: true,
                        delete: true
                    }
                }
            } else {
                if (moduleIndex !== -1) {
                    newPermissions.splice(moduleIndex, 1)
                }
            }

            setFormData({ ...formData, permissions: newPermissions })
        }

        const hasAnyActionForModule = (moduleKey) => {
            const modulePermission = formData.permissions.find(p => p.module === moduleKey)
            return modulePermission ? Object.values(modulePermission.actions).some(v => v) : false
        }

        return (
            <form onSubmit={onSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tên nhóm *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Nhập tên nhóm..."
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Mã nhóm *
                        </label>
                        <input
                            type="text"
                            value={formData.code}
                            onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Nhập mã nhóm..."
                            required
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Mô tả
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Nhập mô tả nhóm..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cấp tổ chức *
                        </label>
                        <select
                            value={formData.organizationLevel}
                            onChange={(e) => setFormData({...formData, organizationLevel: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            {organizationLevels.map(level => (
                                <option key={level.value} value={level.value}>
                                    {level.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Khoa
                        </label>
                        <select
                            value={formData.facultyId}
                            onChange={(e) => {
                                setFormData({...formData, facultyId: e.target.value, departmentId: ''})
                                if (e.target.value) {
                                    fetchDepartments(e.target.value)
                                }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={formData.organizationLevel === 'university'}
                        >
                            <option value="">Chọn khoa...</option>
                            {facultyOptions.map(faculty => (
                                <option key={faculty._id} value={faculty._id}>
                                    {faculty.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {formData.organizationLevel === 'department' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Bộ môn
                            </label>
                            <select
                                value={formData.departmentId}
                                onChange={(e) => setFormData({...formData, departmentId: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={!formData.facultyId}
                            >
                                <option value="">Chọn bộ môn...</option>
                                {departmentOptions.map(dept => (
                                    <option key={dept._id} value={dept._id}>
                                        {dept.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Độ ưu tiên
                        </label>
                        <input
                            type="number"
                            value={formData.priority}
                            onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value)})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min="1"
                            max="10"
                        />
                    </div>
                </div>

                {/* Permissions Section */}
                <div className="border-t pt-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Phân quyền chức năng</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                                        Chức năng
                                    </th>
                                    <th className="text-center py-3 px-2 font-medium text-gray-700">
                                        Tất cả
                                    </th>
                                    {availableActions.map(action => (
                                        <th key={action.key} className="text-center py-3 px-2 font-medium text-gray-700">
                                            {action.name}
                                        </th>
                                    ))}
                                </tr>
                                </thead>
                                <tbody>
                                {availableModules.map(module => (
                                    <tr key={module.key} className="border-b border-gray-100">
                                        <td className="py-3 px-4 font-medium text-gray-900">
                                            {module.name}
                                        </td>
                                        <td className="text-center py-3 px-2">
                                            <input
                                                type="checkbox"
                                                checked={hasAnyActionForModule(module.key)}
                                                onChange={(e) => toggleAllActionsForModule(module.key, e.target.checked)}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                        </td>
                                        {availableActions.map(action => (
                                            <td key={action.key} className="text-center py-3 px-2">
                                                <input
                                                    type="checkbox"
                                                    checked={hasModuleAction(module.key, action.key)}
                                                    onChange={() => toggleModulePermission(module.key, action.key)}
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Signing Permissions */}
                <div className="border-t pt-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Quyền ký số</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                checked={formData.signingPermissions.canSign}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    signingPermissions: {
                                        ...formData.signingPermissions,
                                        canSign: e.target.checked
                                    }
                                })}
                                className="mr-2"
                            />
                            <span className="text-sm font-medium text-gray-700">Có thể ký số</span>
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                checked={formData.signingPermissions.canStamp}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    signingPermissions: {
                                        ...formData.signingPermissions,
                                        canStamp: e.target.checked
                                    }
                                })}
                                className="mr-2"
                            />
                            <span className="text-sm font-medium text-gray-700">Có thể đóng dấu</span>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Cấp độ phê duyệt
                            </label>
                            <select
                                value={formData.signingPermissions.approvalLevel}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    signingPermissions: {
                                        ...formData.signingPermissions,
                                        approvalLevel: parseInt(e.target.value)
                                    }
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value={1}>Cấp 1</option>
                                <option value={2}>Cấp 2</option>
                                <option value={3}>Cấp 3</option>
                                <option value={4}>Cấp 4</option>
                                <option value={5}>Cấp 5</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                    >
                        {selectedGroup ? 'Cập nhật' : 'Tạo mới'}
                    </button>
                </div>
            </form>
        )
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    if (!user || user.role !== 'admin') {
        return null
    }

    return (
        <Layout
            title=""
            breadcrumbItems={breadcrumbItems}
        >
            <div className="space-y-6">
                {/* Backend Connection Notice */}
                {userGroups.length === 0 && !loading && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Nhóm người dùng</h1>
                        <p className="text-gray-600">Quản lý nhóm người dùng và phân quyền theo nhóm</p>
                    </div>

                    <button
                        onClick={handleCreate}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Tạo nhóm mới
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="md:col-span-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm nhóm..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Tất cả trạng thái</option>
                                <option value="active">Hoạt động</option>
                                <option value="inactive">Ngừng hoạt động</option>
                            </select>
                        </div>

                        <div>
                            <select
                                value={selectedOrgLevel}
                                onChange={(e) => setSelectedOrgLevel(e.target.value)}
                                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Tất cả cấp</option>
                                {organizationLevels.map(level => (
                                    <option key={level.value} value={level.value}>
                                        {level.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <button
                                onClick={fetchUserGroups}
                                className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                                <Filter className="h-4 w-4 mr-2" />
                                Lọc
                            </button>
                        </div>
                    </div>
                </div>

                {/* Groups Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Nhóm
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Cấp tổ chức
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Thành viên
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Quyền
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Trạng thái
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ngày tạo
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Thao tác
                                </th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-4 text-center">
                                        <div className="flex justify-center">
                                            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : userGroups.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                                        Không có dữ liệu
                                    </td>
                                </tr>
                            ) : (
                                userGroups.map((group) => (
                                    <tr key={group._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                                                    <Users className="h-5 w-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {group.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {group.code}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            {getOrgLevelBadge(group.organizationLevel)}
                                            {group.facultyId && (
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {group.facultyId.name}
                                                </div>
                                            )}
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex items-center text-sm text-gray-900">
                                                <User className="h-4 w-4 mr-1 text-gray-400" />
                                                {group.memberCount || 0}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex items-center text-sm text-gray-900">
                                                <Shield className="h-4 w-4 mr-1 text-gray-400" />
                                                {group.permissions?.length || 0}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            {getStatusBadge(group.status)}
                                        </td>

                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {formatDate(group.createdAt, 'DD/MM/YYYY')}
                                        </td>

                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => handleViewDetail(group)}
                                                    className="text-blue-600 hover:text-blue-800 p-1"
                                                    title="Xem chi tiết"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleManageMembers(group)}
                                                    className="text-green-600 hover:text-green-800 p-1"
                                                    title="Quản lý thành viên"
                                                >
                                                    <UserPlus className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(group)}
                                                    className="text-yellow-600 hover:text-yellow-800 p-1"
                                                    title="Chỉnh sửa"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedGroup(group)
                                                        setShowDeleteModal(true)
                                                    }}
                                                    className="text-red-600 hover:text-red-800 p-1"
                                                    title="Xóa"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="border-t border-gray-200 px-6 py-3">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                totalItems={pagination.total}
                                itemsPerPage={10}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    )}
                </div>

                {/* Create Group Modal */}
                <Modal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    title="Tạo nhóm người dùng mới"
                    size="large"
                >
                    <UserGroupForm
                        onSubmit={handleSubmit}
                        onClose={() => setShowCreateModal(false)}
                    />
                </Modal>

                {/* Edit Group Modal */}
                <Modal
                    isOpen={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    title="Chỉnh sửa nhóm người dùng"
                    size="large"
                >
                    <UserGroupForm
                        onSubmit={handleSubmit}
                        onClose={() => setShowEditModal(false)}
                    />
                </Modal>

                {/* Group Detail Modal */}
                <Modal
                    isOpen={showDetailModal}
                    onClose={() => setShowDetailModal(false)}
                    title="Chi tiết nhóm người dùng"
                    size="large"
                >
                    {selectedGroup && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                        {selectedGroup.name}
                                    </h3>
                                    <div className="space-y-3">
                                        <div>
                                            <span className="text-sm font-medium text-gray-500">Mã nhóm:</span>
                                            <p className="mt-1 text-sm text-gray-900">{selectedGroup.code}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium text-gray-500">Mô tả:</span>
                                            <p className="mt-1 text-sm text-gray-900">{selectedGroup.description || 'Chưa có'}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium text-gray-500">Cấp tổ chức:</span>
                                            <p className="mt-1">{getOrgLevelBadge(selectedGroup.organizationLevel)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {selectedGroup.permissions && selectedGroup.permissions.length > 0 && (
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Quyền hạn</h4>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full border border-gray-200 rounded-lg">
                                            <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                                    Chức năng
                                                </th>
                                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                                    Hiển thị
                                                </th>
                                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                                    Thêm
                                                </th>
                                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                                    Sửa
                                                </th>
                                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                                    Xóa
                                                </th>
                                            </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                            {selectedGroup.permissions.map((permission) => {
                                                const moduleInfo = availableModules.find(m => m.key === permission.module)
                                                return (
                                                    <tr key={permission.module}>
                                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                            {moduleInfo?.name || permission.module}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            {permission.actions.view ? (
                                                                <span className="inline-flex items-center justify-center w-5 h-5 bg-green-100 text-green-800 rounded-full">
                                                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                        </svg>
                                                                    </span>
                                                            ) : (
                                                                <span className="inline-flex items-center justify-center w-5 h-5 bg-red-100 text-red-800 rounded-full">
                                                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                                        </svg>
                                                                    </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            {permission.actions.create ? (
                                                                <span className="inline-flex items-center justify-center w-5 h-5 bg-green-100 text-green-800 rounded-full">
                                                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                        </svg>
                                                                    </span>
                                                            ) : (
                                                                <span className="inline-flex items-center justify-center w-5 h-5 bg-red-100 text-red-800 rounded-full">
                                                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                                        </svg>
                                                                    </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            {permission.actions.edit ? (
                                                                <span className="inline-flex items-center justify-center w-5 h-5 bg-green-100 text-green-800 rounded-full">
                                                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                        </svg>
                                                                    </span>
                                                            ) : (
                                                                <span className="inline-flex items-center justify-center w-5 h-5 bg-red-100 text-red-800 rounded-full">
                                                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                                        </svg>
                                                                    </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            {permission.actions.delete ? (
                                                                <span className="inline-flex items-center justify-center w-5 h-5 bg-green-100 text-green-800 rounded-full">
                                                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                        </svg>
                                                                    </span>
                                                            ) : (
                                                                <span className="inline-flex items-center justify-center w-5 h-5 bg-red-100 text-red-800 rounded-full">
                                                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                                        </svg>
                                                                    </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </Modal>

                {/* Delete Confirmation Modal */}
                <Modal
                    isOpen={showDeleteModal}
                    onClose={() => setShowDeleteModal(false)}
                    title="Xác nhận xóa"
                >
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                            Bạn có chắc chắn muốn xóa nhóm <strong>{selectedGroup?.name}</strong>?
                        </p>
                        <p className="text-sm text-red-600">
                            Hành động này không thể hoàn tác.
                        </p>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
                            >
                                Xóa
                            </button>
                        </div>
                    </div>
                </Modal>
            </div>
        </Layout>
    )
}