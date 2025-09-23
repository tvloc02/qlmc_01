
import { useState, useEffect } from 'react'
import {
    BarChart3,
    TrendingUp,
    FileText,
    Activity,
    Users,
    Building,
    Clock,
    CheckCircle,
    AlertCircle,
    XCircle,
    Archive
} from 'lucide-react'
import { standardApi } from '../../services/standardApi'

import { organizationApi } from '../../services/organizationApi'
import { toast } from 'react-hot-toast'

const StandardStatistics = () => {
    const [statistics, setStatistics] = useState(null)
    const [programs, setPrograms] = useState([])
    const [organizations, setOrganizations] = useState([])
    const [selectedProgram, setSelectedProgram] = useState('')
    const [selectedOrganization, setSelectedOrganization] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        fetchPrograms()
        fetchOrganizations()
        fetchStatistics()
    }, [])

    useEffect(() => {
        fetchStatistics()
    }, [selectedProgram, selectedOrganization])

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

    const fetchStatistics = async () => {
        try {
            setLoading(true)
            const params = {}
            if (selectedProgram) params.programId = selectedProgram
            if (selectedOrganization) params.organizationId = selectedOrganization

            const response = await standardApi.getStandardStatistics(params)
            setStatistics(response.data.data)
        } catch (error) {
            console.error('Error fetching statistics:', error)
            toast.error('Lỗi khi tải thống kê')
        } finally {
            setLoading(false)
        }
    }

    const getStatusIcon = (status) => {
        const icons = {
            draft: <FileText className="w-5 h-5" />,
            active: <CheckCircle className="w-5 h-5" />,
            inactive: <AlertCircle className="w-5 h-5" />,
            archived: <Archive className="w-5 h-5" />
        }
        return icons[status]
    }

    const getStatusColor = (status) => {
        const colors = {
            draft: 'text-gray-600 bg-gray-100',
            active: 'text-green-600 bg-green-100',
            inactive: 'text-yellow-600 bg-yellow-100',
            archived: 'text-red-600 bg-red-100'
        }
        return colors[status]
    }

    const getStatusLabel = (status) => {
        const labels = {
            draft: 'Bản nháp',
            active: 'Hoạt động',
            inactive: 'Tạm dừng',
            archived: 'Đã lưu trữ'
        }
        return labels[status]
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (loading && !statistics) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Lọc theo chương trình
                        </label>
                        <select
                            value={selectedProgram}
                            onChange={(e) => setSelectedProgram(e.target.value)}
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Lọc theo tổ chức
                        </label>
                        <select
                            value={selectedOrganization}
                            onChange={(e) => setSelectedOrganization(e.target.value)}
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
                </div>
            </div>

            {statistics && (
                <>
                    {/* Overview Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-lg border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Tổng tiêu chuẩn</p>
                                    <p className="text-2xl font-bold text-gray-900">{statistics.totalStandards}</p>
                                </div>
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <BarChart3 className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Hoạt động</p>
                                    <p className="text-2xl font-bold text-green-900">{statistics.statusStatistics.active}</p>
                                </div>
                                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Bản nháp</p>
                                    <p className="text-2xl font-bold text-gray-900">{statistics.statusStatistics.draft}</p>
                                </div>
                                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <FileText className="w-6 h-6 text-gray-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Trọng số TB</p>
                                    <p className="text-2xl font-bold text-purple-900">{statistics.averageWeight}%</p>
                                </div>
                                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <TrendingUp className="w-6 h-6 text-purple-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Status Distribution */}
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Phân bố trạng thái</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {Object.entries(statistics.statusStatistics).map(([status, count]) => (
                                <div key={status} className="text-center">
                                    <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3 ${getStatusColor(status)}`}>
                                        {getStatusIcon(status)}
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                                    <p className="text-sm text-gray-600">{getStatusLabel(status)}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Program Statistics */}
                    {statistics.programStatistics.length > 0 && (
                        <div className="bg-white p-6 rounded-lg border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Building className="w-5 h-5" />
                                Thống kê theo chương trình
                            </h3>
                            <div className="space-y-3">
                                {statistics.programStatistics.map((program) => (
                                    <div key={program._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <span className="font-medium text-gray-900">{program.name}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl font-bold text-blue-600">{program.count}</span>
                                            <span className="text-sm text-gray-600">tiêu chuẩn</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Organization Statistics */}
                    {statistics.organizationStatistics.length > 0 && (
                        <div className="bg-white p-6 rounded-lg border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                Thống kê theo tổ chức
                            </h3>
                            <div className="space-y-3">
                                {statistics.organizationStatistics.map((org) => (
                                    <div key={org._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <span className="font-medium text-gray-900">{org.name}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl font-bold text-green-600">{org.count}</span>
                                            <span className="text-sm text-gray-600">tiêu chuẩn</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recent Activities */}
                    {statistics.recentActivities.length > 0 && (
                        <div className="bg-white p-6 rounded-lg border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Activity className="w-5 h-5" />
                                Hoạt động gần đây
                            </h3>
                            <div className="space-y-3">
                                {statistics.recentActivities.map((activity) => (
                                    <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-3 h-3 rounded-full ${getStatusColor(activity.status).split(' ')[1]}`}></div>
                                                <h4 className="font-medium text-gray-900">
                                                    Tiêu chuẩn {activity.code}: {activity.name}
                                                </h4>
                                            </div>
                                            <div className="mt-1 text-sm text-gray-600">
                                                <span className="font-medium">{activity.program}</span>
                                                {activity.organization && (
                                                    <>
                                                        <span className="mx-2">•</span>
                                                        <span>{activity.organization}</span>
                                                    </>
                                                )}
                                            </div>
                                            <div className="mt-1 flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                            {formatDate(activity.lastActionAt)}
                        </span>
                                                <span>
                          {activity.lastAction === 'created' ? 'Tạo mới' : 'Cập nhật'} bởi {activity.lastActionBy}
                        </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

export default StandardStatistics