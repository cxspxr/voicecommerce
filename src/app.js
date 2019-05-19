'use strict';

// ------------------------------------------------------------------
// APP INITIALIZATION
// ------------------------------------------------------------------

const { App } = require('jovo-framework');
const { Alexa } = require('jovo-platform-alexa');
const { GoogleAssistant } = require('jovo-platform-googleassistant');
const { JovoDebugger } = require('jovo-plugin-debugger');
const { FileDb } = require('jovo-db-filedb');
const axios = require('axios');

const app = new App();

const APP_URL = "http://thecommerce.herokuapp.com";

app.use(
    new Alexa(),
    new GoogleAssistant(),
    new JovoDebugger(),
    new FileDb()
);


// ------------------------------------------------------------------
// APP LOGIC
// ------------------------------------------------------------------

const parseProductsResponse = response => {
    return JSON.parse(response.data.products).map(transformProductToString);
}
const transformProductToString = product => `${product.fields.name} for ${product.fields.price.amount} ${product.fields.price.currency}`

app.setHandler({
    LAUNCH() {
        return this.toIntent('HelloWorldIntent');
    },

    HelloWorldIntent() {
        this.ask(
            'Hello! You can ask me to list you newest products, specific category products, or ' +
            'the products which costs less than some amount of money.', "Please, tell me your request."
        );
    },

    async GetNewestProductsIntent() {
        const { quantity: { value } } = this.$inputs;
        const response = await axios.get(`${APP_URL}/products/new_items/${value}`);
        const list = parseProductsResponse(response);
        if (list.length !== 0) {
            this.tell(`${value} new products are ${list.join(',')}.`);
        } else {
            this.tell('There are no products yet.');
        }
    },

    async GetProductsUnder() {
        const { amount, quantity } = this.$inputs;
        const response = await axios.get(`${APP_URL}/products/price_under/${amount.value}/${quantity.value}`);
        const list = parseProductsResponse(response);
        if (list.length !== 0) {
            this.tell(`${quantity.value} products under ${amount.value} USD are ${list.join(',')}.`);
        } else {
            this.tell('There are no products yet.');
        }
    },

    async GetCategoryProducts() {
        const { category, quantity } = this.$inputs;
        const response = await axios.get(`${APP_URL}/products/category_items/${category.value}/${quantity.value}`);
        const list = parseProductsResponse(response);
        if (list.length !== 0) {
            this.tell(`${quantity.value} ${category.value} products are ${list.join(',')}.`);
        } else {
            this.tell('There are no products yet.');
        }
    },


    Unhandled() {
        return this.toIntent('LAUNCH');
    }

});

module.exports.app = app;
