import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/common/Layout'
import { ConfirmModal } from '../components/common/Modal'
import Modal from '../components/common/Modal'
import Pagination from '../components/common/Pagination'
import { formatDate, formatNumber } from '../utils/helpers'
import toast from 'react-hot-toast'
import {
    ClipboardCheck,
    Plus,
    Edit,
    Trash2,
    Search,
    Filter,
    Eye,
    Users,
    Calendar,
    BarChart3,
    Clock,
    CheckCircle,
    AlertCircle,
    Settings,
    FileText,
    UserPlus,
    Target,
    TrendingUp
} from 'lucide-react'

export default function AssessmentProgramPage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()

    const [programs, setPrograms] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedStatus, setSelectedStatus] = useState('')
    const [selectedType, setSelectedType] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [showExpertModal, setShowExpertModal] = useState(false)
    const [deleteModal, setDeleteModal] = useState({ show: false, programId: null })
    const [editingProgram, setEditingProgram] = useState(null)
    const [viewingProgram, setViewingProgram] = useState(null)

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        programId: '',
        organizationId: '',
        academicYear: new Date().getFullYear(),
        assessmentType: 'internal',
        timeline: {
            startDate: '',
            endDate: '',
            selfAssessmentDeadline: '',
            externalAssessmentDeadline: ''
        },
        assessmentCriteria: []
    })
    const [formErrors, setFormErrors] = useState({})
    const [submitting, setSubmitting] = useState(false)

    // Expert assignment
    const [availableExperts, setAvailableExperts] = useState([])
    const [selectedExperts, setSelectedExperts] = useState([])
    const [expertAssignments, setExpertAssignments] = useState([])

    // Data for form
    const [basePrograms, setBasePrograms] = useState([])
    const [organizations, setOrganizations] = useState([])

    const itemsPerPage = 10

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (user) {
            fetchPrograms()
            fetchFormData()
        }
    }, [user, searchQuery, selectedStatus, selectedType, currentPage])

    const breadcrumbItems = [
        { name: 'Chương trình đánh giá', icon: ClipboardCheck }
    ]

    const fetchPrograms = async () => {
        try {
            setLoading(true)
            await new Promise(resolve => setTimeout(resolve, 800))



            let filteredPrograms = mockPrograms
            if (searchQuery) {
                filteredPrograms = mockPrograms.filter(program =>
                    program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    program.code.toLowerCase().includes(searchQuery.toLowerCase())
                )
            }
            if (selectedStatus) {
                filteredPrograms = filteredPrograms.filter(program => program.status === selectedStatus)
            }
            if (selectedType) {
                filteredPrograms = filteredPrograms.filter(program => program.assessmentType === selectedType)
            }

            setPrograms(filteredPrograms)
            setTotalPages(Math.ceil(filteredPrograms.length / itemsPerPage))
            setTotalItems(filteredPrograms.length)
        } catch (error) {
            toast.error('Lỗi tải danh sách chương trình đánh giá')
        } finally {
            setLoading(false)
        }
    }

    const fetchFormData = async () => {
        try {
            const mockPrograms = [
                { id: '', name: '', code: '' },
                { id: '', name: '', code: '' }
            ]

            const mockOrganizations = [
                { id: '', name: '', code: '' }
            ]

            setBasePrograms(mockPrograms)
            setOrganizations(mockOrganizations)
        } catch (error) {
            console.error('Lỗi tải dữ liệu form:', error)
        }
    }

    const fetchAvailableExperts = async () => {
        try {
            const mockExperts = [
                {
                    id: '',
                    expertCode: '',
                    name: '',
                    specializations: [''],
                    availability: '',
                    currentAssignments: 0,
                    maxAssignments: 0
                }
            ]

            setAvailableExperts(mockExperts)
        } catch (error) {
            toast.error('Lỗi tải danh sách chuyên gia')
        }
    }

    const handleCreateProgram = async (e) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        try {
            setSubmitting(true)
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 1500))

            toast.success('Tạo chương trình đánh giá thành công')
            setShowCreateModal(false)
            resetForm()
            fetchPrograms()
        } catch (error) {
            toast.error('Lỗi tạo chương trình đánh giá')
        } finally {
            setSubmitting(false)
        }
    }

    const handleEditProgram = async (e) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        try {
            setSubmitting(true)
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 1500))

            toast.success('Cập nhật chương trình đánh giá thành công')
            setShowEditModal(false)
            resetForm()
            fetchPrograms()
        } catch (error) {
            toast.error('Lỗi cập nhật chương trình đánh giá')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeleteProgram = async () => {
        try {
            await new Promise(resolve => setTimeout(resolve, 1000))

            toast.success('Xóa chương trình đánh giá thành công')
            fetchPrograms()
        } catch (error) {
            toast.error('Lỗi xóa chương trình đánh giá')
        }
        setDeleteModal({ show: false, programId: null })
    }

    const validateForm = () => {
        const errors = {}

        if (!formData.name.trim()) {
            errors.name = 'Tên chương trình không được để trống'
        }

        if (!formData.code.trim()) {
            errors.code = 'Mã chương trình không được để trống'
        }

        if (!formData.programId) {
            errors.programId = 'Vui lòng chọn chương trình cơ sở'
        }

        if (!formData.organizationId) {
            errors.organizationId = 'Vui lòng chọn tổ chức'
        }

        if (!formData.timeline.startDate) {
            errors.startDate = 'Vui lòng chọn ngày bắt đầu'
        }

        if (!formData.timeline.endDate) {
            errors.endDate = 'Vui lòng chọn ngày kết thúc'
        }

        if (formData.timeline.startDate && formData.timeline.endDate) {
            if (new Date(formData.timeline.startDate) >= new Date(formData.timeline.endDate)) {
                errors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu'
            }
        }

        setFormErrors(errors)
        return Object.keys(errors).length === 0
    }

    const resetForm = () => {
        setFormData({
            name: '',
            code: '',
            programId: '',
            organizationId: '',
            academicYear: new Date().getFullYear(),
            assessmentType: 'internal',
            timeline: {
                startDate: '',
                endDate: '',
                selfAssessmentDeadline: '',
                externalAssessmentDeadline: ''
            },
            assessmentCriteria: []
        })
        setFormErrors({})
        setEditingProgram(null)
    }

    const openEditModal = (program) => {
        setEditingProgram(program)
        setFormData({
            name: program.name,
            code: program.code,
            programId: program.programId || '',
            organizationId: program.organizationId || '',
            academicYear: program.academicYear,
            assessmentType: program.assessmentType,
            timeline: program.timeline,
            assessmentCriteria: program.assessmentCriteria || []
        })
        setShowEditModal(true)
    }

    const openDetailModal = async (program) => {
        try {
            await new Promise(resolve => setTimeout(resolve, 500))

            const mockDetails = {
                ...program,
                assessmentCriteria: [
                    { standardId: '', standardName: '', weight: 0, completed: true },
                    { standardId: '', standardName: '', weight: 0, completed: false }
                ],
                statistics: {
                    totalEvidences: 0,
                    approvedEvidences: 0,
                    pendingEvidences: 0,
                    rejectedEvidences: 0
                }
            }

            setViewingProgram(mockDetails)
            setShowDetailModal(true)
        } catch (error) {
            toast.error('Lỗi tải chi tiết chương trình')
        }
    }

    const openExpertModal = (program) => {
        setEditingProgram(program)
        setExpertAssignments(program.assignedExperts || [])
        fetchAvailableExperts()
        setShowExpertModal(true)
    }

    const handleAssignExpert = async () => {
        try {
            await new Promise(resolve => setTimeout(resolve, 1000))

            toast.success('Phân công chuyên gia thành công')
            setShowExpertModal(false)
            fetchPrograms()
        } catch (error) {
            toast.error('Lỗi phân công chuyên gia')
        }
    }

    const getStatusBadge = (status) => {
        const statusConfig = {
            draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Nháp', icon: AlertCircle },
            active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Đang thực hiện', icon: CheckCircle },
            completed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Hoàn thành', icon: CheckCircle },
            paused: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Tạm dừng', icon: Clock }
        }

        const config = statusConfig[status] || statusConfig.draft
        const Icon = config.icon

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                <Icon className="h-3 w-3 mr-1" />
                {config.label}
            </span>
        )
    }

    const getTypeBadge = (type) => {
        return type === 'external' ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Đánh giá ngoài
            </span>
        ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Đánh giá trong
            </span>
        )
    }

    const getProgressColor = (progress) => {
        if (progress >= 80) return 'bg-green-500'
        if (progress >= 50) return 'bg-yellow-500'
        return 'bg-red-500'
    }

    const ProgramForm = ({ isEdit = false }) => (
        <form onSubmit={isEdit ? handleEditProgram : handleCreateProgram} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tên chương trình đánh giá *
                    </label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            formErrors.name ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="VD: Đánh giá chất lượng giáo dục năm 2024"
                    />
                    {formErrors.name && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mã chương trình *
                    </label>
                    <input
                        type="text"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            formErrors.code ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="VD: ASSESSMENT_2024_001"
                    />
                    {formErrors.code && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.code}</p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Chương trình cơ sở *
                    </label>
                    <select
                        value={formData.programId}
                        onChange={(e) => setFormData({ ...formData, programId: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            formErrors.programId ? 'border-red-500' : 'border-gray-300'
                        }`}
                    >
                        <option value="">Chọn chương trình cơ sở</option>
                        {basePrograms.map(program => (
                            <option key={program.id} value={program.id}>{program.name}</option>
                        ))}
                    </select>
                    {formErrors.programId && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.programId}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tổ chức *
                    </label>
                    <select
                        value={formData.organizationId}
                        onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            formErrors.organizationId ? 'border-red-500' : 'border-gray-300'
                        }`}
                    >
                        <option value="">Chọn tổ chức</option>
                        {organizations.map(org => (
                            <option key={org.id} value={org.id}>{org.name}</option>
                        ))}
                    </select>
                    {formErrors.organizationId && (
                        <p className="text-red-500 text-sm mt-1">{formErrors.organizationId}</p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Năm học
                    </label>
                    <input
                        type="number"
                        min="2020"
                        max="2030"
                        value={formData.academicYear}
                        onChange={(e) => setFormData({ ...formData, academicYear: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Loại đánh giá
                    </label>
                    <select
                        value={formData.assessmentType}
                        onChange={(e) => setFormData({ ...formData, assessmentType: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="internal">Đánh giá trong</option>
                        <option value="external">Đánh giá ngoài</option>
                    </select>
                </div>
            </div>

            <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Kế hoạch thời gian</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ngày bắt đầu *
                        </label>
                        <input
                            type="date"
                            value={formData.timeline.startDate ? formData.timeline.startDate.split('T')[0] : ''}
                            onChange={(e) => setFormData({
                                ...formData,
                                timeline: { ...formData.timeline, startDate: e.target.value + 'T00:00:00Z' }
                            })}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                formErrors.startDate ? 'border-red-500' : 'border-gray-300'
                            }`}
                        />
                        {formErrors.startDate && (
                            <p className="text-red-500 text-sm mt-1">{formErrors.startDate}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ngày kết thúc *
                        </label>
                        <input
                            type="date"
                            value={formData.timeline.endDate ? formData.timeline.endDate.split('T')[0] : ''}
                            onChange={(e) => setFormData({
                                ...formData,
                                timeline: { ...formData.timeline, endDate: e.target.value + 'T23:59:59Z' }
                            })}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                formErrors.endDate ? 'border-red-500' : 'border-gray-300'
                            }`}
                        />
                        {formErrors.endDate && (
                            <p className="text-red-500 text-sm mt-1">{formErrors.endDate}</p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Hạn tự đánh giá
                        </label>
                        <input
                            type="date"
                            value={formData.timeline.selfAssessmentDeadline ? formData.timeline.selfAssessmentDeadline.split('T')[0] : ''}
                            onChange={(e) => setFormData({
                                ...formData,
                                timeline: { ...formData.timeline, selfAssessmentDeadline: e.target.value + 'T23:59:59Z' }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {formData.assessmentType === 'external' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Hạn đánh giá ngoài
                            </label>
                            <input
                                type="date"
                                value={formData.timeline.externalAssessmentDeadline ? formData.timeline.externalAssessmentDeadline.split('T')[0] : ''}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    timeline: { ...formData.timeline, externalAssessmentDeadline: e.target.value + 'T23:59:59Z' }
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                    type="button"
                    onClick={() => {
                        if (isEdit) {
                            setShowEditModal(false)
                        } else {
                            setShowCreateModal(false)
                        }
                        resetForm()
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                    Hủy
                </button>
                <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                    {submitting ? 'Đang lưu...' : (isEdit ? 'Cập nhật' : 'Tạo mới')}
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
                        <h1 className="text-2xl font-bold text-gray-900">Quản lý chương trình đánh giá</h1>
                        <p className="text-gray-600 mt-1">Quản lý các chương trình đánh giá chất lượng giáo dục</p>
                    </div>
                    <button
                        onClick={() => {
                            resetForm()
                            setShowCreateModal(true)
                        }}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Thêm chương trình
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Tìm kiếm theo tên, mã..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="draft">Nháp</option>
                            <option value="active">Đang thực hiện</option>
                            <option value="completed">Hoàn thành</option>
                            <option value="paused">Tạm dừng</option>
                        </select>

                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Tất cả loại</option>
                            <option value="internal">Đánh giá trong</option>
                            <option value="external">Đánh giá ngoài</option>
                        </select>
                    </div>
                </div>

                {/* Programs List */}
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">
                            Danh sách chương trình đánh giá ({totalItems})
                        </h3>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-600">Đang tải...</p>
                        </div>
                    ) : programs.length === 0 ? (
                        <div className="text-center py-12">
                            <ClipboardCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Chưa có chương trình đánh giá nào
                            </h3>
                            <p className="text-gray-500 mb-4">
                                Bắt đầu bằng cách tạo chương trình đánh giá đầu tiên
                            </p>
                            <button
                                onClick={() => {
                                    resetForm()
                                    setShowCreateModal(true)
                                }}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Thêm chương trình
                            </button>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {programs.map(program => (
                                <div key={program.id} className="p-6 hover:bg-gray-50">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center space-x-4">
                                            <div className="p-3 bg-blue-100 rounded-lg">
                                                <ClipboardCheck className="h-6 w-6 text-blue-600" />
                                            </div>
                                            <div>
                                                <div className="flex items-center space-x-3 mb-1">
                                                    <h4 className="text-lg font-medium text-gray-900">
                                                        {program.name}
                                                    </h4>
                                                    {getStatusBadge(program.status)}
                                                    {getTypeBadge(program.assessmentType)}
                                                </div>
                                                <p className="text-sm text-gray-500 font-mono">
                                                    {program.code}
                                                </p>
                                                <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                                                    <span>{program.programName}</span>
                                                    <span>•</span>
                                                    <span>{program.organizationName}</span>
                                                    <span>•</span>
                                                    <span>Năm {program.academicYear}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => openDetailModal(program)}
                                                className="text-blue-600 hover:text-blue-800 p-2"
                                                title="Xem chi tiết"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => openExpertModal(program)}
                                                className="text-purple-600 hover:text-purple-800 p-2"
                                                title="Phân công chuyên gia"
                                            >
                                                <Users className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => openEditModal(program)}
                                                className="text-green-600 hover:text-green-800 p-2"
                                                title="Chỉnh sửa"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteModal({ show: true, programId: program.id })}
                                                className="text-red-600 hover:text-red-800 p-2"
                                                title="Xóa"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Progress */}
                                    <div className="mb-4">
                                        <div className="flex items-center justify-between text-sm mb-2">
                                            <span className="text-gray-600">Tiến độ tổng thể</span>
                                            <span className="font-medium">{program.progress.overallProgress}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(program.progress.overallProgress)}`}
                                                style={{ width: `${program.progress.overallProgress}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                                            <div className="text-lg font-semibold text-gray-900">
                                                {program.progress.completedStandards}/{program.progress.totalStandards}
                                            </div>
                                            <div className="text-gray-600">Tiêu chuẩn</div>
                                        </div>
                                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                                            <div className="text-lg font-semibold text-gray-900">
                                                {program.progress.selfAssessmentProgress}%
                                            </div>
                                            <div className="text-gray-600">Tự đánh giá</div>
                                        </div>
                                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                                            <div className="text-lg font-semibold text-gray-900">
                                                {program.assignedExperts.length}
                                            </div>
                                            <div className="text-gray-600">Chuyên gia</div>
                                        </div>
                                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                                            <div className="text-lg font-semibold text-gray-900">
                                                {formatDate(program.timeline.endDate, { format: 'date' })}
                                            </div>
                                            <div className="text-gray-600">Kết thúc</div>
                                        </div>
                                    </div>

                                    {/* Assigned Experts */}
                                    {program.assignedExperts.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <div className="flex items-center space-x-2">
                                                <Users className="h-4 w-4 text-gray-400" />
                                                <span className="text-sm text-gray-600">Chuyên gia:</span>
                                                <div className="flex flex-wrap gap-2">
                                                    {program.assignedExperts.map(expert => (
                                                        <span
                                                            key={expert.expertId}
                                                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                                expert.role === 'leader'
                                                                    ? 'bg-yellow-100 text-yellow-800'
                                                                    : 'bg-blue-100 text-blue-800'
                                                            }`}
                                                        >
                                                            {expert.expertName}
                                                            {expert.role === 'leader' && ' (Trưởng nhóm)'}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {totalPages > 1 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={totalItems}
                            itemsPerPage={itemsPerPage}
                            onPageChange={setCurrentPage}
                        />
                    )}
                </div>

                {/* Create Modal */}
                <Modal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    title="Thêm chương trình đánh giá mới"
                    size="large"
                >
                    <ProgramForm />
                </Modal>

                {/* Edit Modal */}
                <Modal
                    isOpen={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    title="Chỉnh sửa chương trình đánh giá"
                    size="large"
                >
                    <ProgramForm isEdit={true} />
                </Modal>

                {/* Detail Modal */}
                <Modal
                    isOpen={showDetailModal}
                    onClose={() => setShowDetailModal(false)}
                    title="Chi tiết chương trình đánh giá"
                    size="large"
                >
                    {viewingProgram && (
                        <div className="space-y-6">
                            {/* Basic Info */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">{viewingProgram.name}</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="font-medium text-gray-500">Mã chương trình:</span>
                                        <p className="font-mono">{viewingProgram.code}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-500">Loại đánh giá:</span>
                                        <p>{viewingProgram.assessmentType === 'external' ? 'Đánh giá ngoài' : 'Đánh giá trong'}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-500">Năm học:</span>
                                        <p>{viewingProgram.academicYear}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-500">Trạng thái:</span>
                                        <div className="mt-1">{getStatusBadge(viewingProgram.status)}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Timeline */}
                            <div>
                                <h4 className="font-medium text-gray-900 mb-3">Kế hoạch thời gian</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="font-medium text-gray-500">Ngày bắt đầu:</span>
                                        <p>{formatDate(viewingProgram.timeline.startDate)}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-500">Ngày kết thúc:</span>
                                        <p>{formatDate(viewingProgram.timeline.endDate)}</p>
                                    </div>
                                    {viewingProgram.timeline.selfAssessmentDeadline && (
                                        <div>
                                            <span className="font-medium text-gray-500">Hạn tự đánh giá:</span>
                                            <p>{formatDate(viewingProgram.timeline.selfAssessmentDeadline)}</p>
                                        </div>
                                    )}
                                    {viewingProgram.timeline.externalAssessmentDeadline && (
                                        <div>
                                            <span className="font-medium text-gray-500">Hạn đánh giá ngoài:</span>
                                            <p>{formatDate(viewingProgram.timeline.externalAssessmentDeadline)}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Progress Details */}
                            <div>
                                <h4 className="font-medium text-gray-900 mb-3">Chi tiết tiến độ</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Tiến độ tổng thể</span>
                                        <span className="text-sm font-medium">{viewingProgram.progress.overallProgress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${getProgressColor(viewingProgram.progress.overallProgress)}`}
                                            style={{ width: `${viewingProgram.progress.overallProgress}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            {/* Statistics */}
                            {viewingProgram.statistics && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-3">Thống kê minh chứng</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                                            <div className="text-2xl font-bold text-blue-600">{viewingProgram.statistics.totalEvidences}</div>
                                            <div className="text-sm text-gray-600">Tổng số</div>
                                        </div>
                                        <div className="text-center p-3 bg-green-50 rounded-lg">
                                            <div className="text-2xl font-bold text-green-600">{viewingProgram.statistics.approvedEvidences}</div>
                                            <div className="text-sm text-gray-600">Đã duyệt</div>
                                        </div>
                                        <div className="text-center p-3 bg-yellow-50 rounded-lg">
                                            <div className="text-2xl font-bold text-yellow-600">{viewingProgram.statistics.pendingEvidences}</div>
                                            <div className="text-sm text-gray-600">Chờ duyệt</div>
                                        </div>
                                        <div className="text-center p-3 bg-red-50 rounded-lg">
                                            <div className="text-2xl font-bold text-red-600">{viewingProgram.statistics.rejectedEvidences}</div>
                                            <div className="text-sm text-gray-600">Từ chối</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </Modal>

                {/* Expert Assignment Modal */}
                <Modal
                    isOpen={showExpertModal}
                    onClose={() => setShowExpertModal(false)}
                    title="Phân công chuyên gia"
                    size="large"
                >
                    <div className="space-y-6">
                        {/* Current Assignments */}
                        <div>
                            <h4 className="font-medium text-gray-900 mb-3">Chuyên gia đã phân công</h4>
                            {expertAssignments.length === 0 ? (
                                <p className="text-gray-500 text-sm">Chưa có chuyên gia nào được phân công</p>
                            ) : (
                                <div className="space-y-2">
                                    {expertAssignments.map(assignment => (
                                        <div key={assignment.expertId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div>
                                                <p className="font-medium text-gray-900">{assignment.expertName}</p>
                                                <p className="text-sm text-gray-600">
                                                    {assignment.role === 'leader' ? 'Trưởng nhóm đánh giá' : 'Chuyên gia đánh giá'}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setExpertAssignments(prev =>
                                                        prev.filter(a => a.expertId !== assignment.expertId)
                                                    )
                                                }}
                                                className="text-red-600 hover:text-red-800 text-sm"
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Available Experts */}
                        <div>
                            <h4 className="font-medium text-gray-900 mb-3">Chuyên gia có sẵn</h4>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {availableExperts.filter(expert =>
                                    !expertAssignments.some(assignment => assignment.expertId === expert.id)
                                ).map(expert => (
                                    <div key={expert.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                        <div>
                                            <p className="font-medium text-gray-900">{expert.name}</p>
                                            <p className="text-sm text-gray-600">
                                                {expert.specializations.join(', ')}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Phân công: {expert.currentAssignments}/{expert.maxAssignments}
                                            </p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <select
                                                className="text-sm border border-gray-300 rounded px-2 py-1"
                                                onChange={(e) => {
                                                    if (e.target.value) {
                                                        setExpertAssignments(prev => [...prev, {
                                                            expertId: expert.id,
                                                            expertName: expert.name,
                                                            role: e.target.value
                                                        }])
                                                        e.target.value = ''
                                                    }
                                                }}
                                            >
                                                <option value="">Chọn vai trò</option>
                                                <option value="leader">Trưởng nhóm</option>
                                                <option value="evaluator">Chuyên gia</option>
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4 border-t">
                            <button
                                type="button"
                                onClick={() => setShowExpertModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleAssignExpert}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                            >
                                Lưu phân công
                            </button>
                        </div>
                    </div>
                </Modal>

                {/* Delete Confirmation */}
                <ConfirmModal
                    isOpen={deleteModal.show}
                    onClose={() => setDeleteModal({ show: false, programId: null })}
                    onConfirm={handleDeleteProgram}
                    title="Xác nhận xóa chương trình đánh giá"
                    message="Bạn có chắc chắn muốn xóa chương trình đánh giá này? Thao tác này không thể hoàn tác và có thể ảnh hưởng đến các dữ liệu liên quan."
                    confirmText="Xóa"
                    type="danger"
                />
            </div>
        </Layout>
    )
}