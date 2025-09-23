import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/common/Layout'
import Modal from '../components/common/Modal'
import Pagination from '../components/common/Pagination'
import { formatDate, formatFileSize } from '../utils/helpers'
import toast from 'react-hot-toast'
import {
    FileText,
    Search,
    Filter,
    Eye,
    Download,
    Edit,
    FileSignature,
    CheckCircle,
    Clock,
    AlertCircle,
    X,
    Users,
    User,
    Calendar,
    ArrowRight,
    Settings,
    Plus,
    Trash2
} from 'lucide-react'

export default function EvidenceWorkflowPage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()

    const [evidences, setEvidences] = useState([])
    const [signingConfigs, setSigningConfigs] = useState([])
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedStatus, setSelectedStatus] = useState('draft')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)

    // Modal states
    const [showInitiateModal, setShowInitiateModal] = useState(false)
    const [showSignatureModal, setShowSignatureModal] = useState(false)
    const [showApprovalModal, setShowApprovalModal] = useState(false)
    const [selectedEvidence, setSelectedEvidence] = useState(null)

    // Form states
    const [initiateForm, setInitiateForm] = useState({
        signers: [{ userId: '', role: 'approver', order: 1 }],
        reason: ''
    })

    const [signatureForm, setSignatureForm] = useState({
        signaturePositions: {} // { fileId: [{ signerId, page, x, y, width, height }] }
    })

    const [approvalForm, setApprovalForm] = useState({
        signingInfoId: '',
        password: '',
        reason: '',
        decision: 'approve'
    })

    const [processing, setProcessing] = useState(false)
    const itemsPerPage = 10

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (user) {
            fetchEvidences()
            fetchSigningConfigs()
            fetchUsers()
        }
    }, [user, searchQuery, selectedStatus, currentPage])

    const breadcrumbItems = [
        { name: 'Quy trình trình ký minh chứng', icon: FileSignature }
    ]

    const fetchEvidences = async () => {
        try {
            setLoading(true)

            // Mock API call - replace with actual service
            await new Promise(resolve => setTimeout(resolve, 800))

            const mockEvidences = [
                {
                    id: '1',
                    code: 'H1.01.02.15',
                    name: 'Báo cáo kết quả học tập sinh viên K65',
                    status: 'draft', // draft, pending_approval, in_progress, completed, rejected
                    standardName: 'Chất lượng sinh viên đầu vào',
                    criteriaName: 'Kết quả học tập',
                    createdBy: { fullName: 'Nguyễn Văn A', position: 'Giảng viên' },
                    createdAt: '2024-12-25T10:30:00Z',
                    updatedAt: '2024-12-25T10:30:00Z',
                    files: [
                        {
                            id: '1',
                            originalName: 'bao-cao-hoc-tap.pdf',
                            size: 2048000,
                            mimeType: 'application/pdf'
                        }
                    ],
                    canInitiateSigning: true
                },
                {
                    id: '2',
                    code: 'H1.01.02.16',
                    name: 'Danh sách sinh viên tốt nghiệp loại xuất sắc',
                    status: 'pending_approval',
                    standardName: 'Chất lượng sinh viên đầu vào',
                    criteriaName: 'Kết quả học tập',
                    createdBy: { fullName: 'Trần Thị B', position: 'Trưởng bộ môn' },
                    createdAt: '2024-12-24T09:15:00Z',
                    updatedAt: '2024-12-25T15:20:00Z',
                    files: [
                        {
                            id: '2',
                            originalName: 'danh-sach-sv-xuat-sac.pdf',
                            size: 1024000,
                            mimeType: 'application/pdf'
                        }
                    ],
                    signingProcess: {
                        signers: [
                            {
                                userId: {
                                    _id: 'user1',
                                    fullName: 'Phạm Văn C',
                                    position: 'Phó Trưởng khoa'
                                },
                                order: 1,
                                status: 'pending',
                                role: 'approver'
                            }
                        ],
                        status: 'pending_signatures',
                        initiatedAt: '2024-12-25T15:20:00Z',
                        reason: 'Phê duyệt danh sách sinh viên xuất sắc học kỳ 1'
                    },
                    canUpdateSigning: true,
                    canCancelSigning: true,
                    requiresSignatureInsertion: true
                },
                {
                    id: '3',
                    code: 'H1.01.02.17',
                    name: 'Kế hoạch giảng dạy học kỳ 2',
                    status: 'in_progress',
                    standardName: 'Chương trình đào tạo',
                    criteriaName: 'Kế hoạch giảng dạy',
                    createdBy: { fullName: 'Lê Thị D', position: 'Giảng viên' },
                    createdAt: '2024-12-20T14:00:00Z',
                    updatedAt: '2024-12-24T11:30:00Z',
                    files: [
                        {
                            id: '3',
                            originalName: 'ke-hoach-giang-day.docx',
                            size: 1536000,
                            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                        }
                    ],
                    signingProcess: {
                        signers: [
                            {
                                userId: {
                                    _id: 'user2',
                                    fullName: 'Hoàng Văn E',
                                    position: 'Trưởng bộ môn'
                                },
                                order: 1,
                                status: 'signed',
                                role: 'reviewer',
                                signedAt: '2024-12-24T11:30:00Z'
                            },
                            {
                                userId: {
                                    _id: 'user3',
                                    fullName: 'Nguyễn Thị F',
                                    position: 'Trưởng khoa'
                                },
                                order: 2,
                                status: 'pending',
                                role: 'approver'
                            }
                        ],
                        status: 'signatures_inserted',
                        currentStep: 2
                    },
                    canUserSign: user?.id === 'user3' // Mock: current user can sign
                },
                {
                    id: '4',
                    code: 'H1.01.02.18',
                    name: 'Báo cáo đánh giá chất lượng giảng dạy',
                    status: 'completed',
                    standardName: 'Đảm bảo chất lượng',
                    criteriaName: 'Đánh giá giảng dạy',
                    createdBy: { fullName: 'Vũ Văn G', position: 'Phó Hiệu trưởng' },
                    createdAt: '2024-12-15T08:00:00Z',
                    completedAt: '2024-12-23T16:45:00Z',
                    files: [
                        {
                            id: '4',
                            originalName: 'bao-cao-danh-gia.pdf',
                            size: 3072000,
                            mimeType: 'application/pdf'
                        }
                    ],
                    signingProcess: {
                        signers: [
                            {
                                userId: {
                                    _id: 'user4',
                                    fullName: 'Trần Văn H',
                                    position: 'Hiệu trưởng'
                                },
                                order: 1,
                                status: 'signed',
                                role: 'approver',
                                signedAt: '2024-12-23T16:45:00Z'
                            }
                        ],
                        status: 'completed'
                    }
                },
                {
                    id: '5',
                    code: 'H1.01.02.19',
                    name: 'Đề cương môn học Toán cao cấp',
                    status: 'rejected',
                    standardName: 'Chương trình đào tạo',
                    criteriaName: 'Đề cương môn học',
                    createdBy: { fullName: 'Phạm Thị I', position: 'Giảng viên' },
                    createdAt: '2024-12-22T10:15:00Z',
                    rejectedAt: '2024-12-24T09:20:00Z',
                    files: [
                        {
                            id: '5',
                            originalName: 'de-cuong-toan-cao-cap.pdf',
                            size: 1280000,
                            mimeType: 'application/pdf'
                        }
                    ],
                    signingProcess: {
                        signers: [
                            {
                                userId: {
                                    _id: 'user5',
                                    fullName: 'Lê Văn J',
                                    position: 'Trưởng bộ môn'
                                },
                                order: 1,
                                status: 'rejected',
                                role: 'reviewer',
                                signedAt: '2024-12-24T09:20:00Z'
                            }
                        ],
                        status: 'rejected'
                    },
                    rejectionReason: 'Cần bổ sung thêm tài liệu tham khảo và điều chỉnh phương pháp đánh giá'
                }
            ]

            // Apply filters
            let filteredEvidences = mockEvidences
            if (selectedStatus) {
                filteredEvidences = mockEvidences.filter(evidence => evidence.status === selectedStatus)
            }
            if (searchQuery) {
                filteredEvidences = filteredEvidences.filter(evidence =>
                    evidence.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    evidence.code.toLowerCase().includes(searchQuery.toLowerCase())
                )
            }

            setEvidences(filteredEvidences)
            setTotalPages(Math.ceil(filteredEvidences.length / itemsPerPage))
            setTotalItems(filteredEvidences.length)

        } catch (error) {
            toast.error('Lỗi tải danh sách minh chứng')
        } finally {
            setLoading(false)
        }
    }

    const fetchSigningConfigs = async () => {
        try {
            await new Promise(resolve => setTimeout(resolve, 300))

            const mockConfigs = [
                {
                    id: '1',
                    name: 'Chữ ký điện tử Trưởng phòng',
                    signerName: 'Nguyễn Văn X',
                    validTo: '2025-12-31T23:59:59Z'
                },
                {
                    id: '2',
                    name: 'Chữ ký điện tử Phó Hiệu trưởng',
                    signerName: 'Trần Thị Y',
                    validTo: '2025-12-31T23:59:59Z'
                }
            ]

            setSigningConfigs(mockConfigs)
        } catch (error) {
            toast.error('Lỗi tải cấu hình ký số')
        }
    }

    const fetchUsers = async () => {
        try {
            await new Promise(resolve => setTimeout(resolve, 300))

            const mockUsers = [
                { id: 'user1', fullName: 'Phạm Văn C', position: 'Phó Trưởng khoa' },
                { id: 'user2', fullName: 'Hoàng Văn E', position: 'Trưởng bộ môn' },
                { id: 'user3', fullName: 'Nguyễn Thị F', position: 'Trưởng khoa' },
                { id: 'user4', fullName: 'Trần Văn H', position: 'Hiệu trưởng' },
                { id: 'user5', fullName: 'Lê Văn J', position: 'Trưởng bộ môn' }
            ]

            setUsers(mockUsers)
        } catch (error) {
            toast.error('Lỗi tải danh sách người dùng')
        }
    }

    // Khởi tạo trình ký
    const handleInitiateSigning = (evidence) => {
        setSelectedEvidence(evidence)
        setInitiateForm({
            signers: [{ userId: '', role: 'approver', order: 1 }],
            reason: ''
        })
        setShowInitiateModal(true)
    }

    const addSigner = () => {
        setInitiateForm({
            ...initiateForm,
            signers: [
                ...initiateForm.signers,
                { userId: '', role: 'approver', order: initiateForm.signers.length + 1 }
            ]
        })
    }

    const removeSigner = (index) => {
        const newSigners = initiateForm.signers.filter((_, i) => i !== index)
        setInitiateForm({
            ...initiateForm,
            signers: newSigners.map((signer, i) => ({ ...signer, order: i + 1 }))
        })
    }

    const updateSigner = (index, field, value) => {
        const newSigners = [...initiateForm.signers]
        newSigners[index] = { ...newSigners[index], [field]: value }
        setInitiateForm({ ...initiateForm, signers: newSigners })
    }

    const submitInitiateSigning = async (e) => {
        e.preventDefault()

        if (initiateForm.signers.some(s => !s.userId)) {
            toast.error('Vui lòng chọn tất cả người ký')
            return
        }

        try {
            setProcessing(true)
            await new Promise(resolve => setTimeout(resolve, 2000))

            toast.success('Khởi tạo trình ký thành công')
            setShowInitiateModal(false)
            fetchEvidences()

            // Check if needs signature insertion
            const hasPdf = selectedEvidence.files.some(f => f.mimeType === 'application/pdf')
            if (hasPdf) {
                setShowSignatureModal(true)
            }

        } catch (error) {
            toast.error('Lỗi khởi tạo trình ký')
        } finally {
            setProcessing(false)
        }
    }

    // Chèn chữ ký cho PDF
    const handleInsertSignatures = (evidence) => {
        setSelectedEvidence(evidence)
        setSignatureForm({ signaturePositions: {} })
        setShowSignatureModal(true)
    }

    const submitSignatureInsertion = async (e) => {
        e.preventDefault()

        try {
            setProcessing(true)
            await new Promise(resolve => setTimeout(resolve, 1500))

            toast.success('Chèn chữ ký thành công. Minh chứng đã sẵn sàng để ký duyệt.')
            setShowSignatureModal(false)
            fetchEvidences()

        } catch (error) {
            toast.error('Lỗi chèn chữ ký')
        } finally {
            setProcessing(false)
        }
    }

    // Ký duyệt
    const handleApproval = (evidence) => {
        setSelectedEvidence(evidence)
        setApprovalForm({
            signingInfoId: '',
            password: '',
            reason: '',
            decision: 'approve'
        })
        setShowApprovalModal(true)
    }

    const submitApproval = async (e) => {
        e.preventDefault()

        if (approvalForm.decision === 'approve' && !approvalForm.signingInfoId) {
            toast.error('Vui lòng chọn cấu hình chữ ký số')
            return
        }

        try {
            setProcessing(true)
            await new Promise(resolve => setTimeout(resolve, 2000))

            const message = approvalForm.decision === 'approve' ? 'Ký duyệt thành công' : 'Từ chối thành công'
            toast.success(message)
            setShowApprovalModal(false)
            fetchEvidences()

        } catch (error) {
            toast.error('Lỗi xử lý ký duyệt')
        } finally {
            setProcessing(false)
        }
    }

    // Hủy trình ký
    const handleCancelSigning = async (evidence) => {
        if (!confirm('Bạn có chắc chắn muốn hủy trình ký minh chứng này?')) return

        try {
            await new Promise(resolve => setTimeout(resolve, 1000))
            toast.success('Hủy trình ký thành công')
            fetchEvidences()
        } catch (error) {
            toast.error('Lỗi hủy trình ký')
        }
    }

    const getStatusBadge = (status) => {
        const statusConfig = {
            draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Chưa trình ký', icon: Edit },
            pending_approval: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Chờ ký duyệt', icon: Clock },
            in_progress: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Đang ký duyệt', icon: FileSignature },
            completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Hoàn thành', icon: CheckCircle },
            rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Từ chối', icon: X }
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

    const getSigningProgress = (signingProcess) => {
        if (!signingProcess) return null

        const totalSigners = signingProcess.signers.length
        const signedCount = signingProcess.signers.filter(s => s.status === 'signed').length

        return (
            <div className="flex items-center space-x-2 text-xs text-gray-500">
                <Users className="h-3 w-3" />
                <span>Đã ký: {signedCount}/{totalSigners}</span>
                <div className="w-16 bg-gray-200 rounded-full h-1">
                    <div
                        className="bg-blue-600 h-1 rounded-full"
                        style={{ width: `${(signedCount / totalSigners) * 100}%` }}
                    ></div>
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
            title="Quy trình trình ký minh chứng"
            breadcrumbItems={breadcrumbItems}
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Quy trình trình ký minh chứng</h1>
                        <p className="text-gray-600 mt-1">Quản lý quy trình trình ký và phê duyệt minh chứng</p>
                    </div>
                </div>

                {/* Status Tabs */}
                <div className="bg-white rounded-lg shadow">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8 px-6">
                            {[
                                { key: 'draft', label: 'Chưa trình ký', icon: Edit },
                                { key: 'pending_approval', label: 'Chờ ký duyệt', icon: Clock },
                                { key: 'in_progress', label: 'Đang ký duyệt', icon: FileSignature },
                                { key: 'completed', label: 'Hoàn thành', icon: CheckCircle },
                                { key: 'rejected', label: 'Từ chối', icon: X }
                            ].map(status => {
                                const Icon = status.icon
                                return (
                                    <button
                                        key={status.key}
                                        onClick={() => setSelectedStatus(status.key)}
                                        className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 ${
                                            selectedStatus === status.key
                                                ? 'border-blue-500 text-blue-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        <Icon className="h-4 w-4" />
                                        <span>{status.label}</span>
                                    </button>
                                )
                            })}
                        </nav>
                    </div>

                    {/* Filters */}
                    <div className="p-6 border-b border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Tìm kiếm theo tên, mã minh chứng..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Evidence List */}
                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-600">Đang tải...</p>
                        </div>
                    ) : evidences.length === 0 ? (
                        <div className="text-center py-12">
                            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Không có minh chứng nào
                            </h3>
                            <p className="text-gray-500">
                                Không tìm thấy minh chứng nào ở trạng thái này
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {evidences.map(evidence => (
                                <div key={evidence.id} className="p-6 hover:bg-gray-50">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-3 mb-2">
                                                <h4 className="text-lg font-medium text-gray-900">
                                                    {evidence.name}
                                                </h4>
                                                <span className="text-sm text-gray-500 font-mono">
                                                    {evidence.code}
                                                </span>
                                                {getStatusBadge(evidence.status)}
                                            </div>

                                            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                                                <span>{evidence.standardName}</span>
                                                <span>•</span>
                                                <span>{evidence.criteriaName}</span>
                                                <span>•</span>
                                                <span>{evidence.files.length} file</span>
                                                <span>•</span>
                                                <div className="flex items-center space-x-1">
                                                    <User className="h-3 w-3" />
                                                    <span>{evidence.createdBy.fullName}</span>
                                                </div>
                                            </div>

                                            {/* Signing Progress */}
                                            {evidence.signingProcess && (
                                                <div className="mb-3">
                                                    {getSigningProgress(evidence.signingProcess)}

                                                    {/* Signers List */}
                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        {evidence.signingProcess.signers.map((signer, index) => (
                                                            <div
                                                                key={index}
                                                                className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                                                                    signer.status === 'signed'
                                                                        ? 'bg-green-100 text-green-800'
                                                                        : signer.status === 'rejected'
                                                                            ? 'bg-red-100 text-red-800'
                                                                            : 'bg-gray-100 text-gray-800'
                                                                }`}
                                                            >
                                                                <span className="font-medium">{signer.order}.</span>
                                                                <span className="ml-1">{signer.userId.fullName}</span>
                                                                <span className="ml-1 text-xs opacity-75">({signer.role})</span>
                                                                {signer.status === 'signed' && <CheckCircle className="h-3 w-3 ml-1" />}
                                                                {signer.status === 'rejected' && <X className="h-3 w-3 ml-1" />}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Rejection Reason */}
                                            {evidence.status === 'rejected' && evidence.rejectionReason && (
                                                <div className="mb-3 p-3 bg-red-50 rounded-lg">
                                                    <div className="flex items-start space-x-2">
                                                        <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                                                        <div>
                                                            <p className="text-sm font-medium text-red-800">Lý do từ chối:</p>
                                                            <p className="text-sm text-red-700 mt-1">{evidence.rejectionReason}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Files */}
                                            <div className="space-y-1">
                                                {evidence.files.map(file => (
                                                    <div key={file.id} className="flex items-center justify-between py-1">
                                                        <div className="flex items-center space-x-2">
                                                            <FileText className="h-4 w-4 text-gray-400" />
                                                            <span className="text-sm text-gray-600">{file.originalName}</span>
                                                            <span className="text-xs text-gray-400">({formatFileSize(file.size)})</span>
                                                        </div>
                                                        <button className="text-blue-600 hover:text-blue-800 text-sm">
                                                            <Download className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="mt-3 flex items-center space-x-4 text-xs text-gray-500">
                                                <div className="flex items-center space-x-1">
                                                    <Calendar className="h-3 w-3" />
                                                    <span>Tạo: {formatDate(evidence.createdAt)}</span>
                                                </div>
                                                <span>Cập nhật: {formatDate(evidence.updatedAt)}</span>
                                                {evidence.completedAt && (
                                                    <span>Hoàn thành: {formatDate(evidence.completedAt)}</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center space-x-2 ml-4">
                                            {evidence.status === 'draft' && evidence.canInitiateSigning && (
                                                <button
                                                    onClick={() => handleInitiateSigning(evidence)}
                                                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded text-white bg-blue-600 hover:bg-blue-700"
                                                >
                                                    <FileSignature className="h-4 w-4 mr-1" />
                                                    Trình ký
                                                </button>
                                            )}

                                            {evidence.status === 'pending_approval' && evidence.requiresSignatureInsertion && (
                                                <button
                                                    onClick={() => handleInsertSignatures(evidence)}
                                                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded text-white bg-purple-600 hover:bg-purple-700"
                                                >
                                                    <Settings className="h-4 w-4 mr-1" />
                                                    Chèn chữ ký
                                                </button>
                                            )}

                                            {evidence.canUserSign && (
                                                <button
                                                    onClick={() => handleApproval(evidence)}
                                                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded text-white bg-green-600 hover:bg-green-700"
                                                >
                                                    <CheckCircle className="h-4 w-4 mr-1" />
                                                    Ký duyệt
                                                </button>
                                            )}

                                            {evidence.canCancelSigning && (
                                                <button
                                                    onClick={() => handleCancelSigning(evidence)}
                                                    className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                                                >
                                                    <X className="h-4 w-4 mr-1" />
                                                    Hủy
                                                </button>
                                            )}

                                            <button className="text-gray-600 hover:text-gray-800 p-1">
                                                <Eye className="h-4 w-4" />
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

                {/* Initiate Signing Modal */}
                <Modal
                    isOpen={showInitiateModal}
                    onClose={() => setShowInitiateModal(false)}
                    title="Khởi tạo trình ký minh chứng"
                    size="large"
                >
                    {selectedEvidence && (
                        <form onSubmit={submitInitiateSigning} className="space-y-6">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-medium text-gray-900 mb-2">{selectedEvidence.name}</h4>
                                <p className="text-sm text-gray-600">Mã: {selectedEvidence.code}</p>
                                <p className="text-sm text-gray-600">Số file: {selectedEvidence.files.length}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Người ký duyệt *
                                </label>
                                <div className="space-y-3">
                                    {initiateForm.signers.map((signer, index) => (
                                        <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                                            <span className="text-sm font-medium text-gray-500 w-8">
                                                {signer.order}.
                                            </span>
                                            <select
                                                value={signer.userId}
                                                onChange={(e) => updateSigner(index, 'userId', e.target.value)}
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                required
                                            >
                                                <option value="">Chọn người ký</option>
                                                {users.map(user => (
                                                    <option key={user.id} value={user.id}>
                                                        {user.fullName} - {user.position}
                                                    </option>
                                                ))}
                                            </select>
                                            <select
                                                value={signer.role}
                                                onChange={(e) => updateSigner(index, 'role', e.target.value)}
                                                className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="reviewer">Người duyệt</option>
                                                <option value="approver">Người phê duyệt</option>
                                            </select>
                                            {initiateForm.signers.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeSigner(index)}
                                                    className="text-red-600 hover:text-red-800 p-1"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <button
                                    type="button"
                                    onClick={addSigner}
                                    className="mt-3 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Thêm người ký
                                </button>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Lý do trình ký
                                </label>
                                <textarea
                                    value={initiateForm.reason}
                                    onChange={(e) => setInitiateForm({ ...initiateForm, reason: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Nhập lý do trình ký minh chứng..."
                                />
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowInitiateModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {processing ? 'Đang xử lý...' : 'Khởi tạo trình ký'}
                                </button>
                            </div>
                        </form>
                    )}
                </Modal>

                {/* Signature Insertion Modal */}
                <Modal
                    isOpen={showSignatureModal}
                    onClose={() => setShowSignatureModal(false)}
                    title="Chèn ảnh chữ ký vào PDF"
                    size="large"
                >
                    {selectedEvidence && (
                        <form onSubmit={submitSignatureInsertion} className="space-y-6">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <div className="flex items-start space-x-2">
                                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                                    <div>
                                        <h4 className="font-medium text-blue-900">Chèn ảnh chữ ký</h4>
                                        <p className="text-sm text-blue-700 mt-1">
                                            Bước này chỉ áp dụng cho file PDF. Bạn có thể chèn sẵn vị trí chữ ký cho tất cả người ký.
                                            Chữ ký chỉ có hiệu lực khi người ký xác nhận ký.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* PDF Preview and Signature Positioning would go here */}
                            <div className="border border-gray-200 rounded-lg p-6 text-center">
                                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600">PDF Viewer và công cụ chèn chữ ký sẽ được tích hợp ở đây</p>
                                <p className="text-sm text-gray-500 mt-2">
                                    Sẽ sử dụng thư viện như PDF.js hoặc tương tự để hiển thị PDF và cho phép kéo thả vị trí chữ ký
                                </p>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowSignatureModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Bỏ qua
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 disabled:opacity-50"
                                >
                                    {processing ? 'Đang xử lý...' : 'Hoàn tất chèn chữ ký'}
                                </button>
                            </div>
                        </form>
                    )}
                </Modal>

                {/* Approval Modal */}
                <Modal
                    isOpen={showApprovalModal}
                    onClose={() => setShowApprovalModal(false)}
                    title="Ký duyệt minh chứng"
                    size="large"
                >
                    {selectedEvidence && (
                        <form onSubmit={submitApproval} className="space-y-6">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-medium text-gray-900 mb-2">{selectedEvidence.name}</h4>
                                <p className="text-sm text-gray-600">Mã: {selectedEvidence.code}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Quyết định *
                                </label>
                                <div className="space-y-2">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="decision"
                                            value="approve"
                                            checked={approvalForm.decision === 'approve'}
                                            onChange={(e) => setApprovalForm({ ...approvalForm, decision: e.target.value })}
                                            className="mr-2"
                                        />
                                        <span className="text-sm text-gray-900">Phê duyệt</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="decision"
                                            value="reject"
                                            checked={approvalForm.decision === 'reject'}
                                            onChange={(e) => setApprovalForm({ ...approvalForm, decision: e.target.value })}
                                            className="mr-2"
                                        />
                                        <span className="text-sm text-gray-900">Từ chối</span>
                                    </label>
                                </div>
                            </div>

                            {approvalForm.decision === 'approve' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Cấu hình chữ ký số *
                                        </label>
                                        <select
                                            value={approvalForm.signingInfoId}
                                            onChange={(e) => setApprovalForm({ ...approvalForm, signingInfoId: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        >
                                            <option value="">Chọn cấu hình chữ ký số</option>
                                            {signingConfigs.map(config => (
                                                <option key={config.id} value={config.id}>
                                                    {config.name} - {config.signerName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Mật khẩu chữ ký số *
                                        </label>
                                        <input
                                            type="password"
                                            value={approvalForm.password}
                                            onChange={(e) => setApprovalForm({ ...approvalForm, password: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                </>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {approvalForm.decision === 'approve' ? 'Ghi chú phê duyệt' : 'Lý do từ chối *'}
                                </label>
                                <textarea
                                    value={approvalForm.reason}
                                    onChange={(e) => setApprovalForm({ ...approvalForm, reason: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder={approvalForm.decision === 'approve' ? 'Ghi chú về việc phê duyệt...' : 'Nhập lý do từ chối...'}
                                    required={approvalForm.decision === 'reject'}
                                />
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowApprovalModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md disabled:opacity-50 ${
                                        approvalForm.decision === 'approve'
                                            ? 'bg-green-600 hover:bg-green-700'
                                            : 'bg-red-600 hover:bg-red-700'
                                    }`}
                                >
                                    {processing
                                        ? 'Đang xử lý...'
                                        : approvalForm.decision === 'approve'
                                            ? 'Phê duyệt'
                                            : 'Từ chối'
                                    }
                                </button>
                            </div>
                        </form>
                    )}
                </Modal>
            </div>
        </Layout>
    )
}