'use strict';

function prepareComments(fromMagento) {

    let obj = {}

    let type = fromMagento.type.toLowerCase()

    if (['ordercomment', 'shipment', 'shipmentcomment'].indexOf(type) !== -1) {

        obj.salesOrderID = makeIDObject(fromMagento.order_id)
        obj.docID = makeIDObject(fromMagento.increment_id)

        // keeping address as this can be changed
        obj.address = fromMagento.data.shipping_address


        obj.deliveryDate = MOMENT.unix(fromMagento.data.delivery_date).format('YYYY-MM-DD')
        obj.deliveryTime = fromMagento.data.delivery_time
        obj.deliveryComments = fromMagento.data.delivery_comments

        // comment
        obj.comment = fromMagento.order_comment

        /* BODY */
        let body = '# ' + obj.salesOrderID.stub
        if (type === 'ordercoment') { body += ' Order Comment' }

        else if (type === 'shipment') {
            body += ' Delivery Order (No.'
            body += ' ' + obj.docID.withoutHex + ')'
        }

        else if (type === 'shipmentcomment') {
            body += ' Delivery Comment (for DO No.'
            body += ' ' + obj.docID.withoutHex + ')' 
        }

        // if there are comments
        if (obj.order_comment && obj.order_comment.length > 0) body += '\n\n\n# Comments\n\n' + obj.order_comment

        // there can be non-deliverable products. So if have address will put
        if (obj.address && obj.address.length > 0) {
            body += '\n\n\n# Delivery'
            body += '\nAddress:' + obj.address
            body += '\nDelivery date: ' + (obj.deliveryDate || 'Not indicated')
            body += '\nTime: ' + (obj.deliveryTime || 'Not indicated')
            if (obj.delivery_comments && obj.delivery_comments.length > 0) body += '\nComment: ' + obj.delivery_comments
        }

        return body

    } else  {
        // need to format the rest later
        return jsonFormat(fromMagento)
    }

    return 'Error in preparing comments as `type` of ' + fromMagento.type + ' does not fall into any valid category.\nPlease check prepareComments.js. `fromMagento` output: ' + JSON.stringify(fromMagento)
}

module.exports = prepareComments;
