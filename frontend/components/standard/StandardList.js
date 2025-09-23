import { useState, useEffect } from 'react'
import {
    Search,
    Plus,
    Filter,
    Download,
    Upload,
    Edit,
    Trash2,
    Eye,
    FileText,
    ChevronLeft,
    ChevronRight,
    BarChart3,
    List,
    PieChart
} from 'lucide-react'
import { standardApi } from '../../services/standardApi'
import { organizationApi } from '../../services/organizationApi'
import CreateStandardModal from './CreateStandardModal'
import EditStandardModal from './EditStandardModal'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'react-hot-toast'
import ExcelImportExport from "../structure/ExcelImportExport";

const StandardList = () => {
    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState('list')
    const [standards, setStandards] = useState([])
    const [programs, setPrograms] = useState([])
    const [organizations, setOrganizations] = useState([])
    const [loading, setLoading] = useState(false)
    const [pagination, setPagination] = useState({
        current: 1,
        pages: 1,
        total: 0,
        hasNext: false,
        hasPrev: false
    })

    // Filter states
    const [filters, setFilters] = useState({
        search: '',
        programId: '',
        organizationId: '',
        status: '',
        page: 1,
        limit: 10,
        sortBy: 'order',
        sortOrder: 'asc'
    })

    // Modal states
    const [createModalOpen, setCreateModalOpen] = useState(false)
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [selectedStandard, setSelectedStandard] = useState(null)
    const [excelModalOpen, setExcelModalOpen] = useState(false)

    useEffect(() => {
        fetchPrograms()
        fetchOrganizations()
    }, [])

    useEffect(() => {
        fetchStandards()
    }, [filters])

    const fetchStandards = async () => {
        try {
            setLoading(true)
            const response = await standardApi.getStandards(filters)
            setStandards(response.data.data.standards)
            setPagination(response.data.data.pagination)
        } catch (error) {
            console.error('Error fetching standards:', error)
            toast.error('Lỗi khi tải danh sách tiêu chuẩn')
        } finally {
            setLoading(false)
        }
    }

    const fetchPrograms = async () => {
        try {
            const response = await programApi.getPrograms({ limit: 100 })
            setPrograms(response.data.data.programs || [])
        } catch (error) {
            console.error('Error fetching programs:', error)
        }
    }

    const fetchOrganizations = async () => {
        try {
            const response = await organizationApi.getOrganizations({ limit: 100 })
            setOrganizations(response.data.data.organizations || [])
        } catch (error) {
            console.error('Error fetching organizations:', error)
        }
    }

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
    }

    const handlePageChange = (page) => {
        setFilters(prev => ({ ...prev, page }))
    }

    const handleDelete = async (id) => {
        if (!confirm('Bạn có chắc muốn xóa tiêu chuẩn này?')) return

        try {
            await standardApi.deleteStandard(id)
            toast.success('Xóa tiêu chuẩn thành công')
            fetchStandards()
        } catch (error) {
            console.error('Error deleting standard:', error)
            toast.error('Lỗi khi xóa tiêu chuẩn')
        }
    }

    const handleEdit = (standard) => {
        setSelectedStandard(standard)
        setEditModalOpen(true)
    }

    const formatStandardTitle = (standard) => {
        // Convert number to Roman numerals for display
        const toRoman = (num) => {
            const values = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1]
            const symbols = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I']
            let result = ''

            for (let i = 0; i < values.length; i++) {
                while (num >= values[i]) {
                    result += symbols[i]
                    num -= values[i]
                }
            }
            return result
        }

        const romanCode = toRoman(parseInt(standard.code))
        return `${romanCode} Tiêu chuẩn ${standard.code}: ${standard.name}`
    }

    const getStatusBadge = (status) => {
        const badges = {
            draft: 'bg-gray-100 text-gray-800',
            active: 'bg-green-100 text-green-800',
            inactive: 'bg-yellow-100 text-yellow-800',
            archived: 'bg-red-100 text-red-800'
        }

        const labels = {
            draft: 'Bản nháp',
            active: 'Hoạt động',
            inactive: 'Tạm dừng',
            archived: 'Đã lưu trữ'
        }

        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${badges[status]}`}>
        {labels[status]}
      </span>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <BarChart3 className="w-7 h-7 text-blue-600" />
                        Quản lý Tiêu chuẩn
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Tổng cộng {pagination.total} tiêu chuẩn
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setExcelModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        <Upload className="w-4 h-4" />
                        Import/Export Excel
                    </button>

                    {(user?.role === 'admin' || user?.role === 'manager') && (
                        <button
                            onClick={() => setCreateModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                        >
                            <Plus className="w-4 h-4" />
                            Thêm tiêu chuẩn
                        </button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tìm kiếm
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tên, mã hoặc mô tả..."
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Chương trình
                        </label>
                        <select
                            value={filters.programId}
                            onChange={(e) => handleFilterChange('programId', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Tất cả chương trình</option>
                            {programs.map(program => (
                                <option key={program._id} value={program._id}>
                                    {program.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tổ chức
                        </label>
                        <select
                            value={filters.organizationId}
                            onChange={(e) => handleFilterChange('organizationId', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Tất cả tổ chức</option>
                            {organizations.map(org => (
                                <option key={org._id} value={org._id}>
                                    {org.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Trạng thái
                        </label>
                        <select
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="draft">Bản nháp</option>
                            <option value="active">Hoạt động</option>
                            <option value="inactive">Tạm dừng</option>
                            <option value="archived">Đã lưu trữ</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Standards List */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : standards.length === 0 ? (
                    <div className="text-center py-12">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Không có tiêu chuẩn nào
                        </h3>
                        <p className="text-gray-500">
                            Chưa có tiêu chuẩn nào được tạo hoặc không có kết quả phù hợp với bộ lọc.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tiêu chuẩn
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Chương trình
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tổ chức
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Trạng thái
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Thứ tự
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Trọng số
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Thao tác
                                </th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {standards.map((standard) => (
                                <tr key={standard._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div>
                                            <div className="font-medium text-gray-900">
                                                {formatStandardTitle(standard)}
                                            </div>
                                            {standard.description && (
                                                <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                                                    {standard.description}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        {standard.programId?.name || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        {standard.organizationId?.name || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4">
                                        {getStatusBadge(standard.status)}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        {standard.order}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        {standard.weight ? `${standard.weight}%` : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(standard)}
                                                className="p-1 text-gray-400 hover:text-blue-600"
                                                title="Chỉnh sửa"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            {(user?.role === 'admin') && (
                                                <button
                                                    onClick={() => handleDelete(standard._id)}
                                                    className="p-1 text-gray-400 hover:text-red-600"
                                                    title="Xóa"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="bg-white px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Hiển thị {(pagination.current - 1) * filters.limit + 1} - {Math.min(pagination.current * filters.limit, pagination.total)} / {pagination.total} kết quả
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handlePageChange(pagination.current - 1)}
                                disabled={!pagination.hasPrev}
                                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>

                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                                    const pageNum = i + 1
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => handlePageChange(pageNum)}
                                            className={`px-3 py-1 text-sm rounded ${
                                                pageNum === pagination.current
                                                    ? 'bg-blue-600 text-white'
                                                    : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                        >
                                            {pageNum}
                                        </button>
                                    )
                                })}
                            </div>

                            <button
                                onClick={() => handlePageChange(pagination.current + 1)}
                                disabled={!pagination.hasNext}
                                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            <CreateStandardModal
                isOpen={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onSuccess={() => {
                    setCreateModalOpen(false)
                    fetchStandards()
                }}
                programs={programs}
                organizations={organizations}
            />

            <EditStandardModal
                isOpen={editModalOpen}
                onClose={() => {
                    setEditModalOpen(false)
                    setSelectedStandard(null)
                }}
                onSuccess={() => {
                    setEditModalOpen(false)
                    setSelectedStandard(null)
                    fetchStandards()
                }}
                standard={selectedStandard}
                programs={programs}
                organizations={organizations}
            />

            <ExcelImportExport
                isOpen={excelModalOpen}
                onClose={() => setExcelModalOpen(false)}
                onSuccess={() => {
                    setExcelModalOpen(false)
                    fetchStandards()
                }}
                programs={programs}
                organizations={organizations}
            />
        </div>
    )
}

export default StandardList