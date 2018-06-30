function calculateStripeCommissionAmountOnRefund(stripeObject) {

    const stripeChargesAMEX = 0.032;
    const stripeChargesMasterOrVisa = 0.027;

    var total = parseInt(D.get(stripeObject, 'data.object.amount'));
    var amountRefunded = parseInt(D.get(stripeObject, 'data.object.amount_refunded'));

    if (isNaN(total) || isNaN(amountRefunded)) throw new Error("CRITICAL: calculateStripeCommissionAmountOnRefund: total or amountRefunded is NaN.");

    var stripeCommissionAmount;

    // get country of credit card origin
    var countryOfOrigin = D.get(stripeObject, 'data.object.source.country');
    if (!countryOfOrigin) throw new Error("CRITICAL: calculateStripeCommissionAmountOnRefund: countryOfOrigin is invalid.");

    // get card brand
    var cardBrand = D.get(stripeObject, 'data.object.source.brand');
    if (!cardBrand) throw new Error("CRITICAL: calculateStripeCommissionAmountOnRefund: countryOfOrigin is invalid.");



    // calucate the commission which strip will refund us
    if (countryOfOrigin !== 'SG' || cardBrand === 'American Express') {

        // international charges or AMEX, so 3.4% of the amount refunded
        stripeCommissionAmount = Math.round(amountRefunded * stripeChargesAMEX)/100;

    } else {

        // 2.9% of the amount refunded
        stripeCommissionAmount = Math.round(amountRefunded * stripeChargesMasterOrVisa)/100;

    }


    // if it is a total refund, additional 0.50 refund of stripe fixed charges
    if (total === amountRefunded) stripeCommissionAmount += 0.50;

    // calculate the new stripe commission.
    return stripeCommissionAmount

}

module.exports = calculateStripeCommissionAmountOnRefund;
