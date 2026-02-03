require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authRouter = require("./routes/auth.route");
const matchingRouter = require("./routes/matching.route");
const reviewRouter = require("./routes/review.route");
const bookingRouter = require("./routes/booking.route");
const governanceRouter = require("./routes/governance.route");
const profileRouter = require("./routes/profile.route");
const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());
app.use(cors());

app.use((req, res, next) => {
  console.log("REQ:", req.method, req.url);
  next();
});

app.get("/api/test", (req, res) => {
  res.status(200).json({ message: "Backend is reachable" });
});

app.use("/api/auth", authRouter);
app.use("/api/matching", matchingRouter);
app.use("/api/review", reviewRouter);
app.use("/api/booking", bookingRouter);
app.use("/api/governance", governanceRouter);
app.use("/api/profile", profileRouter);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`ElderlyLN Backend running on port ${PORT}`);
  console.log(`Test API at: http://localhost:${PORT}/api/test`);
});
