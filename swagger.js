// swagger.js
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const swaggerDefinition = {
  openapi: "3.0.3",
  info: {
    title: "Career OS API",
    version: "1.0.0",
    description: "Career OS Backend API Documentation",
    contact: {
      name: "Career OS API Support",
    },
  },
  // Setting server URL relative to current domain fixes CORS in all environments
  servers: [
    {
      url: "/",
      description: "Current Host Environment (Auto-detected)",
    },
  ],
  tags: [
    { name: "Auth", description: "Authentication, registration, login and logout APIs" },
    { name: "AI", description: "AI-powered career and resume APIs" },
    { name: "Dashboard", description: "Candidate dashboard APIs" },
    { name: "Profile", description: "Candidate profile management APIs" },
    { name: "Public", description: "Publicly accessible APIs" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your JWT access token",
      },
    },
    schemas: {
      SuccessResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Operation successful" },
        },
      },
      Error: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Something went wrong" },
          errors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                field: { type: "string", example: "email" },
                message: { type: "string", example: "Email is required" },
              },
            },
          },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string", example: "6651a7e8c123456789abcd12" },
          name: { type: "string", example: "Mitin Patel" },
          email: { type: "string", format: "email", example: "mitin@example.com" },
          role: { type: "string", enum: ["CANDIDATE", "ADMIN"], example: "CANDIDATE" },
          isActive: { type: "boolean", example: true },
          createdAt: { type: "string", format: "date-time", example: "2026-08-11T10:00:00.000Z" },
        },
      },
      SignupInput: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: { type: "string", example: "Mitin Patel" },
          email: { type: "string", format: "email", example: "mitin@example.com" },
          password: { type: "string", format: "password", minLength: 8, example: "Password@123" },
        },
      },
      LoginInput: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "mitin@example.com" },
          password: { type: "string", format: "password", example: "Password@123" },
        },
      },
      RefreshTokenInput: {
        type: "object",
        required: ["refreshToken"],
        properties: {
          refreshToken: { type: "string", example: "eyJhbGciOiJIUzI1NiIs..." },
        },
      },
      AuthResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Login successful" },
          data: {
            type: "object",
            properties: {
              accessToken: { type: "string", example: "eyJhbGciOiJIUzI1NiIs..." },
              refreshToken: { type: "string", example: "eyJhbGciOiJIUzI1NiIs..." },
              user: { $ref: "#/components/schemas/User" },
            },
          },
        },
      },
    },
  },
};

const options = {
  definition: swaggerDefinition,
  apis: ["./src/routes/*.js", "./src/routes/**/*.js", "./src/controllers/**/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

const setupSwagger = (app) => {
  // Expose JSON Spec endpoint
  app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  // Serve Swagger UI
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customSiteTitle: "Career OS API Documentation",
      customCss: ".swagger-ui .topbar { display: none }",
      swaggerOptions: {
        persistAuthorization: true,
      },
    })
  );
};

module.exports = {
  swaggerSpec,
  setupSwagger,
};