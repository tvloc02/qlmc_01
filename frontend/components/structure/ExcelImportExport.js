
import { useState, useRef } from 'react'
import { X, Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, Info } from 'lucide-react'
import * as XLSX from 'xlsx'
import { standardApi } from '../../services/standardApi'
import { toast } from 'react-hot-toast'

const ExcelImportExport = ({ isOpen, onClose, onSuccess, programs, organizations }) => {
    const [activeTab, setActiveTab] = useState('import')
    const [importFile, setImportFile] = useState(null)
    const [importData, setImportData] = useState([])
    const [importResults, setImportResults] = useState(null)
    const [processing, setProcessing] = useState(false)
    const [selectedProgram, setSelectedProgram] = useState('')
    const [selectedOrganization, setSelectedOrganization] = useState('')
    const fileInputRef = useRef()

    const handleFileSelect = (event) => {
        const file = event.target.files[0]
        if (file) {
            setImportFile(file)
            parseExcelFile(file)
        }
    }

    const parseExcelFile = (file) => {
        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result)
                const workbook = XLSX.read(data, { type: 'array' })
                const sheetName = workbook.SheetNames[0]
                const worksheet = workbook.Sheets[sheetName]

                // Convert to JSON with header row
                const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                    header: 1,
                    defval: '',
                    raw: false
                })

                if (jsonData.length < 2) {
                    toast.error('File Excel phải có ít nhất 1 dòng dữ liệu')
                    return
                }

                // Parse headers and data
                const headers = jsonData[0]
                const dataRows = jsonData.slice(1).filter(row =>
                    row.some(cell => cell && cell.toString().trim() !== '')
                )

                const parsedData = dataRows.map((row, index) => {
                    const item = {}
                    headers.forEach((header, i) => {
                        const key = mapHeaderToField(header)
                        if (key) {
                            item[key] = row[i] || ''
                        }
                    })
                    item._rowIndex = index + 2 // +2 because of header and 0-based index
                    return item
                })

                setImportData(parsedData)
                console.log('Parsed data:', parsedData)
            } catch (error) {
                console.error('Parse error:', error)
                toast.error('Lỗi khi đọc file Excel')
            }
        }
        reader.readAsArrayBuffer(file)
    }

    const mapHeaderToField = (header) => {
        const headerMap = {
            'Mã tiêu chuẩn': 'code',
            'Code': 'code',
            'Mã': 'code',
            'Tên tiêu chuẩn': 'name',
            'Name': 'name',
            'Tên': 'name',
            'Mô tả': 'description',
            'Description': 'description',
            'Thứ tự': 'order',
            'Order': 'order',
            'STT': 'order',
            'Trọng số': 'weight',
            'Weight': 'weight',
            'Mục tiêu': 'objectives',
            'Objectives': 'objectives',
            'Hướng dẫn': 'guidelines',
            'Guidelines': 'guidelines',
            'Trạng thái': 'status',
            'Status': 'status'
        }

        return headerMap[header] || null
    }

    const validateImportData = () => {
        const results = {
            valid: [],
            invalid: [],
            duplicates: []
        }

        const seenCodes = new Set()

        importData.forEach((item, index) => {
            const errors = []

            // Validate required fields
            if (!item.code || !item.code.trim()) {
                errors.push('Thiếu mã tiêu chuẩn')
            } else if (!/^\d{1,2}$/.test(item.code.trim())) {
                errors.push('Mã tiêu chuẩn phải là 1-2 chữ số')
            }

            if (!item.name || !item.name.trim()) {
                errors.push('Thiếu tên tiêu chuẩn')
            } else if (item.name.length > 500) {
                errors.push('Tên tiêu chuẩn quá dài (>500 ký tự)')
            }

            // Validate optional fields
            if (item.description && item.description.length > 3000) {
                errors.push('Mô tả quá dài (>3000 ký tự)')
            }

            if (item.order && (isNaN(item.order) || parseInt(item.order) < 1)) {
                errors.push('Thứ tự phải là số nguyên dương')
            }

            if (item.weight && (isNaN(item.weight) || parseFloat(item.weight) < 0 || parseFloat(item.weight) > 100)) {
                errors.push('Trọng số phải từ 0-100')
            }

            if (item.objectives && item.objectives.length > 2000) {
                errors.push('Mục tiêu quá dài (>2000 ký tự)')
            }

            if (item.guidelines && item.guidelines.length > 3000) {
                errors.push('Hướng dẫn quá dài (>3000 ký tự)')
            }

            if (item.status && !['draft', 'active', 'inactive', 'archived'].includes(item.status)) {
                errors.push('Trạng thái không hợp lệ')
            }

            // Check for duplicates
            if (item.code && seenCodes.has(item.code.trim())) {
                results.duplicates.push({
                    ...item,
                    _rowIndex: item._rowIndex,
                    _index: index,
                    error: `Mã tiêu chuẩn "${item.code}" bị trùng lặp`
                })
            } else if (item.code) {
                seenCodes.add(item.code.trim())
            }

            if (errors.length > 0) {
                results.invalid.push({
                    ...item,
                    _rowIndex: item._rowIndex,
                    _index: index,
                    errors
                })
            } else {
                results.valid.push({
                    ...item,
                    _index: index
                })
            }
        })

        return results
    }

    const handleImport = async () => {
        if (!selectedProgram || !selectedOrganization) {
            toast.error('Vui lòng chọn chương trình và tổ chức')
            return
        }

        if (importData.length === 0) {
            toast.error('Không có dữ liệu để import')
            return
        }

        const validation = validateImportData()

        if (validation.invalid.length > 0 || validation.duplicates.length > 0) {
            setImportResults({
                ...validation,
                summary: {
                    total: importData.length,
                    valid: validation.valid.length,
                    invalid: validation.invalid.length,
                    duplicates: validation.duplicates.length
                }
            })
            return
        }

        try {
            setProcessing(true)
            let successCount = 0
            let errorCount = 0
            const errors = []

            // Process valid data
            for (const item of validation.valid) {
                try {
                    const standardData = {
                        name: item.name.trim(),
                        code: item.code.toString().padStart(2, '0'),
                        description: item.description?.trim() || '',
                        programId: selectedProgram,
                        organizationId: selectedOrganization,
                        order: parseInt(item.order) || 1,
                        weight: item.weight ? parseFloat(item.weight) : undefined,
                        objectives: item.objectives?.trim() || '',
                        guidelines: item.guidelines?.trim() || '',
                        status: item.status || 'draft',
                        evaluationCriteria: []
                    }

                    await standardApi.createStandard(standardData)
                    successCount++
                } catch (error) {
                    errorCount++
                    errors.push({
                        row: item._rowIndex,
                        code: item.code,
                        name: item.name,
                        error: error.response?.data?.message || 'Lỗi không xác định'
                    })
                }
            }

            setImportResults({
                ...validation,
                processResults: {
                    successCount,
                    errorCount,
                    errors
                },
                summary: {
                    total: importData.length,
                    valid: validation.valid.length,
                    invalid: validation.invalid.length,
                    duplicates: validation.duplicates.length,
                    processed: successCount + errorCount,
                    success: successCount,
                    failed: errorCount
                }
            })

            if (successCount > 0) {
                toast.success(`Import thành công ${successCount} tiêu chuẩn`)
                if (successCount === validation.valid.length) {
                    onSuccess()
                }
            }

            if (errorCount > 0) {
                toast.error(`Có ${errorCount} tiêu chuẩn không thể import`)
            }

        } catch (error) {
            console.error('Import error:', error)
            toast.error('Lỗi khi import dữ liệu')
        } finally {
            setProcessing(false)
        }
    }

    const handleExport = async () => {
        if (!selectedProgram || !selectedOrganization) {
            toast.error('Vui lòng chọn chương trình và tổ chức để xuất dữ liệu')
            return
        }

        try {
            setProcessing(true)

            // Get standards data
            const response = await standardApi.getStandardsByProgramAndOrg(selectedProgram, selectedOrganization)
            const standards = response.data.data || []

            // Prepare data for export
            const exportData = standards.map(standard => ({
                'Mã tiêu chuẩn': standard.code,
                'Tên tiêu chuẩn': standard.name,
                'Mô tả': standard.description || '',
                'Thứ tự': standard.order,
                'Trọng số': standard.weight || '',
                'Mục tiêu': standard.objectives || '',
                'Hướng dẫn': standard.guidelines || '',
                'Trạng thái': standard.status
            }))

            // Create workbook
            const wb = XLSX.utils.book_new()
            const ws = XLSX.utils.json_to_sheet(exportData)

            // Auto-size columns
            const colWidths = [
                { wch: 15 }, // Mã tiêu chuẩn
                { wch: 50 }, // Tên tiêu chuẩn
                { wch: 50 }, // Mô tả
                { wch: 10 }, // Thứ tự
                { wch: 12 }, // Trọng số
                { wch: 50 }, // Mục tiêu
                { wch: 50 }, // Hướng dẫn
                { wch: 15 }  // Trạng thái
            ]
            ws['!cols'] = colWidths

            XLSX.utils.book_append_sheet(wb, ws, 'Tiêu chuẩn')

            // Generate filename
            const program = programs.find(p => p._id === selectedProgram)
            const organization = organizations.find(o => o._id === selectedOrganization)
            const filename = `Tieu_chuan_${program?.code || 'Program'}_${organization?.code || 'Org'}_${new Date().toISOString().split('T')[0]}.xlsx`

            // Save file
            XLSX.writeFile(wb, filename)

            toast.success(`Đã xuất ${standards.length} tiêu chuẩn`)
        } catch (error) {
            console.error('Export error:', error)
            toast.error('Lỗi khi xuất file Excel')
        } finally {
            setProcessing(false)
        }
    }

    const downloadTemplate = () => {
        const templateData = [
            {
                'Mã tiêu chuẩn': '1',
                'Tên tiêu chuẩn': 'Mục tiêu và chuẩn đầu ra của chương trình đào tạo',
                'Mô tả': 'Tiêu chuẩn về mục tiêu và chuẩn đầu ra',
                'Thứ tự': '1',
                'Trọng số': '20',
                'Mục tiêu': 'Đảm bảo chất lượng mục tiêu đào tạo',
                'Hướng dẫn': 'Hướng dẫn thực hiện tiêu chuẩn',
                'Trạng thái': 'active'
            },
            {
                'Mã tiêu chuẩn': '2',
                'Tên tiêu chuẩn': 'Bản mô tả chương trình đào tạo',
                'Mô tả': 'Tiêu chuẩn về bản mô tả chương trình',
                'Thứ tự': '2',
                'Trọng số': '15',
                'Mục tiêu': 'Đảm bảo chất lượng mô tả chương trình',
                'Hướng dẫn': 'Hướng dẫn mô tả chương trình đào tạo',
                'Trạng thái': 'active'
            }
        ]

        const wb = XLSX.utils.book_new()
        const ws = XLSX.utils.json_to_sheet(templateData)

        // Auto-size columns
        const colWidths = [
            { wch: 15 }, { wch: 50 }, { wch: 50 }, { wch: 10 },
            { wch: 12 }, { wch: 50 }, { wch: 50 }, { wch: 15 }
        ]
        ws['!cols'] = colWidths

        XLSX.utils.book_append_sheet(wb, ws, 'Template')
        XLSX.writeFile(wb, 'Template_Tieu_chuan.xlsx')

        toast.success('Đã tải template mẫu')
    }

    const resetImport = () => {
        setImportFile(null)
        setImportData([])
        setImportResults(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Import/Export Excel - Tiêu chuẩn
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex">
                        <button
                            onClick={() => setActiveTab('import')}
                            className={`py-2 px-4 border-b-2 font-medium text-sm ${
                                activeTab === 'import'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <Upload className="w-4 h-4 inline-block mr-2" />
                            Import từ Excel
                        </button>
                        <button
                            onClick={() => setActiveTab('export')}
                            className={`py-2 px-4 border-b-2 font-medium text-sm ${
                                activeTab === 'export'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <Download className="w-4 h-4 inline-block mr-2" />
                            Export ra Excel
                        </button>
                    </nav>
                </div>

                <div className="p-6">
                    {/* Program and Organization Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Chương trình <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={selectedProgram}
                                onChange={(e) => setSelectedProgram(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Chọn chương trình</option>
                                {programs.map(program => (
                                    <option key={program._id} value={program._id}>
                                        {program.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tổ chức <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={selectedOrganization}
                                onChange={(e) => setSelectedOrganization(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Chọn tổ chức</option>
                                {organizations.map(org => (
                                    <option key={org._id} value={org._id}>
                                        {org.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {activeTab === 'import' && (
                        <div className="space-y-6">
                            {/* Template Download */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                                    <div className="flex-1">
                                        <h3 className="font-medium text-blue-900">Template Excel</h3>
                                        <p className="text-blue-700 text-sm mt-1">
                                            Tải template mẫu để chuẩn bị dữ liệu import đúng định dạng
                                        </p>
                                        <button
                                            onClick={downloadTemplate}
                                            className="mt-2 flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                        >
                                            <Download className="w-4 h-4" />
                                            Tải Template
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* File Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Chọn file Excel
                                </label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                                    <div className="text-center">
                                        <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".xlsx,.xls"
                                            onChange={handleFileSelect}
                                            className="hidden"
                                            id="excel-upload"
                                        />
                                        <label
                                            htmlFor="excel-upload"
                                            className="cursor-pointer flex flex-col items-center"
                                        >
                      <span className="text-blue-600 font-medium">
                        Nhấn để chọn file Excel
                      </span>
                                            <span className="text-gray-500 text-sm mt-1">
                        Hỗ trợ file .xlsx, .xls
                      </span>
                                        </label>

                                        {importFile && (
                                            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                                <p className="text-sm font-medium text-gray-700">
                                                    File đã chọn: {importFile.name}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    Kích thước: {(importFile.size / 1024).toFixed(1)} KB
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    Dòng dữ liệu: {importData.length}
                                                </p>
                                                <button
                                                    onClick={resetImport}
                                                    className="mt-2 text-sm text-red-600 hover:text-red-800"
                                                >
                                                    Chọn file khác
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Import Results */}
                            {importResults && (
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h3 className="font-medium text-gray-900 mb-4">Kết quả kiểm tra</h3>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                        <div className="bg-white p-3 rounded border">
                                            <div className="text-2xl font-bold text-gray-900">{importResults.summary.total}</div>
                                            <div className="text-sm text-gray-600">Tổng cộng</div>
                                        </div>
                                        <div className="bg-white p-3 rounded border">
                                            <div className="text-2xl font-bold text-green-600">{importResults.summary.valid}</div>
                                            <div className="text-sm text-gray-600">Hợp lệ</div>
                                        </div>
                                        <div className="bg-white p-3 rounded border">
                                            <div className="text-2xl font-bold text-red-600">{importResults.summary.invalid}</div>
                                            <div className="text-sm text-gray-600">Lỗi</div>
                                        </div>
                                        <div className="bg-white p-3 rounded border">
                                            <div className="text-2xl font-bold text-yellow-600">{importResults.summary.duplicates}</div>
                                            <div className="text-sm text-gray-600">Trùng lặp</div>
                                        </div>
                                    </div>

                                    {/* Show errors */}
                                    {(importResults.invalid.length > 0 || importResults.duplicates.length > 0) && (
                                        <div className="space-y-4">
                                            {importResults.invalid.length > 0 && (
                                                <div>
                                                    <h4 className="font-medium text-red-900 mb-2">Dòng có lỗi:</h4>
                                                    <div className="max-h-40 overflow-y-auto">
                                                        {importResults.invalid.map((item, index) => (
                                                            <div key={index} className="text-sm p-2 bg-red-50 border border-red-200 rounded mb-2">
                                                                <div className="font-medium">Dòng {item._rowIndex}: {item.name || item.code}</div>
                                                                <ul className="list-disc list-inside text-red-700 mt-1">
                                                                    {item.errors.map((error, i) => (
                                                                        <li key={i}>{error}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {importResults.duplicates.length > 0 && (
                                                <div>
                                                    <h4 className="font-medium text-yellow-900 mb-2">Dòng trùng lặp:</h4>
                                                    <div className="max-h-40 overflow-y-auto">
                                                        {importResults.duplicates.map((item, index) => (
                                                            <div key={index} className="text-sm p-2 bg-yellow-50 border border-yellow-200 rounded mb-2">
                                                                <div className="font-medium">Dòng {item._rowIndex}: {item.error}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Process results */}
                                    {importResults.processResults && (
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <h4 className="font-medium text-gray-900 mb-2">Kết quả xử lý:</h4>
                                            <div className="grid grid-cols-2 gap-4 mb-4">
                                                <div className="bg-green-50 p-3 rounded border">
                                                    <div className="text-lg font-bold text-green-600">{importResults.processResults.successCount}</div>
                                                    <div className="text-sm text-gray-600">Thành công</div>
                                                </div>
                                                <div className="bg-red-50 p-3 rounded border">
                                                    <div className="text-lg font-bold text-red-600">{importResults.processResults.errorCount}</div>
                                                    <div className="text-sm text-gray-600">Thất bại</div>
                                                </div>
                                            </div>

                                            {importResults.processResults.errors.length > 0 && (
                                                <div>
                                                    <h5 className="font-medium text-red-900 mb-2">Lỗi khi xử lý:</h5>
                                                    <div className="max-h-40 overflow-y-auto">
                                                        {importResults.processResults.errors.map((error, index) => (
                                                            <div key={index} className="text-sm p-2 bg-red-50 border border-red-200 rounded mb-2">
                                                                <div className="font-medium">Dòng {error.row}: {error.name} ({error.code})</div>
                                                                <div className="text-red-700">{error.error}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Import Actions */}
                            <div className="flex justify-end gap-4">
                                <button
                                    onClick={resetImport}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                    disabled={processing}
                                >
                                    Reset
                                </button>
                                <button
                                    onClick={handleImport}
                                    disabled={!importFile || importData.length === 0 || processing || !selectedProgram || !selectedOrganization}
                                    className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {processing ? 'Đang xử lý...' : 'Import dữ liệu'}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'export' && (
                        <div className="space-y-6">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                                    <div>
                                        <h3 className="font-medium text-blue-900">Xuất dữ liệu</h3>
                                        <p className="text-blue-700 text-sm mt-1">
                                            Xuất danh sách tiêu chuẩn theo chương trình và tổ chức đã chọn ra file Excel
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-4">
                                <button
                                    onClick={handleExport}
                                    disabled={processing || !selectedProgram || !selectedOrganization}
                                    className="flex items-center gap-2 px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
                                >
                                    <Download className="w-4 h-4" />
                                    {processing ? 'Đang xuất...' : 'Xuất Excel'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ExcelImportExport