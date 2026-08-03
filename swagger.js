// swagger.js
const swaggerAutogen = require("swagger-autogen")();

const doc = {
  info: {
    title: "CareerOs API",
    description: "API for candidate profiles, authentication & AI suggestions",
    version: "1.0.0",
  },
  servers: [
    {
      url: "http://localhost:5000",
      description: "Local development server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
  security: [{ bearerAuth: [] }], // apply globally; can be overridden per route
};

const outputFile = "./swagger-output.json"; // the generated spec file
const endpointsFiles = [
  "./src/routes/auth.routes.js",
  "./src/routes/profile.routes.js",
  "./src/routes/ai.routes.js",
  "./src/routes/public-resume.routes.js",
  // add any other route files you may have (e.g., dashboard)
];

// Generate the Swagger JSON
swaggerAutogen(outputFile, endpointsFiles, doc)
  .then(() => {
    console.log("✅ Swagger JSON generated successfully!");
  })
  .catch((err) => {
    console.error("❌ Error generating Swagger:", err);
  });
