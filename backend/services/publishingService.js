const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const Evidence = require('../models/Evidence');
const { Program, Organization, Standard, Criteria } = require('../models/Program');
const exportService = require('./exportService');

/**
 * Publishing service for evidence packages
 */

// Publish evidence package
const publishEvidencePackage = async (publishOptions, userId) => {
    try {
        const {
            programId,
            organizationId,
            standardIds,
            criteriaIds,
            packageName,
            description,
            version = '1.0',
            includeFiles = true,
            includeMetadata = true,
            format = 'zip'
        } = publishOptions;

        // Validate inputs
        await validatePublishingOptions(publishOptions);

        // Build evidence query
        const query = buildEvidenceQuery(programId, organizationId, standardIds, criteriaIds);

        // Get evidences to publish
        const evidences = await Evidence.find(query)
            .populate('programId', 'name code')
            .populate('organizationId', 'name code')
            .populate('standardId', 'name code')
            .populate('criteriaId', 'name code')
            .populate('files')
            .sort({ 'standardId.code': 1, 'criteriaId.code': 1, code: 1 });

        if (evidences.length === 0) {
            throw new Error('Không có minh chứng nào để xuất bản');
        }

        // Create package directory
        const packageId = generatePackageId();
        const packageDir = path.join('uploads', 'packages', packageId);
        if (!fs.existsSync(packageDir)) {
            fs.mkdirSync(packageDir, { recursive: true });
        }

        const packageData = {
            id: packageId,
            name: packageName,
            description,
            version,
            createdAt: new Date(),
            createdBy: userId,
            program: evidences[0].programId,
            organization: evidences[0].organizationId,
            totalEvidences: evidences.length,
            totalFiles: evidences.reduce((sum, ev) => sum + ev.files.length, 0)
        };

        // Generate package contents
        const packageContents = await generatePackageContents(
            evidences,
            packageDir,
            packageData,
            {
                includeFiles,
                includeMetadata,
                format
            }
        );

        // Create final package file
        const packagePath = await createPackageFile(packageDir, packageData, format);

        // Clean up temporary directory
        if (format !== 'directory') {
            fs.rmSync(packageDir, { recursive: true, force: true });
        }

        // Log publishing activity
        await logPublishingActivity(userId, packageData, 'success', {
            evidenceCount: evidences.length,
            fileCount: packageData.totalFiles
        });

        return {
            success: true,
            message: 'Xuất bản gói minh chứng thành công',
            data: {
                packageId,
                packagePath,
                packageData,
                contents: packageContents
            }
        };

    } catch (error) {
        console.error('Publish evidence package error:', error);

        // Log failed publishing attempt
        await logPublishingActivity(userId, publishOptions, 'failed', {
            error: error.message
        });

        throw error;
    }
};

// Generate package contents
const generatePackageContents = async (evidences, packageDir, packageData, options) => {
    try {
        const contents = {
            metadata: null,
            evidenceList: null,
            files: [],
            structure: {}
        };

        // Generate metadata file
        if (options.includeMetadata) {
            const metadataPath = await generateMetadataFile(evidences, packageDir, packageData);
            contents.metadata = metadataPath;
        }

        // Generate evidence list
        const evidenceListPath = await generateEvidenceList(evidences, packageDir);
        contents.evidenceList = evidenceListPath;

        // Copy evidence files
        if (options.includeFiles) {
            contents.files = await copyEvidenceFiles(evidences, packageDir);
        }

        // Generate folder structure
        contents.structure = generateFolderStructure(evidences);

        // Generate README file
        await generateReadmeFile(packageDir, packageData, contents);

        return contents;

    } catch (error) {
        console.error('Generate package contents error:', error);
        throw error;
    }
};

