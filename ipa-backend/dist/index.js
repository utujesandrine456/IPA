"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
console.log("Backend index.ts is starting...");
const auth_js_1 = __importDefault(require("./routes/auth.js"));
const students_js_1 = __importDefault(require("./routes/students.js"));
const tasks_js_1 = __importDefault(require("./routes/tasks.js"));
const supervisors_js_1 = __importDefault(require("./routes/supervisors.js"));
const admin_js_1 = __importDefault(require("./routes/admin.js"));
const notifications_js_1 = __importDefault(require("./routes/notifications.js"));
const ratings_js_1 = __importDefault(require("./routes/ratings.js"));
// Import other routes as they are created
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Basic health check
app.get("/", (req, res) => {
    res.send("IPA Backend API is running");
});
// Routes
app.use("/api/auth", auth_js_1.default);
app.use("/api/students", students_js_1.default);
// app.use("/api/students", studentRoutes);
app.use("/api/tasks", tasks_js_1.default);
app.use("/api/supervisors", supervisors_js_1.default);
app.use("/api/superteacher", supervisors_js_1.default);
app.use("/api/admin", admin_js_1.default);
app.use("/api/notifications", notifications_js_1.default);
app.use("/api/ratings", ratings_js_1.default);
// app.use("/api/supervisors", supervisorRoutes);
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
