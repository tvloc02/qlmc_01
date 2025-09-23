import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/common/Layout'
import {
    Clock,
    Search,
    Filter,
    Calendar,
    User,
    Activity,
    Download,
    RefreshCw,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Eye,
    FileText,
    Users,
    Settings
} from 'lucide-react'
import { formatDate } from '../utils/helpers'
import toast from 'react-hot-toast'

export default function HistoryPage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedAction, setSelectedAction] = useState('')
    const [selectedModule, setSelectedModule] = useState('')
    const [selectedStatus, setSelectedStatus] = useState('')
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [viewMode, setViewMode] = useState('user') // 'user' or 'system'

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (user) {
            fetchHistory()
        }
    }, [user, searchTerm, selectedAction, selectedModule, selectedStatus, dateFrom, dateTo, currentPage, viewMode])

    const breadcrumbItems = [
        { name: 'Lịch sử hoạt động', icon: Clock }
    ]

    const fetchHistory = async () => {
        try {
            setLoading(true)
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 1000))

            const mockHistory = [
                {
                    _id: '',
                    userId: { fullName: '', email: '' },
                    action: '',
                    module: '',
                    description: '',
                    timestamp: new Date(),
                    status: '',
                    ipAddress: ''
                }
            ]

            setHistory(mockHistory)
            setTotalPages(1)
        } catch (error) {
            toast.error('Lỗi tải lịch sử hoạt động')
        } finally {
            setLoading(false)
        }
    }

    const getActionIcon = (action) => {
        switch (action) {
            case 'create':
                return <CheckCircle className="h-4 w-4 text-green-500" />
            case 'update':
                return <Activity className="h-4 w-4 text-blue-500" />
            case 'delete':
                return <XCircle className="h-4 w-4 text-red-500" />
            case 'read':
                return <Eye className="h-4 w-4 text-gray-500" />
            case 'login':
                return <User className="h-4 w-4 text-purple-500" />
            case 'logout':
                return <User className="h-4 w-4 text-gray-500" />
            default:
                return <Activity className="h-4 w-4 text-gray-500" />
        }
    }

    const getModuleIcon = (module) => {
        switch (module) {
            case 'evidence':
                return <FileText className="h-4 w-4 text-blue-500" />
            case 'standards':
                return <Settings className="h-4 w-4 text-green-500" />
            case 'criteria':
                return <Activity className="h-4 w-4 text-yellow-500" />
            case 'users':
                return <Users className="h-4 w-4 text-purple-500" />
            default:
                return <Activity className="h-4 w-4 text-gray-500" />
        }
    }

    const getStatusBadge = (status) => {
        switch (status) {
            case 'success':
                return (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Thành công
                    </span>
                )
            case 'failed':
                return (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircle className="h-3 w-3 mr-1" />
                        Thất bại
                    </span>
                )
            case 'warning':
                return (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Cảnh báo
                    </span>
                )
            default:
                return (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {status}
                    </span>
                )
        }
    }

    const handleExport = async (format) => {
        try {
            toast.loading('Đang xuất dữ liệu...')
            await new Promise(resolve => setTimeout(resolve, 2000))
            toast.dismiss()
            toast.success(`Xuất dữ liệu ${format.toUpperCase()} thành công`)
        } catch (error) {
            toast.dismiss()
            toast.error('Lỗi xuất dữ liệu')
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    if (!user) {
        return null
    }

    return (
        <Layout
            title=""
            breadcrumbItems={breadcrumbItems}
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Lịch sử hoạt động</h1>
                        <p className="text-gray-600">Theo dõi các hoạt động trong hệ thống</p>
                    </div>

                    <div className="flex items-center space-x-3">
                        {/* View Mode Toggle */}
                        {(user.role === 'admin' || user.role === 'manager') && (
                            <div className="flex rounded-lg border border-gray-300">
                                <button
                                    onClick={() => setViewMode('user')}
                                    className={`px-3 py-2 text-sm font-medium rounded-l-lg ${
                                        viewMode === 'user'
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-white text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    Cá nhân
                                </button>
                                <button
                                    onClick={() => setViewMode('system')}
                                    className={`px-3 py-2 text-sm font-medium rounded-r-lg ${
                                        viewMode === 'system'
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-white text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    Hệ thống
                                </button>
                            </div>
                        )}

                        <button
                            onClick={fetchHistory}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Làm mới
                        </button>

                        <div className="relative">
                            <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                                <Download className="h-4 w-4 mr-2" />
                                Xuất dữ liệu
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <select
                            value={selectedAction}
                            onChange={(e) => setSelectedAction(e.target.value)}
                            className="border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Tất cả hành động</option>
                            <option value="create">Tạo mới</option>
                            <option value="update">Cập nhật</option>
                            <option value="delete">Xóa</option>
                            <option value="read">Xem</option>
                            <option value="login">Đăng nhập</option>
                            <option value="logout">Đăng xuất</option>
                        </select>

                        <select
                            value={selectedModule}
                            onChange={(e) => setSelectedModule(e.target.value)}
                            className="border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Tất cả module</option>
                            <option value="evidence">Minh chứng</option>
                            <option value="standards">Tiêu chuẩn</option>
                            <option value="criteria">Tiêu chí</option>
                            <option value="users">Người dùng</option>
                            <option value="configuration">Cấu hình</option>
                        </select>

                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="success">Thành công</option>
                            <option value="failed">Thất bại</option>
                            <option value="warning">Cảnh báo</option>
                        </select>

                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Từ ngày"
                        />

                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Đến ngày"
                        />
                    </div>
                </div>

                {/* History List */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : history.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Người dùng
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Hoạt động
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Mô tả
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Trạng thái
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Thời gian
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        IP Address
                                    </th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {history.map((record) => (
                                    <tr key={record._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-8 w-8">
                                                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                                        <User className="h-4 w-4 text-gray-600" />
                                                    </div>
                                                </div>
                                                <div className="ml-3">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {record.userId.fullName}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {record.userId.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                {getActionIcon(record.action)}
                                                <span className="ml-2 text-sm text-gray-900">
                                                        {record.action}
                                                    </span>
                                                <div className="ml-2 flex items-center">
                                                    {getModuleIcon(record.module)}
                                                    <span className="ml-1 text-xs text-gray-500">
                                                            {record.module}
                                                        </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900 max-w-xs truncate">
                                                {record.description}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(record.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(record.timestamp, 'DD/MM/YYYY HH:mm')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {record.ipAddress}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Clock className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">Không có lịch sử</h3>
                            <p className="mt-1 text-sm text-gray-500">Chưa có hoạt động nào được ghi lại.</p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Trang {currentPage} / {totalPages}
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
                            >
                                Trước
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
                            >
                                Sau
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    )
}