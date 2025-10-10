const {filter, endsWith, replace} = require("lodash");

function checkIsPercent(valueAxis, data) {
    const result = {
        isPercent: false,
        data: [],
    }

    const notEmptyData = filter(
        data,
        (d) =>
            d &&
            d[valueAxis.value] !== null &&
            d[valueAxis.value] !== undefined &&
            d[valueAxis.value] !== 0 &&
            d[valueAxis.value] !== '0'
    )
    if (notEmptyData.length > 0) {
        const v = notEmptyData[0][valueAxis.value] + ''
        if (endsWith(v.trim(), '%')) {
            result.isPercent = true
        }
    }
    for (let i = 0; i < data.length; i++) {
        const v = data[i]
        const _v = {...v}
        if (result.isPercent) {
            const formatValue = replace(v[valueAxis.value], '%', '')
            _v[valueAxis.value] = Number(formatValue)
        }
        result.data.push(_v)
    }

    return result
}

module.exports = {checkIsPercent}