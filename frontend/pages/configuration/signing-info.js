import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import {
    FileSignature,
    Plus,
    Search,
    Filter,
    MoreHorizontal,
    Edit,
    Trash2,
    CheckCircle,
    XCircle,
    Clock,
    User,
    Building,
    Calendar,
    Shield,
    Key,
    Users
} from 'lucide-react'
import { formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'

export default function SigningInfoPage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()
    const [signingInfos, setSigningInfos] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedType, setSelectedType] = useState('')
    const [selectedStatus, setSelectedStatus] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [selectedSigning, setSelectedSigning] = useState(null)

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (user) {
            fetchSigningInfos()
        }
    }, [user, searchTerm, selectedType, selectedStatus, currentPage])

    const breadcrumbItems = [
        { name: 'Cấu hình', icon: Settings },
        { name: 'Thông tin ký', icon: FileSignature }
    ]

    const fetchSigningInfos = async () => {
        try {
            setLoading(true)
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 1000))

            const mockSigningInfos = [
                {
                    _id: '1',
                    name: 'Chữ ký Bùi Thị Hà',
                    type: 'individual',
                    signerInfo: {
                        fullName: 'Bùi Thị Hà',
                        position: 'Trưởng khoa',
                        organization: 'Khoa Công nghệ thông tin'
                    },
                    certificate: {
                        issuer: 'Viettel MySign',
                        validFrom: new Date('2024-01-01'),
                        validTo: new Date('2025-12-31'),
                        serialNumber: '03418000132'
                    },
                    status: 'active',
                    usageCount: 25,
                    lastUsed: new Date(),
                    createdAt: new Date()
                },
                {
                    _id: '2',
                    name: 'Chữ ký Bùi Thị Hiền',
                    type: 'individual',
                    signerInfo: {
                        fullName: 'Bùi Thị Hiền',
                        position: 'Phó trưởng khoa',
                        organization: 'Khoa Kinh tế'
                    },
                    certificate: {
                        issuer: 'USB Token',
                        validFrom: new Date('2024-01-01'),
                        validTo: new Date('2025-12-31')
                    },
                    status: 'active',
                    usageCount: 12,
                    lastUsed: new Date(Date.now() - 86400000),
                    createdAt: new Date()
                }
            ]

            setSigningInfos(mockSigningInfos)
            setTotalPages(1)
        } catch (error) {
            toast.error('Lỗi tải danh sách thông tin ký')
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
            case 'expired':
                return <Clock className="h-4 w-4 text-orange-500" />
            default:
                return <Clock className="h-4 w-4 text-gray-500" />
        }
    }

    const getStatusBadge = (status) => {
        const styles = {
            active: 'bg-green-100 text-green-800',
            inactive: 'bg-red-100 text-red-800',
            expired: 'bg-orange-100 text-orange-800',
            revoked: 'bg-red-100 text-red-800'
        }
        const labels = {
            active: 'Hoạt động',
            inactive: 'Ngừng hoạt động',
            expired: 'Hết hạn',
            revoked: 'Bị thu hồi'
        }
        return (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
                {labels[status]}
            </span>
        )
    }

    const getTypeIcon = (type) => {
        return type === 'individual' ? <User className="h-4 w-4" /> : <Building className="h-4 w-4" />
    }

    const handleViewDetail = (signing) => {
        setSelectedSigning(signing)
        setShowDetailModal(true)
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
                        <h1 className="text-2xl font-bold text-gray-900">Thông tin ký</h1>
                        <p className="text-gray-600">Quản lý chứng chỉ và cấu hình chữ ký số</p>
                    </div>

                    {user.role === 'admin' && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Thêm cấu hình ký
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
                                placeholder="Tìm kiếm..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                            className="border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Tất cả loại</option>
                            <option value="individual">Cá nhân</option>
                            <option value="organizational">Tổ chức</option>
                        </select>

                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="active">Hoạt động</option>
                            <option value="inactive">Ngừng hoạt động</option>
                            <option value="expired">Hết hạn</option>
                        </select>

                        <button
                            onClick={fetchSigningInfos}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            Lọc
                        </button>
                    </div>
                </div>

                {/* Signing Info Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : signingInfos.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        STT
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Họ và tên
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ảnh chữ ký không có họ và tên
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ảnh chữ ký có họ và tên
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ảnh chữ ký cùng con dấu
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Phương thức ký CA
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Serial USB Token
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Số Sim CA
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Viettel MySign
                                    </th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {signingInfos.map((signing, index) => (
                                    <tr key={signing._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {index + 1}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {signing.signerInfo.fullName}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {signing.signerInfo.position}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-16 h-8 border border-gray-300 rounded bg-gray-50 flex items-center justify-center">
                                                    <FileSignature className="h-4 w-4 text-gray-400" />
                                                </div>
                                                <button className="text-blue-600 hover:text-blue-800 text-xs">
                                                    <Edit className="h-3 w-3" />
                                                </button>
                                                <button className="text-red-600 hover:text-red-800 text-xs">
                                                    <Trash2 className="h-3 w-3" />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-16 h-8 border border-gray-300 rounded bg-gray-50 flex items-center justify-center">
                                                    <FileSignature className="h-4 w-4 text-gray-400" />
                                                </div>
                                                <button className="text-blue-600 hover:text-blue-800 text-xs">
                                                    <Edit className="h-3 w-3" />
                                                </button>
                                                <button className="text-red-600 hover:text-red-800 text-xs">
                                                    <Trash2 className="h-3 w-3" />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-16 h-8 border border-gray-300 rounded bg-gray-50 flex items-center justify-center">
                                                    <FileSignature className="h-4 w-4 text-gray-400" />
                                                </div>
                                                <button className="text-blue-600 hover:text-blue-800 text-xs">
                                                    <Edit className="h-3 w-3" />
                                                </button>
                                                <button className="text-red-600 hover:text-red-800 text-xs">
                                                    <Trash2 className="h-3 w-3" />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <select className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                                <option value="">Tất cả</option>
                                                <option value="viettel" selected={signing.certificate.issuer === 'Viettel MySign'}>
                                                    Viettel MySign
                                                </option>
                                                <option value="usb" selected={signing.certificate.issuer === 'USB Token'}>
                                                    USB Token
                                                </option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="text"
                                                placeholder="Nhập Serial Usb Token"
                                                className="text-sm border border-gray-300 rounded px-2 py-1 w-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="text"
                                                placeholder="Nhập Số Sim CA"
                                                className="text-sm border border-gray-300 rounded px-2 py-1 w-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="text"
                                                placeholder="Nhập tài khoản"
                                                value={signing.certificate.serialNumber || ''}
                                                className="text-sm border border-gray-300 rounded px-2 py-1 w-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                readOnly
                                            />
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <FileSignature className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">Không có cấu hình ký</h3>
                            <p className="mt-1 text-sm text-gray-500">Bắt đầu bằng cách thêm cấu hình ký mới.</p>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <button className="inline-flex items-center px-3 py-2 border border-blue-600 rounded-md text-sm font-medium text-blue-600 bg-white hover:bg-blue-50">
                            <Users className="h-4 w-4 mr-2" />
                            Điền tài khoản MySign
                        </button>
                        <button className="inline-flex items-center px-3 py-2 border border-green-600 rounded-md text-sm font-medium text-green-600 bg-white hover:bg-green-50">
                            Lưu
                        </button>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
                            >
                                Trước
                            </button>
                            <span className="px-3 py-1 text-sm text-gray-600">
                                Trang {currentPage} / {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
                            >
                                Sau
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    )
}