import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import Modal from '../../components/common/Modal'
import Pagination from '../../components/common/Pagination'
import { formatDate, formatNumber } from '../../utils/helpers'
import toast from 'react-hot-toast'
import {
    GitBranch,
    Plus,
    Search,
    Filter,
    Eye,
    Edit,
    Trash2,
    Users,
    Building,
    Calendar,
    User,
    BookOpen,
    GraduationCap,
    Download,
    Upload,
    MoreVertical,
    UserCheck,
    ChevronDown,
    ChevronRight
} from 'lucide-react'

export default function DepartmentsPage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()

    // State management
    const [departments, setDepartments] = useState([])
    const [loading, setLoading] = useState(false)
    const [selectedDepartments, setSelectedDepartments] = useState([])

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [currentDepartment, setCurrentDepartment] = useState(null)

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        type: 'department',
        facultyId: '',
        head: '',
        description: '',
        trainingLevel: []
    })

    // Search and filter
    const [searchQuery, setSearchQuery] = useState('')
    const [filters, setFilters] = useState({
        facultyId: '',
        type: '',
        status: '',
        hasHead: ''
    })

    // Pagination
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)
    const itemsPerPage = 10

    // Options
    const [facultyOptions, setFacultyOptions] = useState([])
    const [personnelOptions, setPersonnelOptions] = useState([])

    const departmentTypes = [
        { value: '', label: '' },
        { value: '', label: '' }
    ]

    const trainingLevels = [
        { value: '', label: '' }
    ]

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (user) {
            fetchDepartments()
            fetchFacultyOptions()
            fetchPersonnelOptions()
        }
    }, [user, currentPage, searchQuery, filters])

    const breadcrumbItems = [
        { name: '', href: '/unit-data' },
        { name: '', icon: GitBranch }
    ]

    const fetchDepartments = async () => {
        try {
            setLoading(true)
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 800))

            const mockDepartments = [
                {
                    id: '',
                    name: '',
                    code: '',
                    type: '',
                    faculty: {
                        id: '',
                        name: '',
                        code: ''
                    },
                    head: {
                        id: '',
                        fullName: '',
                        email: '',
                        position: ''
                    },
                    description: '',
                    trainingLevel: ['', ''],
                    statistics: {
                        totalPersonnel: 0,
                        totalStudents: 0
                    },
                    status: '',
                    createdAt: ''
                }
            ]

            setDepartments(mockDepartments)
            setTotalItems(mockDepartments.length)
            setTotalPages(Math.ceil(mockDepartments.length / itemsPerPage))

        } catch (error) {
            toast.error('Lỗi tải danh sách bộ môn/ngành')
        } finally {
            setLoading(false)
        }
    }

    const fetchFacultyOptions = async () => {
        try {
            // Mock API call
            const mockFaculties = [
                { id: '', name: '', code: '' }
            ]
            setFacultyOptions(mockFaculties)
        } catch (error) {
            console.error('Lỗi tải danh sách khoa:', error)
        }
    }

    const fetchPersonnelOptions = async () => {
        try {
            // Mock API call
            const mockPersonnel = [
                { id: '', fullName: '', position: '', facultyId: '' }
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
            type: 'department',
            facultyId: '',
            head: '',
            description: '',
            trainingLevel: []
        })
        setShowCreateModal(true)
    }

    const handleEdit = (department) => {
        setCurrentDepartment(department)
        setFormData({
            name: department.name,
            code: department.code,
            type: department.type,
            facultyId: department.faculty.id,
            head: department.head?.id || '',
            description: department.description,
            trainingLevel: department.trainingLevel
        })
        setShowEditModal(true)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 1000))

            if (currentDepartment) {
                toast.success('Cập nhật bộ môn/ngành thành công')
                setShowEditModal(false)
            } else {
                toast.success('Tạo bộ môn/ngành thành công')
                setShowCreateModal(false)
            }

            fetchDepartments()
            setCurrentDepartment(null)
        } catch (error) {
            toast.error('Lỗi lưu thông tin bộ môn/ngành')
        }
    }

    const handleDelete = async () => {
        try {
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 500))

            toast.success('Xóa bộ môn/ngành thành công')
            setShowDeleteModal(false)
            setCurrentDepartment(null)
            fetchDepartments()
        } catch (error) {
            toast.error('Lỗi xóa bộ môn/ngành')
        }
    }

    const handleViewDetail = async (department) => {
        try {
            // Mock API call to get full details
            await new Promise(resolve => setTimeout(resolve, 300))

            setCurrentDepartment(department)
            setShowDetailModal(true)
        } catch (error) {
            toast.error('Lỗi tải chi tiết bộ môn/ngành')
        }
    }

    const filteredDepartments = departments.filter(department => {
        const matchesSearch = !searchQuery ||
            department.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            department.code.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesFaculty = !filters.facultyId || department.faculty.id === filters.facultyId
        const matchesType = !filters.type || department.type === filters.type
        const matchesStatus = !filters.status || department.status === filters.status
        const matchesHasHead = !filters.hasHead ||
            (filters.hasHead === 'true' ? department.head : !department.head)

        return matchesSearch && matchesFaculty && matchesType && matchesStatus && matchesHasHead
    })

    // Filter personnel by selected faculty
    const availablePersonnel = personnelOptions.filter(person =>
        !formData.facultyId || person.facultyId === formData.facultyId
    )

    const DepartmentForm = ({ onSubmit, onClose }) => (
        <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tên bộ môn/ngành *
                    </label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Nhập tên bộ môn/ngành..."
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mã bộ môn/ngành *
                    </label>
                    <input
                        type="text"
                        value={formData.code}
                        onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Nhập mã bộ môn/ngành..."
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Loại *
                    </label>
                    <select
                        value={formData.type}
                        onChange={(e) => setFormData({...formData, type: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    >
                        {departmentTypes.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Khoa *
                    </label>
                    <select
                        value={formData.facultyId}
                        onChange={(e) => setFormData({...formData, facultyId: e.target.value, head: ''})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    >
                        <option value="">Chọn khoa...</option>
                        {facultyOptions.map(faculty => (
                            <option key={faculty.id} value={faculty.id}>
                                {faculty.name} ({faculty.code})
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Trưởng bộ môn/ngành
                    </label>
                    <select
                        value={formData.head}
                        onChange={(e) => setFormData({...formData, head: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={!formData.facultyId}
                    >
                        <option value="">Chọn trưởng bộ môn/ngành...</option>
                        {availablePersonnel.map(person => (
                            <option key={person.id} value={person.id}>
                                {person.fullName} ({person.position})
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bậc đào tạo
                    </label>
                    <div className="space-y-2">
                        {trainingLevels.map(level => (
                            <label key={level.value} className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={formData.trainingLevel.includes(level.value)}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setFormData({
                                                ...formData,
                                                trainingLevel: [...formData.trainingLevel, level.value]
                                            })
                                        } else {
                                            setFormData({
                                                ...formData,
                                                trainingLevel: formData.trainingLevel.filter(l => l !== level.value)
                                            })
                                        }
                                    }}
                                    className="mr-2"
                                />
                                <span className="text-sm text-gray-700">{level.label}</span>
                            </label>
                        ))}
                    </div>
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
                        placeholder="Mô tả về bộ môn/ngành..."
                    />
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
                    {currentDepartment ? 'Cập nhật' : 'Tạo mới'}
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
                        <h1 className="text-2xl font-bold text-gray-900">Quản lý Ngành</h1>
                        <p className="text-gray-600 mt-1">Quản lý thông tin các ngành học</p>
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
                            Thêm bộ môn/ngành
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="md:col-span-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Tìm kiếm bộ môn/ngành..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <select
                                value={filters.facultyId}
                                onChange={(e) => setFilters({...filters, facultyId: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Tất cả khoa</option>
                                {facultyOptions.map(faculty => (
                                    <option key={faculty.id} value={faculty.id}>{faculty.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <select
                                value={filters.type}
                                onChange={(e) => setFilters({...filters, type: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Tất cả loại</option>
                                {departmentTypes.map(type => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <select
                                value={filters.hasHead}
                                onChange={(e) => setFilters({...filters, hasHead: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Tất cả</option>
                                <option value="true">Có trưởng</option>
                                <option value="false">Chưa có trưởng</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <GitBranch className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Tổng số</p>
                                <p className="text-2xl font-semibold text-gray-900">{departments.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Building className="h-6 w-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Bộ môn</p>
                                <p className="text-2xl font-semibold text-gray-900">
                                    {departments.filter(d => d.type === 'department').length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <GraduationCap className="h-6 w-6 text-purple-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Ngành học</p>
                                <p className="text-2xl font-semibold text-gray-900">
                                    {departments.filter(d => d.type === 'major').length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <Users className="h-6 w-6 text-orange-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Tổng nhân sự</p>
                                <p className="text-2xl font-semibold text-gray-900">
                                    {departments.reduce((sum, d) => sum + d.statistics.totalPersonnel, 0)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Departments Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Bộ môn/Ngành
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Khoa
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Trưởng bộ môn/ngành
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Bậc đào tạo
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Thống kê
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
                            ) : filteredDepartments.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                                        Không có dữ liệu
                                    </td>
                                </tr>
                            ) : (
                                filteredDepartments.map(department => (
                                    <tr key={department.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className={`p-2 rounded-lg mr-3 ${
                                                    department.type === 'department'
                                                        ? 'bg-blue-100'
                                                        : 'bg-purple-100'
                                                }`}>
                                                    {department.type === 'department' ? (
                                                        <GitBranch className={`h-5 w-5 ${
                                                            department.type === 'department'
                                                                ? 'text-blue-600'
                                                                : 'text-purple-600'
                                                        }`} />
                                                    ) : (
                                                        <GraduationCap className="h-5 w-5 text-purple-600" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {department.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {department.code} • {
                                                        departmentTypes.find(t => t.value === department.type)?.label
                                                    }
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {department.faculty.name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {department.faculty.code}
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            {department.head ? (
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {department.head.fullName}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {department.head.position}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                        Chưa có
                                                    </span>
                                            )}
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {department.trainingLevel.map(level => (
                                                    <span
                                                        key={level}
                                                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                                                    >
                                                            {trainingLevels.find(t => t.value === level)?.label}
                                                        </span>
                                                ))}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="space-y-1 text-sm">
                                                <div className="flex items-center text-gray-600">
                                                    <Users className="h-3 w-3 mr-1" />
                                                    {department.statistics.totalPersonnel} nhân sự
                                                </div>
                                                <div className="flex items-center text-gray-600">
                                                    <BookOpen className="h-3 w-3 mr-1" />
                                                    {formatNumber(department.statistics.totalStudents)} sinh viên
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => handleViewDetail(department)}
                                                    className="text-blue-600 hover:text-blue-800 p-1"
                                                    title="Xem chi tiết"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(department)}
                                                    className="text-green-600 hover:text-green-800 p-1"
                                                    title="Chỉnh sửa"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setCurrentDepartment(department)
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

                {/* Create Department Modal */}
                <Modal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    title="Thêm bộ môn/ngành mới"
                    size="large"
                >
                    <DepartmentForm
                        onSubmit={handleSubmit}
                        onClose={() => setShowCreateModal(false)}
                    />
                </Modal>

                {/* Edit Department Modal */}
                <Modal
                    isOpen={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    title="Chỉnh sửa bộ môn/ngành"
                    size="large"
                >
                    <DepartmentForm
                        onSubmit={handleSubmit}
                        onClose={() => setShowEditModal(false)}
                    />
                </Modal>

                {/* Department Detail Modal */}
                <Modal
                    isOpen={showDetailModal}
                    onClose={() => setShowDetailModal(false)}
                    title="Chi tiết bộ môn/ngành"
                    size="large"
                >
                    {currentDepartment && (
                        <div className="space-y-6">
                            {/* Basic Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                        {currentDepartment.name}
                                    </h3>
                                    <div className="space-y-3">
                                        <div>
                                            <span className="text-sm font-medium text-gray-500">Mã:</span>
                                            <p className="mt-1 text-sm text-gray-900">{currentDepartment.code}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium text-gray-500">Loại:</span>
                                            <p className="mt-1 text-sm text-gray-900">
                                                {departmentTypes.find(t => t.value === currentDepartment.type)?.label}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium text-gray-500">Khoa:</span>
                                            <p className="mt-1 text-sm text-gray-900">
                                                {currentDepartment.faculty.name} ({currentDepartment.faculty.code})
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium text-gray-500">Mô tả:</span>
                                            <p className="mt-1 text-sm text-gray-900">{currentDepartment.description}</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Lãnh đạo</h4>
                                    <div className="space-y-3">
                                        <div>
                                            <span className="text-sm font-medium text-gray-500">
                                                Trưởng bộ môn/ngành:
                                            </span>
                                            {currentDepartment.head ? (
                                                <div className="mt-1">
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {currentDepartment.head.fullName}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {currentDepartment.head.position}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {currentDepartment.head.email}
                                                    </p>
                                                </div>
                                            ) : (
                                                <p className="mt-1 text-sm text-gray-500">Chưa có</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Training Levels */}
                            <div>
                                <h4 className="text-lg font-semibold text-gray-900 mb-4">Bậc đào tạo</h4>
                                <div className="flex flex-wrap gap-2">
                                    {currentDepartment.trainingLevel.map(level => (
                                        <span
                                            key={level}
                                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                                        >
                                            {trainingLevels.find(t => t.value === level)?.label}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Statistics */}
                            <div>
                                <h4 className="text-lg font-semibold text-gray-900 mb-4">Thống kê</h4>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                                        <div className="text-2xl font-bold text-blue-600">
                                            {currentDepartment.statistics.totalPersonnel}
                                        </div>
                                        <div className="text-sm text-gray-600">Nhân sự</div>
                                    </div>
                                    <div className="text-center p-4 bg-green-50 rounded-lg">
                                        <div className="text-2xl font-bold text-green-600">
                                            {formatNumber(currentDepartment.statistics.totalStudents)}
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
                            Bạn có chắc chắn muốn xóa bộ môn/ngành <strong>{currentDepartment?.name}</strong>?
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