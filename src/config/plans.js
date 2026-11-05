// Server-side source of truth for prices (INR, Whole rupees) and plan details. This is used to generate the pricing table on the frontend and to validate the plan selected by the user during checkout.

const PLANS = {
    free:{ name: "Free", rank: 0, price: {monthly: 0, yearly: 0}},
    pro: { name: "Pro", rank: 1, price: {monthly: 100, yearly: 1000}},
    premium: { name: "Premium", rank: 2, price: {monthly: 200, yearly: 2000}}
};

const BILLING_DAYS = { monthly: 30, yearly: 365 };

module.exports = { PLANS, BILLING_DAYS };