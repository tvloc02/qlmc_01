import api from './api'

export const organizationApi = {
    // Lấy danh sách tổ chức
    getOrganizations: (params = {}) => {
        const searchParams = new URLSearchParams()
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.append(key, value)
            }
        })
        return api.get(`/organizations?${searchParams.toString()}`)
    },

    // Lấy tổ chức theo ID
    getOrganizationById: (id) => {
        return api.get(`/organizations/${id}`)
    },

    // Tạo tổ chức mới
    createOrganization: (data) => {
        return api.post('/organizations', data)
    },

    // Cập nhật tổ chức
    updateOrganization: (id, data) => {
        return api.put(`/organizations/${id}`, data)
    },

    // Xóa tổ chức
    deleteOrganization: (id) => {
        return api.delete(`/organizations/${id}`)
    },

    // Lấy thống kê tổ chức
    getOrganizationStatistics: (params = {}) => {
        const searchParams = new URLSearchParams()
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.append(key, value)
            }
        })
        return api.get(`/organizations/statistics?${searchParams.toString()}`)
    }
}