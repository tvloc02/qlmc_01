import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import {
    Database,
    Building,
    Users,
    User,
    BarChart3,
    TrendingUp,
    ChevronRight
} from 'lucide-react'
import Link from 'next/link'

export default function UnitDataPage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()
    const [statistics, setStatistics] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (user) {
            fetchStatistics()
        }
    }, [user])

    const breadcrumbItems = [
        { name: 'Dữ liệu đơn vị', icon: Database }
    ]

    const fetchStatistics = async () => {
        try {
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 1000))

            const mockStats = {
                faculties: {
                    total: 8,
                    active: 8,
                    personnel: 156
                },
                departments: {
                    total: 23,
                    active: 21,
                    personnel: 134
                },
                personnel: {
                    total: 156,
                    active: 152,
                    experts: 24,
                    professors: 12,
                    associateProfessors: 18,
                    lecturers: 98
                }
            }

            setStatistics(mockStats)
        } catch (error) {
            console.error('Error fetching statistics:', error)
        } finally {
            setLoading(false)
        }
    }

    const dataModules = [
        {
            title: 'Khoa/Viện',
            description: 'Quản lý thông tin các khoa, viện trong trường',
            icon: Building,
            href: '/unit-data/faculties',
            stats: statistics?.faculties,
            color: 'blue'
        },
        {
            title: 'Bộ môn/Ngành',
            description: 'Quản lý thông tin bộ môn và ngành học',
            icon: Database,
            href: '/unit-data/departments',
            stats: statistics?.departments,
            color: 'green'
        },
        {
            title: 'Nhân sự',
            description: 'Quản lý thông tin giảng viên và nhân viên',
            icon: Users,
            href: '/unit-data/personnel',
            stats: statistics?.personnel,
            color: 'purple'
        }
    ]

    const StatCard = ({ title, value, subValue, color }) => (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <p className="text-3xl font-bold text-gray-900">{value}</p>
                    {subValue && (
                        <p className="text-sm text-gray-500 mt-1">{subValue}</p>
                    )}
                </div>
                <div className={`p-3 rounded-full bg-${color}-100`}>
                    <TrendingUp className={`h-6 w-6 text-${color}-600`} />
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
            title="Dữ liệu đơn vị"
            breadcrumbItems={breadcrumbItems}
        >
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dữ liệu đơn vị</h1>
                    <p className="text-gray-600">Quản lý thông tin tổ chức, đơn vị và nhân sự</p>
                </div>

                {/* Statistics Overview */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
                                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                                <div className="h-8 bg-gray-200 rounded w-1/2 mb-1"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                            </div>
                        ))}
                    </div>
                ) : statistics && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard
                            title="Tổng số khoa/viện"
                            value={statistics.faculties.total}
                            subValue={`${statistics.faculties.active} đang hoạt động`}
                            color="blue"
                        />
                        <StatCard
                            title="Tổng số bộ môn/ngành"
                            value={statistics.departments.total}
                            subValue={`${statistics.departments.active} đang hoạt động`}
                            color="green"
                        />
                        <StatCard
                            title="Tổng số nhân sự"
                            value={statistics.personnel.total}
                            subValue={`${statistics.personnel.experts} chuyên gia`}
                            color="purple"
                        />
                    </div>
                )}

                {/* Data Modules */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {dataModules.map((module, index) => (
                        <Link key={index} href={module.href}>
                            <div className="group bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`p-3 rounded-lg bg-${module.color}-100`}>
                                        <module.icon className={`h-6 w-6 text-${module.color}-600`} />
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600" />
                                </div>

                                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 mb-2">
                                    {module.title}
                                </h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    {module.description}
                                </p>

                                {module.stats && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Tổng số:</span>
                                            <span className="font-medium">{module.stats.total}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Đang hoạt động:</span>
                                            <span className="font-medium text-green-600">{module.stats.active}</span>
                                        </div>
                                        {module.stats.personnel && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Nhân sự:</span>
                                                <span className="font-medium">{module.stats.personnel}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Quick Actions */}
                <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
                    <h3 className="text-lg font-medium text-blue-900 mb-3">
                        Hướng dẫn quản lý dữ liệu
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
                        <div className="space-y-2">
                            <h4 className="font-medium flex items-center">
                                <Building className="h-4 w-4 mr-1" />
                                Khoa/Viện
                            </h4>
                            <ul className="space-y-1 text-xs">
                                <li>• Tạo và quản lý thông tin khoa/viện</li>
                                <li>• Phân công trưởng khoa, phó khoa</li>
                                <li>• Thiết lập thông tin liên hệ</li>
                            </ul>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-medium flex items-center">
                                <Database className="h-4 w-4 mr-1" />
                                Bộ môn/Ngành
                            </h4>
                            <ul className="space-y-1 text-xs">
                                <li>• Quản lý bộ môn theo khoa</li>
                                <li>• Thiết lập ngành đào tạo</li>
                                <li>• Phân công trưởng bộ môn</li>
                            </ul>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-medium flex items-center">
                                <Users className="h-4 w-4 mr-1" />
                                Nhân sự
                            </h4>
                            <ul className="space-y-1 text-xs">
                                <li>• Quản lý thông tin giảng viên</li>
                                <li>• Thiết lập chuyên môn và trình độ</li>
                                <li>• Phân loại chuyên gia đánh giá</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Recent Activities */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Hoạt động gần đây</h3>
                    <div className="space-y-3">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <User className="h-4 w-4 text-green-600" />
                            </div>
                            <div className="ml-3 flex-1">
                                <p className="text-sm text-gray-900">
                                    Thêm mới nhân sự <span className="font-medium">Nguyễn Văn A</span>
                                </p>
                                <p className="text-xs text-gray-500">2 giờ trước</p>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <Building className="h-4 w-4 text-blue-600" />
                            </div>
                            <div className="ml-3 flex-1">
                                <p className="text-sm text-gray-900">
                                    Cập nhật thông tin <span className="font-medium">Khoa CNTT</span>
                                </p>
                                <p className="text-xs text-gray-500">1 ngày trước</p>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                                <Database className="h-4 w-4 text-yellow-600" />
                            </div>
                            <div className="ml-3 flex-1">
                                <p className="text-sm text-gray-900">
                                    Tạo bộ môn mới <span className="font-medium">Bộ môn Trí tuệ nhân tạo</span>
                                </p>
                                <p className="text-xs text-gray-500">3 ngày trước</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    )
}