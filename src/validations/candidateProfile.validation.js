const Joi = require('joi');

// exports.personalInfo = Joi.object({
//   firstName: Joi.string().required().messages({
//     'string.empty': 'First name is required',
//     'any.required': 'First name is required',
//   }),

//   lastName: Joi.string().required().messages({
//     'string.empty': 'Last name is required',
//     'any.required': 'Last name is required',
//   }),

//   jobTitle: Joi.string().required().messages({
//     'string.empty': 'Job title is required',
//     'any.required': 'Job title is required',
//   }),

//   dateOfBirth: Joi.date().optional(),

//   gender: Joi.string().valid('Male', 'Female', 'Other').optional(),

//   maritalStatus: Joi.string().optional(),

//   nationality: Joi.string().optional(),

//   // photoUrl: Joi.string().uri().optional(),
// });
