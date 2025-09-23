const searchService = require('../services/searchService');
const Evidence = require('../models/Evidence');
const { Program, Organization, Standard, Criteria } = require('../models/Program');

const searchEvidences = async (req, res) => {
    try {
        const searchParams = {
            keyword: req.query.keyword,
            programId: req.query.programId,
            organizationId: req.query.organizationId,
            standardId: req.query.standardId,
            criteriaId: req.query.criteriaId,
            status: req.query.status,
            documentType: req.query.documentType,
            dateFrom: req.query.dateFrom,
            dateTo: req.query.dateTo,
            tags: req.query.tags ? req.query.tags.split(',') : undefined,
            createdBy: req.query.createdBy,
            issuingAgency: req.query.issuingAgency,
            page: req.query.page,
            limit: req.query.limit,
            sortBy: req.query.sortBy,
            sortOrder: req.query.sortOrder
        };

        const userPermissions = {
            role: req.user.role,
            standardAccess: req.user.standardAccess,
            criteriaAccess: req.user.criteriaAccess
        };

        const result = await searchService.searchEvidences(searchParams, userPermissions);

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Search evidences error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi tìm kiếm minh chứng'
        });
    }
};

const advancedSearch = async (req, res) => {
    try {
        const searchParams = req.body;

        // Apply user permissions
        searchParams.userPermissions = {
            role: req.user.role,
            standardAccess: req.user.standardAccess,
            criteriaAccess: req.user.criteriaAccess
        };

        const result = await Evidence.advancedSearch(searchParams);

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Advanced search error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi tìm kiếm nâng cao'
        });
    }
};

const searchInFiles = async (req, res) => {
    try {
        const { keyword } = req.query;

        if (!keyword || keyword.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Từ khóa tìm kiếm phải có ít nhất 2 ký tự'
            });
        }

        const userPermissions = {
            role: req.user.role,
            standardAccess: req.user.standardAccess,
            criteriaAccess: req.user.criteriaAccess
        };

        const result = await searchService.searchInFiles(keyword, userPermissions);

        res.json(result);

    } catch (error) {
        console.error('Search in files error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi tìm kiếm trong file'
        });
    }
};

const globalSearch = async (req, res) => {
    try {
        const { keyword } = req.query;

        if (!keyword || keyword.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Từ khóa tìm kiếm phải có ít nhất 2 ký tự'
            });
        }

        const userPermissions = {
            role: req.user.role,
            standardAccess: req.user.standardAccess,
            criteriaAccess: req.user.criteriaAccess
        };

        const result = await searchService.globalSearch(keyword, userPermissions);

        res.json(result);

    } catch (error) {
        console.error('Global search error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi tìm kiếm toàn bộ'
        });
    }
};

const getSearchSuggestions = async (req, res) => {
    try {
        const { keyword } = req.query;

        const userPermissions = {
            role: req.user.role,
            standardAccess: req.user.standardAccess,
            criteriaAccess: req.user.criteriaAccess
        };

        const result = await searchService.getSearchSuggestions(keyword, userPermissions);

        res.json(result);

    } catch (error) {
        console.error('Get search suggestions error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy gợi ý tìm kiếm'
        });
    }
};

const facetedSearch = async (req, res) => {
    try {
        const searchParams = {
            keyword: req.query.keyword,
            programId: req.query.programId,
            organizationId: req.query.organizationId,
            standardId: req.query.standardId,
            criteriaId: req.query.criteriaId,
            status: req.query.status,
            documentType: req.query.documentType,
            dateFrom: req.query.dateFrom,
            dateTo: req.query.dateTo,
            page: req.query.page,
            limit: req.query.limit,
            sortBy: req.query.sortBy,
            sortOrder: req.query.sortOrder
        };

        const userPermissions = {
            role: req.user.role,
            standardAccess: req.user.standardAccess,
            criteriaAccess: req.user.criteriaAccess
        };

        const result = await searchService.facetedSearch(searchParams, userPermissions);

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Faceted search error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi tìm kiếm có bộ lọc'
        });
    }
};