// Generate metadata file
const generateMetadataFile = async (evidences, packageDir, packageData) => {
    try {
        const metadata = {
            package: packageData,
            statistics: {
                totalEvidences: evidences.length,
                totalFiles: evidences.reduce((sum, ev) => sum + ev.files.length, 0),
                byStandard: {},
                byCriteria: {},
                byDocumentType: {}
            },
            evidenceSummary: evidences.map(evidence => ({
                id: evidence._id,
                code: evidence.code,
                name: evidence.name,
                standard: evidence.standardId?.code,
                criteria: evidence.criteriaId?.code,
                fileCount: evidence.files.length,
                documentType: evidence.documentType,
                status: evidence.status
            }))
        };

        // Calculate statistics
        evidences.forEach(evidence => {
            const standardKey = evidence.standardId?.code || 'unknown';
            const criteriaKey = evidence.criteriaId?.code || 'unknown';
            const docType = evidence.documentType || 'unknown';

            metadata.statistics.byStandard[standardKey] =
                (metadata.statistics.byStandard[standardKey] || 0) + 1;
            metadata.statistics.byCriteria[criteriaKey] =
                (metadata.statistics.byCriteria[criteriaKey] || 0) + 1;
            metadata.statistics.byDocumentType[docType] =
                (metadata.statistics.byDocumentType[docType] || 0) + 1;
        });

        const metadataPath = path.join(packageDir, 'metadata.json');
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

        return metadataPath;
    } catch (error) {
        console.error('Generate metadata file error:', error);
        throw error;
    }
};

// Generate evidence list (Excel format)
const generateEvidenceList = async (evidences, packageDir) => {
    try {
        // Prepare data for export
        const exportData = evidences.map(evidence => ({
            'Mã minh chứng': evidence.code,
            'Tên minh chứng': evidence.name,
            'Mô tả': evidence.description || '',
            'Tiêu chuẩn': `${evidence.standardId?.code} - ${evidence.standardId?.name}`,
            'Tiêu chí': `${evidence.criteriaId?.code} - ${evidence.criteriaId?.name}`,
            'Số hiệu văn bản': evidence.documentNumber || '',
            'Loại văn bản': evidence.documentType || '',
            'Ngày ban hành': evidence.issueDate ? formatDate(evidence.issueDate) : '',
            'Cơ quan ban hành': evidence.issuingAgency || '',
            'Số lượng file': evidence.files.length,
            'Trạng thái': evidence.status,
            'Ghi chú': evidence.notes || ''
        }));

        const XLSX = require('xlsx');
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh sách minh chứng');

        const listPath = path.join(packageDir, 'danh_sach_minh_chung.xlsx');
        XLSX.writeFile(workbook, listPath);

        return listPath;
    } catch (error) {
        console.error('Generate evidence list error:', error);
        throw error;
    }
};

// Copy evidence files to package
const copyEvidenceFiles = async (evidences, packageDir) => {
    try {
        const copiedFiles = [];
        const filesDir = path.join(packageDir, 'files');

        if (!fs.existsSync(filesDir)) {
            fs.mkdirSync(filesDir, { recursive: true });
        }

        for (const evidence of evidences) {
            if (evidence.files && evidence.files.length > 0) {
                const evidenceDir = path.join(filesDir, evidence.code);
                if (!fs.existsSync(evidenceDir)) {
                    fs.mkdirSync(evidenceDir, { recursive: true });
                }

                for (const file of evidence.files) {
                    if (fs.existsSync(file.filePath)) {
                        const targetPath = path.join(evidenceDir, file.originalName);
                        fs.copyFileSync(file.filePath, targetPath);
                        copiedFiles.push({
                            evidenceCode: evidence.code,
                            originalName: file.originalName,
                            targetPath: path.relative(packageDir, targetPath)
                        });
                    }
                }
            }
        }

        return copiedFiles;
    } catch (error) {
        console.error('Copy evidence files error:', error);
        throw error;
    }
};

