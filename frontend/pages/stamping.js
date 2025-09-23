import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/common/Layout'
import Modal from '../components/common/Modal'
import Pagination from '../components/common/Pagination'
import { formatDate } from '../utils/helpers'
import toast from 'react-hot-toast'
import {
    Stamp,
    FileText,
    Plus,
    Search,
    Filter,
    Eye,
    Download,
    CheckCircle,
    Clock,
    AlertCircle,
    Settings,
    Calendar,
    User,
    Building,
    Upload,
    X
} from 'lucide-react'

export default function StampingPage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()

    const [documents, setDocuments] = useState([])
    const [stampTemplates, setStampTemplates] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedStatus, setSelectedStatus] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)

    // Modal states
    const [showStampModal, setShowStampModal] = useState(false)
    const [showBulkStampModal, setShowBulkStampModal] = useState(false)
    const [showTemplateModal, setShowTemplateModal] = useState(false)
    const [showPreviewModal, setShowPreviewModal] = useState(false)

    const [selectedDocuments, setSelectedDocuments] = useState([])
    const [stampingDocument, setStampingDocument] = useState(null)
    const [previewDocument, setPreviewDocument] = useState(null)

    // Stamping form state
    const [stampingForm, setStampingForm] = useState({
        templateId: '',
        position: { x: 100, y: 100 },
        size: 100,
        opacity: 0.8,
        text: '',
        date: new Date().toISOString().split('T')[0],
        officialNumber: '',
        note: ''
    })
    const [stamping, setStamping] = useState(false)

    // Template form state
    const [templateForm, setTemplateForm] = useState({
        name: '',
        type: 'official',
        design: {
            shape: 'circle',
            size: 100,
            color: '#FF0000',
            borderWidth: 2,
            text: {
                main: '',
                sub: '',
                bottom: ''
            }
        },
        permissions: {
            allowedRoles: [],
            allowedUsers: []
        }
    })

    const itemsPerPage = 10

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (user) {
            fetchDocuments()
            fetchStampTemplates()
        }
    }, [user, searchQuery, selectedStatus, currentPage])

    const breadcrumbItems = [
        { name: 'Đóng dấu tài liệu', icon: Stamp }
    ]

    const fetchDocuments = async () => {
        try {
            setLoading(true)
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 800))

            const mockDocuments = [
                {
                    id: '1',
                    name: 'Quyết định bổ nhiệm giảng viên',
                    code: 'QD001/2024',
                    type: 'decision',
                    status: 'pending_stamp',
                    evidenceCode: 'H2.01.01.08',
                    createdBy: 'Nguyễn Văn A',
                    createdAt: '2024-12-25T10:30:00Z',
                    fileSize: 2048000,
                    pageCount: 3,
                    requiresOfficialStamp: true,
                    stampHistory: []
                },
                {
                    id: '2',
                    name: 'Báo cáo kết quả học tập sinh viên',
                    code: 'BC002/2024',
                    type: 'report',
                    status: 'stamped',
                    evidenceCode: 'H1.01.02.15',
                    createdBy: 'Trần Thị B',
                    createdAt: '2024-12-24T09:15:00Z',
                    fileSize: 1536000,
                    pageCount: 8,
                    requiresOfficialStamp: true,
                    stampHistory: [
                        {
                            id: '1',
                            templateName: 'Dấu chính thức VNUA',
                            stampedBy: 'Phạm Văn C',
                            stampedAt: '2024-12-24T15:30:00Z',
                            note: 'Phê duyệt báo cáo'
                        }
                    ]
                }
            ]

            // Apply filters
            let filteredDocuments = mockDocuments
            if (searchQuery) {
                filteredDocuments = mockDocuments.filter(doc =>
                    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    doc.code.toLowerCase().includes(searchQuery.toLowerCase())
                )
            }
            if (selectedStatus) {
                filteredDocuments = filteredDocuments.filter(doc => doc.status === selectedStatus)
            }

            setDocuments(filteredDocuments)
            setTotalPages(Math.ceil(filteredDocuments.length / itemsPerPage))
            setTotalItems(filteredDocuments.length)
        } catch (error) {
            toast.error('Lỗi tải danh sách tài liệu')
        } finally {
            setLoading(false)
        }
    }

    const fetchStampTemplates = async () => {
        try {
            // Mock API call
            const mockTemplates = [
                {
                    id: '1',
                    name: 'Dấu chính thức VNUA',
                    type: 'official',
                    design: {
                        shape: 'circle',
                        size: 100,
                        color: '#FF0000',
                        borderWidth: 2,
                        text: {
                            main: 'ĐẠI HỌC NÔNG NGHIỆP HÀ NỘI',
                            sub: 'PHÒNG ĐÀO TẠO',
                            bottom: 'VIETNAM NATIONAL UNIVERSITY OF AGRICULTURE'
                        }
                    },
                    isActive: true
                },
                {
                    id: '2',
                    name: 'Dấu xác nhận',
                    type: 'verification',
                    design: {
                        shape: 'rectangle',
                        size: 80,
                        color: '#0066CC',
                        borderWidth: 1,
                        text: {
                            main: 'ĐÃ XÁC NHẬN',
                            sub: '',
                            bottom: formatDate(new Date())
                        }
                    },
                    isActive: true
                }
            ]

            setStampTemplates(mockTemplates)
        } catch (error) {
            toast.error('Lỗi tải mẫu dấu')
        }
    }

    const handleStampDocument = (document) => {
        setStampingDocument(document)
        setStampingForm({
            templateId: '',
            position: { x: 100, y: 100 },
            size: 100,
            opacity: 0.8,
            text: '',
            date: new Date().toISOString().split('T')[0],
            officialNumber: document.code,
            note: ''
        })
        setShowStampModal(true)
    }

    const handleBulkStamp = () => {
        if (selectedDocuments.length === 0) {
            toast.error('Vui lòng chọn ít nhất một tài liệu')
            return
        }
        setShowBulkStampModal(true)
    }

    const performStamping = async (e) => {
        e.preventDefault()

        if (!stampingForm.templateId) {
            toast.error('Vui lòng chọn mẫu dấu')
            return
        }

        try {
            setStamping(true)
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 2000))

            toast.success('Đóng dấu tài liệu thành công')
            setShowStampModal(false)
            setShowBulkStampModal(false)
            setSelectedDocuments([])
            fetchDocuments()
        } catch (error) {
            toast.error('Lỗi đóng dấu tài liệu')
        } finally {
            setStamping(false)
        }
    }

    const handlePreviewDocument = (document) => {
        setPreviewDocument(document)
        setShowPreviewModal(true)
    }

    const handleCreateTemplate = async (e) => {
        e.preventDefault()

        try {
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 1000))

            toast.success('Tạo mẫu dấu thành công')
            setShowTemplateModal(false)
            setTemplateForm({
                name: '',
                type: 'official',
                design: {
                    shape: 'circle',
                    size: 100,
                    color: '#FF0000',
                    borderWidth: 2,
                    text: { main: '', sub: '', bottom: '' }
                },
                permissions: { allowedRoles: [], allowedUsers: [] }
            })
            fetchStampTemplates()
        } catch (error) {
            toast.error('Lỗi tạo mẫu dấu')
        }
    }

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending_stamp: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Chờ đóng dấu', icon: Clock },
            stamped: { bg: 'bg-green-100', text: 'text-green-800', label: 'Đã đóng dấu', icon: CheckCircle },
            rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Từ chối đóng dấu', icon: AlertCircle }
        }

        const config = statusConfig[status] || statusConfig.pending_stamp
        const Icon = config.icon

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                <Icon className="h-3 w-3 mr-1" />
                {config.label}
            </span>
        )
    }

    const formatFileSize = (bytes) => {
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        if (bytes === 0) return '0 Bytes'
        const i = Math.floor(Math.log(bytes) / Math.log(1024))
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
    }

    const StampPreview = ({ template, form }) => {
        if (!template) return null

        const design = template.design
        const isCircle = design.shape === 'circle'

        return (
            <div className="flex justify-center">
                <div
                    className={`relative border-2 flex items-center justify-center text-center ${
                        isCircle ? 'rounded-full' : 'rounded-lg'
                    }`}
                    style={{
                        width: `${form.size}px`,
                        height: `${form.size}px`,
                        borderColor: design.color,
                        borderWidth: `${design.borderWidth}px`,
                        color: design.color,
                        opacity: form.opacity
                    }}
                >
                    <div className="px-2">
                        {design.text.main && (
                            <div className="text-xs font-bold leading-tight">
                                {form.text || design.text.main}
                            </div>
                        )}
                        {design.text.sub && (
                            <div className="text-xs leading-tight mt-1">
                                {design.text.sub}
                            </div>
                        )}
                        {design.text.bottom && (
                            <div className="text-xs leading-tight mt-1">
                                {form.date || design.text.bottom}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )
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
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Đóng dấu tài liệu</h1>
                        <p className="text-gray-600 mt-1">Quản lý việc đóng dấu chính thức cho tài liệu</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => setShowTemplateModal(true)}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                            <Settings className="h-4 w-4 mr-2" />
                            Quản lý mẫu dấu
                        </button>
                        {selectedDocuments.length > 0 && (
                            <button
                                onClick={handleBulkStamp}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                            >
                                <Stamp className="h-4 w-4 mr-2" />
                                Đóng dấu hàng loạt ({selectedDocuments.length})
                            </button>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Tìm kiếm theo tên, mã tài liệu..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="pending_stamp">Chờ đóng dấu</option>
                            <option value="stamped">Đã đóng dấu</option>
                            <option value="rejected">Từ chối</option>
                        </select>
                    </div>
                </div>

                {/* Documents List */}
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">
                            Danh sách tài liệu ({totalItems})
                        </h3>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-600">Đang tải...</p>
                        </div>
                    ) : documents.length === 0 ? (
                        <div className="text-center py-12">
                            <Stamp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Không có tài liệu nào
                            </h3>
                            <p className="text-gray-500">
                                Không tìm thấy tài liệu phù hợp với bộ lọc hiện tại
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {documents.map(document => (
                                <div key={document.id} className="p-6 hover:bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedDocuments.includes(document.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedDocuments([...selectedDocuments, document.id])
                                                    } else {
                                                        setSelectedDocuments(selectedDocuments.filter(id => id !== document.id))
                                                    }
                                                }}
                                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <div className="p-2 bg-red-100 rounded-lg">
                                                <FileText className="h-5 w-5 text-red-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center space-x-3 mb-2">
                                                    <h4 className="text-sm font-medium text-gray-900">
                                                        {document.name}
                                                    </h4>
                                                    <span className="text-xs text-gray-500 font-mono">
                                                        ({document.code})
                                                    </span>
                                                    {getStatusBadge(document.status)}
                                                    {document.requiresOfficialStamp && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                                            Yêu cầu dấu chính thức
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                                    <span>Mã minh chứng: {document.evidenceCode}</span>
                                                    <span>•</span>
                                                    <span>{formatFileSize(document.fileSize)}</span>
                                                    <span>•</span>
                                                    <span>{document.pageCount} trang</span>
                                                    <span>•</span>
                                                    <span>Tạo bởi: {document.createdBy}</span>
                                                    <span>•</span>
                                                    <span>{formatDate(document.createdAt)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => handlePreviewDocument(document)}
                                                className="text-blue-600 hover:text-blue-800 p-2"
                                                title="Xem trước"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                            <button
                                                className="text-gray-600 hover:text-gray-800 p-2"
                                                title="Tải về"
                                            >
                                                <Download className="h-4 w-4" />
                                            </button>
                                            {document.status === 'pending_stamp' && (
                                                <button
                                                    onClick={() => handleStampDocument(document)}
                                                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700"
                                                >
                                                    <Stamp className="h-3 w-3 mr-1" />
                                                    Đóng dấu
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Stamp History */}
                                    {document.stampHistory.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <h5 className="text-sm font-medium text-gray-900 mb-2">Lịch sử đóng dấu:</h5>
                                            <div className="space-y-2">
                                                {document.stampHistory.map(stamp => (
                                                    <div key={stamp.id} className="flex items-center justify-between text-sm">
                                                        <div className="flex items-center space-x-2">
                                                            <Stamp className="h-3 w-3 text-red-500" />
                                                            <span>{stamp.templateName}</span>
                                                            <span className="text-gray-500">bởi {stamp.stampedBy}</span>
                                                        </div>
                                                        <span className="text-gray-400">
                                                            {formatDate(stamp.stampedAt, { format: 'datetime' })}
                                                        </span>
                                                    </div>
                                                ))}
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

                {/* Stamp Modal */}
                <Modal
                    isOpen={showStampModal}
                    onClose={() => setShowStampModal(false)}
                    title="Đóng dấu tài liệu"
                    size="large"
                >
                    {stampingDocument && (
                        <form onSubmit={performStamping} className="space-y-6">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-medium text-gray-900 mb-2">{stampingDocument.name}</h4>
                                <p className="text-sm text-gray-600">Mã: {stampingDocument.code}</p>
                                <p className="text-sm text-gray-600">Loại: {stampingDocument.type}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Mẫu dấu *
                                        </label>
                                        <select
                                            value={stampingForm.templateId}
                                            onChange={(e) => setStampingForm({ ...stampingForm, templateId: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        >
                                            <option value="">Chọn mẫu dấu</option>
                                            {stampTemplates.map(template => (
                                                <option key={template.id} value={template.id}>
                                                    {template.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Kích thước (px)
                                        </label>
                                        <input
                                            type="range"
                                            min="50"
                                            max="150"
                                            value={stampingForm.size}
                                            onChange={(e) => setStampingForm({ ...stampingForm, size: parseInt(e.target.value) })}
                                            className="w-full"
                                        />
                                        <div className="text-sm text-gray-500 mt-1">{stampingForm.size}px</div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Độ trong suốt
                                        </label>
                                        <input
                                            type="range"
                                            min="0.3"
                                            max="1"
                                            step="0.1"
                                            value={stampingForm.opacity}
                                            onChange={(e) => setStampingForm({ ...stampingForm, opacity: parseFloat(e.target.value) })}
                                            className="w-full"
                                        />
                                        <div className="text-sm text-gray-500 mt-1">{Math.round(stampingForm.opacity * 100)}%</div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Ngày
                                        </label>
                                        <input
                                            type="date"
                                            value={stampingForm.date}
                                            onChange={(e) => setStampingForm({ ...stampingForm, date: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Số hiệu
                                        </label>
                                        <input
                                            type="text"
                                            value={stampingForm.officialNumber}
                                            onChange={(e) => setStampingForm({ ...stampingForm, officialNumber: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Số hiệu công văn..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Ghi chú
                                        </label>
                                        <textarea
                                            value={stampingForm.note}
                                            onChange={(e) => setStampingForm({ ...stampingForm, note: e.target.value })}
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Ghi chú về việc đóng dấu..."
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Xem trước dấu
                                        </label>
                                        <div className="border border-gray-200 rounded-lg p-4 bg-white">
                                            <StampPreview
                                                template={stampTemplates.find(t => t.id === stampingForm.templateId)}
                                                form={stampingForm}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => setShowStampModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={stamping}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50"
                                >
                                    {stamping ? 'Đang đóng dấu...' : 'Đóng dấu'}
                                </button>
                            </div>
                        </form>
                    )}
                </Modal>

                {/* Bulk Stamp Modal */}
                <Modal
                    isOpen={showBulkStampModal}
                    onClose={() => setShowBulkStampModal(false)}
                    title="Đóng dấu hàng loạt"
                    size="large"
                >
                    <form onSubmit={performStamping} className="space-y-4">
                        <div className="bg-yellow-50 p-4 rounded-lg">
                            <div className="flex items-center">
                                <AlertCircle className="h-5 w-5 text-yellow-400 mr-2" />
                                <p className="text-sm text-yellow-700">
                                    Bạn đang đóng dấu cho {selectedDocuments.length} tài liệu cùng lúc.
                                </p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Mẫu dấu *
                            </label>
                            <select
                                value={stampingForm.templateId}
                                onChange={(e) => setStampingForm({ ...stampingForm, templateId: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="">Chọn mẫu dấu</option>
                                {stampTemplates.map(template => (
                                    <option key={template.id} value={template.id}>
                                        {template.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Ghi chú chung
                            </label>
                            <textarea
                                value={stampingForm.note}
                                onChange={(e) => setStampingForm({ ...stampingForm, note: e.target.value })}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Ghi chú cho việc đóng dấu hàng loạt..."
                            />
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                            <button
                                type="button"
                                onClick={() => setShowBulkStampModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                disabled={stamping}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50"
                            >
                                {stamping ? 'Đang đóng dấu...' : 'Đóng dấu hàng loạt'}
                            </button>
                        </div>
                    </form>
                </Modal>

                {/* Template Modal */}
                <Modal
                    isOpen={showTemplateModal}
                    onClose={() => setShowTemplateModal(false)}
                    title="Quản lý mẫu dấu"
                    size="large"
                >
                    <div className="space-y-6">
                        {/* Existing Templates */}
                        <div>
                            <h4 className="font-medium text-gray-900 mb-3">Mẫu dấu hiện có</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {stampTemplates.map(template => (
                                    <div key={template.id} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <h5 className="font-medium text-gray-900">{template.name}</h5>
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                template.isActive
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {template.isActive ? 'Hoạt động' : 'Vô hiệu'}
                                            </span>
                                        </div>
                                        <StampPreview template={template} form={{ size: 80, opacity: 1 }} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Create New Template */}
                        <div className="border-t pt-6">
                            <h4 className="font-medium text-gray-900 mb-3">Tạo mẫu dấu mới</h4>
                            <form onSubmit={handleCreateTemplate} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Tên mẫu dấu *
                                        </label>
                                        <input
                                            type="text"
                                            value={templateForm.name}
                                            onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="VD: Dấu chính thức VNUA"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Loại dấu
                                        </label>
                                        <select
                                            value={templateForm.type}
                                            onChange={(e) => setTemplateForm({ ...templateForm, type: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="official">Dấu chính thức</option>
                                            <option value="verification">Dấu xác nhận</option>
                                            <option value="approval">Dấu phê duyệt</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Hình dạng
                                        </label>
                                        <select
                                            value={templateForm.design.shape}
                                            onChange={(e) => setTemplateForm({
                                                ...templateForm,
                                                design: { ...templateForm.design, shape: e.target.value }
                                            })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="circle">Hình tròn</option>
                                            <option value="rectangle">Hình chữ nhật</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Màu sắc
                                        </label>
                                        <input
                                            type="color"
                                            value={templateForm.design.color}
                                            onChange={(e) => setTemplateForm({
                                                ...templateForm,
                                                design: { ...templateForm.design, color: e.target.value }
                                            })}
                                            className="w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Độ dày viền
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="5"
                                            value={templateForm.design.borderWidth}
                                            onChange={(e) => setTemplateForm({
                                                ...templateForm,
                                                design: { ...templateForm.design, borderWidth: parseInt(e.target.value) }
                                            })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nội dung chính
                                    </label>
                                    <input
                                        type="text"
                                        value={templateForm.design.text.main}
                                        onChange={(e) => setTemplateForm({
                                            ...templateForm,
                                            design: {
                                                ...templateForm.design,
                                                text: { ...templateForm.design.text, main: e.target.value }
                                            }
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="VD: ĐẠI HỌC NÔNG NGHIỆP HÀ NỘI"
                                    />
                                </div>

                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowTemplateModal(false)}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                    >
                                        Đóng
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                                    >
                                        Tạo mẫu dấu
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </Modal>

                {/* Preview Modal */}
                <Modal
                    isOpen={showPreviewModal}
                    onClose={() => setShowPreviewModal(false)}
                    title="Xem trước tài liệu"
                    size="large"
                >
                    {previewDocument && (
                        <div className="space-y-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-medium text-gray-900">{previewDocument.name}</h4>
                                <p className="text-sm text-gray-600">Mã: {previewDocument.code}</p>
                            </div>

                            <div className="bg-white border border-gray-200 rounded-lg p-8 min-h-96 flex items-center justify-center">
                                <div className="text-center text-gray-500">
                                    <FileText className="h-16 w-16 mx-auto mb-4" />
                                    <p>Xem trước tài liệu sẽ được hiển thị ở đây</p>
                                    <p className="text-sm mt-2">Tích hợp với PDF viewer hoặc image viewer</p>
                                </div>
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </Layout>
    )
}