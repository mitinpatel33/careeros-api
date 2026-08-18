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

  servers: [
    {
      url: "https://careeros-api-22tq.vercel.app",
      description: "Vercel Production",
    },
    {
      url: "http://localhost:5000",
      description: "Local Development",
    },
  ],

  // =====================================================
  // TAGS
  // =====================================================

  tags: [
    {
      name: "Auth",
      description: "Authentication, registration, login and logout APIs",
    },

    {
      name: "AI",
      description: "AI-powered career and resume APIs",
    },

    {
      name: "Dashboard",
      description: "Candidate dashboard APIs",
    },

    {
      name: "Profile",
      description: "Candidate profile management APIs",
    },

    {
      name: "Public",
      description: "Publicly accessible APIs",
    },
  ],

  // =====================================================
  // COMPONENTS
  // =====================================================

  components: {
    // ===================================================
    // SECURITY
    // ===================================================

    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your JWT access token",
      },
    },

    // ===================================================
    // SCHEMAS
    // ===================================================

    schemas: {
      // =================================================
      // COMMON RESPONSE
      // =================================================

      SuccessResponse: {
        type: "object",

        properties: {
          success: {
            type: "boolean",
            example: true,
          },

          message: {
            type: "string",
            example: "Operation successful",
          },
        },
      },

      Error: {
        type: "object",

        properties: {
          success: {
            type: "boolean",
            example: false,
          },

          message: {
            type: "string",
            example: "Something went wrong",
          },

          errors: {
            type: "array",

            items: {
              type: "object",

              properties: {
                field: {
                  type: "string",
                  example: "email",
                },

                message: {
                  type: "string",
                  example: "Email is required",
                },
              },
            },
          },
        },
      },

      // =================================================
      // USER
      // =================================================

      User: {
        type: "object",

        properties: {
          id: {
            type: "string",
            example: "6651a7e8c123456789abcd12",
          },

          name: {
            type: "string",
            example: "Mitin Patel",
          },

          email: {
            type: "string",
            format: "email",
            example: "mitin@example.com",
          },

          role: {
            type: "string",
            enum: ["CANDIDATE", "ADMIN"],
            example: "CANDIDATE",
          },

          isActive: {
            type: "boolean",
            example: true,
          },

          createdAt: {
            type: "string",
            format: "date-time",
            example: "2026-08-11T10:00:00.000Z",
          },
        },
      },

      // =================================================
      // SIGNUP
      // =================================================

      SignupInput: {
        type: "object",

        required: ["name", "email", "password"],

        properties: {
          name: {
            type: "string",
            example: "Mitin Patel",
          },

          email: {
            type: "string",
            format: "email",
            example: "mitin@example.com",
          },

          password: {
            type: "string",
            format: "password",
            minLength: 8,
            example: "Password@123",
          },
        },
      },

      // =================================================
      // LOGIN
      // =================================================

      LoginInput: {
        type: "object",

        required: ["email", "password"],

        properties: {
          email: {
            type: "string",
            format: "email",
            example: "mitin@example.com",
          },

          password: {
            type: "string",
            format: "password",
            example: "Password@123",
          },
        },
      },

      // =================================================
      // REFRESH TOKEN
      // =================================================

      RefreshTokenInput: {
        type: "object",

        required: ["refreshToken"],

        properties: {
          refreshToken: {
            type: "string",
            example: "eyJhbGciOiJIUzI1NiIs...",
          },
        },
      },

      // =================================================
      // AUTH RESPONSE
      // =================================================

      AuthResponse: {
        type: "object",

        properties: {
          success: {
            type: "boolean",
            example: true,
          },

          message: {
            type: "string",
            example: "Login successful",
          },

          data: {
            type: "object",

            properties: {
              accessToken: {
                type: "string",
                example: "eyJhbGciOiJIUzI1NiIs...",
              },

              refreshToken: {
                type: "string",
                example: "eyJhbGciOiJIUzI1NiIs...",
              },

              user: {
                $ref: "#/components/schemas/User",
              },
            },
          },
        },
      },

      // =================================================
      // AI REQUEST
      // =================================================

      AIRequest: {
        type: "object",

        required: ["text"],

        properties: {
          text: {
            type: "string",
            example:
              "I worked as a Full Stack Developer using React and Node.js",
          },
        },
      },

      // =================================================
      // AI RESPONSE
      // =================================================

      AIResponse: {
        type: "object",

        properties: {
          success: {
            type: "boolean",
            example: true,
          },

          message: {
            type: "string",
            example: "AI response generated successfully",
          },

          data: {
            type: "object",

            properties: {
              result: {
                type: "string",
                example:
                  "Experienced Full Stack Developer specializing in React and Node.js.",
              },
            },
          },
        },
      },

      // =================================================
      // PUBLISH
      // =================================================

      PublishRequest: {
        type: "object",

        required: ["isPublished"],

        properties: {
          isPublished: {
            type: "boolean",
            example: true,
          },
        },
      },

      PublishResponse: {
        type: "object",

        properties: {
          success: {
            type: "boolean",
            example: true,
          },

          message: {
            type: "string",
            example: "Profile published successfully",
          },

          data: {
            type: "object",

            properties: {
              isPublished: {
                type: "boolean",
                example: true,
              },
            },
          },
        },
      },

      // =================================================
      // SLUG
      // =================================================

      CheckSlugResponse: {
        type: "object",

        properties: {
          success: {
            type: "boolean",
            example: true,
          },

          available: {
            type: "boolean",
            example: true,
          },

          slug: {
            type: "string",
            example: "mitin-patel",
          },
        },
      },

      // =================================================
      // DASHBOARD
      // =================================================

      DashboardData: {
        type: "object",

        properties: {
          success: {
            type: "boolean",
            example: true,
          },

          data: {
            type: "object",

            properties: {
              completion: {
                type: "number",
                example: 75,
              },

              isPublished: {
                type: "boolean",
                example: true,
              },

              profileViews: {
                type: "number",
                example: 120,
              },
            },
          },
        },
      },

      // =================================================
      // PERSONAL
      // =================================================

      PersonalInput: {
        type: "object",

        properties: {
          firstName: {
            type: "string",
            example: "Mitin",
          },

          lastName: {
            type: "string",
            example: "Patel",
          },

          headline: {
            type: "string",
            example: "Full Stack Developer",
          },

          profileImage: {
            type: "string",
            example: "https://example.com/profile.jpg",
          },
        },
      },

      // =================================================
      // CONTACT
      // =================================================

      ContactInput: {
        type: "object",

        properties: {
          email: {
            type: "string",
            format: "email",
            example: "mitin@example.com",
          },

          mobile: {
            type: "string",
            example: "+91 9876543210",
          },

          address: {
            type: "string",
            example: "Surat, Gujarat, India",
          },
        },
      },

      // =================================================
      // SOCIAL
      // =================================================

      SocialInput: {
        type: "object",

        properties: {
          linkedInUrl: {
            type: "string",
            format: "uri",
            example: "https://linkedin.com/in/example",
          },

          gitHubUrl: {
            type: "string",
            format: "uri",
            example: "https://github.com/example",
          },

          portfolioUrl: {
            type: "string",
            format: "uri",
            example: "https://example.com",
          },

          websiteUrl: {
            type: "string",
            format: "uri",
            example: "https://example.com",
          },
        },
      },

      // =================================================
      // GENERIC PROFILE SECTION
      // =================================================

      ProfileSectionResponse: {
        type: "object",

        properties: {
          success: {
            type: "boolean",
            example: true,
          },

          message: {
            type: "string",
            example: "Profile section saved successfully",
          },

          data: {
            type: "object",
            additionalProperties: true,
          },
        },
      },
    },
  },
};

const options = {
  definition: swaggerDefinition,

  apis: ["./src/routes/**/*.js", "./src/controllers/**/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

// =====================================================
// SETUP SWAGGER
// =====================================================

const setupSwagger = (app) => {
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customSiteTitle: "Career OS API Documentation",
      // CDN URLs to fix Vercel static asset routing issue
      customCssUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.8/swagger-ui.min.css",
      customJs: [
        "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.8/swagger-ui-bundle.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.8/swagger-ui-standalone-preset.min.js",
      ],
      swaggerOptions: {
        persistAuthorization: true,
      },
    }),
  );

  // Raw OpenAPI JSON
  app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  console.log("📚 Swagger UI: /api-docs");
  console.log("📄 Swagger JSON: /api-docs.json");
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  swaggerSpec,
  setupSwagger,
};
