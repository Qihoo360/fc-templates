const {checkIsPercent} = require("./utils");

function getPieOptions(baseOptions, axis, data) {

    const y = axis.filter((item) => item.type === 'y')
    const series = axis.filter((item) => item.type === 'series')

    if (series.length === 0 || y.length === 0) {
        return
    }

    const _data = checkIsPercent(y[0], data)

    return {
        ...baseOptions,
        type: 'interval',
        coordinate: {type: 'theta', outerRadius: 0.8},
        transform: [{type: 'stackY'}],
        data: _data.data,
        encode: {
            y: y[0].value,
            color: series[0].value,
        },
        legend: {
            color: {position: 'bottom', layout: {justifyContent: 'center'}},
        },
        labels: [
            {
                position: 'outside',
                text: (data) =>
                    `${data[series[0].value]}: ${data[y[0].value]}${_data.isPercent ? '%' : ''}`,
                transform: [
                    { type: 'exceedAdjust' },
                    { type: 'overlapHide' },
                ],
            },
        ],
        tooltip: {
            title: (data) => data[series[0].value],
            items: [
                (data) => {
                    return {
                        name: y[0].name,
                        value: `${data[y[0].value]}${_data.isPercent ? '%' : ''}`,
                    }
                },
            ],
        },
    }

}

module.exports = {getPieOptions}
