// frontend/services/programApi.js
import api from './api'

export const programApi = {
    // Lấy danh sách chương trình
    getPrograms: (params = {}) => {
        const searchParams = new URLSearchParams()
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.append(key, value)
            }
        })
        return api.get(`/programs?${searchParams.toString()}`)
    },

    // Lấy chương trình theo ID
    getProgramById: (id) => {
        return api.get(`/programs/${id}`)
    },

    // Tạo chương trình mới
    createProgram: (data) => {
        return api.post('/programs', data)
    },

    // Cập nhật chương trình
    updateProgram: (id, data) => {
        return api.put(`/programs/${id}`, data)
    },

    // Xóa chương trình
    deleteProgram: (id) => {
        return api.delete(`/programs/${id}`)
    },

    // Lấy thống kê chương trình
    getProgramStatistics: (params = {}) => {
        const searchParams = new URLSearchParams()
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.append(key, value)
            }
        })
        return api.get(`/programs/statistics?${searchParams.toString()}`)
    }
}