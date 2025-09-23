const formatDate = (date, format = 'DD/MM/YYYY') => {
    if (!date) return ''

    const d = new Date(date)
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')

    switch (format) {
        case 'DD/MM/YYYY':
            return `${day}/${month}/${year}`
        case 'DD/MM/YYYY HH:mm':
            return `${day}/${month}/${year} ${hours}:${minutes}`
        case 'YYYY-MM-DD':
            return `${year}-${month}-${day}`
        default:
            return d.toLocaleDateString('vi-VN')
    }
}

const getRelativeTime = (date) => {
    if (!date) return ''

    const now = new Date()
    const diff = now - new Date(date)
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (seconds < 60) return 'Vừa xong'
    if (minutes < 60) return `${minutes} phút trước`
    if (hours < 24) return `${hours} giờ trước`
    if (days < 7) return `${days} ngày trước`

    return formatDate(date)
}

const truncateText = (text, maxLength = 100) => {
    if (!text || text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
}

const capitalizeFirstLetter = (string) => {
    if (!string) return ''
    return string.charAt(0).toUpperCase() + string.slice(1)
}

const slugify = (text) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '')
}

const formatNumber = (number) => {
    if (number == null) return '0'
    return new Intl.NumberFormat('vi-VN').format(number)
}

const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

const groupBy = (array, key) => {
    return array.reduce((result, currentValue) => {
        const groupKey = currentValue[key]
        if (!result[groupKey]) {
            result[groupKey] = []
        }
        result[groupKey].push(currentValue)
        return result
    }, {})
}

const sortBy = (array, key, order = 'asc') => {
    return array.sort((a, b) => {
        const valueA = a[key]
        const valueB = b[key]

        if (order === 'asc') {
            return valueA > valueB ? 1 : valueA < valueB ? -1 : 0
        } else {
            return valueA < valueB ? 1 : valueA > valueB ? -1 : 0
        }
    })
}

const removeDuplicates = (array, key = null) => {
    if (!key) {
        return [...new Set(array)]
    }

    const seen = new Set()
    return array.filter(item => {
        const keyValue = item[key]
        if (seen.has(keyValue)) {
            return false
        }
        seen.add(keyValue)
        return true
    })
}

const deepClone = (obj) => {
    if (obj === null || typeof obj !== 'object') return obj
    if (obj instanceof Date) return new Date(obj.getTime())
    if (obj instanceof Array) return obj.map(item => deepClone(item))
    if (typeof obj === 'object') {
        const clonedObj = {}
        for (const key in obj) {
            clonedObj[key] = deepClone(obj[key])
        }
        return clonedObj
    }
}

const omit = (obj, keys) => {
    const result = { ...obj }
    keys.forEach(key => delete result[key])
    return result
}

const pick = (obj, keys) => {
    const result = {}
    keys.forEach(key => {
        if (key in obj) {
            result[key] = obj[key]
        }
    })
    return result
}

const buildQueryString = (params) => {
    const queryString = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
            queryString.append(key, value)
        }
    })

    return queryString.toString()
}

const parseQueryString = (queryString) => {
    const params = new URLSearchParams(queryString)
    const result = {}

    for (const [key, value] of params.entries()) {
        result[key] = value
    }

    return result
}

const getFileExtension = (filename) => {
    if (!filename) return ''
    return filename.split('.').pop().toLowerCase()
}

const getFileIcon = (filename) => {
    const extension = getFileExtension(filename)

    switch (extension) {
        case 'pdf':
            return 'FileText'
        case 'doc':
        case 'docx':
            return 'FileText'
        case 'xls':
        case 'xlsx':
            return 'FileSpreadsheet'
        case 'ppt':
        case 'pptx':
            return 'FileBarChart'
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
            return 'Image'
        case 'zip':
        case 'rar':
        case '7z':
            return 'Archive'
        default:
            return 'File'
    }
}

const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

const isValidPhone = (phone) => {
    const phoneRegex = /^[0-9]{10,11}$/
    return phoneRegex.test(phone)
}

