import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/common/Layout'
import { ConfirmModal } from '../components/common/Modal'
import Modal from '../components/common/Modal'
import Pagination from '../components/common/Pagination'
import { formatDate } from '../utils/helpers'
import toast from 'react-hot-toast'
import {
    Globe,
    Send,
    Eye,
    Edit,
    Trash2,
    Search,
    Filter,
    Plus,
    Share2,
    Download,
    Link,
    Calendar,
    User,
    FileText,
    CheckCircle,
    Clock,
    AlertCircle,
    ExternalLink,
    Copy,
    Settings
} from 'lucide-react'

export default function PublishingPage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()

    const [publications, setPublications] = useState([])
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
    const [showShareModal, setShowShareModal] = useState(false)
    const [deleteModal, setDeleteModal] = useState({ show: false, publicationId: null })
    const [editingPublication, setEditingPublication] = useState(null)
    const [viewingPublication, setViewingPublication] = useState(null)
    const [sharingPublication, setSharingPublication] = useState(null)

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'evidence_collection',
        evidenceIds: [],
        visibility: 'public',
        allowDownload: true,
        allowShare: true,
        expiryDate: '',
        accessPassword: '',
        customDomain: '',
        seoSettings: {
            metaTitle: '',
            metaDescription: '',
            keywords: []
        }
    })
    const [formErrors, setFormErrors] = useState({})
    const [submitting, setSubmitting] = useState(false)

    // Share settings
    const [shareSettings, setShareSettings] = useState({
        platforms: [],
        message: '',
        scheduledDate: '',
        recipientEmails: []
    })

    // Available evidences for selection
    const [availableEvidences, setAvailableEvidences] = useState([])
    const [selectedEvidences, setSelectedEvidences] = useState([])

    const itemsPerPage = 10

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (user) {
            fetchPublications()
            fetchAvailableEvidences()
        }
    }, [user, searchQuery, selectedStatus, selectedType, currentPage])

    const breadcrumbItems = [
        { name: 'Ban hành minh chứng', icon: Globe }
    ]

    const fetchPublications = async () => {
        try {
            setLoading(true)
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 800))

            const mockPublications = [
                {
                    id: '',
                    title: '',
                    description: '',
                    type: '',
                    status: '',
                    visibility: '',
                    url: '',
                    shortUrl: '',
                    allowDownload: true,
                    allowShare: true,
                    publishedAt: '',
                    expiryDate: '',
                    createdBy: '',
                    createdAt: '',
                    seoSettings: {
                        metaTitle: '',
                        metaDescription: '',
                        keywords: ['', '', '']
                    }
                }
            ]

            // Apply filters
            let filteredPublications = mockPublications
            if (searchQuery) {
                filteredPublications = mockPublications.filter(pub =>
                    pub.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    pub.description.toLowerCase().includes(searchQuery.toLowerCase())
                )
            }
            if (selectedStatus) {
                filteredPublications = filteredPublications.filter(pub => pub.status === selectedStatus)
            }
            if (selectedType) {
                filteredPublications = filteredPublications.filter(pub => pub.type === selectedType)
            }

            setPublications(filteredPublications)
            setTotalPages(Math.ceil(filteredPublications.length / itemsPerPage))
            setTotalItems(filteredPublications.length)
        } catch (error) {
            toast.error('Lỗi tải danh sách xuất bản')
        } finally {
            setLoading(false)
        }
    }

    const fetchAvailableEvidences = async () => {
        try {
            // Mock API call
            const mockEvidences = [
                {
                    id: '',
                    code: '',
                    name: '',
                    standardName: '',
                    fileCount: 0
                }
            ]

            setAvailableEvidences(mockEvidences)
        } catch (error) {
            console.error('Lỗi tải danh sách minh chứng:', error)
        }
    }

    const handleCreatePublication = async (e) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        try {
            setSubmitting(true)
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 2000))

            toast.success('Tạo xuất bản thành công')
            setShowCreateModal(false)
            resetForm()
            fetchPublications()
        } catch (error) {
            toast.error('Lỗi tạo xuất bản')
        } finally {
            setSubmitting(false)
        }
    }

    const handleEditPublication = async (e) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        try {
            setSubmitting(true)
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 2000))

            toast.success('Cập nhật xuất bản thành công')
            setShowEditModal(false)
            resetForm()
            fetchPublications()
        } catch (error) {
            toast.error('Lỗi cập nhật xuất bản')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeletePublication = async () => {
        try {
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 1000))

            toast.success('Xóa xuất bản thành công')
            fetchPublications()
        } catch (error) {
            toast.error('Lỗi xóa xuất bản')
        }
        setDeleteModal({ show: false, publicationId: null })
    }

    const handlePublish = async (publication) => {
        try {
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 1500))

            toast.success('Xuất bản thành công')
            fetchPublications()
        } catch (error) {
            toast.error('Lỗi xuất bản')
        }
    }

    const handleUnpublish = async (publication) => {
        try {
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 1000))

            toast.success('Hủy xuất bản thành công')
            fetchPublications()
        } catch (error) {
            toast.error('Lỗi hủy xuất bản')
        }
    }

    const handleShare = async (e) => {
        e.preventDefault()

        try {
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 1500))

            toast.success('Chia sẻ thành công')
            setShowShareModal(false)
            setShareSettings({
                platforms: [],
                message: '',
                scheduledDate: '',
                recipientEmails: []
            })
        } catch (error) {
            toast.error('Lỗi chia sẻ')
        }
    }

    const validateForm = () => {
        const errors = {}

        if (!formData.title.trim()) {
            errors.title = 'Tiêu đề không được để trống'
        }

        if (!formData.description.trim()) {
            errors.description = 'Mô tả không được để trống'
        }

        if (formData.evidenceIds.length === 0) {
            errors.evidenceIds = 'Vui lòng chọn ít nhất một minh chứng'
        }

        setFormErrors(errors)
        return Object.keys(errors).length === 0
    }

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            type: 'evidence_collection',
            evidenceIds: [],
            visibility: 'public',
            allowDownload: true,
            allowShare: true,
            expiryDate: '',
            accessPassword: '',
            customDomain: '',
            seoSettings: {
                metaTitle: '',
                metaDescription: '',
                keywords: []
            }
        })
        setFormErrors({})
        setEditingPublication(null)
        setSelectedEvidences([])
    }

    const openEditModal = (publication) => {
        setEditingPublication(publication)
        setFormData({
            title: publication.title,
            description: publication.description,
            type: publication.type,
            evidenceIds: publication.evidenceIds || [],
            visibility: publication.visibility,
            allowDownload: publication.allowDownload,
            allowShare: publication.allowShare,
            expiryDate: publication.expiryDate ? publication.expiryDate.split('T')[0] : '',
            accessPassword: '',
            customDomain: publication.customDomain || '',
            seoSettings: publication.seoSettings || {
                metaTitle: '',
                metaDescription: '',
                keywords: []
            }
        })
        setShowEditModal(true)
    }

    const openDetailModal = (publication) => {
        setViewingPublication(publication)
        setShowDetailModal(true)
    }

    const openShareModal = (publication) => {
        setSharingPublication(publication)
        setShareSettings({
            platforms: [],
            message: `Chia sẻ: ${publication.title}`,
            scheduledDate: '',
            recipientEmails: []
        })
        setShowShareModal(true)
    }

    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text)
            toast.success('Đã sao chép vào clipboard')
        } catch (error) {
            toast.error('Lỗi sao chép')
        }
    }

    const getStatusBadge = (status) => {
        const statusConfig = {
            draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Nháp', icon: Edit },
            published: { bg: 'bg-green-100', text: 'text-green-800', label: 'Đã xuất bản', icon: CheckCircle },
            scheduled: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Đã lên lịch', icon: Calendar },
            expired: { bg: 'bg-red-100', text: 'text-red-800', label: 'Hết hạn', icon: AlertCircle }
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
        const typeConfig = {
            evidence_collection: { label: 'Bộ sưu tập', bg: 'bg-blue-100', text: 'text-blue-800' },
            single_document: { label: 'Tài liệu đơn', bg: 'bg-purple-100', text: 'text-purple-800' },
            report: { label: 'Báo cáo', bg: 'bg-green-100', text: 'text-green-800' }
        }

        const config = typeConfig[type] || typeConfig.evidence_collection

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        )
    }

    const getVisibilityBadge = (visibility) => {
        return visibility === 'public' ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <Globe className="h-3 w-3 mr-1" />
                Công khai
            </span>
        ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                <Eye className="h-3 w-3 mr-1" />
                Riêng tư
            </span>
        )
    }

    const PublicationForm = ({ isEdit = false }) => (
        <form onSubmit={isEdit ? handleEditPublication : handleCreatePublication} className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tiêu đề *
                </label>
                <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formErrors.title ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="VD: Bộ sưu tập minh chứng AUN-QA 2024"
                />
                {formErrors.title && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.title}</p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả *
                </label>
                <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formErrors.description ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Mô tả chi tiết về nội dung xuất bản..."
                />
                {formErrors.description && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.description}</p>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Loại xuất bản
                    </label>
                    <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="evidence_collection">Bộ sưu tập minh chứng</option>
                        <option value="single_document">Tài liệu đơn lẻ</option>
                        <option value="report">Báo cáo tổng hợp</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quyền riêng tư
                    </label>
                    <select
                        value={formData.visibility}
                        onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="public">Công khai</option>
                        <option value="private">Riêng tư</option>
                        <option value="password_protected">Bảo vệ bằng mật khẩu</option>
                    </select>
                </div>
            </div>

            {/* Evidence Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chọn minh chứng *
                </label>
                <div className={`border rounded-md p-4 max-h-60 overflow-y-auto ${
                    formErrors.evidenceIds ? 'border-red-500' : 'border-gray-300'
                }`}>
                    {availableEvidences.map(evidence => (
                        <div key={evidence.id} className="flex items-center space-x-3 py-2">
                            <input
                                type="checkbox"
                                id={`evidence-${evidence.id}`}
                                checked={formData.evidenceIds.includes(evidence.id)}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setFormData({
                                            ...formData,
                                            evidenceIds: [...formData.evidenceIds, evidence.id]
                                        })
                                    } else {
                                        setFormData({
                                            ...formData,
                                            evidenceIds: formData.evidenceIds.filter(id => id !== evidence.id)
                                        })
                                    }
                                }}
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <label htmlFor={`evidence-${evidence.id}`} className="flex-1 cursor-pointer">
                                <div className="font-medium text-gray-900">{evidence.name}</div>
                                <div className="text-sm text-gray-500">
                                    {evidence.code} • {evidence.standardName} • {evidence.fileCount} file
                                </div>
                            </label>
                        </div>
                    ))}
                </div>
                {formErrors.evidenceIds && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.evidenceIds}</p>
                )}
            </div>

            {/* Access Settings */}
            <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Cài đặt truy cập</h4>
                <div className="space-y-3">
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="allowDownload"
                            checked={formData.allowDownload}
                            onChange={(e) => setFormData({ ...formData, allowDownload: e.target.checked })}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="allowDownload" className="ml-2 text-sm text-gray-700">
                            Cho phép tải xuống
                        </label>
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="allowShare"
                            checked={formData.allowShare}
                            onChange={(e) => setFormData({ ...formData, allowShare: e.target.checked })}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="allowShare" className="ml-2 text-sm text-gray-700">
                            Cho phép chia sẻ
                        </label>
                    </div>
                </div>
            </div>

            {/* Advanced Settings */}
            <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Cài đặt nâng cao</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ngày hết hạn
                        </label>
                        <input
                            type="date"
                            value={formData.expiryDate}
                            onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {formData.visibility === 'password_protected' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Mật khẩu truy cập
                            </label>
                            <input
                                type="password"
                                value={formData.accessPassword}
                                onChange={(e) => setFormData({ ...formData, accessPassword: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Nhập mật khẩu..."
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* SEO Settings */}
            <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Cài đặt SEO</h4>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Meta Title
                        </label>
                        <input
                            type="text"
                            value={formData.seoSettings.metaTitle}
                            onChange={(e) => setFormData({
                                ...formData,
                                seoSettings: { ...formData.seoSettings, metaTitle: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Tiêu đề trang cho SEO..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Meta Description
                        </label>
                        <textarea
                            value={formData.seoSettings.metaDescription}
                            onChange={(e) => setFormData({
                                ...formData,
                                seoSettings: { ...formData.seoSettings, metaDescription: e.target.value }
                            })}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Mô tả trang cho SEO..."
                        />
                    </div>
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
                    {submitting ? 'Đang lưu...' : (isEdit ? 'Cập nhật' : 'Tạo xuất bản')}
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
                        <h1 className="text-2xl font-bold text-gray-900">Ban hành minh chứng</h1>
                        <p className="text-gray-600 mt-1">Ban hành minh chứng khi đã xác nhận</p>
                    </div>
                    <button
                        onClick={() => {
                            resetForm()
                            setShowCreateModal(true)
                        }}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Tạo xuất bản mới
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
                                placeholder="Tìm kiếm theo tiêu đề..."
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
                            <option value="published">Đã xuất bản</option>
                            <option value="scheduled">Đã lên lịch</option>
                            <option value="expired">Hết hạn</option>
                        </select>

                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Tất cả loại</option>
                            <option value="evidence_collection">Bộ sưu tập</option>
                            <option value="single_document">Tài liệu đơn</option>
                            <option value="report">Báo cáo</option>
                        </select>
                    </div>
                </div>

                {/* Publications List */}
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">
                            Danh sách xuất bản ({totalItems})
                        </h3>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-600">Đang tải...</p>
                        </div>
                    ) : publications.length === 0 ? (
                        <div className="text-center py-12">
                            <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Chưa có xuất bản nào
                            </h3>
                            <p className="text-gray-500 mb-4">
                                Bắt đầu bằng cách tạo xuất bản đầu tiên
                            </p>
                            <button
                                onClick={() => {
                                    resetForm()
                                    setShowCreateModal(true)
                                }}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Tạo xuất bản mới
                            </button>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {publications.map(publication => (
                                <div key={publication.id} className="p-6 hover:bg-gray-50">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start space-x-4 flex-1">
                                            <div className="p-3 bg-blue-100 rounded-lg">
                                                <Globe className="h-6 w-6 text-blue-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center space-x-3 mb-2">
                                                    <h4 className="text-lg font-medium text-gray-900">
                                                        {publication.title}
                                                    </h4>
                                                    {getStatusBadge(publication.status)}
                                                    {getTypeBadge(publication.type)}
                                                    {getVisibilityBadge(publication.visibility)}
                                                </div>
                                                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                                    {publication.description}
                                                </p>

                                                {publication.url && (
                                                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                                                        <div className="flex items-center space-x-1">
                                                            <Link className="h-4 w-4" />
                                                            <span className="font-mono text-xs">
                                                                {publication.shortUrl || publication.url}
                                                            </span>
                                                            <button
                                                                onClick={() => copyToClipboard(publication.url)}
                                                                className="text-blue-600 hover:text-blue-800"
                                                            >
                                                                <Copy className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                    <div className="text-center p-2 bg-gray-50 rounded">
                                                        <div className="font-semibold text-blue-600">{publication.evidenceCount}</div>
                                                        <div className="text-gray-600">Minh chứng</div>
                                                    </div>
                                                    <div className="text-center p-2 bg-gray-50 rounded">
                                                        <div className="font-semibold text-green-600">{publication.viewCount}</div>
                                                        <div className="text-gray-600">Lượt xem</div>
                                                    </div>
                                                    <div className="text-center p-2 bg-gray-50 rounded">
                                                        <div className="font-semibold text-purple-600">{publication.downloadCount}</div>
                                                        <div className="text-gray-600">Lượt tải</div>
                                                    </div>
                                                    <div className="text-center p-2 bg-gray-50 rounded">
                                                        <div className="font-semibold text-orange-600">{publication.shareCount}</div>
                                                        <div className="text-gray-600">Lượt chia sẻ</div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center space-x-4 text-xs text-gray-500 mt-3">
                                                    <span>Tạo bởi: {publication.createdBy}</span>
                                                    <span>•</span>
                                                    <span>{formatDate(publication.createdAt)}</span>
                                                    {publication.publishedAt && (
                                                        <>
                                                            <span>•</span>
                                                            <span>Xuất bản: {formatDate(publication.publishedAt)}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => openDetailModal(publication)}
                                                className="text-blue-600 hover:text-blue-800 p-2"
                                                title="Xem chi tiết"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>

                                            {publication.url && (
                                                <a
                                                    href={publication.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-green-600 hover:text-green-800 p-2"
                                                    title="Mở trang xuất bản"
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                </a>
                                            )}

                                            <button
                                                onClick={() => openShareModal(publication)}
                                                className="text-purple-600 hover:text-purple-800 p-2"
                                                title="Chia sẻ"
                                            >
                                                <Share2 className="h-4 w-4" />
                                            </button>

                                            <button
                                                onClick={() => openEditModal(publication)}
                                                className="text-orange-600 hover:text-orange-800 p-2"
                                                title="Chỉnh sửa"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>

                                            {publication.status === 'draft' ? (
                                                <button
                                                    onClick={() => handlePublish(publication)}
                                                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
                                                >
                                                    <Send className="h-3 w-3 mr-1" />
                                                    Xuất bản
                                                </button>
                                            ) : publication.status === 'published' ? (
                                                <button
                                                    onClick={() => handleUnpublish(publication)}
                                                    className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                                                >
                                                    Hủy xuất bản
                                                </button>
                                            ) : null}

                                            <button
                                                onClick={() => setDeleteModal({ show: true, publicationId: publication.id })}
                                                className="text-red-600 hover:text-red-800 p-2"
                                                title="Xóa"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
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
                    title="Tạo xuất bản mới"
                    size="large"
                >
                    <PublicationForm />
                </Modal>

                {/* Edit Modal */}
                <Modal
                    isOpen={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    title="Chỉnh sửa xuất bản"
                    size="large"
                >
                    <PublicationForm isEdit={true} />
                </Modal>

                {/* Detail Modal */}
                <Modal
                    isOpen={showDetailModal}
                    onClose={() => setShowDetailModal(false)}
                    title="Chi tiết xuất bản"
                    size="large"
                >
                    {viewingPublication && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">{viewingPublication.title}</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="font-medium text-gray-500">Loại:</span>
                                        <div className="mt-1">{getTypeBadge(viewingPublication.type)}</div>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-500">Trạng thái:</span>
                                        <div className="mt-1">{getStatusBadge(viewingPublication.status)}</div>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-500">Quyền riêng tư:</span>
                                        <div className="mt-1">{getVisibilityBadge(viewingPublication.visibility)}</div>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-500">Số minh chứng:</span>
                                        <p>{viewingPublication.evidenceCount}</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-medium text-gray-900 mb-2">Mô tả</h4>
                                <p className="text-sm text-gray-700">{viewingPublication.description}</p>
                            </div>

                            {viewingPublication.url && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Liên kết</h4>
                                    <div className="flex items-center space-x-2">
                                        <code className="bg-gray-100 px-2 py-1 rounded text-sm">{viewingPublication.url}</code>
                                        <button
                                            onClick={() => copyToClipboard(viewingPublication.url)}
                                            className="text-blue-600 hover:text-blue-800"
                                        >
                                            <Copy className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div>
                                <h4 className="font-medium text-gray-900 mb-3">Thống kê</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                                        <div className="text-2xl font-bold text-blue-600">{viewingPublication.viewCount}</div>
                                        <div className="text-sm text-gray-600">Lượt xem</div>
                                    </div>
                                    <div className="text-center p-4 bg-green-50 rounded-lg">
                                        <div className="text-2xl font-bold text-green-600">{viewingPublication.downloadCount}</div>
                                        <div className="text-sm text-gray-600">Lượt tải</div>
                                    </div>
                                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                                        <div className="text-2xl font-bold text-purple-600">{viewingPublication.shareCount}</div>
                                        <div className="text-sm text-gray-600">Lượt chia sẻ</div>
                                    </div>
                                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                                        <div className="text-2xl font-bold text-orange-600">{viewingPublication.evidenceCount}</div>
                                        <div className="text-sm text-gray-600">Minh chứng</div>
                                    </div>
                                </div>
                            </div>

                            {viewingPublication.seoSettings.metaTitle && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Cài đặt SEO</h4>
                                    <div className="space-y-2 text-sm">
                                        <div>
                                            <span className="font-medium text-gray-500">Meta Title:</span>
                                            <p>{viewingPublication.seoSettings.metaTitle}</p>
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-500">Meta Description:</span>
                                            <p>{viewingPublication.seoSettings.metaDescription}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </Modal>

                {/* Share Modal */}
                <Modal
                    isOpen={showShareModal}
                    onClose={() => setShowShareModal(false)}
                    title="Chia sẻ xuất bản"
                    size="large"
                >
                    {sharingPublication && (
                        <form onSubmit={handleShare} className="space-y-6">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-medium text-gray-900">{sharingPublication.title}</h4>
                                <p className="text-sm text-gray-600">{sharingPublication.url}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nền tảng chia sẻ
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {['facebook', 'twitter', 'linkedin', 'email'].map(platform => (
                                        <div key={platform} className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id={platform}
                                                checked={shareSettings.platforms.includes(platform)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setShareSettings({
                                                            ...shareSettings,
                                                            platforms: [...shareSettings.platforms, platform]
                                                        })
                                                    } else {
                                                        setShareSettings({
                                                            ...shareSettings,
                                                            platforms: shareSettings.platforms.filter(p => p !== platform)
                                                        })
                                                    }
                                                }}
                                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <label htmlFor={platform} className="ml-2 text-sm text-gray-700 capitalize">
                                                {platform}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tin nhắn chia sẻ
                                </label>
                                <textarea
                                    value={shareSettings.message}
                                    onChange={(e) => setShareSettings({ ...shareSettings, message: e.target.value })}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Tin nhắn kèm theo khi chia sẻ..."
                                />
                            </div>

                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowShareModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                                >
                                    Chia sẻ ngay
                                </button>
                            </div>
                        </form>
                    )}
                </Modal>

                {/* Delete Confirmation */}
                <ConfirmModal
                    isOpen={deleteModal.show}
                    onClose={() => setDeleteModal({ show: false, publicationId: null })}
                    onConfirm={handleDeletePublication}
                    title="Xác nhận xóa xuất bản"
                    message="Bạn có chắc chắn muốn xóa xuất bản này? Thao tác này không thể hoàn tác."
                    confirmText="Xóa"
                    type="danger"
                />
            </div>
        </Layout>
    )
}