const getSearchFilters = async (req, res) => {
    try {
        const { programId, organizationId } = req.query;

        // Get programs
        const programs = await Program.find({ status: 'active' })
            .select('name code')
            .sort({ name: 1 });

        // Get organizations
        const organizations = await Organization.find({ status: 'active' })
            .select('name code')
            .sort({ name: 1 });

        // Get standards
        let standardQuery = { status: 'active' };
        if (programId && organizationId) {
            standardQuery.programId = programId;
            standardQuery.organizationId = organizationId;
        }

        const standards = await Standard.find(standardQuery)
            .select('name code programId organizationId')
            .populate('programId', 'name code')
            .populate('organizationId', 'name code')
            .sort({ code: 1 });

        // Get criteria
        let criteriaQuery = { status: 'active' };
        if (programId && organizationId) {
            criteriaQuery.programId = programId;
            criteriaQuery.organizationId = organizationId;
        }

        const criteria = await Criteria.find(criteriaQuery)
            .select('name code standardId')
            .populate('standardId', 'name code')
            .sort({ 'standardId.code': 1, code: 1 });

        // Get document types
        const documentTypes = await Evidence.distinct('documentType', {
            status: 'active'
        });

        // Get tags
        const tags = await Evidence.aggregate([
            { $match: { status: 'active' } },
            { $unwind: '$tags' },
            { $group: { _id: '$tags', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 50 }
        ]);

        res.json({
            success: true,
            data: {
                programs,
                organizations,
                standards,
                criteria,
                documentTypes: documentTypes.filter(type => type),
                tags: tags.map(tag => ({
                    name: tag._id,
                    count: tag.count
                }))
            }
        });

    } catch (error) {
        console.error('Get search filters error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy bộ lọc tìm kiếm'
        });
    }
};

const getEvidenceDetail = async (req, res) => {
    try {
        const { id } = req.params;

        const evidence = await Evidence.findById(id)
            .populate('programId', 'name code')
            .populate('organizationId', 'name code')
            .populate('standardId', 'name code')
            .populate('criteriaId', 'name code')
            .populate('createdBy', 'fullName email')
            .populate('updatedBy', 'fullName email')
            .populate({
                path: 'files',
                select: 'originalName storedName size mimeType uploadedAt downloadCount',
                populate: {
                    path: 'uploadedBy',
                    select: 'fullName email'
                }
            });

        if (!evidence) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy minh chứng'
            });
        }

        // Check user access
        if (req.user.role !== 'admin' &&
            !req.user.hasStandardAccess(evidence.standardId._id) &&
            !req.user.hasCriteriaAccess(evidence.criteriaId._id)) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền xem minh chứng này'
            });
        }

        res.json({
            success: true,
            data: evidence
        });

    } catch (error) {
        console.error('Get evidence detail error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy chi tiết minh chứng'
        });
    }
};

const getRecentSearches = async (req, res) => {
    try {
        // In a real implementation, this would be stored per user
        // For now, return mock data
        const recentSearches = [
            { keyword: 'quyết định', timestamp: new Date() },
            { keyword: 'báo cáo', timestamp: new Date() },
            { keyword: 'kế hoạch', timestamp: new Date() }
        ];

        res.json({
            success: true,
            data: recentSearches
        });

    } catch (error) {
        console.error('Get recent searches error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy lịch sử tìm kiếm'
        });
    }
};

const saveSearch = async (req, res) => {
    try {
        const { keyword, filters, name } = req.body;

        // In a real implementation, this would save to user's saved searches
        // For now, just return success
        res.json({
            success: true,
            message: 'Lưu tìm kiếm thành công',
            data: {
                name,
                keyword,
                filters,
                savedAt: new Date()
            }
        });

    } catch (error) {
        console.error('Save search error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lưu tìm kiếm'
        });
    }
};

const getSavedSearches = async (req, res) => {
    try {
        // In a real implementation, this would get user's saved searches
        // For now, return mock data
        const savedSearches = [];

        res.json({
            success: true,
            data: savedSearches
        });

    } catch (error) {
        console.error('Get saved searches error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi lấy tìm kiếm đã lưu'
        });
    }
};

module.exports = {
    searchEvidences,
    advancedSearch,
    searchInFiles,
    globalSearch,
    getSearchSuggestions,
    facetedSearch,
    getSearchFilters,
    getEvidenceDetail,
    getRecentSearches,
    saveSearch,
    getSavedSearches
};