const isValidPassword = (password) => {
    return password && password.length >= 6
}

const isValidEvidenceCode = (code) => {
    const codeRegex = /^H\d+\.\d+\.\d+\.\d+$/
    return codeRegex.test(code)
}

const scrollToTop = () => {
    if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }
}

const scrollToElement = (elementId) => {
    if (typeof window !== 'undefined') {
        const element = document.getElementById(elementId)
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' })
        }
    }
}

const getLocalStorage = (key, defaultValue = null) => {
    if (typeof window === 'undefined') return defaultValue

    try {
        const item = window.localStorage.getItem(key)
        return item ? JSON.parse(item) : defaultValue
    } catch (error) {
        console.error(`Error getting localStorage key "${key}":`, error)
        return defaultValue
    }
}

const setLocalStorage = (key, value) => {
    if (typeof window === 'undefined') return

    try {
        window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error)
    }
}

const removeLocalStorage = (key) => {
    if (typeof window === 'undefined') return

    try {
        window.localStorage.removeItem(key)
    } catch (error) {
        console.error(`Error removing localStorage key "${key}":`, error)
    }
}

const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null
}

const rgbToHex = (r, g, b) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
}

const debounce = (func, wait) => {
    let timeout
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout)
            func(...args)
        }
        clearTimeout(timeout)
        timeout = setTimeout(later, wait)
    }
}

const throttle = (func, limit) => {
    let inThrottle
    return function() {
        const args = arguments
        const context = this
        if (!inThrottle) {
            func.apply(context, args)
            inThrottle = true
            setTimeout(() => inThrottle = false, limit)
        }
    }
}

const generateRandomString = (length = 10) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    return result
}

const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0
        const v = c == 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
    })
}

const getErrorMessage = (error) => {
    if (typeof error === 'string') return error
    if (error?.response?.data?.message) return error.response.data.message
    if (error?.message) return error.message
    return 'Có lỗi xảy ra'
}

const isNetworkError = (error) => {
    return !error.response && error.request
}

const generateEvidenceCode = (boxNumber, standardCode, criteriaCode, sequence) => {
    return `H${boxNumber}.${standardCode.padStart(2, '0')}.${criteriaCode.padStart(2, '0')}.${sequence.toString().padStart(2, '0')}`
}

const parseEvidenceCode = (code) => {
    const match = code.match(/^H(\d+)\.(\d+)\.(\d+)\.(\d+)$/)
    if (!match) return null

    return {
        boxNumber: parseInt(match[1]),
        standardCode: parseInt(match[2]),
        criteriaCode: parseInt(match[3]),
        sequence: parseInt(match[4])
    }
}

const downloadBlob = (blob, filename) => {
    if (typeof window !== 'undefined') {
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
    }
}

const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) return

    const headers = Object.keys(data[0])
    const csvContent = [
        headers.join(','),
        ...data.map(row =>
            headers.map(header => {
                const value = row[header]
                return typeof value === 'string' && value.includes(',')
                    ? `"${value}"`
                    : value
            }).join(',')
        )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    downloadBlob(blob, filename)
}

module.exports = {
    formatDate,
    getRelativeTime,
    truncateText,
    capitalizeFirstLetter,
    slugify,
    formatNumber,
    formatBytes,
    groupBy,
    sortBy,
    removeDuplicates,
    deepClone,
    omit,
    pick,
    buildQueryString,
    parseQueryString,
    getFileExtension,
    getFileIcon,
    isValidEmail,
    isValidPhone,
    isValidPassword,
    isValidEvidenceCode,
    scrollToTop,
    scrollToElement,
    getLocalStorage,
    setLocalStorage,
    removeLocalStorage,
    hexToRgb,
    rgbToHex,
    debounce,
    throttle,
    generateRandomString,
    generateUUID,
    getErrorMessage,
    isNetworkError,
    generateEvidenceCode,
    parseEvidenceCode,
    downloadBlob,
    exportToCSV
};