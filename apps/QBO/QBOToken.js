const QuickBooks = require('node-quickbooks')
const rp = require('request-promise')
const parseString = require('xml2js').parseString
const debug = require('debug')('nn:apps:qbotoken')

function retrieveTokenAndRefresh() {
    // get the token
    DB.Token.findById(1).then(function (token) {

        // check validity of token data.
        if (!token || !token.data || !token.data.access_token || !token.data.refresh_token) {
            throw new Error('CRITICAL: Obtaining token from database failed.')
        }

        let accessToken = token.data

        // NOTE: OAuth2 Access token `access_token` will expire 1 hour from the point it is created.
        //       The refresh token `refresh_token` will expire in 100 days if not used.
        //       Before every hour (expiry limit of Access Token), the tokens are refreshed.
        //       The new tokens are then stored and QBO is re-initialised with the new tokens.


        // initialise QBO
        // access_token may be outdated, it is not a problem.
        QBO = new QuickBooks(
            process.env.qbo_consumerKey,
            process.env.qbo_consumerSecret,
            accessToken.access_token, /* oAuth access token */
            false, /* no token secret for oAuth 2.0 */
            process.env.qbo_realmID,
            (process.env.environment === 'production' ? false : true), /* use a sandbox account */
            false, /* turn debugging on */
            34, /* minor version */
            '2.0', /* oauth version */
            accessToken.refresh_token /* refresh token */
        )

        global.QBO = PROMISE.promisifyAll(global.QBO)

        return refreshQBOToken()

    }).catch(function (err) {
        // log the error
        throw err

    });




    // connect to quickbooks to refresh token. returns a promise
    function refreshQBOToken() {
        console.log('running refresh.')
        return QBO.refreshAccessTokenAsync().then(function(authReponse) {
            console.log(authResponse)

            accessToken = authResponse.getJson();
            var companyId = authResponse.token.realmId;

            // re-initialise QBO
            QBO = new QuickBooks(
                process.env.qbo_consumerKey,
                process.env.qbo_consumerSecret,
                accessToken.access_token, /* oAuth access token */
                false, /* no token secret for oAuth 2.0 */
                process.env.qbo_realmID,
                (process.env.qbo_environment === 'production' ? false : true), /* use a sandbox account */
                false, /* turn debugging on */
                34, /* minor version */
                '2.0', /* oauth version */
                accessToken.refresh_token /* refresh token */
            )

            // update the token
            return DB.Token.update({
                data: accessToken
            }, {
                where: {
                    TokenID: 1
                }
            })

        }).then(function() {
            console.log('QBO token successfully updated.')
        })

    }


    // attempt refresh every 50 min
    setInterval(retrieveTokenAndRefresh, 3e+6);
}
module.exports = retrieveTokenAndRefresh