// Generate folder structure
const generateFolderStructure = (evidences) => {
    const structure = {};

    evidences.forEach(evidence => {
        const standardCode = evidence.standardId?.code || 'unknown';
        const criteriaCode = evidence.criteriaId?.code || 'unknown';
        const standardName = evidence.standardId?.name || 'Unknown Standard';
        const criteriaName = evidence.criteriaId?.name || 'Unknown Criteria';

        const standardKey = `${standardCode} - ${standardName}`;
        const criteriaKey = `${criteriaCode} - ${criteriaName}`;

        if (!structure[standardKey]) {
            structure[standardKey] = {};
        }

        if (!structure[standardKey][criteriaKey]) {
            structure[standardKey][criteriaKey] = [];
        }

        structure[standardKey][criteriaKey].push({
            code: evidence.code,
            name: evidence.name,
            fileCount: evidence.files.length
        });
    });

    return structure;
};

// Generate README file
const generateReadmeFile = async (packageDir, packageData, contents) => {
    try {
        const readme = `# ${packageData.name}

## Thông tin gói minh chứng

- **Tên gói**: ${packageData.name}
- **Phiên bản**: ${packageData.version}
- **Mô tả**: ${packageData.description || 'Không có mô tả'}
- **Ngày tạo**: ${formatDate(packageData.createdAt)}
- **Chương trình**: ${packageData.program?.name} (${packageData.program?.code})
- **Tổ chức**: ${packageData.organization?.name} (${packageData.organization?.code})

## Thống kê

- **Tổng số minh chứng**: ${packageData.totalEvidences}
- **Tổng số file**: ${packageData.totalFiles}

## Cấu trúc gói

\`\`\`
${packageData.name}/
├── README.md                    # File hướng dẫn này
├── metadata.json               # Metadata của gói
├── danh_sach_minh_chung.xlsx  # Danh sách minh chứng (Excel)
└── files/                     # Thư mục chứa files minh chứng
    ├── H1.01.01.01/           # Minh chứng theo mã
    ├── H1.01.01.02/
    └── ...
\`\`\`

## Hướng dẫn sử dụng

1. **Xem danh sách minh chứng**: Mở file \`danh_sach_minh_chung.xlsx\`
2. **Xem chi tiết metadata**: Mở file \`metadata.json\`
3. **Truy cập files**: Vào thư mục \`files/\` và tìm theo mã minh chứng

## Lưu ý

- Gói này được tạo tự động từ hệ thống quản lý minh chứng
- Mọi thay đổi trong gói này sẽ không được đồng bộ ngược lại hệ thống
- Để cập nhật, vui lòng tạo gói mới từ hệ thống

---
Được tạo bởi Hệ thống Quản lý Minh chứng
`;

        const readmePath = path.join(packageDir, 'README.md');
        fs.writeFileSync(readmePath, readme);

        return readmePath;
    } catch (error) {
        console.error('Generate README file error:', error);
        throw error;
    }
};

// Create final package file
const createPackageFile = async (packageDir, packageData, format) => {
    try {
        if (format === 'directory') {
            return packageDir;
        }

        const packageName = `${packageData.name}_v${packageData.version}_${Date.now()}`;
        let packagePath;

        switch (format) {
            case 'zip':
                packagePath = path.join('uploads', 'packages', `${packageName}.zip`);
                await createZipPackage(packageDir, packagePath);
                break;
            case 'tar':
                packagePath = path.join('uploads', 'packages', `${packageName}.tar.gz`);
                await createTarPackage(packageDir, packagePath);
                break;
            default:
                throw new Error(`Định dạng ${format} không được hỗ trợ`);
        }

        return packagePath;
    } catch (error) {
        console.error('Create package file error:', error);
        throw error;
    }
};

// Create ZIP package
const createZipPackage = async (sourceDir, targetPath) => {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(targetPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => resolve(targetPath));
        archive.on('error', reject);

        archive.pipe(output);
        archive.directory(sourceDir, false);
        archive.finalize();
    });
};

