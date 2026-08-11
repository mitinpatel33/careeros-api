const dotenv = require("dotenv");
const connectDB = require("./src/config/db");
const app = require("./src/app");

dotenv.config();

const PORT = process.env.PORT || 5000;

// connectDB().then(() => {
//     app.listen(PORT, () => {
//         console.log(`Server running on port ${PORT}`);
//     });
// });

(async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log("--------------------------------");
      console.log(`Server Running : ${PORT}`);
      console.log(`Environment    : ${process.env.NODE_ENV}`);
      console.log("--------------------------------");
      console.log(`🚀 Server running on http://localhost:${PORT}`);

      console.log(`📚 Swagger running on http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error(error);

    process.exit(1);
  }
})();
