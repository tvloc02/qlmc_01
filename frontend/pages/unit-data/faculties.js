import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import Modal from '../../components/common/Modal'
import Pagination from '../../components/common/Pagination'
import { formatDate, formatNumber } from '../../utils/helpers'
import toast from 'react-hot-toast'
import {
    Building,
    Plus,
    Search,
    Filter,
    Eye,
    Edit,
    Trash2,
    Users,
    Calendar,
    Phone,
    Mail,
    MapPin,
    Download,
    Upload,
    MoreVertical,
    UserCheck,
    BookOpen,
    ChevronDown,
    ChevronRight,
    ExternalLink
} from 'lucide-react'

export default function FacultiesPage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()

    // State management
    const [faculties, setFaculties] = useState([])
    const [loading, setLoading] = useState(false)
    const [selectedFaculties, setSelectedFaculties] = useState([])

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [currentFaculty, setCurrentFaculty] = useState(null)

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        dean: '',
        viceDeans: [],
        establishedDate: '',
        contactInfo: {
            phone: '',
            email: '',
            address: '',
            website: ''
        }
    })

    // Search and filter
    const [searchQuery, setSearchQuery] = useState('')
    const [filters, setFilters] = useState({
        status: '',
        hasDean: ''
    })

    // Pagination
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)
    const itemsPerPage = 10

    // Options
    const [personnelOptions, setPersonnelOptions] = useState([])

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (user) {
            fetchFaculties()
            fetchPersonnelOptions()
        }
    }, [user, currentPage, searchQuery, filters])

    const breadcrumbItems = [
        { name: 'Dữ liệu đơn vị', href: '/unit-data' },
        { name: 'Khoa', icon: Building }
    ]

    const fetchFaculties = async () => {
        try {
            setLoading(true)
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 800))

            const mockFaculties = [
                {
                    id: '',
                    name: '',
                    code: '',
                    description: '',
                    dean: {
                        id: '',
                        fullName: '',
                        email: '',
                        position: ''
                    },
                    viceDeans: [
                        {
                            id: '',
                            fullName: '',
                            email: '',
                            position: ''
                        }
                    ],
                    establishedDate: '',
                    contactInfo: {
                        phone: '',
                        email: '',
                        address: '',
                        website: ''
                    },
                    statistics: {
                        totalPersonnel: 0,
                        totalDepartments: 0,
                        totalStudents: 0
                    },
                    status: '',
                    createdAt: ''
                },
            ]

            setFaculties(mockFaculties)
            setTotalItems(mockFaculties.length)
            setTotalPages(Math.ceil(mockFaculties.length / itemsPerPage))

        } catch (error) {
            toast.error('Lỗi tải danh sách khoa')
        } finally {
            setLoading(false)
        }
    }

    const fetchPersonnelOptions = async () => {
        try {
            const mockPersonnel = [
                { id: '', fullName: '', position: '' }
            ]
            setPersonnelOptions(mockPersonnel)
        } catch (error) {
            console.error('Lỗi tải danh sách nhân sự:', error)
        }
    }

    const handleCreate = () => {
        setFormData({
            name: '',
            code: '',
            description: '',
            dean: '',
            viceDeans: [],
            establishedDate: '',
            contactInfo: {
                phone: '',
                email: '',
                address: '',
                website: ''
            }
        })
        setShowCreateModal(true)
    }

    const handleEdit = (faculty) => {
        setCurrentFaculty(faculty)
        setFormData({
            name: faculty.name,
            code: faculty.code,
            description: faculty.description,
            dean: faculty.dean?.id || '',
            viceDeans: faculty.viceDeans.map(vd => vd.id),
            establishedDate: faculty.establishedDate ? faculty.establishedDate.split('T')[0] : '',
            contactInfo: faculty.contactInfo
        })
        setShowEditModal(true)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 1000))

            if (currentFaculty) {
                toast.success('Cập nhật khoa thành công')
                setShowEditModal(false)
            } else {
                toast.success('Tạo khoa thành công')
                setShowCreateModal(false)
            }

            fetchFaculties()
            setCurrentFaculty(null)
        } catch (error) {
            toast.error('Lỗi lưu thông tin khoa')
        }
    }

    const handleDelete = async () => {
        try {
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 500))

            toast.success('Xóa khoa thành công')
            setShowDeleteModal(false)
            setCurrentFaculty(null)
            fetchFaculties()
        } catch (error) {
            toast.error('Lỗi xóa khoa')
        }
    }

    const handleViewDetail = async (faculty) => {
        try {
            // Mock API call to get full details
            await new Promise(resolve => setTimeout(resolve, 300))

            setCurrentFaculty(faculty)
            setShowDetailModal(true)
        } catch (error) {
            toast.error('Lỗi tải chi tiết khoa')
        }
    }

    const filteredFaculties = faculties.filter(faculty => {
        const matchesSearch = !searchQuery ||
            faculty.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faculty.code.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesStatus = !filters.status || faculty.status === filters.status
        const matchesHasDean = !filters.hasDean ||
            (filters.hasDean === 'true' ? faculty.dean : !faculty.dean)

        return matchesSearch && matchesStatus && matchesHasDean
    })

    const FacultyForm = ({ onSubmit, onClose }) => (
        <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tên khoa *
                    </label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Nhập tên khoa..."
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mã khoa *
                    </label>
                    <input
                        type="text"
                        value={formData.code}
                        onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Nhập mã khoa..."
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
                        placeholder="Mô tả về khoa..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Trưởng khoa
                    </label>
                    <select
                        value={formData.dean}
                        onChange={(e) => setFormData({...formData, dean: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Chọn trưởng khoa...</option>
                        {personnelOptions.map(person => (
                            <option key={person.id} value={person.id}>
                                {person.fullName} ({person.position})
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ngày thành lập
                    </label>
                    <input
                        type="date"
                        value={formData.establishedDate}
                        onChange={(e) => setFormData({...formData, establishedDate: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Contact Information */}
            <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Thông tin liên hệ</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Số điện thoại
                        </label>
                        <input
                            type="tel"
                            value={formData.contactInfo.phone}
                            onChange={(e) => setFormData({
                                ...formData,
                                contactInfo: {...formData.contactInfo, phone: e.target.value}
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="024-12345678"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            value={formData.contactInfo.email}
                            onChange={(e) => setFormData({
                                ...formData,
                                contactInfo: {...formData.contactInfo, email: e.target.value}
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="khoa@cmcu.edu.vn"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Địa chỉ
                        </label>
                        <input
                            type="text"
                            value={formData.contactInfo.address}
                            onChange={(e) => setFormData({
                                ...formData,
                                contactInfo: {...formData.contactInfo, address: e.target.value}
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Địa chỉ của khoa..."
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Website
                        </label>
                        <input
                            type="url"
                            value={formData.contactInfo.website}
                            onChange={(e) => setFormData({
                                ...formData,
                                contactInfo: {...formData.contactInfo, website: e.target.value}
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="https://khoa.cmcu.edu.vn"
                        />
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
                    {currentFaculty ? 'Cập nhật' : 'Tạo mới'}
                </button>
            </div>
        </form>
    )

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
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Quản lý Khoa</h1>
                        <p className="text-gray-600 mt-1">Quản lý thông tin các khoa trong trường</p>
                    </div>
                    <div className="flex space-x-3">
                        <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                            <Download className="h-4 w-4 mr-2" />
                            Xuất Excel
                        </button>
                        <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                            <Upload className="h-4 w-4 mr-2" />
                            Nhập Excel
                        </button>
                        <button
                            onClick={handleCreate}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Thêm khoa
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Tìm kiếm khoa..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters({...filters, status: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Tất cả trạng thái</option>
                                <option value="active">Hoạt động</option>
                                <option value="inactive">Không hoạt động</option>
                            </select>
                        </div>

                        <div>
                            <select
                                value={filters.hasDean}
                                onChange={(e) => setFilters({...filters, hasDean: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Tất cả</option>
                                <option value="true">Có trưởng khoa</option>
                                <option value="false">Chưa có trưởng khoa</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Building className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Tổng số khoa</p>
                                <p className="text-2xl font-semibold text-gray-900">{faculties.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <UserCheck className="h-6 w-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Có trưởng khoa</p>
                                <p className="text-2xl font-semibold text-gray-900">
                                    {faculties.filter(f => f.dean).length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Users className="h-6 w-6 text-purple-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Tổng nhân sự</p>
                                <p className="text-2xl font-semibold text-gray-900">
                                    {faculties.reduce((sum, f) => sum + f.statistics.totalPersonnel, 0)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <BookOpen className="h-6 w-6 text-orange-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Tổng sinh viên</p>
                                <p className="text-2xl font-semibold text-gray-900">
                                    {formatNumber(faculties.reduce((sum, f) => sum + f.statistics.totalStudents, 0))}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Faculties Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Khoa
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Trưởng khoa
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Liên hệ
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Thống kê
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Thành lập
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Thao tác
                                </th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-center">
                                        <div className="flex justify-center">
                                            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredFaculties.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                                        Không có dữ liệu
                                    </td>
                                </tr>
                            ) : (
                                filteredFaculties.map(faculty => (
                                    <tr key={faculty.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="flex items-center">
                                                    <div className="p-2 bg-blue-100 rounded-lg mr-3">
                                                        <Building className="h-5 w-5 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {faculty.name}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            Mã: {faculty.code}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            {faculty.dean ? (
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {faculty.dean.fullName}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {faculty.dean.position}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                        Chưa có
                                                    </span>
                                            )}
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                {faculty.contactInfo.phone && (
                                                    <div className="flex items-center text-sm text-gray-500">
                                                        <Phone className="h-3 w-3 mr-1" />
                                                        {faculty.contactInfo.phone}
                                                    </div>
                                                )}
                                                {faculty.contactInfo.email && (
                                                    <div className="flex items-center text-sm text-gray-500">
                                                        <Mail className="h-3 w-3 mr-1" />
                                                        {faculty.contactInfo.email}
                                                    </div>
                                                )}
                                                {faculty.contactInfo.website && (
                                                    <div className="flex items-center text-sm text-gray-500">
                                                        <ExternalLink className="h-3 w-3 mr-1" />
                                                        <a
                                                            href={faculty.contactInfo.website}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 hover:text-blue-800"
                                                        >
                                                            Website
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="space-y-1 text-sm">
                                                <div className="flex items-center text-gray-600">
                                                    <Users className="h-3 w-3 mr-1" />
                                                    {faculty.statistics.totalPersonnel} nhân sự
                                                </div>
                                                <div className="flex items-center text-gray-600">
                                                    <Building className="h-3 w-3 mr-1" />
                                                    {faculty.statistics.totalDepartments} bộ môn
                                                </div>
                                                <div className="flex items-center text-gray-600">
                                                    <BookOpen className="h-3 w-3 mr-1" />
                                                    {formatNumber(faculty.statistics.totalStudents)} sinh viên
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">
                                                {formatDate(faculty.establishedDate)}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => handleViewDetail(faculty)}
                                                    className="text-blue-600 hover:text-blue-800 p-1"
                                                    title="Xem chi tiết"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(faculty)}
                                                    className="text-green-600 hover:text-green-800 p-1"
                                                    title="Chỉnh sửa"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setCurrentFaculty(faculty)
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
                                totalItems={totalItems}
                                itemsPerPage={itemsPerPage}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    )}
                </div>

                {/* Create Faculty Modal */}
                <Modal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    title="Thêm khoa mới"
                    size="large"
                >
                    <FacultyForm
                        onSubmit={handleSubmit}
                        onClose={() => setShowCreateModal(false)}
                    />
                </Modal>

                {/* Edit Faculty Modal */}
                <Modal
                    isOpen={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    title="Chỉnh sửa khoa"
                    size="large"
                >
                    <FacultyForm
                        onSubmit={handleSubmit}
                        onClose={() => setShowEditModal(false)}
                    />
                </Modal>

                {/* Faculty Detail Modal */}
                <Modal
                    isOpen={showDetailModal}
                    onClose={() => setShowDetailModal(false)}
                    title="Chi tiết khoa"
                    size="large"
                >
                    {currentFaculty && (
                        <div className="space-y-6">
                            {/* Basic Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">{currentFaculty.name}</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <span className="text-sm font-medium text-gray-500">Mã khoa:</span>
                                            <p className="mt-1 text-sm text-gray-900">{currentFaculty.code}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium text-gray-500">Mô tả:</span>
                                            <p className="mt-1 text-sm text-gray-900">{currentFaculty.description}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium text-gray-500">Ngày thành lập:</span>
                                            <p className="mt-1 text-sm text-gray-900">
                                                {formatDate(currentFaculty.establishedDate)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Lãnh đạo</h4>
                                    <div className="space-y-3">
                                        <div>
                                            <span className="text-sm font-medium text-gray-500">Trưởng khoa:</span>
                                            {currentFaculty.dean ? (
                                                <div className="mt-1">
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {currentFaculty.dean.fullName}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {currentFaculty.dean.position}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {currentFaculty.dean.email}
                                                    </p>
                                                </div>
                                            ) : (
                                                <p className="mt-1 text-sm text-gray-500">Chưa có</p>
                                            )}
                                        </div>

                                        {currentFaculty.viceDeans.length > 0 && (
                                            <div>
                                                <span className="text-sm font-medium text-gray-500">Phó trưởng khoa:</span>
                                                <div className="mt-1 space-y-2">
                                                    {currentFaculty.viceDeans.map(viceDean => (
                                                        <div key={viceDean.id}>
                                                            <p className="text-sm font-medium text-gray-900">
                                                                {viceDean.fullName}
                                                            </p>
                                                            <p className="text-sm text-gray-500">
                                                                {viceDean.position} • {viceDean.email}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div>
                                <h4 className="text-lg font-semibold text-gray-900 mb-4">Thông tin liên hệ</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <div className="flex items-center">
                                            <Phone className="h-4 w-4 text-gray-400 mr-2" />
                                            <span className="text-sm text-gray-900">
                                                {currentFaculty.contactInfo.phone || 'Chưa có'}
                                            </span>
                                        </div>
                                        <div className="flex items-center">
                                            <Mail className="h-4 w-4 text-gray-400 mr-2" />
                                            <span className="text-sm text-gray-900">
                                                {currentFaculty.contactInfo.email || 'Chưa có'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center">
                                            <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                                            <span className="text-sm text-gray-900">
                                                {currentFaculty.contactInfo.address || 'Chưa có'}
                                            </span>
                                        </div>
                                        <div className="flex items-center">
                                            <ExternalLink className="h-4 w-4 text-gray-400 mr-2" />
                                            {currentFaculty.contactInfo.website ? (
                                                <a
                                                    href={currentFaculty.contactInfo.website}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm text-blue-600 hover:text-blue-800"
                                                >
                                                    {currentFaculty.contactInfo.website}
                                                </a>
                                            ) : (
                                                <span className="text-sm text-gray-900">Chưa có</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Statistics */}
                            <div>
                                <h4 className="text-lg font-semibold text-gray-900 mb-4">Thống kê</h4>
                                <div className="grid grid-cols-3 gap-6">
                                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                                        <div className="text-2xl font-bold text-blue-600">
                                            {currentFaculty.statistics.totalPersonnel}
                                        </div>
                                        <div className="text-sm text-gray-600">Nhân sự</div>
                                    </div>
                                    <div className="text-center p-4 bg-green-50 rounded-lg">
                                        <div className="text-2xl font-bold text-green-600">
                                            {currentFaculty.statistics.totalDepartments}
                                        </div>
                                        <div className="text-sm text-gray-600">Bộ môn</div>
                                    </div>
                                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                                        <div className="text-2xl font-bold text-purple-600">
                                            {formatNumber(currentFaculty.statistics.totalStudents)}
                                        </div>
                                        <div className="text-sm text-gray-600">Sinh viên</div>
                                    </div>
                                </div>
                            </div>
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
                            Bạn có chắc chắn muốn xóa khoa <strong>{currentFaculty?.name}</strong>?
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