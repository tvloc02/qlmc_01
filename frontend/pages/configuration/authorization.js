import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import {
    Shield,
    Users,
    User,
    Search,
    Filter,
    Plus,
    Edit,
    Trash2,
    CheckCircle,
    XCircle,
    Settings,
    Lock,
    Unlock,
    Eye,
    EyeOff,
    Copy,
    Download,
    Upload
} from 'lucide-react'
import { formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'

export default function AuthorizationPage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()

    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState('matrix')

    // Permission Matrix State
    const [permissionMatrix, setPermissionMatrix] = useState({})
    const [userGroups, setUserGroups] = useState([])
    const [modules, setModules] = useState([])
    const [actions, setActions] = useState([])

    // Filters
    const [filters, setFilters] = useState({
        organizationLevel: '',
        facultyId: '',
        departmentId: '',
        module: ''
    })

    // Edit state
    const [editingCell, setEditingCell] = useState(null)
    const [selectedGroups, setSelectedGroups] = useState([])
    const [showTemplateModal, setShowTemplateModal] = useState(false)
    const [showCopyModal, setShowCopyModal] = useState(false)

    const breadcrumbItems = [
        { name: 'Cấu hình', icon: Settings },
        { name: 'Phân quyền', icon: Shield }
    ]

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (user && user.role === 'admin') {
            fetchPermissions()
            fetchPermissionMatrix()
        }
    }, [user, filters])

    const fetchPermissions = async () => {
        try {
            const response = await fetch('/api/authorization/permissions')
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`)
            }
            const data = await response.json()
            if (data.success) {
                const { modules, actions } = data.data
                setModules(modules)
                setActions(actions)
            }
        } catch (error) {
            console.error('Lỗi tải danh sách quyền:', error)
            // Set default data when API is not available
            setModules([
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
            ])
            setActions([
                { key: 'view', name: 'Hiển thị' },
                { key: 'create', name: 'Thêm' },
                { key: 'edit', name: 'Sửa' },
                { key: 'delete', name: 'Xóa' }
            ])
        }
    }

    const fetchPermissionMatrix = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams(filters).toString()
            const response = await fetch(`/api/authorization/permission-matrix?${params}`)
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`)
            }
            const data = await response.json()

            if (data.success) {
                setPermissionMatrix(data.data.matrix)
                setUserGroups(data.data.groups)
            }
        } catch (error) {
            console.error('Lỗi tải ma trận phân quyền:', error)
            // Set default data when API is not available
            setUserGroups([
                { code: 'ADMIN', name: 'Quản trị viên hệ thống', organizationLevel: 'university' },
                { code: 'MANAGER', name: 'Quản lý khoa', organizationLevel: 'faculty' },
                { code: 'STAFF', name: 'Nhân viên', organizationLevel: 'department' }
            ])
            setPermissionMatrix({})
            toast.error('Không thể kết nối đến server. Vui lòng kiểm tra backend server.')
        } finally {
            setLoading(false)
        }
    }

    const updateGroupPermissions = async (groupId, permissions) => {
        try {
            const response = await fetch(`/api/authorization/groups/${groupId}/permissions`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ permissions })
            })
            const data = await response.json()

            if (data.success) {
                toast.success('Cập nhật quyền thành công')
                fetchPermissionMatrix()
            }
        } catch (error) {
            console.error('Lỗi cập nhật quyền:', error)
            toast.error('Lỗi cập nhật quyền')
        }
    }

    const copyGroupPermissions = async (sourceGroupId, targetGroupIds) => {
        try {
            const response = await fetch('/api/authorization/copy-permissions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sourceGroupId,
                    targetGroupIds
                })
            })
            const data = await response.json()

            if (data.success) {
                toast.success('Sao chép quyền thành công')
                fetchPermissionMatrix()
                setShowCopyModal(false)
            }
        } catch (error) {
            console.error('Lỗi sao chép quyền:', error)
            toast.error('Lỗi sao chép quyền')
        }
    }

    const applyTemplate = async (groupId, templateName) => {
        try {
            const response = await fetch(`/api/authorization/groups/${groupId}/apply-template`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ templateName })
            })
            const data = await response.json()

            if (data.success) {
                toast.success('Áp dụng template thành công')
                fetchPermissionMatrix()
                setShowTemplateModal(false)
            }
        } catch (error) {
            console.error('Lỗi áp dụng template:', error)
            toast.error('Lỗi áp dụng template')
        }
    }

    const togglePermission = (groupCode, module, action) => {
        const currentMatrix = { ...permissionMatrix }
        if (!currentMatrix[module]) {
            currentMatrix[module] = {}
        }
        if (!currentMatrix[module][groupCode]) {
            currentMatrix[module][groupCode] = {
                actions: { view: false, create: false, edit: false, delete: false }
            }
        }

        currentMatrix[module][groupCode].actions[action] =
            !currentMatrix[module][groupCode].actions[action]

        setPermissionMatrix(currentMatrix)

        // Find group and update permissions
        const group = userGroups.find(g => g.code === groupCode)
        if (group) {
            const updatedPermissions = modules.map(mod => {
                const moduleMatrix = currentMatrix[mod.key]?.[groupCode]
                return {
                    module: mod.key,
                    actions: moduleMatrix?.actions || { view: false, create: false, edit: false, delete: false }
                }
            }).filter(p => Object.values(p.actions).some(v => v))

            updateGroupPermissions(group._id, updatedPermissions)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    if (!user || user.role !== 'admin') {
        return (
            <Layout title="Không có quyền truy cập">
                <div className="text-center py-12">
                    <Lock className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Không có quyền truy cập</h3>
                    <p className="mt-1 text-sm text-gray-500">Bạn không có quyền truy cập trang này.</p>
                </div>
            </Layout>
        )
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
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Phân quyền nhóm người dùng</h1>
                        <p className="text-gray-600">Quản lý quyền truy cập cho từng nhóm người dùng trong hệ thống</p>
                    </div>

                    <div className="flex space-x-3">
                        <button
                            onClick={() => setShowTemplateModal(true)}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Áp dụng Template
                        </button>
                        <button
                            onClick={() => setShowCopyModal(true)}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                            <Copy className="h-4 w-4 mr-2" />
                            Sao chép quyền
                        </button>
                        <button
                            onClick={fetchPermissionMatrix}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                        >
                            <Shield className="h-4 w-4 mr-2" />
                            Làm mới
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Cấp tổ chức
                            </label>
                            <select
                                value={filters.organizationLevel}
                                onChange={(e) => setFilters({...filters, organizationLevel: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Tất cả cấp</option>
                                <option value="university">Trường</option>
                                <option value="faculty">Khoa</option>
                                <option value="department">Bộ môn</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Module
                            </label>
                            <select
                                value={filters.module}
                                onChange={(e) => setFilters({...filters, module: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Tất cả module</option>
                                {modules.map(module => (
                                    <option key={module.key} value={module.key}>
                                        {module.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div></div>

                        <div className="flex justify-end">
                            <button
                                onClick={fetchPermissionMatrix}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                                <Filter className="h-4 w-4 mr-2" />
                                Lọc
                            </button>
                        </div>
                    </div>
                </div>

                {/* Permission Matrix */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Ma trận phân quyền</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Nhấp vào ô để bật/tắt quyền cho nhóm người dùng
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        {loading ? (
                            <div className="flex justify-center items-center py-12">
                                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : (
                            <table className="min-w-full">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="sticky left-0 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                                        TÊN CHỨC NĂNG / TÊN MINH CHỨNG
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        HIỂN THỊ
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        THÊM
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        SỬA
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        XÓA
                                    </th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {modules.map((module) => (
                                    <tr key={module.key} className="hover:bg-gray-50">
                                        <td className="sticky left-0 bg-white px-6 py-4 text-sm font-medium text-gray-900 border-r border-gray-200">
                                            <div className="flex items-center">
                                                <Users className="h-4 w-4 text-gray-400 mr-2" />
                                                {module.name}
                                            </div>
                                        </td>
                                        {actions.map((action) => (
                                            <td key={action.key} className="px-6 py-4 text-center">
                                                {userGroups.map((group) => {
                                                    const hasPermission = permissionMatrix[module.key]?.[group.code]?.actions?.[action.key] || false
                                                    return (
                                                        <div key={group.code} className="mb-2">
                                                            <button
                                                                onClick={() => togglePermission(group.code, module.key, action.key)}
                                                                className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                                                                    hasPermission
                                                                        ? 'bg-blue-600 border-blue-600 text-white'
                                                                        : 'bg-white border-gray-300 hover:border-blue-400'
                                                                }`}
                                                                title={`${group.name} - ${action.name}`}
                                                            >
                                                                {hasPermission && (
                                                                    <CheckCircle className="h-4 w-4" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    )
                                                })}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Group Legend */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Chú giải nhóm người dùng</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {userGroups.map((group) => (
                            <div key={group.code} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                <div className="w-4 h-4 bg-blue-600 rounded"></div>
                                <div>
                                    <div className="text-sm font-medium text-gray-900">
                                        {group.name}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {group.code} • {group.organizationLevel}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Layout>
    )
}