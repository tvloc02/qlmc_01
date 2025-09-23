import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/common/Layout'
import Modal from '../components/common/Modal'
import Pagination from '../components/common/Pagination'
import { formatDate, formatNumber } from '../utils/helpers'
import toast from 'react-hot-toast'
import {
    Search,
    Filter,
    Eye,
    Download,
    FileText,
    Calendar,
    User,
    Tag,
    Star,
    Bookmark,
    Clock,
    RefreshCw,
    SlidersHorizontal,
    ChevronDown,
    ChevronRight,
    Building,
    BookOpen,
    BarChart3
} from 'lucide-react'

export default function EvidenceLookupPage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()

    // Search state
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [loading, setLoading] = useState(false)
    const [searchHistory, setSearchHistory] = useState([])
    const [savedSearches, setSavedSearches] = useState([])

    // Advanced search state
    const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)
    const [advancedFilters, setAdvancedFilters] = useState({
        programId: '',
        organizationId: '',
        standardId: '',
        criteriaId: '',
        documentType: '',
        dateFrom: '',
        dateTo: '',
        tags: [],
        issuingAgency: '',
        status: ''
    })

    // Filter options
    const [filterOptions, setFilterOptions] = useState({
        programs: [],
        organizations: [],
        standards: [],
        criteria: [],
        documentTypes: [],
        tags: []
    })

    // Pagination
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)

    // Modal states
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [showSaveSearchModal, setShowSaveSearchModal] = useState(false)
    const [viewingEvidence, setViewingEvidence] = useState(null)
    const [saveSearchForm, setSaveSearchForm] = useState({ name: '', description: '' })

    // UI state
    const [viewMode, setViewMode] = useState('list') // list, grid, compact
    const [sortBy, setSortBy] = useState('relevance')
    const [sortOrder, setSortOrder] = useState('desc')

    const itemsPerPage = 12

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (user) {
            fetchFilterOptions()
            fetchSearchHistory()
            fetchSavedSearches()
        }
    }, [user])

    useEffect(() => {
        if (searchQuery) {
            const delayedSearch = setTimeout(() => {
                handleSearch()
            }, 500)
            return () => clearTimeout(delayedSearch)
        }
    }, [searchQuery, advancedFilters, currentPage, sortBy, sortOrder])

    const breadcrumbItems = [
        { name: 'Tra cứu minh chứng', icon: Search }
    ]

    const fetchFilterOptions = async () => {
        try {
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 500))

            const mockOptions = {
                programs: [
                    { id: '1', name: 'AUN-QA 2023', code: 'AUN23' },
                    { id: '2', name: 'MOET 2024', code: 'MOET24' }
                ],
                organizations: [
                    { id: '1', name: 'Đại học Nông nghiệp Hà Nội', code: 'VNUA' }
                ],
                standards: [
                    { id: '1', name: 'Chất lượng sinh viên đầu vào', code: 'H1' },
                    { id: '2', name: 'Chất lượng giảng viên', code: 'H2' }
                ],
                criteria: [
                    { id: '1', name: 'Kết quả học tập', code: '01' },
                    { id: '2', name: 'Hoạt động ngoại khóa', code: '02' }
                ],
                documentTypes: [
                    'Quyết định', 'Báo cáo', 'Kế hoạch', 'Thông báo', 'Biên bản'
                ],
                tags: [
                    { name: 'Quan trọng', count: 45 },
                    { name: 'Khẩn cấp', count: 23 },
                    { name: 'Đã duyệt', count: 156 }
                ]
            }

            setFilterOptions(mockOptions)
        } catch (error) {
            toast.error('Lỗi tải dữ liệu bộ lọc')
        }
    }

    const fetchSearchHistory = async () => {
        try {
            // Mock API call
            const mockHistory = [
                { keyword: 'báo cáo học tập', timestamp: new Date() },
                { keyword: 'quyết định tuyển sinh', timestamp: new Date() },
                { keyword: 'kế hoạch đào tạo', timestamp: new Date() }
            ]
            setSearchHistory(mockHistory)
        } catch (error) {
            console.error('Lỗi tải lịch sử tìm kiếm:', error)
        }
    }

    const fetchSavedSearches = async () => {
        try {
            // Mock API call
            const mockSaved = [
                { id: '1', name: 'Báo cáo chất lượng', keyword: 'báo cáo', filters: {} },
                { id: '2', name: 'Quyết định mới', keyword: 'quyết định', filters: {} }
            ]
            setSavedSearches(mockSaved)
        } catch (error) {
            console.error('Lỗi tải tìm kiếm đã lưu:', error)
        }
    }

    const handleSearch = async () => {
        if (!searchQuery && !hasAdvancedFilters()) {
            setSearchResults([])
            return
        }

        try {
            setLoading(true)
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 800))

            const mockResults = [
                {
                    id: '1',
                    code: 'H1.01.02.15',
                    name: 'Báo cáo kết quả học tập sinh viên K65',
                    description: 'Báo cáo tổng hợp kết quả học tập của sinh viên khóa 65 trong năm học 2023-2024',
                    standardName: 'Chất lượng sinh viên đầu vào',
                    criteriaName: 'Kết quả học tập',
                    documentType: 'Báo cáo',
                    issueDate: '2024-12-20T00:00:00Z',
                    issuingAgency: 'Phòng Đào tạo',
                    tags: ['Quan trọng', 'Đã duyệt'],
                    fileCount: 3,
                    downloadCount: 25,
                    createdBy: 'Nguyễn Văn A',
                    createdAt: '2024-12-25T10:30:00Z',
                    highlights: ['<mark>báo cáo</mark> kết quả <mark>học tập</mark>']
                },
                {
                    id: '2',
                    code: 'H1.01.02.16',
                    name: 'Danh sách sinh viên tốt nghiệp loại xuất sắc',
                    description: 'Danh sách chi tiết sinh viên tốt nghiệp loại xuất sắc năm 2024',
                    standardName: 'Chất lượng sinh viên đầu vào',
                    criteriaName: 'Kết quả học tập',
                    documentType: 'Danh sách',
                    issueDate: '2024-12-15T00:00:00Z',
                    issuingAgency: 'Phòng Đào tạo',
                    tags: ['Xuất sắc'],
                    fileCount: 1,
                    downloadCount: 18,
                    createdBy: 'Trần Thị B',
                    createdAt: '2024-12-24T09:15:00Z',
                    highlights: ['danh sách sinh viên']
                },
                {
                    id: '3',
                    code: 'H2.01.01.08',
                    name: 'Quyết định bổ nhiệm giảng viên',
                    description: 'Quyết định bổ nhiệm giảng viên chính thức năm 2024',
                    standardName: 'Chất lượng giảng viên',
                    criteriaName: 'Tuyển dụng và bổ nhiệm',
                    documentType: 'Quyết định',
                    issueDate: '2024-11-30T00:00:00Z',
                    issuingAgency: 'Ban Giám hiệu',
                    tags: ['Nhân sự'],
                    fileCount: 2,
                    downloadCount: 12,
                    createdBy: 'Lê Văn C',
                    createdAt: '2024-12-01T14:20:00Z',
                    highlights: ['<mark>quyết định</mark> bổ nhiệm']
                }
            ]

            setSearchResults(mockResults)
            setTotalItems(mockResults.length)
            setTotalPages(Math.ceil(mockResults.length / itemsPerPage))

            // Add to search history
            if (searchQuery && !searchHistory.some(h => h.keyword === searchQuery)) {
                setSearchHistory(prev => [{ keyword: searchQuery, timestamp: new Date() }, ...prev.slice(0, 4)])
            }

        } catch (error) {
            toast.error('Lỗi tìm kiếm minh chứng')
        } finally {
            setLoading(false)
        }
    }

    const hasAdvancedFilters = () => {
        return Object.values(advancedFilters).some(value =>
            Array.isArray(value) ? value.length > 0 : value !== ''
        )
    }

    const clearAllFilters = () => {
        setSearchQuery('')
        setAdvancedFilters({
            programId: '',
            organizationId: '',
            standardId: '',
            criteriaId: '',
            documentType: '',
            dateFrom: '',
            dateTo: '',
            tags: [],
            issuingAgency: '',
            status: ''
        })
        setSearchResults([])
    }

    const handleSaveSearch = async (e) => {
        e.preventDefault()
        try {
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 500))

            const newSavedSearch = {
                id: Date.now().toString(),
                name: saveSearchForm.name,
                keyword: searchQuery,
                filters: advancedFilters,
                savedAt: new Date()
            }

            setSavedSearches(prev => [newSavedSearch, ...prev])
            setShowSaveSearchModal(false)
            setSaveSearchForm({ name: '', description: '' })
            toast.success('Lưu tìm kiếm thành công')
        } catch (error) {
            toast.error('Lỗi lưu tìm kiếm')
        }
    }

    const handleViewEvidence = async (evidence) => {
        try {
            // Mock API call to get full details
            await new Promise(resolve => setTimeout(resolve, 300))

            const mockDetails = {
                ...evidence,
                fullDescription: evidence.description + ' - Chi tiết đầy đủ về minh chứng này...',
                files: [
                    { id: '1', name: 'bao-cao-chinh.pdf', size: 2048000, downloadCount: 15 },
                    { id: '2', name: 'phu-luc-so-lieu.xlsx', size: 1024000, downloadCount: 8 },
                    { id: '3', name: 'hinh-anh-minh-hoa.jpg', size: 512000, downloadCount: 3 }
                ],
                relatedEvidences: [
                    { id: '4', name: 'Báo cáo liên quan 1', code: 'H1.01.02.14' },
                    { id: '5', name: 'Báo cáo liên quan 2', code: 'H1.01.02.17' }
                ]
            }

            setViewingEvidence(mockDetails)
            setShowDetailModal(true)
        } catch (error) {
            toast.error('Lỗi tải chi tiết minh chứng')
        }
    }

    const formatFileSize = (bytes) => {
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        if (bytes === 0) return '0 Bytes'
        const i = Math.floor(Math.log(bytes) / Math.log(1024))
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
    }

    const EvidenceCard = ({ evidence, isCompact = false }) => (
        <div className={`bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow ${
            isCompact ? 'p-4' : 'p-6'
        }`}>
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className={`font-medium text-gray-900 line-clamp-2 ${
                            isCompact ? 'text-sm' : 'text-base'
                        }`}>
                            {evidence.name}
                        </h3>
                        <p className="text-xs text-gray-500 font-mono mt-1">{evidence.code}</p>
                    </div>
                </div>
                <button
                    onClick={() => handleViewEvidence(evidence)}
                    className="text-blue-600 hover:text-blue-800 p-1"
                    title="Xem chi tiết"
                >
                    <Eye className="h-4 w-4" />
                </button>
            </div>

            {!isCompact && evidence.highlights && (
                <div className="mb-3">
                    <div className="text-sm text-gray-600"
                         dangerouslySetInnerHTML={{ __html: evidence.highlights[0] }} />
                </div>
            )}

            <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                <span className="flex items-center">
                    <Building className="h-3 w-3 mr-1" />
                    {evidence.issuingAgency}
                </span>
                <span className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {formatDate(evidence.issueDate)}
                </span>
                <span className="flex items-center">
                    <Download className="h-3 w-3 mr-1" />
                    {evidence.downloadCount}
                </span>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {evidence.documentType}
                    </span>
                    <span className="text-xs text-gray-500">
                        {evidence.fileCount} file
                    </span>
                </div>
                <div className="flex items-center space-x-1">
                    {evidence.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {tag}
                        </span>
                    ))}
                </div>
            </div>
        </div>
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
                        <h1 className="text-2xl font-bold text-gray-900">Tra cứu minh chứng</h1>
                        <p className="text-gray-600 mt-1">Tìm kiếm và tra cứu minh chứng chất lượng</p>
                    </div>
                    {searchQuery && (
                        <button
                            onClick={() => setShowSaveSearchModal(true)}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                            <Bookmark className="h-4 w-4 mr-2" />
                            Lưu tìm kiếm
                        </button>
                    )}
                </div>

                {/* Search Bar */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm kiếm minh chứng theo tên, mã, nội dung..."
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                        />
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                                className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${
                                    showAdvancedSearch || hasAdvancedFilters()
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                                <SlidersHorizontal className="h-4 w-4 mr-1" />
                                Tìm kiếm nâng cao
                                {showAdvancedSearch ?
                                    <ChevronDown className="h-4 w-4 ml-1" /> :
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                }
                            </button>
                            {(searchQuery || hasAdvancedFilters()) && (
                                <button
                                    onClick={clearAllFilters}
                                    className="text-sm text-gray-500 hover:text-gray-700"
                                >
                                    Xóa tất cả bộ lọc
                                </button>
                            )}
                        </div>

                        <div className="flex items-center space-x-2">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="text-sm border border-gray-300 rounded px-2 py-1"
                            >
                                <option value="relevance">Độ liên quan</option>
                                <option value="date">Ngày tạo</option>
                                <option value="name">Tên A-Z</option>
                                <option value="downloads">Lượt tải</option>
                            </select>
                        </div>
                    </div>

                    {/* Advanced Search */}
                    {showAdvancedSearch && (
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Chương trình
                                    </label>
                                    <select
                                        value={advancedFilters.programId}
                                        onChange={(e) => setAdvancedFilters({...advancedFilters, programId: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                    >
                                        <option value="">Tất cả chương trình</option>
                                        {filterOptions.programs.map(program => (
                                            <option key={program.id} value={program.id}>{program.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tiêu chuẩn
                                    </label>
                                    <select
                                        value={advancedFilters.standardId}
                                        onChange={(e) => setAdvancedFilters({...advancedFilters, standardId: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                    >
                                        <option value="">Tất cả tiêu chuẩn</option>
                                        {filterOptions.standards.map(standard => (
                                            <option key={standard.id} value={standard.id}>{standard.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Loại tài liệu
                                    </label>
                                    <select
                                        value={advancedFilters.documentType}
                                        onChange={(e) => setAdvancedFilters({...advancedFilters, documentType: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                    >
                                        <option value="">Tất cả loại</option>
                                        {filterOptions.documentTypes.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Từ ngày
                                    </label>
                                    <input
                                        type="date"
                                        value={advancedFilters.dateFrom}
                                        onChange={(e) => setAdvancedFilters({...advancedFilters, dateFrom: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Đến ngày
                                    </label>
                                    <input
                                        type="date"
                                        value={advancedFilters.dateTo}
                                        onChange={(e) => setAdvancedFilters({...advancedFilters, dateTo: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Cơ quan ban hành
                                    </label>
                                    <input
                                        type="text"
                                        value={advancedFilters.issuingAgency}
                                        onChange={(e) => setAdvancedFilters({...advancedFilters, issuingAgency: e.target.value})}
                                        placeholder="Tên cơ quan..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Search History & Saved Searches */}
                {!searchQuery && !loading && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Search History */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                <Clock className="h-5 w-5 mr-2" />
                                Tìm kiếm gần đây
                            </h3>
                            {searchHistory.length === 0 ? (
                                <p className="text-gray-500 text-sm">Chưa có lịch sử tìm kiếm</p>
                            ) : (
                                <div className="space-y-2">
                                    {searchHistory.map((item, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setSearchQuery(item.keyword)}
                                            className="w-full text-left p-2 hover:bg-gray-50 rounded text-sm"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span>{item.keyword}</span>
                                                <span className="text-xs text-gray-400">
                                                    {formatDate(item.timestamp, { format: 'time' })}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Saved Searches */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                <Star className="h-5 w-5 mr-2" />
                                Tìm kiếm đã lưu
                            </h3>
                            {savedSearches.length === 0 ? (
                                <p className="text-gray-500 text-sm">Chưa có tìm kiếm đã lưu</p>
                            ) : (
                                <div className="space-y-2">
                                    {savedSearches.map(item => (
                                        <button
                                            key={item.id}
                                            onClick={() => {
                                                setSearchQuery(item.keyword)
                                                setAdvancedFilters(item.filters)
                                            }}
                                            className="w-full text-left p-2 hover:bg-gray-50 rounded text-sm"
                                        >
                                            <div className="font-medium">{item.name}</div>
                                            <div className="text-gray-500">{item.keyword}</div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Search Results */}
                {(searchQuery || hasAdvancedFilters()) && (
                    <div className="space-y-4">
                        {/* Results Header */}
                        <div className="flex items-center justify-between">
                            <div>
                                {loading ? (
                                    <div className="flex items-center">
                                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                                        <span className="text-gray-600">Đang tìm kiếm...</span>
                                    </div>
                                ) : (
                                    <p className="text-gray-600">
                                        Tìm thấy <strong>{formatNumber(totalItems)}</strong> kết quả
                                        {searchQuery && ` cho "${searchQuery}"`}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
                                >
                                    <BarChart3 className="h-4 w-4 rotate-90" />
                                </button>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
                                >
                                    <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
                                        <div className="bg-current w-1.5 h-1.5"></div>
                                        <div className="bg-current w-1.5 h-1.5"></div>
                                        <div className="bg-current w-1.5 h-1.5"></div>
                                        <div className="bg-current w-1.5 h-1.5"></div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Results */}
                        {loading ? (
                            <div className="bg-white rounded-lg shadow p-8 text-center">
                                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-gray-600">Đang tìm kiếm...</p>
                            </div>
                        ) : searchResults.length === 0 ? (
                            <div className="bg-white rounded-lg shadow p-8 text-center">
                                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    Không tìm thấy kết quả
                                </h3>
                                <p className="text-gray-500">
                                    Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc
                                </p>
                            </div>
                        ) : (
                            <div className={viewMode === 'grid'
                                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                                : 'space-y-4'
                            }>
                                {searchResults.map(evidence => (
                                    <EvidenceCard
                                        key={evidence.id}
                                        evidence={evidence}
                                        isCompact={viewMode === 'compact'}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
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
                )}

                {/* Evidence Detail Modal */}
                <Modal
                    isOpen={showDetailModal}
                    onClose={() => setShowDetailModal(false)}
                    title="Chi tiết minh chứng"
                    size="large"
                >
                    {viewingEvidence && (
                        <div className="space-y-6">
                            {/* Basic Info */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    {viewingEvidence.name}
                                </h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="font-medium text-gray-500">Mã minh chứng:</span>
                                        <p className="font-mono">{viewingEvidence.code}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-500">Loại tài liệu:</span>
                                        <p>{viewingEvidence.documentType}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-500">Ngày ban hành:</span>
                                        <p>{formatDate(viewingEvidence.issueDate)}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-500">Cơ quan ban hành:</span>
                                        <p>{viewingEvidence.issuingAgency}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <h4 className="font-medium text-gray-900 mb-2">Mô tả</h4>
                                <p className="text-sm text-gray-700">{viewingEvidence.fullDescription}</p>
                            </div>

                            {/* Tags */}
                            {viewingEvidence.tags.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Thẻ</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {viewingEvidence.tags.map(tag => (
                                            <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                <Tag className="h-3 w-3 mr-1" />
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Files */}
                            <div>
                                <h4 className="font-medium text-gray-900 mb-2">Files đính kèm</h4>
                                <div className="space-y-2">
                                    {viewingEvidence.files.map(file => (
                                        <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center space-x-3">
                                                <FileText className="h-5 w-5 text-gray-400" />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {formatFileSize(file.size)} • {file.downloadCount} lượt tải
                                                    </p>
                                                </div>
                                            </div>
                                            <button className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50">
                                                <Download className="h-3 w-3 mr-1" />
                                                Tải về
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Related Evidences */}
                            {viewingEvidence.relatedEvidences.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Minh chứng liên quan</h4>
                                    <div className="space-y-2">
                                        {viewingEvidence.relatedEvidences.map(related => (
                                            <button
                                                key={related.id}
                                                className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <FileText className="h-4 w-4 text-gray-400" />
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{related.name}</p>
                                                        <p className="text-xs text-gray-500 font-mono">{related.code}</p>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </Modal>

                {/* Save Search Modal */}
                <Modal
                    isOpen={showSaveSearchModal}
                    onClose={() => setShowSaveSearchModal(false)}
                    title="Lưu tìm kiếm"
                >
                    <form onSubmit={handleSaveSearch} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tên tìm kiếm *
                            </label>
                            <input
                                type="text"
                                value={saveSearchForm.name}
                                onChange={(e) => setSaveSearchForm({...saveSearchForm, name: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Đặt tên cho tìm kiếm này..."
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Mô tả
                            </label>
                            <textarea
                                value={saveSearchForm.description}
                                onChange={(e) => setSaveSearchForm({...saveSearchForm, description: e.target.value})}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Mô tả về tìm kiếm này..."
                            />
                        </div>

                        <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm font-medium text-gray-700 mb-1">Tìm kiếm sẽ lưu:</p>
                            <p className="text-sm text-gray-600">Từ khóa: "{searchQuery}"</p>
                            {hasAdvancedFilters() && (
                                <p className="text-sm text-gray-600">+ Bộ lọc nâng cao</p>
                            )}
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => setShowSaveSearchModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                            >
                                Lưu tìm kiếm
                            </button>
                        </div>
                    </form>
                </Modal>
            </div>
        </Layout>
    )
}