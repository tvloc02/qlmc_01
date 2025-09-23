// frontend/pages/configuration/index.js
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/common/Layout'
import {
    Settings,
    Shield,
    Users,
    FileSignature,
    Database,
    Bell,
    Lock,
    Globe,
    Mail,
    Server,
    ChevronRight
} from 'lucide-react'
import Link from 'next/link'

export default function ConfigurationPage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login')
        }
    }, [user, isLoading, router])

    useEffect(() => {
        if (user && user.role !== 'admin') {
            router.replace('/dashboard')
        }
    }, [user, router])

    const breadcrumbItems = [
        { name: 'Cấu hình hệ thống', icon: Settings }
    ]

    const configurationSections = [
        {
            title: 'Phân quyền & Bảo mật',
            description: 'Quản lý quyền truy cập và bảo mật hệ thống',
            icon: Shield,
            items: [
                {
                    name: 'Phân quyền người dùng',
                    description: 'Quản lý quyền truy cập tiêu chuẩn và tiêu chí',
                    href: '/configuration/authorization',
                    icon: Lock
                },
                {
                    name: 'Nhóm người dùng',
                    description: 'Tạo và quản lý nhóm người dùng',
                    href: '/configuration/user-groups',
                    icon: Users
                },
                {
                    name: 'Cấu hình chữ ký',
                    description: 'Quản lý chứng chỉ và cấu hình chữ ký số',
                    href: '/configuration/signing-info',
                    icon: FileSignature
                }
            ]
        },
        {
            title: 'Dữ liệu đơn vị',
            description: 'Quản lý thông tin tổ chức và nhân sự',
            icon: Database,
            items: [
                {
                    name: 'Khoa/Viện',
                    description: 'Quản lý thông tin các khoa, viện',
                    href: '/unit-data/faculties',
                    icon: Database
                },
                {
                    name: 'Bộ môn/Ngành',
                    description: 'Quản lý thông tin bộ môn và ngành học',
                    href: '/unit-data/departments',
                    icon: Database
                },
                {
                    name: 'Nhân sự',
                    description: 'Quản lý thông tin giảng viên và nhân viên',
                    href: '/unit-data/personnel',
                    icon: Users
                }
            ]
        },
        {
            title: 'Hệ thống',
            description: 'Cấu hình chung của hệ thống',
            icon: Server,
            items: [
                {
                    name: 'Cấu hình email',
                    description: 'Cấu hình gửi email tự động',
                    href: '/configuration/email',
                    icon: Mail
                },
                {
                    name: 'Thông báo',
                    description: 'Cấu hình thông báo hệ thống',
                    href: '/configuration/notifications',
                    icon: Bell
                },
                {
                    name: 'Cài đặt chung',
                    description: 'Các cài đặt chung của hệ thống',
                    href: '/configuration/general',
                    icon: Globe
                }
            ]
        }
    ]

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    if (!user || user.role !== 'admin') {
        return null
    }

    return (
        <Layout
            title="Cấu hình hệ thống"
            breadcrumbItems={breadcrumbItems}
        >
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Cấu hình hệ thống</h1>
                    <p className="text-gray-600">Quản lý cấu hình và thiết lập hệ thống</p>
                </div>

                {/* Configuration Sections */}
                <div className="space-y-8">
                    {configurationSections.map((section, sectionIndex) => (
                        <div key={sectionIndex} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center mb-4">
                                <section.icon className="h-6 w-6 text-blue-600 mr-3" />
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
                                    <p className="text-sm text-gray-600">{section.description}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {section.items.map((item, itemIndex) => (
                                    <Link key={itemIndex} href={item.href}>
                                        <div className="group relative p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer">
                                            <div className="flex items-start">
                                                <div className="flex-shrink-0">
                                                    <item.icon className="h-6 w-6 text-gray-600 group-hover:text-blue-600" />
                                                </div>
                                                <div className="ml-3 flex-1">
                                                    <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                                                        {item.name}
                                                    </h3>
                                                    <p className="mt-1 text-sm text-gray-500">
                                                        {item.description}
                                                    </p>
                                                </div>
                                                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600" />
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Quick Actions */}
                <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
                    <h3 className="text-lg font-medium text-blue-900 mb-3">
                        Hướng dẫn cấu hình
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                        <div className="space-y-2">
                            <h4 className="font-medium">Bước 1: Thiết lập tổ chức</h4>
                            <ul className="space-y-1 text-xs">
                                <li>• Tạo và cấu hình thông tin khoa/viện</li>
                                <li>• Thêm bộ môn/ngành học</li>
                                <li>• Nhập danh sách nhân sự</li>
                            </ul>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-medium">Bước 2: Phân quyền</h4>
                            <ul className="space-y-1 text-xs">
                                <li>• Tạo nhóm người dùng theo vai trò</li>
                                <li>• Phân quyền truy cập tiêu chuẩn/tiêu chí</li>
                                <li>• Cấu hình chữ ký số</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    )
}