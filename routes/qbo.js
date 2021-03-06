const express = require('express')
const router = express.Router()
const debug = require('debug')('nn:api:qbo')

var QuickBooks = require('node-quickbooks')
QuickBooks.setOauthVersion('2.0')

const OAuthClient = require('intuit-oauth')
const oauthClient = new OAuthClient({
    clientId: process.env.qbo_consumerKey,
    clientSecret: process.env.qbo_consumerSecret,
    environment: process.env.qbo_environment,
    redirectUri: process.env.DOMAIN + '/qbo/callback'
})

//var oauthClient, companyId
var companyId

router.all('*', function(req, res, next) {
    if (process.env.QBO_ALLOW_LOCKED_ROUTES !== 'true') return res.status(403).send();
    next();
});


router.get('/requestToken', function (req, res) {

    if(process.env.QBO_ALLOW_LOCKED_ROUTES !== 'true') return res.status(400).send();

    var authUri = oauthClient.authorizeUri({scope:[OAuthClient.scopes.Accounting,OAuthClient.scopes.OpenId],state:'nicknacks'});

    res.redirect(authUri);

})

router.get('/callback', function (req, res) {

    if(process.env.QBO_ALLOW_LOCKED_ROUTES !== 'true') return res.status(400).send();

    var accessToken;

    oauthClient.createToken(req.url).then(function(authResponse) {
        accessToken = authResponse.getJson();
        companyId = authResponse.token.realmId;

        // update the token in DB
        return DB.Token.update({
            data: accessToken
        }, {
            where: {
                TokenID: 1
            }
        })
    }).then(function(){

            // initialise QBO
            global.QBO = new QuickBooks(
                oauthClient.clientId,
                oauthClient.clientSecret,
                accessToken.access_token, /* oAuth access token */
                false, /* no token secret for oAuth 2.0 */
                companyId,
                (process.env.qbo_environment === 'production' ? false : true), /* use a sandbox account */
                false, /* turn debugging on */
                34, /* minor version */
                '2.0', /* oauth version */
                accessToken.refresh_token /* refresh token */
            )

            global.QBO = PROMISE.promisifyAll(global.QBO)

            // run a query to ensure it is working.
            return global.QBO.findAccountsAsync()
        }).then(accounts => {

            accounts.QueryResponse.Account.forEach(function (account) {
                debug(account.Name);
                console.log(account.Name)
            });

            res.send('Successfully obtained token!')
            global.QBOIsWorking = true

        }).catch(function(e) {
            global.QBOIsWorking = false

            let error = new Error('QBO requestToken error')
            error.status = 500
            error.level = 'high'
            error.debug = e

            API_ERROR_HANDLER(error, req, res)

        })

});

router.get('/accounts', function(req, res, next) {

    if(process.env.QBO_ALLOW_LOCKED_ROUTES !== 'true') return res.status(400).send();

    QBO.findAccounts(function (err, accounts) {
        if (err) {

            let error = new Error('Error in testing QBO.')
            error.debug = JSON.stringify(err)
            API_ERROR_HANDLER(error, null, res)

        } else {
            accounts.QueryResponse.Account.forEach(function (account) {
                console.log(account.Name);
            });

            res.send('success!')
        }

    });

});

module.exports = router;
