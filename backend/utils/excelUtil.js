const XLSX = require('xlsx');
const { Standard } = require('../models/Program');

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
    };

    return headerMap[header] || null;
};

const validateStandardData = (data) => {
    const errors = [];

    // Validate required fields
    if (!data.code || !data.code.trim()) {
        errors.push('Thiếu mã tiêu chuẩn');
    } else if (!/^\d{1,2}$/.test(data.code.trim())) {
        errors.push('Mã tiêu chuẩn phải là 1-2 chữ số');
    }

    if (!data.name || !data.name.trim()) {
        errors.push('Thiếu tên tiêu chuẩn');
    } else if (data.name.length > 500) {
        errors.push('Tên tiêu chuẩn quá dài (>500 ký tự)');
    }

    // Validate optional fields
    if (data.description && data.description.length > 3000) {
        errors.push('Mô tả quá dài (>3000 ký tự)');
    }

    if (data.order && (isNaN(data.order) || parseInt(data.order) < 1)) {
        errors.push('Thứ tự phải là số nguyên dương');
    }

    if (data.weight && (isNaN(data.weight) || parseFloat(data.weight) < 0 || parseFloat(data.weight) > 100)) {
        errors.push('Trọng số phải từ 0-100');
    }

    if (data.objectives && data.objectives.length > 2000) {
        errors.push('Mục tiêu quá dài (>2000 ký tự)');
    }

    if (data.guidelines && data.guidelines.length > 3000) {
        errors.push('Hướng dẫn quá dài (>3000 ký tự)');
    }

    if (data.status && !['draft', 'active', 'inactive', 'archived'].includes(data.status)) {
        errors.push('Trạng thái không hợp lệ');
    }

    return errors;
};

const parseExcelFile = (fileBuffer) => {
    try {
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON with header row
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: '',
            raw: false
        });

        if (jsonData.length < 2) {
            throw new Error('File Excel phải có ít nhất 1 dòng dữ liệu');
        }

        // Parse headers and data
        const headers = jsonData[0];
        const dataRows = jsonData.slice(1).filter(row =>
            row.some(cell => cell && cell.toString().trim() !== '')
        );

        const parsedData = dataRows.map((row, index) => {
            const item = {};
            headers.forEach((header, i) => {
                const key = mapHeaderToField(header);
                if (key) {
                    item[key] = row[i] || '';
                }
            });
            item._rowIndex = index + 2; // +2 because of header and 0-based index
            return item;
        });

        return {
            success: true,
            data: parsedData
        };
    } catch (error) {
        return {
            success: false,
            error: error.message || 'Lỗi khi đọc file Excel'
        };
    }
};

const validateImportData = (data) => {
    const results = {
        valid: [],
        invalid: [],
        duplicates: []
    };

    const seenCodes = new Set();

    data.forEach((item, index) => {
        const errors = validateStandardData(item);

        // Check for duplicates
        if (item.code && seenCodes.has(item.code.trim())) {
            results.duplicates.push({
                ...item,
                _rowIndex: item._rowIndex,
                _index: index,
                error: `Mã tiêu chuẩn "${item.code}" bị trùng lặp`
            });
        } else if (item.code) {
            seenCodes.add(item.code.trim());
        }

        if (errors.length > 0) {
            results.invalid.push({
                ...item,
                _rowIndex: item._rowIndex,
                _index: index,
                errors
            });
        } else {
            results.valid.push({
                ...item,
                _index: index
            });
        }
    });

    return results;
};

const createExcelTemplate = () => {
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
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);

    // Auto-size columns
    const colWidths = [
        { wch: 15 }, { wch: 50 }, { wch: 50 }, { wch: 10 },
        { wch: 12 }, { wch: 50 }, { wch: 50 }, { wch: 15 }
    ];
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Template');

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
};

const exportStandardsToExcel = async (programId, organizationId) => {
    try {
        const standards = await Standard.findByProgramAndOrganization(programId, organizationId);

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
        }));

        // Create workbook
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(exportData);

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
        ];
        ws['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(wb, ws, 'Tiêu chuẩn');

        return {
            success: true,
            buffer: XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }),
            count: standards.length
        };
    } catch (error) {
        return {
            success: false,
            error: error.message || 'Lỗi khi xuất dữ liệu'
        };
    }
};

module.exports = {
    mapHeaderToField,
    validateStandardData,
    parseExcelFile,
    validateImportData,
    createExcelTemplate,
    exportStandardsToExcel
};