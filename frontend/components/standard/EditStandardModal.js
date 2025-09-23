import { useState, useEffect } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { standardApi } from '../../services/standardApi'
import { toast } from 'react-hot-toast'

const EditStandardModal = ({ isOpen, onClose, onSuccess, standard, programs, organizations }) => {
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        programId: '',
        organizationId: '',
        order: 1,
        weight: '',
        objectives: '',
        guidelines: '',
        evaluationCriteria: [],
        status: 'draft'
    })

    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState({})

    useEffect(() => {
        if (isOpen && standard) {
            setFormData({
                name: standard.name || '',
                code: standard.code || '',
                description: standard.description || '',
                programId: standard.programId?._id || standard.programId || '',
                organizationId: standard.organizationId?._id || standard.organizationId || '',
                order: standard.order || 1,
                weight: standard.weight || '',
                objectives: standard.objectives || '',
                guidelines: standard.guidelines || '',
                evaluationCriteria: standard.evaluationCriteria || [],
                status: standard.status || 'draft'
            })
            setErrors({})
        }
    }, [isOpen, standard])

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }))
        }
    }

    const addEvaluationCriteria = () => {
        setFormData(prev => ({
            ...prev,
            evaluationCriteria: [
                ...prev.evaluationCriteria,
                { name: '', description: '', weight: '' }
            ]
        }))
    }

    const updateEvaluationCriteria = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            evaluationCriteria: prev.evaluationCriteria.map((criteria, i) =>
                i === index ? { ...criteria, [field]: value } : criteria
            )
        }))
    }

    const removeEvaluationCriteria = (index) => {
        setFormData(prev => ({
            ...prev,
            evaluationCriteria: prev.evaluationCriteria.filter((_, i) => i !== index)
        }))
    }

    const validateForm = () => {
        const newErrors = {}

        if (!formData.name.trim()) {
            newErrors.name = 'Tên tiêu chuẩn là bắt buộc'
        } else if (formData.name.length > 500) {
            newErrors.name = 'Tên tiêu chuẩn không được quá 500 ký tự'
        }

        if (!formData.code.trim()) {
            newErrors.code = 'Mã tiêu chuẩn là bắt buộc'
        } else if (!/^\d{1,2}$/.test(formData.code)) {
            newErrors.code = 'Mã tiêu chuẩn phải là 1-2 chữ số'
        }

        if (formData.description && formData.description.length > 3000) {
            newErrors.description = 'Mô tả không được quá 3000 ký tự'
        }

        if (formData.weight && (formData.weight < 0 || formData.weight > 100)) {
            newErrors.weight = 'Trọng số phải từ 0-100'
        }

        if (formData.objectives && formData.objectives.length > 2000) {
            newErrors.objectives = 'Mục tiêu không được quá 2000 ký tự'
        }

        if (formData.guidelines && formData.guidelines.length > 3000) {
            newErrors.guidelines = 'Hướng dẫn không được quá 3000 ký tự'
        }

        if (formData.order && formData.order < 1) {
            newErrors.order = 'Thứ tự phải lớn hơn 0'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        try {
            setLoading(true)

            const submitData = {
                ...formData,
                order: parseInt(formData.order) || 1,
                weight: formData.weight ? parseFloat(formData.weight) : undefined,
                evaluationCriteria: formData.evaluationCriteria.map(criteria => ({
                    ...criteria,
                    weight: criteria.weight ? parseFloat(criteria.weight) : undefined
                }))
            }

            await standardApi.updateStandard(standard._id, submitData)
            toast.success('Cập nhật tiêu chuẩn thành công')
            onSuccess()
        } catch (error) {
            console.error('Update standard error:', error)
            const message = error.response?.data?.message || 'Lỗi khi cập nhật tiêu chuẩn'
            toast.error(message)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen || !standard) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Chỉnh sửa Tiêu chuẩn
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tên tiêu chuẩn <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                    errors.name ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Nhập tên tiêu chuẩn..."
                            />
                            {errors.name && (
                                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Mã tiêu chuẩn <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="code"
                                value={formData.code}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                    errors.code ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="VD: 1, 01, 12"
                            />
                            {errors.code && (
                                <p className="text-red-500 text-sm mt-1">{errors.code}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Chương trình đánh giá
                            </label>
                            <select
                                name="programId"
                                value={formData.programId}
                                onChange={handleChange}
                                disabled // Không cho phép thay đổi program khi edit
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                            >
                                <option value="">Chọn chương trình</option>
                                {programs.map(program => (
                                    <option key={program._id} value={program._id}>
                                        {program.name}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                Không thể thay đổi chương trình khi chỉnh sửa
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tổ chức - Cấp đánh giá
                            </label>
                            <select
                                name="organizationId"
                                value={formData.organizationId}
                                onChange={handleChange}
                                disabled // Không cho phép thay đổi organization khi edit
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                            >
                                <option value="">Chọn tổ chức</option>
                                {organizations.map(org => (
                                    <option key={org._id} value={org._id}>
                                        {org.name}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                Không thể thay đổi tổ chức khi chỉnh sửa
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Trạng thái
                            </label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="draft">Bản nháp</option>
                                <option value="active">Hoạt động</option>
                                <option value="inactive">Tạm dừng</option>
                                <option value="archived">Đã lưu trữ</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Mô tả
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={3}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                errors.description ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Mô tả chi tiết về tiêu chuẩn..."
                        />
                        {errors.description && (
                            <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Thứ tự
                            </label>
                            <input
                                type="number"
                                name="order"
                                value={formData.order}
                                onChange={handleChange}
                                min="1"
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                    errors.order ? 'border-red-500' : 'border-gray-300'
                                }`}
                            />
                            {errors.order && (
                                <p className="text-red-500 text-sm mt-1">{errors.order}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Trọng số (%)
                            </label>
                            <input
                                type="number"
                                name="weight"
                                value={formData.weight}
                                onChange={handleChange}
                                min="0"
                                max="100"
                                step="0.1"
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                    errors.weight ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="VD: 20.5"
                            />
                            {errors.weight && (
                                <p className="text-red-500 text-sm mt-1">{errors.weight}</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Mục tiêu
                        </label>
                        <textarea
                            name="objectives"
                            value={formData.objectives}
                            onChange={handleChange}
                            rows={3}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                errors.objectives ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Mục tiêu của tiêu chuẩn..."
                        />
                        {errors.objectives && (
                            <p className="text-red-500 text-sm mt-1">{errors.objectives}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Hướng dẫn
                        </label>
                        <textarea
                            name="guidelines"
                            value={formData.guidelines}
                            onChange={handleChange}
                            rows={3}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                errors.guidelines ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Hướng dẫn thực hiện tiêu chuẩn..."
                        />
                        {errors.guidelines && (
                            <p className="text-red-500 text-sm mt-1">{errors.guidelines}</p>
                        )}
                    </div>

                    {/* Evaluation Criteria */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <label className="block text-sm font-medium text-gray-700">
                                Tiêu chí đánh giá
                            </label>
                            <button
                                type="button"
                                onClick={addEvaluationCriteria}
                                className="flex items-center gap-2 px-3 py-1 text-sm text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
                            >
                                <Plus className="w-4 h-4" />
                                Thêm tiêu chí
                            </button>
                        </div>

                        {formData.evaluationCriteria.map((criteria, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-medium text-gray-700">
                                        Tiêu chí {index + 1}
                                    </h4>
                                    <button
                                        type="button"
                                        onClick={() => removeEvaluationCriteria(index)}
                                        className="p-1 text-red-400 hover:text-red-600"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="md:col-span-2">
                                        <input
                                            type="text"
                                            placeholder="Tên tiêu chí"
                                            value={criteria.name}
                                            onChange={(e) => updateEvaluationCriteria(index, 'name', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <input
                                            type="number"
                                            placeholder="Trọng số (%)"
                                            value={criteria.weight}
                                            onChange={(e) => updateEvaluationCriteria(index, 'weight', e.target.value)}
                                            min="0"
                                            max="100"
                                            step="0.1"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="mt-3">
                  <textarea
                      placeholder="Mô tả tiêu chí"
                      value={criteria.description}
                      onChange={(e) => updateEvaluationCriteria(index, 'description', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                                </div>
                            </div>
                        ))}

                        {formData.evaluationCriteria.length === 0 && (
                            <p className="text-gray-500 text-sm italic">
                                Chưa có tiêu chí đánh giá nào. Nhấn "Thêm tiêu chí" để thêm mới.
                            </p>
                        )}
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Đang cập nhật...' : 'Cập nhật tiêu chuẩn'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default EditStandardModal