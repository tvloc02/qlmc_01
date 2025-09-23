import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/common/Layout'
import {
    Users,
    User,
    Plus,
    Search,
    Filter,
    MoreHorizontal,
    Edit,
    Trash2,
    UserCheck,
    UserX,
    Award,
    Briefcase,
    Mail,
    Phone,
    Calendar,
    CheckCircle,
    XCircle,
    Clock
} from 'lucide-react'
import { formatDate } from '../utils/helpers'
import toast from 'react-hot-toast'

export default function ExpertsPage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()
    const [experts, setExperts] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedStatus, setSelectedStatus] = useState('')
    const [selectedAvailability, setSelectedAvailability] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [showCreateModal, setShowCreateModal] = useState(false)

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (user) {
            fetchExperts()
        }
    }, [user, searchTerm, selectedStatus, selectedAvailability, currentPage])

    const breadcrumbItems = [
        { name: 'Quản lý chuyên gia', icon: Users }
    ]

    const fetchExperts = async () => {
        try {
            setLoading(true)
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 1000))

            const mockExperts = [
                {
                    _id: '1',
                    expertCode: 'EXP001',
                    personnelId: {
                        fullName: 'TS. Nguyễn Văn A',
                        email: 'nva@cmc.edu.vn',
                        position: 'associate_professor'
                    },
                    specializations: [
                        { field: 'Công nghệ phần mềm', level: 'expert' },
                        { field: 'Trí tuệ nhân tạo', level: 'advanced' }
                    ],
                    status: 'active',
                    availability: 'available',
                    workload: { currentAssignments: 2, maxAssignments: 5 },
                    createdAt: new Date()
                },
                {
                    _id: '2',
                    expertCode: 'EXP002',
                    personnelId: {
                        fullName: 'PGS. Trần Thị B',
                        email: 'ttb@cmc.edu.vn',
                        position: 'professor'
                    },
                    specializations: [
                        { field: 'Quản lý chất lượng', level: 'expert' }
                    ],
                    status: 'active',
                    availability: 'busy',
                    workload: { currentAssignments: 5, maxAssignments: 5 },
                    createdAt: new Date()
                }
            ]

            setExperts(mockExperts)
            setTotalPages(1)
        } catch (error) {
            toast.error('Lỗi tải danh sách chuyên gia')
        } finally {
            setLoading(false)
        }
    }

    const getStatusIcon = (status) => {
        switch (status) {
            case 'active':
                return <CheckCircle className="h-4 w-4 text-green-500" />
            case 'inactive':
                return <XCircle className="h-4 w-4 text-red-500" />
            default:
                return <Clock className="h-4 w-4 text-yellow-500" />
        }
    }

    const getAvailabilityBadge = (availability) => {
        const styles = {
            available: 'bg-green-100 text-green-800',
            busy: 'bg-yellow-100 text-yellow-800',
            unavailable: 'bg-red-100 text-red-800'
        }
        const labels = {
            available: 'Sẵn sàng',
            busy: 'Bận',
            unavailable: 'Không khả dụng'
        }
        return (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${styles[availability]}`}>
                {labels[availability]}
            </span>
        )
    }

    const getPositionText = (position) => {
        const positions = {
            lecturer: 'Giảng viên',
            senior_lecturer: 'Giảng viên chính',
            associate_professor: 'Phó giáo sư',
            professor: 'Giáo sư'
        }
        return positions[position] || position
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
                        <h1 className="text-2xl font-bold text-gray-900">Quản lý chuyên gia</h1>
                        <p className="text-gray-600">Quản lý danh sách chuyên gia đánh giá chất lượng</p>
                    </div>

                    {(user.role === 'admin' || user.role === 'manager') && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Thêm chuyên gia
                        </button>
                    )}
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm chuyên gia..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="active">Đang hoạt động</option>
                            <option value="inactive">Ngừng hoạt động</option>
                        </select>

                        <select
                            value={selectedAvailability}
                            onChange={(e) => setSelectedAvailability(e.target.value)}
                            className="border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Tất cả tình trạng</option>
                            <option value="available">Sẵn sàng</option>
                            <option value="busy">Bận</option>
                            <option value="unavailable">Không khả dụng</option>
                        </select>

                        <button
                            onClick={fetchExperts}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            Lọc
                        </button>
                    </div>
                </div>

                {/* Experts List */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : experts.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Chuyên gia
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Chuyên môn
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tình trạng
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Khối lượng công việc
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
                                {experts.map((expert) => (
                                    <tr key={expert._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                        <User className="h-5 w-5 text-blue-600" />
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {expert.personnelId.fullName}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {expert.expertCode} • {getPositionText(expert.personnelId.position)}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {expert.personnelId.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                {expert.specializations.map((spec, index) => (
                                                    <div key={index} className="flex items-center text-sm">
                                                        <Award className="h-3 w-3 text-yellow-500 mr-1" />
                                                        <span className="text-gray-900">{spec.field}</span>
                                                        <span className="ml-2 text-xs text-gray-500">({spec.level})</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="space-y-2">
                                                <div className="flex items-center">
                                                    {getStatusIcon(expert.status)}
                                                    <span className="ml-2 text-sm text-gray-900">
                                                            {expert.status === 'active' ? 'Hoạt động' : 'Ngừng hoạt động'}
                                                        </span>
                                                </div>
                                                {getAvailabilityBadge(expert.availability)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span>{expert.workload.currentAssignments}/{expert.workload.maxAssignments}</span>
                                                        <span className="text-gray-500">
                                                                {Math.round((expert.workload.currentAssignments / expert.workload.maxAssignments) * 100)}%
                                                            </span>
                                                    </div>
                                                    <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                                                        <div
                                                            className={`h-2 rounded-full ${
                                                                expert.workload.currentAssignments >= expert.workload.maxAssignments
                                                                    ? 'bg-red-500'
                                                                    : expert.workload.currentAssignments / expert.workload.maxAssignments > 0.7
                                                                        ? 'bg-yellow-500'
                                                                        : 'bg-green-500'
                                                            }`}
                                                            style={{
                                                                width: `${(expert.workload.currentAssignments / expert.workload.maxAssignments) * 100}%`
                                                            }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(expert.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button className="text-blue-600 hover:text-blue-900">
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button className="text-red-600 hover:text-red-900">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                                <button className="text-gray-400 hover:text-gray-600">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Users className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">Không có chuyên gia</h3>
                            <p className="mt-1 text-sm text-gray-500">Bắt đầu bằng cách thêm chuyên gia mới.</p>
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