// Create TAR package
const createTarPackage = async (sourceDir, targetPath) => {
    return new Promise((resolve, reject) => {
        const tar = require('tar');

        tar.c({
            gzip: true,
            file: targetPath
        }, [sourceDir])
            .then(() => resolve(targetPath))
            .catch(reject);
    });
};

// Validate publishing options
const validatePublishingOptions = async (options) => {
    const { programId, organizationId, packageName } = options;

    if (!programId) {
        throw new Error('Thiếu ID chương trình');
    }

    if (!organizationId) {
        throw new Error('Thiếu ID tổ chức');
    }

    if (!packageName || packageName.trim().length === 0) {
        throw new Error('Tên gói không được để trống');
    }

    if (packageName.length > 100) {
        throw new Error('Tên gói không được quá 100 ký tự');
    }

    // Validate program and organization exist
    const [program, organization] = await Promise.all([
        Program.findById(programId),
        Organization.findById(organizationId)
    ]);

    if (!program) {
        throw new Error('Chương trình không tồn tại');
    }

    if (!organization) {
        throw new Error('Tổ chức không tồn tại');
    }
};

// Build evidence query
const buildEvidenceQuery = (programId, organizationId, standardIds, criteriaIds) => {
    const query = {
        programId,
        organizationId,
        status: 'active'
    };

    if (standardIds && standardIds.length > 0) {
        query.standardId = { $in: standardIds };
    }

    if (criteriaIds && criteriaIds.length > 0) {
        query.criteriaId = { $in: criteriaIds };
    }

    return query;
};

// Get published packages
const getPublishedPackages = async (userId, options = {}) => {
    try {
        // In a real implementation, this would query a PublishedPackage collection
        // For now, return mock data
        const packages = [
            {
                id: 'pkg_001',
                name: 'Gói minh chứng MOET v1.0',
                version: '1.0',
                createdAt: new Date(),
                createdBy: userId,
                size: '45.2 MB',
                evidenceCount: 125,
                fileCount: 340,
                downloadCount: 3
            }
        ];

        return {
            success: true,
            data: packages
        };
    } catch (error) {
        console.error('Get published packages error:', error);
        throw error;
    }
};

// Download published package
const downloadPackage = async (packageId, userId) => {
    try {
        // Validate package exists and user has access
        const packagePath = path.join('uploads', 'packages', `${packageId}.zip`);

        if (!fs.existsSync(packagePath)) {
            throw new Error('Gói không tồn tại hoặc đã bị xóa');
        }

        // Log download activity
        await logPublishingActivity(userId, { packageId }, 'download', {
            downloadedAt: new Date()
        });

        return {
            success: true,
            packagePath,
            filename: path.basename(packagePath)
        };
    } catch (error) {
        console.error('Download package error:', error);
        throw error;
    }
};

// Helper functions
const generatePackageId = () => {
    return `pkg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN');
};

// Log publishing activity
const logPublishingActivity = async (userId, packageData, status, details) => {
    try {
        const History = require('../models/History');

        await History.create({
            userId,
            action: 'publish',
            module: 'evidence',
            targetType: 'Package',
            targetId: packageData.id || packageData.packageId,
            description: getPublishingDescription(status),
            details: {
                status,
                ...details
            },
            status: status === 'failed' ? 'failed' : 'success'
        });
    } catch (error) {
        console.error('Log publishing activity error:', error);
    }
};

const getPublishingDescription = (status) => {
    const descriptions = {
        success: 'Xuất bản gói minh chứng thành công',
        failed: 'Xuất bản gói minh chứng thất bại',
        download: 'Tải xuống gói minh chứng'
    };
    return descriptions[status] || 'Hoạt động xuất bản';
};

module.exports = {
    publishEvidencePackage,
    getPublishedPackages,
    downloadPackage,
    generatePackageContents,
    createZipPackage
};