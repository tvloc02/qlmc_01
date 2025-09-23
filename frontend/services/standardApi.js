import api from './api'

export const standardApi = {
    getStandards: (params = {}) => {
        const searchParams = new URLSearchParams()
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.append(key, value)
            }
        })
        return api.get(`/standards?${searchParams.toString()}`)
    },

    // Lấy tiêu chuẩn theo program và organization
    getStandardsByProgramAndOrg: (programId, organizationId) => {
        return api.get(`/standards/by-program-org?programId=${programId}&organizationId=${organizationId}`)
    },

    // Lấy tiêu chuẩn theo ID
    getStandardById: (id) => {
        return api.get(`/standards/${id}`)
    },

    // Tạo tiêu chuẩn mới
    createStandard: (data) => {
        return api.post('/standards', data)
    },

    // Cập nhật tiêu chuẩn
    updateStandard: (id, data) => {
        return api.put(`/standards/${id}`, data)
    },

    // Xóa tiêu chuẩn
    deleteStandard: (id) => {
        return api.delete(`/standards/${id}`)
    },

    // Lấy thống kê tiêu chuẩn
    getStandardStatistics: (params = {}) => {
        const searchParams = new URLSearchParams()
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.append(key, value)
            }
        })
        return api.get(`/standards/statistics?${searchParams.toString()}`)
    }
}